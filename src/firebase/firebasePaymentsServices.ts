import { collection, getDocs, QuerySnapshot, DocumentData, doc, setDoc, getDoc, runTransaction } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db } from './firebaseConfig';
import {
  MemberReceipt,
  PaymentEntry,
  normalizePayments,
  normalizeReceipts,
  makeReceiptId,
} from '../utils/payments';

const PAYMENTS_COLLECTION = 'payments';
const MEMBERS_COLLECTION = 'membersListOld';
const storage = getStorage();

// NOTE: the four functions immediately below operate on a top-level 'payments' collection
// that nothing in the UI reads or writes — real payment data lives on the member document
// in membersListOld. They are kept only until it is confirmed the collection is empty in
// production; do not build new features on them.

// Fetch all data from the payments collection
export async function fetchAllPayments() {
  const snapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, PAYMENTS_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Fetch a specific payment document by its id
export async function fetchPaymentById(id: string) {
  const docSnap = await getDoc(doc(db, PAYMENTS_COLLECTION, id));
  if (docSnap.exists()) return { id: docSnap.id, ...docSnap.data() };
  return null;
}

// Add a new payment with a specific id.
// The existence check and the write run in a transaction so two admins creating the
// same id cannot both succeed and silently overwrite one another.
export async function addPaymentWithId(id: string, data: Record<string, any>) {
  await runTransaction(db, async (transaction) => {
    const docRef = doc(db, PAYMENTS_COLLECTION, id);
    const existing = await transaction.get(docRef);
    if (existing.exists()) {
      throw new Error('A payment with this ID already exists.');
    }
    transaction.set(docRef, data);
  });
  return id;
}

// Fetch a member by id from membersListOld collection
export async function fetchMemberById(id: string) {
  const memberRef = doc(db, 'membersListOld', id);
  const memberSnap = await getDoc(memberRef);
  if (memberSnap.exists()) {
    return { id: memberSnap.id, ...memberSnap.data() };
  }
  return null;
}

// Insert or update a member's payment data in an existing payment document
export async function insertMemberPaymentToPaymentDoc(paymentId: string, memberId: string, paymentData: Record<string, any>) {
  const docRef = doc(db, PAYMENTS_COLLECTION, paymentId);
  // merge:true already leaves the other members' entries untouched, so there is no
  // need to read the whole document back before writing this one member's data.
  await setDoc(docRef, { [memberId]: paymentData }, { merge: true });
  return true;
}

/**
 * Adds or updates multiple payment records for a member in the 'membersListOld' collection.
 * @param memberId - The ID of the member document to update.
 * @param paymentsArray - Array of objects: [{ paymentNumber: string, data: object }]
 */
export async function addOrUpdateMemberPayments(memberId: string, paymentsArray: Array<{ paymentNumber: string, data: Record<string, any> }>) {
  // Read and write inside a transaction: this rewrites the whole payments array, so two
  // admins saving at once would otherwise silently drop one set of payments.
  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) {
      throw new Error(`Member with ID ${memberId} does not exist.`);
    }
    const memberData = memberSnap.data() || {};
    const currentPayments = normalizePayments(memberData.payments);

    // Convert currentPayments to a map for easy update
    const paymentsMap: Record<string, any> = {};
    currentPayments.forEach((p) => {
      if (p && p.paymentNumber) paymentsMap[p.paymentNumber] = p.data;
    });

    // Add/update each payment
    paymentsArray.forEach(({ paymentNumber, data }) => {
      paymentsMap[paymentNumber] = data;
    });

    // Convert back to array format
    const updatedPayments = Object.entries(paymentsMap).map(([paymentNumber, data]) => ({ paymentNumber, data }));

    transaction.set(memberRef, { payments: updatedPayments }, { merge: true });
  });
  return true;
}

/**
 * Removes a payment entry from a member's payments array in the 'membersListOld' collection by paymentNumber.
 * @param memberId - The ID of the member document.
 * @param paymentNumber - The payment number to remove.
 * @returns {Promise<boolean>} True if removed, false otherwise.
 */
/**
 * Removes one payment entry, and the receipt behind it once nothing references it any more.
 *
 * A receipt can cover a range of payment numbers, so removing a single number must NOT
 * delete the receipt while its siblings are still paid — the receipt (and its photo) is
 * only dropped when the entry removed was the last one carrying that receiptId.
 *
 * The image is deleted after the Firestore write commits, never before: an orphaned file
 * in Storage is recoverable noise, whereas a receipt row pointing at a deleted image is a
 * broken record in the UI.
 */
