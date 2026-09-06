// Receipt-scan linking: pure helpers.
//
// The scans are PDFs (and the occasional photo) of paper receipts that already live in
// Cloud Storage under `receiptScans/<batch>/<file>`. Linking one means writing its URL
// onto the matching entry in a member's `receipts` array — the receipt is the real-world
// transaction, and every payment number it covers already carries its `receiptId`, so a
// scan attached to the receipt is reachable from any of those payments.
//
// Nothing here touches Firestore or Storage, so the search behaviour can be reasoned
// about (and changed) without a network round trip.

import { MemberReceipt, normalizePayments, normalizeReceipts } from './payments';

/** Where the scan library lives in Storage. Batch folders sit directly under it. */
export const SCANS_ROOT = 'receiptScans';

/** Firestore collection holding one index document per scan file. */
export const SCAN_INDEX_COLLECTION = 'receiptScans';

export type ScanStatus = 'pending' | 'linked' | 'skipped';

export interface ScanDoc {
  /** Document id: the storage path with '/' replaced, so re-syncing is idempotent. */
  scanId: string;
  /** Full storage path, e.g. receiptScans/batch-001/00123.pdf */
  path: string;
  /** File name only. */
  name: string;
  /** Folder under SCANS_ROOT, or '' for files sitting at the root. */
  batch: string;
  /** Cached download URL so the viewer does not re-resolve it on every render. */
  url: string;
  contentType?: string;
  size?: number;
  status: ScanStatus;
  /** Set once linked. */
  memberId?: string;
  receiptId?: string;
  receiptNumber?: string;
  linkedAt?: string;
  linkedBy?: string;
  /** Why it was skipped, for the follow-up pass. */
  note?: string;
  syncedAt: string;
}

