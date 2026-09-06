// Receipt-scan library: Storage listing, the Firestore index, and the link/skip writes.
//
// The scans themselves are uploaded out-of-band (Firebase console, gsutil, whatever) into
//   receiptScans/<batch>/<file>.pdf
// Batch folders are the recommended layout: Storage lists 1,000 entries per page, and a
// batch per scanning session means a partly-uploaded folder is obvious at a glance. The
// listing below recurses, so any nesting under the root works.
//
// A Firestore index document per file is what makes the work resumable. Without it,
// answering "which scans are still unlinked?" would mean reading every member document
// and diffing it against a Storage listing on every page load.

import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  writeBatch,
  runTransaction,
  updateDoc,
  deleteField,
} from 'firebase/firestore';
import { getStorage, ref, listAll, getDownloadURL, getMetadata } from 'firebase/storage';
import { db } from './firebaseConfig';
import { MemberReceipt, normalizeReceipts } from '../utils/payments';
import {
  ScanDoc,
  ScanStatus,
  SCANS_ROOT,
  SCAN_INDEX_COLLECTION,
  scanIdFromPath,
  batchFromPath,
} from '../utils/receiptScans';

const MEMBERS_COLLECTION = 'membersListOld';
const storage = getStorage();

/** Firestore caps a batched write at 500 operations. */
const WRITE_BATCH_LIMIT = 400;

export interface StorageScanFile {
  path: string;
  name: string;
  url: string;
  contentType?: string;
  size?: number;
}

/**
 * Every file under receiptScans/, recursing into batch folders.
 *
 * `onProgress` reports files found so far — a few thousand scans take long enough that a
 * silent button looks broken.
 */
export async function listScanFilesFromStorage(
  onProgress?: (found: number) => void
): Promise<StorageScanFile[]> {
  const found: StorageScanFile[] = [];

  const walk = async (prefixPath: string): Promise<void> => {
    const result = await listAll(ref(storage, prefixPath));

    // Metadata and URLs are fetched per file, so they are batched rather than awaited one
    // at a time — a folder of 500 scans is 1,000 sequential round trips otherwise.
    const items = await Promise.all(
      result.items.map(async (item) => {
        const [url, metadata] = await Promise.all([
          getDownloadURL(item),
          getMetadata(item).catch(() => null),
        ]);
        return {
          path: item.fullPath,
          name: item.name,
          url,
          contentType: metadata ? metadata.contentType : undefined,
          size: metadata ? metadata.size : undefined,
        } as StorageScanFile;
      })
    );
    found.push(...items);
    if (onProgress) onProgress(found.length);

    for (const prefix of result.prefixes) {
      await walk(prefix.fullPath);
    }
  };

  await walk(SCANS_ROOT);
  return found;
}

/** Every index document, newest sync first is not needed — order is applied in the UI. */
export async function fetchScanIndex(): Promise<ScanDoc[]> {
  const snapshot = await getDocs(collection(db, SCAN_INDEX_COLLECTION));
  return snapshot.docs.map((d) => d.data() as ScanDoc);
}

export async function fetchScansByStatus(status: ScanStatus): Promise<ScanDoc[]> {
  const snapshot = await getDocs(
    query(collection(db, SCAN_INDEX_COLLECTION), where('status', '==', status))
  );
  return snapshot.docs.map((d) => d.data() as ScanDoc);
}

export interface SyncResult {
  filesInStorage: number;
  added: number;
  refreshed: number;
  missingFromStorage: string[];
}

/**
 * Brings the index in line with Storage.
 *
 * New files become `pending`. Files already indexed keep their status and linkage — only
 * the download URL and metadata are refreshed, because a re-uploaded file gets a new token
 * and the stale URL would 403 in the viewer.
 *
 * Index entries with no file behind them any more are reported, not deleted: a scan that
 * vanished from Storage while its receipt still points at it is something an admin needs
 * to see, not something to quietly tidy away.
 */