export async function removeMemberPaymentByNumber(memberId: string, paymentNumber: string): Promise<boolean> {
  const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
  let imagePathToDelete: string | undefined;

  await runTransaction(db, async (transaction) => {
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) {
      throw new Error(`Member with ID ${memberId} does not exist.`);
    }
    imagePathToDelete = undefined;

    const memberData = memberSnap.data() || {};
    const payments = normalizePayments(memberData.payments);
    const receipts = normalizeReceipts(memberData.receipts);

    const removed = payments.find((p) => String(p.paymentNumber) === String(paymentNumber));
    if (!removed) return;

    const remainingPayments = payments.filter((p) => String(p.paymentNumber) !== String(paymentNumber));
    const receiptId = removed.data?.receiptId;

    // Payments written before receipts existed have no receiptId; there is nothing to clean.
    let remainingReceipts = receipts;
    if (receiptId) {
      const stillReferenced = remainingPayments.some((p) => p.data?.receiptId === receiptId);
      if (!stillReferenced) {
        const orphan = receipts.find((r) => r.receiptId === receiptId);
        if (orphan?.imagePath) imagePathToDelete = orphan.imagePath;
        remainingReceipts = receipts.filter((r) => r.receiptId !== receiptId);
      }
    }

    transaction.set(
      memberRef,
      { payments: remainingPayments, receipts: remainingReceipts },
      { merge: true }
    );
  });

  if (imagePathToDelete) await deleteReceiptImage(imagePathToDelete);
  return true;
}

// ---------------------------------------------------------------------------
// Receipts
//
// A receipt is the real-world transaction: one check or cash handover, one receipt
// number, one optional photo. It pays for a contiguous range of payment numbers, and each
// of those payment entries carries the receipt's id back.
//
// The payments array keeps the shape it has always had, so ActiveList, the Excel export
// and PaymentDetail continue to work against members that have no receipts at all.
// ---------------------------------------------------------------------------

export interface AddReceiptParams {
  memberId: string;
  receiptNumber: string;
  totalAmount: number;
  singleAmount: number;
  /** YYYY-MM-DD */
  date: string;
  method: string;
  place?: string;
  paymentNumbers: string[];
  imageUrl?: string;
  imagePath?: string;
  createdBy?: string;
  /** Set by the backfill; leave unset for real entries. */
  backfilled?: boolean;
}

/**
 * Writes a receipt and the payment entries it covers in a single transaction, so a
 * receipt can never end up recorded without its payments (or the reverse).
 *
 * Re-checks duplicates and range collisions inside the transaction rather than trusting
 * the caller's preview, which may have been built from stale store data.
 *
 * @throws if the member is missing, the receipt number or id is already recorded, or any
 *         of the payment numbers is already paid.
 */
export async function addReceiptWithPayments(params: AddReceiptParams): Promise<{ receiptId: string }> {
  const {
    memberId,
    receiptNumber,
    totalAmount,
    singleAmount,
    date,
    method,
    place,
    paymentNumbers,
    imageUrl,
    imagePath,
    createdBy,
    backfilled,
  } = params;

  if (!paymentNumbers.length) {
    throw new Error('A receipt must cover at least one payment number.');
  }

  const receiptId = makeReceiptId(date, receiptNumber);

  await runTransaction(db, async (transaction) => {
    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) {
      throw new Error(`Member with ID ${memberId} does not exist.`);
    }

    const memberData = memberSnap.data() || {};
    const payments = normalizePayments(memberData.payments);
    const receipts = normalizeReceipts(memberData.receipts);

    if (receipts.some((r) => r.receiptId === receiptId)) {
      throw new Error(`This receipt has already been recorded for member ${memberId}.`);
    }
    if (receiptNumber && receipts.some((r) => String(r.receiptNumber) === String(receiptNumber))) {
      throw new Error(`Receipt number ${receiptNumber} is already recorded for member ${memberId}.`);
    }

    const alreadyPaid = new Set(payments.map((p) => String(p.paymentNumber)));
    const collisions = paymentNumbers.filter((n) => alreadyPaid.has(String(n)));
    if (collisions.length) {
      throw new Error(`These payment numbers are already paid: ${collisions.join(', ')}.`);
    }

    const sorted = [...paymentNumbers].sort((a, b) => Number(a) - Number(b));
    const receipt: MemberReceipt = {
      receiptId,
      receiptNumber: String(receiptNumber || ''),
      totalAmount,
      date,
      method,
      coversFrom: sorted[0],
      coversTo: sorted[sorted.length - 1],
      createdAt: new Date().toISOString(),
    };
    // Firestore rejects undefined, so optional fields are only attached when present.
    if (place) receipt.place = place;
    if (imageUrl) receipt.imageUrl = imageUrl;
    if (imagePath) receipt.imagePath = imagePath;
    if (createdBy) receipt.createdBy = createdBy;
    if (backfilled) receipt.backfilled = true;

    const newEntries: PaymentEntry[] = sorted.map((paymentNumber) => {
      const data: Record<string, any> = {
        amount: singleAmount,
        paidAt: date,
        method,
        receiptNumber: String(receiptNumber || ''),
        receiptId,
      };
      if (place) data.place = place;
      return { paymentNumber, data };
    });

    transaction.set(
      memberRef,
      { payments: [...payments, ...newEntries], receipts: [...receipts, receipt] },
      { merge: true }
    );
  });

  return { receiptId };
}