/** Turns a storage path into a Firestore-safe document id ('/' is illegal in an id). */
export function scanIdFromPath(path: string): string {
  return path.replace(/\//g, '__');
}

/** The folder segment between SCANS_ROOT and the file name, or '' when there is none. */
export function batchFromPath(path: string): string {
  const rest = path.startsWith(SCANS_ROOT + '/') ? path.slice(SCANS_ROOT.length + 1) : path;
  const parts = rest.split('/');
  return parts.length > 1 ? parts.slice(0, -1).join('/') : '';
}

export function isPdf(scan: Pick<ScanDoc, 'name' | 'contentType'>): boolean {
  if (scan.contentType) return scan.contentType.toLowerCase().includes('pdf');
  return /\.pdf$/i.test(scan.name || '');
}

/**
 * True when a receipt already carries a scan or photo — the caller must confirm before
 * overwriting it.
 */
export function receiptHasFile(receipt: MemberReceipt | null | undefined): boolean {
  return Boolean(receipt && receipt.imageUrl);
}

export type SearchMode = 'auto' | 'memberId' | 'receiptNumber' | 'paymentNumber';

export const SEARCH_MODE_LABELS: Record<SearchMode, string> = {
  auto: 'Anything',
  memberId: 'Member ID / name',
  receiptNumber: 'Receipt number',
  paymentNumber: 'Payment number',
};

export interface ReceiptHit {
  memberId: string;
  memberName: string;
  memberNameAm: string;
  memberStatus: string;
  /** Null when the member (or the matched payment) has no receipt record to link to. */
  receipt: MemberReceipt | null;
  /** Set when the hit came from a payment number whose entry has no receiptId. */
  orphanPaymentNumber?: string;
  matchedOn: SearchMode;
  rank: number;
}

/** Stable identity for a hit row, also used to de-duplicate across match kinds. */
export function hitKey(hit: ReceiptHit): string {
  const receiptPart = hit.receipt
    ? hit.receipt.receiptId
    : 'payment-' + (hit.orphanPaymentNumber || 'none');
  return hit.memberId + '::' + receiptPart;
}

function memberLabel(member: Record<string, any>) {
  return {
    memberId: String(member.id != null ? member.id : ''),
    memberName: String(member.fullName != null ? member.fullName : ''),
    memberNameAm: String(member.fullNameAm != null ? member.fullNameAm : ''),
    memberStatus: String(member.status != null ? member.status : ''),
  };
}

/**
 * Ranks, lowest first. An exact receipt number is the strongest signal an admin can give —
 * they are reading it off the scan in front of them — so it outranks an ID that merely
 * happens to be the same digits.
 */
const RANK = {
  receiptExact: 0,
  memberIdExact: 1,
  paymentExact: 2,
  receiptPartial: 3,
  memberPartial: 4,
};

/**
 * Searches every member's receipts for a query.
 *
 * `mode` narrows which fields are considered; 'auto' tries all three and lets the ranking
 * sort it out. A payment number repeats across every member, so payment-number matching is
 * only attempted when the query is purely numeric, and `memberIdFilter` (the second box in
 * the UI) is what makes it usable on its own.
 *
 * Results are not capped here — the caller shows a page of them plus the total, because
 * "412 matches" is itself the signal that the query was too broad.
 */
export function searchReceipts(
  members: Record<string, any>[],
  query: string,
  mode: SearchMode = 'auto',
  memberIdFilter = ''
): ReceiptHit[] {
  const q = String(query || '').trim().toLowerCase();
  const idFilter = String(memberIdFilter || '').trim().toLowerCase();
  if (!q) return [];

  const numeric = /^\d+$/.test(q);
  const hits = new Map<string, ReceiptHit>();

  const consider = (hit: ReceiptHit) => {
    const key = hitKey(hit);
    const existing = hits.get(key);
    // Keep the strongest reason a row is on screen; a row found two ways is still one row.
    if (!existing || hit.rank < existing.rank) hits.set(key, hit);
  };

  for (const member of members) {
    const label = memberLabel(member);
    if (idFilter && label.memberId.toLowerCase() !== idFilter) continue;

    const receipts = normalizeReceipts(member.receipts);

    // --- member id / name ---------------------------------------------------
    if (mode === 'auto' || mode === 'memberId') {
      const id = label.memberId.toLowerCase();
      const newId = String(member.newId != null ? member.newId : '').toLowerCase();
      const name = label.memberName.toLowerCase();
      const nameAm = label.memberNameAm.toLowerCase();

      let rank: number | null = null;
      if (id === q || newId === q) rank = RANK.memberIdExact;
      else if (id.startsWith(q) || newId.startsWith(q) || name.includes(q) || nameAm.includes(q)) {
        rank = RANK.memberPartial;
      }

      if (rank !== null) {
        if (receipts.length) {
          receipts.forEach((receipt) =>
            consider({ ...label, receipt, matchedOn: 'memberId', rank: rank as number })
          );
        } else {
          // Worth showing: it tells the admin the member exists but has no receipt record,
          // which is a different problem from "no such member".
          consider({ ...label, receipt: null, matchedOn: 'memberId', rank: rank as number });
        }
      }
    }

    // --- receipt number -----------------------------------------------------
    if (mode === 'auto' || mode === 'receiptNumber') {
      receipts.forEach((receipt) => {
        const number = String(receipt.receiptNumber || '').toLowerCase();
        if (!number) return;
        if (number === q) {
          consider({ ...label, receipt, matchedOn: 'receiptNumber', rank: RANK.receiptExact });
        } else if (q.length >= 2 && number.includes(q)) {
          consider({ ...label, receipt, matchedOn: 'receiptNumber', rank: RANK.receiptPartial });
        }
      });
    }

    // --- payment number -----------------------------------------------------
    // Only exact, and only for digits: a substring match on payment numbers would return
    // most of the roster on every keystroke.
    if ((mode === 'auto' || mode === 'paymentNumber') && numeric) {
      const entry = normalizePayments(member.payments).find(
        (p) => String(p.paymentNumber) === q
      );
      if (entry) {
        const receiptId = entry.data && entry.data.receiptId;
        const receipt = receiptId
          ? receipts.find((r) => r.receiptId === receiptId) || null
          : null;
        consider({
          ...label,
          receipt,
          orphanPaymentNumber: receipt ? undefined : q,
          matchedOn: 'paymentNumber',
          rank: RANK.paymentExact,
        });
      }
    }
  }

  return Array.from(hits.values()).sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    // Newest receipt first within a rank: a scan being filed is usually a recent one.
    const dateDiff = String(b.receipt ? b.receipt.date : '').localeCompare(
      String(a.receipt ? a.receipt.date : '')
    );
    if (dateDiff !== 0) return dateDiff;
    return a.memberId.localeCompare(b.memberId, undefined, { numeric: true });
  });
}

/** One-line summary of a receipt for the result rows. */
export function describeReceipt(receipt: MemberReceipt): string {
  const parts = ['$' + receipt.totalAmount, 'covers ' + receipt.coversFrom + '–' + receipt.coversTo];
  if (receipt.method) parts.push(receipt.method);
  if (receipt.place) parts.push(receipt.place);
  return parts.join(' · ');
}

/** Human-readable file size for the queue list. */
export function formatSize(bytes?: number): string {
  if (!bytes || !isFinite(bytes)) return '';
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return Math.round(bytes / 1024) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}