export async function syncScanIndex(onProgress?: (found: number) => void): Promise<SyncResult> {
  const files = await listScanFilesFromStorage(onProgress);
  const existing = await fetchScanIndex();
  const existingById = new Map(existing.map((s) => [s.scanId, s]));

  const now = new Date().toISOString();
  const pendingWrites: Array<{ id: string; data: Record<string, any>; merge: boolean }> = [];
  let added = 0;
  let refreshed = 0;

  for (const file of files) {
    const scanId = scanIdFromPath(file.path);
    const prior = existingById.get(scanId);

    if (!prior) {
      const scan: ScanDoc = {
        scanId,
        path: file.path,
        name: file.name,
        batch: batchFromPath(file.path),
        url: file.url,
        status: 'pending',
        syncedAt: now,
      };
      // Firestore rejects undefined, so optional metadata is only attached when present.
      if (file.contentType) scan.contentType = file.contentType;
      if (file.size != null) scan.size = file.size;
      pendingWrites.push({ id: scanId, data: scan, merge: false });
      added++;
      continue;
    }

    if (prior.url !== file.url || prior.size !== file.size) {
      const patch: Record<string, any> = { url: file.url, syncedAt: now };
      if (file.contentType) patch.contentType = file.contentType;
      if (file.size != null) patch.size = file.size;
      pendingWrites.push({ id: scanId, data: patch, merge: true });
      refreshed++;
    }
  }

  const seen = new Set(files.map((f) => scanIdFromPath(f.path)));
  const missingFromStorage = existing.filter((s) => !seen.has(s.scanId)).map((s) => s.path);

  for (let i = 0; i < pendingWrites.length; i += WRITE_BATCH_LIMIT) {
    const batch = writeBatch(db);
    pendingWrites.slice(i, i + WRITE_BATCH_LIMIT).forEach((write) => {
      batch.set(doc(db, SCAN_INDEX_COLLECTION, write.id), write.data, { merge: write.merge });
    });
    await batch.commit();
  }

  return { filesInStorage: files.length, added, refreshed, missingFromStorage };
}

export interface LinkScanParams {
  scan: ScanDoc;
  memberId: string;
  receiptId: string;
  /** Required when the receipt already carries a file; without it the write is refused. */
  replaceExisting?: boolean;
  linkedBy?: string;
}

export interface LinkScanResult {
  /** Storage path of the file that was displaced, if any. */
  replacedPath?: string;
}

/**
 * Attaches a scan to one receipt.
 *
 * The receipt write runs in a transaction against the member document, because receipts
 * live in an array — a plain merge would have to rewrite the whole array and could drop a
 * receipt another admin added a second earlier.
 *
 * The displaced file is never deleted from Storage. The scan library is the source of
 * truth for these documents, and an unlinked scan belongs back in the queue rather than in
 * the bin; the caller gets its path so the displaced scan can be re-opened as pending.
 *
 * @throws if the member or receipt is gone, or the receipt already has a file and
 *         `replaceExisting` was not set.
 */
