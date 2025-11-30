import { getFirestore, collection, getDocs, QuerySnapshot, DocumentData, doc, setDoc, getDoc } from 'firebase/firestore';

const db = getFirestore();
const PAYMENTS_COLLECTION = 'payments';

// Fetch all data from the payments collection
export async function fetchAllPayments() {
  const snapshot: QuerySnapshot<DocumentData> = await getDocs(collection(db, PAYMENTS_COLLECTION));
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

// Fetch a specific payment document by its id
export async function fetchPaymentById(id: string) {
  const docRef = doc(db, PAYMENTS_COLLECTION, id);
  const docSnap = await getDocs(collection(db, PAYMENTS_COLLECTION));
  // Try to find the document in the collection snapshot (for compatibility)
  const found = docSnap.docs.find((d) => d.id === id);
  if (found) return { id: found.id, ...found.data() };
  return null;
}

// Add a new payment with a specific id
export async function addPaymentWithId(id: string, data: Record<string, any>) {
  const docRef = doc(db, PAYMENTS_COLLECTION, id);
  // Check if document with this id already exists
  const existing = await getDocs(collection(db, PAYMENTS_COLLECTION));
  const found = existing.docs.find((d) => d.id === id);
  if (found) {
    throw new Error('A payment with this ID already exists.');
  }
  await setDoc(docRef, data);
  return id;
}

// Fetch a member by id from membersListOld collection
export async function fetchMemberById(id: string) {
  const db = getFirestore();
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
  // Fetch the current document data
  const docSnap = await getDoc(docRef);
  let updateData: Record<string, any> = {};
  if (docSnap.exists()) {
    // Merge with existing data
    updateData = docSnap.data() || {};
  }
  updateData[memberId] = paymentData;
  await setDoc(docRef, updateData, { merge: true });
  return true;
}

/**
 * Adds or updates multiple payment records for a member in the 'membersListOld' collection.
 * @param memberId - The ID of the member document to update.
 * @param paymentsArray - Array of objects: [{ paymentNumber: string, data: object }]
 */
export async function addOrUpdateMemberPayments(memberId: string, paymentsArray: Array<{ paymentNumber: string, data: Record<string, any> }>) {
  const memberRef = doc(getFirestore(), 'membersListOld', memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    throw new Error(`Member with ID ${memberId} does not exist.`);
  }
  const memberData = memberSnap.data() || {};
  const currentPayments = Array.isArray(memberData.payments) ? [...memberData.payments] : [];

  // Convert currentPayments to a map for easy update
  const paymentsMap: Record<string, any> = {};
  currentPayments.forEach((p: any) => {
    if (p && p.paymentNumber) paymentsMap[p.paymentNumber] = p.data;
  });

  // Add/update each payment
  paymentsArray.forEach(({ paymentNumber, data }) => {
    paymentsMap[paymentNumber] = data;
  });

  // Convert back to array format
  const updatedPayments = Object.entries(paymentsMap).map(([paymentNumber, data]) => ({ paymentNumber, data }));

  await setDoc(memberRef, { payments: updatedPayments }, { merge: true });
  return true;
}

/**
 * Removes a payment entry from a member's payments array in the 'membersListOld' collection by paymentNumber.
 * @param memberId - The ID of the member document.
 * @param paymentNumber - The payment number to remove.
 * @returns {Promise<boolean>} True if removed, false otherwise.
 */
export async function removeMemberPaymentByNumber(memberId: string, paymentNumber: string): Promise<boolean> {
  const memberRef = doc(getFirestore(), 'membersListOld', memberId);
  const memberSnap = await getDoc(memberRef);
  if (!memberSnap.exists()) {
    throw new Error(`Member with ID ${memberId} does not exist.`);
  }
  const memberData = memberSnap.data() || {};
  const currentPayments = Array.isArray(memberData.payments) ? [...memberData.payments] : [];
  const filteredPayments = currentPayments.filter((p: any) => String(p.paymentNumber) !== String(paymentNumber));
  await setDoc(memberRef, { payments: filteredPayments }, { merge: true });
  return true;
}
