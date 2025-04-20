import { getFirestore, collection, getDocs, doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

// MOCK: Return 100 fake members for UI testing
export async function fetchMembers2() {
  return Array.from({ length: 113 }, (_, i) => ({
    id: `ID${i + 1}`,
    firstName: `First${i + 1}`,
    lastName: `Last${i + 1}`,
    firstNameAmharic: `አማርኛ${i + 1}`,
    lastNameAmharic: `አማርኛ${i + 1}`,
    dateOfBirth: `1990-01-${String((i % 28) + 1).padStart(2, '0')}`,
    address: `Address ${i + 1}`,
    email: `user${i + 1}@example.com`,
    phone: `0912${String(100000 + i).slice(-6)}`,
    payments: [],
  }));
}

// REAL: Fetch all members from Firestore
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
  address: string;
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
    const memberDocRef = doc(db, "members", member.id);
    const memberDoc = await getDoc(memberDocRef);
    if (memberDoc.exists()) {
      throw new Error("A member with this ID already exists.");
    }
    await setDoc(memberDocRef, {
      firstName: member.firstName,
      lastName: member.lastName,
      firstNameAmharic: member.firstNameAmharic,
      lastNameAmharic: member.lastNameAmharic,
      dateOfBirth: member.dateOfBirth,
      address: member.address,
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
