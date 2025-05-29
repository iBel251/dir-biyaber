import { getDocs, collection, query, orderBy, limit, startAfter, DocumentData, QuerySnapshot, DocumentSnapshot, Query } from "firebase/firestore";
import { db } from "./firebaseConfig";
import { doc, updateDoc } from "firebase/firestore";

/**
 * Fetches all documents from the "membersAddedData" collection through pagination.
 * Loads all documents incrementally and returns the complete list.
 * @param pageSize - The number of documents to fetch per page (default: 100).
 * @returns A list of all members added data.
 */
export async function fetchAllMembersAddedData(pageSize: number = 100): Promise<any[]> {
  try {
    const membersAddedDataCol = collection(db, "membersAddedData");
    let members: any[] = [];
    let lastVisible: DocumentSnapshot<DocumentData> | null = null;
    let hasMore = true;

    while (hasMore) {
      const membersQuery: Query<DocumentData> = lastVisible
        ? query(membersAddedDataCol, orderBy("createdAt"), startAfter(lastVisible), limit(pageSize))
        : query(membersAddedDataCol, orderBy("createdAt"), limit(pageSize));

      const membersSnapshot: QuerySnapshot<DocumentData> = await getDocs(membersQuery);
      const fetchedMembers = membersSnapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }));
      members = [...members, ...fetchedMembers];

      lastVisible = membersSnapshot.docs[membersSnapshot.docs.length - 1] || null;
      hasMore = fetchedMembers.length === pageSize;
    }

    return members;
  } catch (error) {
    console.error("Error fetching all members from membersAddedData:", error);
    throw error;
  }
}

/**
 * Updates the status field of a member in the "membersAddedData" collection.
 * @param id - The document ID (id, docId, or membershipId) of the member to update.
 * @param status - The new status to set.
 */
export async function setMemberAddedDataStatus(id: string, status: string): Promise<void> {
  try {
    // Try to find the document by id, docId, or membershipId
    const membersAddedDataCol = collection(db, "membersAddedData");
    const snapshot = await getDocs(query(membersAddedDataCol));
    let foundDocId: string | null = null;
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (docSnap.id === id || data.docId === id || data.membershipId === id) {
        foundDocId = docSnap.id;
      }
    });
    if (!foundDocId) throw new Error('Member not found');
    const docRef = doc(db, "membersAddedData", foundDocId);
    await updateDoc(docRef, { status });
  } catch (error) {
    console.error('Error setting member status:', error);
    throw error;
  }
}