import {  collection, getDocs, doc, getDoc, setDoc, addDoc, query, orderBy, limit, startAfter, QuerySnapshot, DocumentData, Query, DocumentSnapshot, deleteDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";


export async function fetchMembers() {
  try {
    const membersCol = collection(db, "members");
    const membersSnapshot = await getDocs(membersCol);
    const membersList = membersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    return membersList;
  } catch (error) {
    console.error("Error fetching members:", error);
    throw error;
  }
}

/**
 * Adds a new member to the "members" collection.
 * Ensures the ID is unique (used as document ID).
 * @param member - The member object to add.
 * @throws Error if the ID already exists.
 */
export async function addMember(member: {
  id: string; // Used as document ID and must be unique
  firstName: string;
  lastName: string;
  firstNameAmharic: string;
  lastNameAmharic: string;
  dateOfBirth: string;
  addressLine1: string;
  apartment: string;
  city: string;
  state: string;
  zipCode: string;
  email: string;
  phone: string;
  payments?: Array<{
    date: string;
    method: string;
    location: string;
    receiptNumber: string;
    collector: string;
  }>;
}) {
  try {
    const memberDocRef = doc(db, "membersListOld", member.id);
    const memberDoc = await getDoc(memberDocRef);
    if (memberDoc.exists()) {
      throw new Error("A member with this ID already exists.");
    }
    await setDoc(memberDocRef, {
      fullName: `${member.firstName} ${member.lastName}`, // Combine first and last name for English
      fullNameAm: `${member.firstNameAmharic} ${member.lastNameAmharic}`, // Combine first and last name for Amharic
      dateOfBirth: member.dateOfBirth,
      addressLine1: member.addressLine1,
      apartment: member.apartment,
      city: member.city,
      state: member.state,
      zipCode: member.zipCode,
      email: member.email,
      phone: member.phone,
      payments: member.payments || [],
      createdAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error adding member:", error);
    throw error;
  }
}


/**
 * Fetches all documents from the "membersListOld" collection through pagination.
 * Loads all documents incrementally and returns the complete list.
 * @param pageSize - The number of documents to fetch per page.
 * @returns A list of all members.
 */
export async function fetchAllMembersListOld(pageSize: number): Promise<any[]> {
  try {
    const membersListOldCol = collection(db, "membersListOld");
    let members: any[] = [];
    let lastVisible: DocumentSnapshot<DocumentData> | null = null;
    let hasMore = true;

    while (hasMore) {
      const membersQuery: Query<DocumentData> = lastVisible
        ? query(membersListOldCol, orderBy("createdAt"), startAfter(lastVisible), limit(pageSize))
        : query(membersListOldCol, orderBy("createdAt"), limit(pageSize));

      const membersSnapshot: QuerySnapshot<DocumentData> = await getDocs(membersQuery);
      const fetchedMembers = membersSnapshot.docs.map((doc: DocumentSnapshot<DocumentData>) => ({ id: doc.id, ...doc.data() }));
      members = [...members, ...fetchedMembers];

      lastVisible = membersSnapshot.docs[membersSnapshot.docs.length - 1] || null;
      hasMore = fetchedMembers.length === pageSize;
    }

    return members;
  } catch (error) {
    console.error("Error fetching all members from membersListOld:", error);
    throw error;
  }
}

/**
 * Saves member data to the "membersAddedData" collection in Firestore.
 * Uses Firestore's automatic ID generation for the document ID and includes the document ID in the fields.
 * @param memberData - The member data to save.
 */
export async function saveMemberData(memberData: {
  firstName: string;
  lastName: string;
  membershipId: string; // Retain only membershipId
  email: string;
  gender: string;
  address: string;
  phone: string;
}) {
  try {
    const membersCollectionRef = collection(db, "membersAddedData"); // Reference to the collection
    const docRef = await addDoc(membersCollectionRef, {
      ...memberData,
      
      createdAt: new Date().toISOString(),
    });

    // Update the document with its own ID
    await setDoc(docRef, { ...memberData, docId: docRef.id }, { merge: true });

    console.log("Member data saved successfully with document ID.");
  } catch (error) {
    console.error("Error saving member data:", error);
    throw error;
  }
}

/**
 * Updates a member in the "membersListOld" collection.
 * Accepts the member ID and the updated data, including new fields.
 * @param id - The ID of the member document to update.
 * @param updatedData - The updated data for the member, including new fields.
 */
export async function updateMember(id: string, updatedData: Record<string, any>) {
  try {
    const memberDocRef = doc(db, "membersListOld", id);

    // Update the document with the new data, merging it with the existing data
    await setDoc(memberDocRef, updatedData, { merge: true });

    console.log(`Member with ID ${id} updated successfully.`);
  } catch (error) {
    console.error(`Error updating member with ID ${id}:`, error);
    throw error;
  }
}

/**
 * Deletes a member from the "membersListOld" collection.
 * @param id - The ID of the member document to delete.
 */
export async function deleteMember(id: string): Promise<void> {
  try {
    const memberDocRef = doc(db, "membersListOld", id);

    // Delete the document with the specified ID
    await deleteDoc(memberDocRef);

    console.log(`Member with ID ${id} deleted successfully.`);
  } catch (error) {
    console.error(`Error deleting member with ID ${id}:`, error);
    throw error;
  }
}