export async function linkScanToReceipt(params: LinkScanParams): Promise<LinkScanResult> {
  const { scan, memberId, receiptId, replaceExisting, linkedBy } = params;
  let replacedPath: string | undefined;
  let linkedReceiptNumber = '';

  await runTransaction(db, async (transaction) => {
    replacedPath = undefined;

    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) {
      throw new Error('Member ' + memberId + ' no longer exists.');
    }

    const memberData = memberSnap.data() || {};
    const receipts = normalizeReceipts(memberData.receipts);
    const target = receipts.find((r) => r.receiptId === receiptId);
    if (!target) {
      throw new Error('Receipt ' + receiptId + ' is no longer on member ' + memberId + '.');
    }

    if (target.imageUrl && !replaceExisting) {
      throw new Error('This receipt already has a file attached.');
    }
    if (target.imageUrl && target.imagePath && target.imagePath !== scan.path) {
      replacedPath = target.imagePath;
    }
    linkedReceiptNumber = String(target.receiptNumber || '');

    const updated: MemberReceipt[] = receipts.map((r) =>
      r.receiptId === receiptId
        ? {
            ...r,
            imageUrl: scan.url,
            imagePath: scan.path,
            fileType: /\.pdf$/i.test(scan.name) ? 'pdf' : 'image',
          }
        : r
    );

    transaction.set(memberRef, { receipts: updated }, { merge: true });
  });

  // Index second, and deliberately outside the transaction: it is a work-tracking record,
  // and a scan that is attached but still shows as pending is a re-link away from correct,
  // whereas the reverse would hide a receipt with no file behind it.
  const patch: Record<string, any> = {
    status: 'linked' as ScanStatus,
    memberId,
    receiptId,
    receiptNumber: linkedReceiptNumber,
    linkedAt: new Date().toISOString(),
    note: deleteField(),
  };
  if (linkedBy) patch.linkedBy = linkedBy;
  await updateDoc(doc(db, SCAN_INDEX_COLLECTION, scan.scanId), patch);

  // The displaced scan goes back in the queue so it is not silently lost.
  if (replacedPath && replacedPath.startsWith(SCANS_ROOT + '/')) {
    const displacedId = scanIdFromPath(replacedPath);
    const displacedRef = doc(db, SCAN_INDEX_COLLECTION, displacedId);
    const displacedSnap = await getDoc(displacedRef);
    if (displacedSnap.exists()) {
      await updateDoc(displacedRef, {
        status: 'pending' as ScanStatus,
        memberId: deleteField(),
        receiptId: deleteField(),
        receiptNumber: deleteField(),
        linkedAt: deleteField(),
      });
    }
  }

  return { replacedPath };
}

/**
 * Detaches a scan from its receipt and puts it back in the pending queue.
 *
 * Only clears the receipt when it is still pointing at THIS scan — if the receipt has
 * since been linked to a different file, unlinking the old index entry must not blank it.
 */
export async function unlinkScan(scan: ScanDoc): Promise<void> {
  if (scan.memberId && scan.receiptId) {
    await runTransaction(db, async (transaction) => {
      const memberRef = doc(db, MEMBERS_COLLECTION, scan.memberId as string);
      const memberSnap = await transaction.get(memberRef);
      if (!memberSnap.exists()) return;

      const memberData = memberSnap.data() || {};
      const receipts = normalizeReceipts(memberData.receipts);
      const target = receipts.find((r) => r.receiptId === scan.receiptId);
      if (!target || target.imagePath !== scan.path) return;

      const updated = receipts.map((r) => {
        if (r.receiptId !== scan.receiptId) return r;
        const { imageUrl, imagePath, fileType, ...rest } = r as MemberReceipt & Record<string, any>;
        return rest as MemberReceipt;
      });

      transaction.set(memberRef, { receipts: updated }, { merge: true });
    });
  }

  await updateDoc(doc(db, SCAN_INDEX_COLLECTION, scan.scanId), {
    status: 'pending' as ScanStatus,
    memberId: deleteField(),
    receiptId: deleteField(),
    receiptNumber: deleteField(),
    linkedAt: deleteField(),
    linkedBy: deleteField(),
  });
}

/** Parks a scan whose record could not be found, with a note for the follow-up pass. */
export async function skipScan(scan: ScanDoc, note: string): Promise<void> {
  await updateDoc(doc(db, SCAN_INDEX_COLLECTION, scan.scanId), {
    status: 'skipped' as ScanStatus,
    note: note || 'No matching record found.',
  });
}

/** Returns a skipped scan to the queue. */
export async function unskipScan(scan: ScanDoc): Promise<void> {
  await updateDoc(doc(db, SCAN_INDEX_COLLECTION, scan.scanId), {
    status: 'pending' as ScanStatus,
    note: deleteField(),
  });
}