/**
 * Uploads a receipt photo and returns both the download URL and the storage path.
 *
 * Called before the Firestore write so a failed upload cannot leave a receipt pointing at
 * an image that does not exist; if the subsequent write fails, the caller should hand the
 * returned path to deleteReceiptImage.
 */
export async function uploadReceiptImage(
  memberId: string,
  receiptId: string,
  file: File
): Promise<{ imageUrl: string; imagePath: string }> {
  const extension = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
  const imagePath = `receipts/${memberId}/${receiptId}.${extension}`;
  const storageRef = ref(storage, imagePath);
  const snapshot = await uploadBytes(storageRef, file);
  const imageUrl = await getDownloadURL(snapshot.ref);
  return { imageUrl, imagePath };
}

/**
 * Every member document, for bulk validation.
 *
 * Deliberately does NOT use fetchAllMembersListOld: that helper pages with
 * orderBy('createdAt'), and Firestore silently omits documents missing that field — a
 * member without createdAt would look like "member not found" to the importer and have
 * their payments skipped. A plain collection read returns everything.
 */
export async function fetchAllMembersForImport(): Promise<Record<string, any>[]> {
  const snapshot = await getDocs(collection(db, MEMBERS_COLLECTION));
  return snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export interface BulkReceiptInput {
  receipt: Omit<MemberReceipt, 'createdAt'>;
  paymentNumbers: string[];
  singleAmount: number;
}

/**
 * Writes every receipt for ONE member in a single transaction.
 *
 * Grouping by member is what makes a 4,700-row import practical: it turns thousands of
 * writes into roughly one per member, and removes the write contention that repeated
 * single-row transactions on the same document would cause.
 *
 * Receipts whose id is already present are skipped rather than failing the batch, so
 * re-running the same sheet after an interrupted import resumes instead of erroring.
 */
export async function addReceiptsForMember(
  memberId: string,
  inputs: BulkReceiptInput[]
): Promise<{ written: number; skipped: number }> {
  let written = 0;
  let skipped = 0;

  await runTransaction(db, async (transaction) => {
    written = 0;
    skipped = 0;

    const memberRef = doc(db, MEMBERS_COLLECTION, memberId);
    const memberSnap = await transaction.get(memberRef);
    if (!memberSnap.exists()) {
      throw new Error(`Member with ID ${memberId} does not exist.`);
    }

    const memberData = memberSnap.data() || {};
    const payments = normalizePayments(memberData.payments);
    const receipts = normalizeReceipts(memberData.receipts);

    const existingReceiptIds = new Set(receipts.map((r) => r.receiptId));
    const claimed = new Set(payments.map((p) => String(p.paymentNumber)));

    const newReceipts: MemberReceipt[] = [];
    const newEntries: PaymentEntry[] = [];

    for (const input of inputs) {
      if (existingReceiptIds.has(input.receipt.receiptId)) {
        skipped++;
        continue;
      }
      const collisions = input.paymentNumbers.filter((n) => claimed.has(String(n)));
      if (collisions.length) {
        // The preview blocks contradicting members, so reaching here means the member
        // changed underneath us. Fail the whole member rather than write a partial record.
        throw new Error(
          `Payment numbers already recorded for member ${memberId}: ${collisions.join(', ')}.`
        );
      }

      newReceipts.push({ ...input.receipt, createdAt: new Date().toISOString() });
      input.paymentNumbers.forEach((paymentNumber) => {
        claimed.add(String(paymentNumber));
        newEntries.push({
          paymentNumber: String(paymentNumber),
          data: {
            amount: input.singleAmount,
            paidAt: input.receipt.date,
            method: input.receipt.method,
            receiptNumber: input.receipt.receiptNumber,
            receiptId: input.receipt.receiptId,
          },
        });
      });
      existingReceiptIds.add(input.receipt.receiptId);
      written++;
    }

    if (!newReceipts.length) return;

    // Only payments and receipts are touched — names, phone and every other member field
    // are left exactly as they are in Firestore.
    transaction.set(
      memberRef,
      { payments: [...payments, ...newEntries], receipts: [...receipts, ...newReceipts] },
      { merge: true }
    );
  });

  return { written, skipped };
}

/** Best-effort cleanup of an orphaned upload. Never throws — the caller is already failing. */
export async function deleteReceiptImage(imagePath: string): Promise<void> {
  try {
    await deleteObject(ref(storage, imagePath));
  } catch (error) {
    console.warn('Could not delete receipt image', imagePath, error);
  }
}
