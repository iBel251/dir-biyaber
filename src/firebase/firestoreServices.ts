import { getFirestore, collection, getDocs, addDoc, deleteDoc, doc, updateDoc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { app, db } from "./firebaseConfig"; // Ensure this file exports your Firebase configuration

const storage = getStorage();

// Function to fetch all documents from the "obituaries" collection
export async function fetchObituaries() {
    try {
        const obituariesCollection = collection(db, "obituaries");
        const snapshot = await getDocs(obituariesCollection);

        // Map through the documents and return their data
        const obituaries = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return obituaries;
    } catch (error) {
        console.error("Error fetching obituaries:", error);
        throw error;
    }
}

// Function to fetch all documents from the "board_members" collection
export async function fetchBoardMembers() {
    try {
        const boardMembersCollection = collection(db, "board_members");
        const snapshot = await getDocs(boardMembersCollection);

        // Map through the documents and return their data
        const boardMembers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        return boardMembers;
    } catch (error) {
        console.error("Error fetching board members:", error);
        throw error;
    }
}

// Function to add a board member to Firestore and upload the image to Storage
export async function addBoardMember(member: { nameEn: string; nameAm: string; role: string; image: File | null }) {
    try {
        let imageUrl = null;

        // Upload image to Firebase Storage if provided
        if (member.image) {
            const uniqueImageName = `${Date.now()}_${member.image.name}`; // Append a timestamp to ensure uniqueness
            const storageRef = ref(storage, `members/${uniqueImageName}`);
            const snapshot = await uploadBytes(storageRef, member.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Add member data to Firestore
        const boardMembersCollection = collection(db, "board_members");
        const newMember = {
            nameEn: member.nameEn,
            nameAm: member.nameAm,
            role: member.role,
            imageUrl, // Link to the uploaded image
        };
        await addDoc(boardMembersCollection, newMember);
    } catch (error) {
        console.error("Error adding board member:", error);
        throw error;
    }
}

// Function to delete a board member and their image from Firestore and Storage
export async function deleteBoardMember(memberId: string, imageUrl: string | null) {
    try {
        // Delete the image from Firebase Storage if it exists
        if (imageUrl) {
            const imageRef = ref(storage, imageUrl);
            try {
                await deleteObject(imageRef);
            } catch (error: any) {
                if (error.code === 'storage/object-not-found') {
                    console.warn(`Image not found in storage: ${imageUrl}`);
                } else {
                    throw error; // Re-throw other errors
                }
            }
        }

        // Delete the member document from Firestore
        const memberDoc = doc(db, "board_members", memberId);
        await deleteDoc(memberDoc); // Ensure Firestore document is deleted regardless of imageUrl
    } catch (error) {
        console.error("Error deleting board member:", error);
        throw error;
    }
}

// Function to update a board member in Firestore
export async function updateBoardMember(member: { id: string; nameEn: string; nameAm: string; role: string; image: File | null; imageUrl?: string }) {
    try {
        const memberDoc = doc(db, "board_members", member.id);
        let imageUrl = member.image ? null : member.imageUrl;

        // Upload new image if provided
        if (member.image) {
            const uniqueImageName = `${Date.now()}_${member.image.name}`;
            const storageRef = ref(storage, `members/${uniqueImageName}`);
            const snapshot = await uploadBytes(storageRef, member.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Update Firestore document
        const updatedData = {
            nameEn: member.nameEn,
            nameAm: member.nameAm,
            role: member.role,
            imageUrl, // Update the imageUrl field
        };
        await updateDoc(memberDoc, updatedData);
    } catch (error) {
        console.error("Error updating board member:", error);
        throw error;
    }
}

// Function to add an obituary to Firestore
export async function addObituary(obituary: { nameEn: string; nameAm: string; birthYear: string; deathDate: string; number: string; image: File | null }) {
    try {
        let imageUrl = null;

        // Upload image to Firebase Storage if provided
        if (obituary.image) {
            const uniqueImageName = `${Date.now()}_${obituary.image.name}`;
            const storageRef = ref(storage, `obituaries/${uniqueImageName}`);
            const snapshot = await uploadBytes(storageRef, obituary.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Add obituary data to Firestore
        const obituariesCollection = collection(db, "obituaries");
        const newObituary = {
            nameEn: obituary.nameEn,
            nameAm: obituary.nameAm,
            birthYear: obituary.birthYear,
            deathDate: obituary.deathDate,
            number: obituary.number, // Added field
            imageUrl, // Link to the uploaded image
        };
        await addDoc(obituariesCollection, newObituary);
    } catch (error) {
        console.error("Error adding obituary:", error);
        throw error;
    }
}

// Function to delete an obituary and its image from Firestore and Storage
export async function deleteObituary(obituaryId: string, imageUrl: string | null) {
    try {
        // Delete the image from Firebase Storage if it exists
        if (imageUrl) {
            const imageRef = ref(storage, imageUrl);
            try {
                await deleteObject(imageRef);
            } catch (error: any) {
                if (error.code === 'storage/object-not-found') {
                    console.warn(`Image not found in storage: ${imageUrl}`);
                } else {
                    throw error; // Re-throw other errors
                }
            }
        }

        // Delete the obituary document from Firestore
        const obituaryDoc = doc(db, "obituaries", obituaryId);
        await deleteDoc(obituaryDoc);
    } catch (error) {
        console.error("Error deleting obituary:", error);
        throw error;
    }
}

// Function to update an obituary in Firestore
export async function updateObituary(obituary: { id: string; name: string; description: string; image: File | null; imageUrl?: string }) {
    try {
        const obituaryDoc = doc(db, "obituaries", obituary.id);
        let imageUrl = obituary.image ? null : obituary.imageUrl;

        // Upload new image if provided
        if (obituary.image) {
            const uniqueImageName = `${Date.now()}_${obituary.image.name}`;
            const storageRef = ref(storage, `obituaries/${uniqueImageName}`);
            const snapshot = await uploadBytes(storageRef, obituary.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Update Firestore document
        const updatedData = {
            name: obituary.name,
            description: obituary.description,
            imageUrl, // Update the imageUrl field
        };
        await updateDoc(obituaryDoc, updatedData);
    } catch (error) {
        console.error("Error updating obituary:", error);
        throw error;
    }
}

// Function to fetch user roles from the "roles" collection
export async function fetchUserRole(email: string): Promise<string | null> {
    try {
        const rolesDocRef = doc(db, "roles", "user_status");
        const rolesDoc = await getDoc(rolesDocRef);

        if (rolesDoc.exists()) {
            const rolesData = rolesDoc.data();
            return rolesData[email] || null; // Return the status for the given email
        } else {
            console.warn("No roles document found");
            return null;
        }
    } catch (error) {
        console.error("Error fetching user role:", error);
        throw error;
    }
}