import { getFirestore, collection, getDocs, doc, getDoc, setDoc, writeBatch, addDoc, query, orderBy, limit, startAfter, where, QuerySnapshot, DocumentData, Query, DocumentSnapshot } from "firebase/firestore";
import { db } from "./firebaseConfig";
import Papa from "papaparse";
import { v4 as uuidv4 } from "uuid";

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

/**
 * Reads a CSV file from an input element and uploads the data to Firestore under the collection "membersListOld".
 * Handles large datasets efficiently.
 * @param file - The CSV file selected by the user.
 */
export async function uploadMembersFromCSV(file: File) {
  try {
    // const fileContent = await new Promise<string>((resolve, reject) => {
    //   const reader = new FileReader();
    //   reader.onload = () => resolve(reader.result as string);
    //   reader.onerror = () => reject(reader.error);
    //   reader.readAsText(file);
    // });

    // const records = Papa.parse(fileContent, {
    //   header: true,
    //   skipEmptyLines: true,
    //   transformHeader: (header) => header.replace(/\s+/g, ' ').trim(),
    // }).data;

    // const formattedRecords = records.map((record: any) => ({
    //   id: record["id"] || uuidv4(),
    //   fullName: record["Full name"] || "",
    //   fullNameAm: record["ሙሉ ስም"] || record["Full name"] || "",
    //   phone: record["ስልክ ቁጥር"] || "",
    //   additionalFields: {
    //     "120": record["120"] || null,
    //     "121": record["121"] || null,
    //     "122": record["122"] || null,
    //     "123": record["123"] || null,
    //     "124": record["124"] || null,
    //     "125": record["125"] || null,
    //     "126": record["126"] || null,
    //     "127": record["127"] || null,
    //     "128": record["128"] || null,
    //     "129": record["129"] || null,
    //     "130": record["130"] || null,
    //   },
    // }));

    // const batchSize = 500;
    // for (let i = 0; i < formattedRecords.length; i += batchSize) {
    //   const batch = writeBatch(db);
    //   const chunk = formattedRecords.slice(i, i + batchSize);

    //   chunk.forEach((record: { id: string; fullName: string; fullNameAm: string; phone: string; additionalFields: Record<string, any> }) => {
    //     const docRef = doc(db, "membersListOld", record.id);
    //     batch.set(docRef, {
    //       fullName: record.fullName,
    //       fullNameAm: record.fullNameAm,
    //       phone: record.phone,
    //       additionalFields: record.additionalFields,
    //       createdAt: new Date().toISOString(),
    //     });
    //   });

    //   await batch.commit();
    // }

    console.log("CSV data successfully uploaded to Firestore.");
  } catch (error) {
    console.error("Error uploading CSV data to Firestore:", error);
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
      firstName: memberData.firstName,
      lastName: memberData.lastName,
      membershipId: memberData.membershipId, // Use membershipId consistently
      email: memberData.email,
      gender: memberData.gender,
      address: memberData.address,
      phone: memberData.phone,
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
