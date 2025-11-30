import { getFirestore, doc, setDoc } from 'firebase/firestore';

const db = getFirestore();

/**
 * Adds a new member to the membersListOld collection with the specified id and data.
 * @param memberId The ID to use for the new member document.
 * @param data The data object to store in the document.
 * @returns {Promise<boolean>} True if added successfully, false otherwise.
 */
export async function addMemberToMembersListOld(memberId: string, data: Record<string, any>): Promise<boolean> {
  try {
    const memberRef = doc(db, 'membersListOld', memberId);
    await setDoc(memberRef, data);
    console.log(`Member with id ${memberId} added to membersListOld.`);
    return true;
  } catch (error) {
    console.error('Error adding member to membersListOld:', error);
    return false;
  }
}