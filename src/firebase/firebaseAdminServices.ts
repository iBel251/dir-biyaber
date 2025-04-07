import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, arrayUnion, arrayRemove } from "firebase/firestore";
import { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } from "firebase/storage";
import { db } from "./firebaseConfig"; // Ensure this file exports your Firebase configuration
import { v4 as uuidv4 } from "uuid";
import { getFunctions, httpsCallable } from 'firebase/functions';

const functions = getFunctions();

// Function to fetch all documents from the "posts" collection
export async function fetchPosts() {
    try {
        const sectionsDocRef = doc(db, "posts", "sections");
        const sectionsDoc = await getDoc(sectionsDocRef);

        if (!sectionsDoc.exists()) {
            console.warn("No posts found in the sections document.");
            return [];
        }

        const data = sectionsDoc.data();
        return data?.posts || [];
    } catch (error) {
        console.error("Error fetching posts:", error);
        throw error;
    }
}

// Function to add a post to the "sections" document in the "posts" collection
export async function addPost(post: { header: string; body: string; image: File | null }) {
    try {
        // Validate post content
        if (!post.header.trim() || !post.body.trim()) {
            throw new Error("Header and body cannot be empty.");
        }

        let imageUrl = null;

        // Validate and upload image if provided
        if (post.image) {
            const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/webm"];
            if (!validImageTypes.includes(post.image.type)) {
                throw new Error("Invalid image type. Only JPG, PNG, WEBP, and WEBM are allowed.");
            }
            if (post.image.size > 5 * 1024 * 1024) { // 5MB limit
                throw new Error("Image size must be less than 5MB.");
            }

            const uniqueImageName = `${Date.now()}_${post.image.name}`; // Append a timestamp to ensure uniqueness
            const storageRef = ref(getStorage(), `posts/${uniqueImageName}`);
            const snapshot = await uploadBytes(storageRef, post.image);
            imageUrl = await getDownloadURL(snapshot.ref);
        }

        // Reference to the "sections" document in the "posts" collection
        const sectionsDocRef = doc(db, "posts", "sections");

        // Check if the document exists
        const sectionsDoc = await getDoc(sectionsDocRef);

        const newPost = {
            id: uuidv4(), // Generate a truly unique ID here
            header: post.header,
            body: post.body,
            imageUrl,
            createdAt: new Date().toISOString(),
        };

        if (!sectionsDoc.exists()) {
            // If the document doesn't exist, create it with an initial array
            await setDoc(sectionsDocRef, {
                posts: [newPost],
            });
        } else {
            // If the document exists, update it by appending the new post
            await updateDoc(sectionsDocRef, {
                posts: arrayUnion(newPost),
            });
        }
    } catch (error) {
        console.error("Error adding post:", error);
        throw error;
    }
}

// Function to delete a post from the "sections" document in the "posts" collection
export async function deletePost(postToDelete: { id: string; header: string; body: string; imageUrl: string | null; createdAt: string }) {
    try {
        const sectionsDocRef = doc(db, "posts", "sections");
        const sectionsDoc = await getDoc(sectionsDocRef);

        if (!sectionsDoc.exists()) {
            throw new Error("Sections document does not exist.");
        }

        const data = sectionsDoc.data();
        const updatedPosts = (data?.posts || []).filter(
            (post: any) => post.id !== postToDelete.id
        );

        await setDoc(sectionsDocRef, { posts: updatedPosts });

        // Optionally delete the image from storage
        if (postToDelete.imageUrl) {
            const storageRef = ref(getStorage(), postToDelete.imageUrl);

            await deleteObject(storageRef).catch(() => {
                console.warn("Failed to delete image from storage.");
            });
        }
    } catch (error) {
        console.error("Error deleting post:", error);
        throw error;
    }
}

// Function to edit the image of a post
export async function editPostImage(postId: string, newImage: File) {
    try {
        const validImageTypes = ["image/jpeg", "image/png", "image/webp", "image/webm"];
        if (!validImageTypes.includes(newImage.type)) {
            throw new Error("Invalid image type. Only JPG, PNG, WEBP, and WEBM are allowed.");
        }
        if (newImage.size > 5 * 1024 * 1024) { // 5MB limit
            throw new Error("Image size must be less than 5MB.");
        }

        const sectionsDocRef = doc(db, "posts", "sections");
        const sectionsDoc = await getDoc(sectionsDocRef);

        if (!sectionsDoc.exists()) {
            throw new Error("Sections document does not exist.");
        }

        const data = sectionsDoc.data();
        const posts = data?.posts || [];
        const postIndex = posts.findIndex((post: any) => post.id === postId); // Use `id` to find the correct post

        if (postIndex === -1) {
            throw new Error("Post not found.");
        }

        const oldImageUrl = posts[postIndex].imageUrl;

        // Upload new image
        const uniqueImageName = `${Date.now()}_${newImage.name}`;
        const storageRef = ref(getStorage(), `posts/${uniqueImageName}`);
        const snapshot = await uploadBytes(storageRef, newImage);
        const newImageUrl = await getDownloadURL(snapshot.ref);

        // Update the post with the new image URL
        posts[postIndex] = {
            ...posts[postIndex],
            imageUrl: newImageUrl,
        };

        await setDoc(sectionsDocRef, { posts });

        // Delete the old image from storage
        if (oldImageUrl) {
            const oldImageRef = ref(getStorage(), oldImageUrl);
            await deleteObject(oldImageRef).catch(() => {
                console.warn("Failed to delete old image from storage.");
            });
        }

        return newImageUrl;
    } catch (error) {
        console.error("Error editing post image:", error);
        throw error;
    }
}

// Function to edit the contents of a post
export async function editPost(postId: string, updatedFields: { header: string; body: string }) {
    const sectionsDocRef = doc(db, "posts", "sections");
    const sectionsDoc = await getDoc(sectionsDocRef);

    if (!sectionsDoc.exists()) {
        throw new Error("Sections document does not exist.");
    }

    const data = sectionsDoc.data();
    const posts = data?.posts || [];
    const postIndex = posts.findIndex((post: any) => post.id === postId);

    if (postIndex === -1) {
        throw new Error("Post not found.");
    }

    posts[postIndex] = {
        ...posts[postIndex],
        header: updatedFields.header,
        body: updatedFields.body,
    };

    await setDoc(sectionsDocRef, { posts });
}

// Function to set user role in the "roles" collection
export async function setUserRole(email: string, role: string, name: string, uid?: string) {
    const rolesDocRef = doc(db, 'roles', 'user_status');
    const userObj = { email, role, name, uid };
    const docSnap = await getDoc(rolesDocRef);

    if (!docSnap.exists()) {
        // Creates an array of user objects
        await setDoc(rolesDocRef, { userRoles: [userObj] });
    } else {
        // Appends a new user object to the array
        await updateDoc(rolesDocRef, {
            userRoles: arrayUnion(userObj),
        });
    }
}

// Function to fetch user roles from the "user_status" document
export async function fetchUserRoles() {
    const rolesDocRef = doc(db, 'roles', 'user_status');
    const docSnap = await getDoc(rolesDocRef);
    if (!docSnap.exists()) {
        return [];
    }
    const data = docSnap.data();
    return data.userRoles || [];
}

// Function to update the role of an existing user
export async function updateUserRole(email: string, newRole: string) {
    const rolesDocRef = doc(db, 'roles', 'user_status');
    const docSnap = await getDoc(rolesDocRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const updatedList = (data.userRoles || []).map((u: any) =>
        u.email === email ? { ...u, role: newRole } : u
    );

    await updateDoc(rolesDocRef, {
        userRoles: updatedList
    });
}

// Function to remove a user role from the "roles" collection
export async function removeUserRole(email: string) {
    const rolesDocRef = doc(db, 'roles', 'user_status');
    const docSnap = await getDoc(rolesDocRef);
    if (!docSnap.exists()) return;

    const data = docSnap.data();
    const updatedList = (data.userRoles || []).filter((u: any) => u.email !== email);

    await updateDoc(rolesDocRef, {
        userRoles: updatedList
    });
}

// Function to delete a user by UID using Firebase Functions
export async function deleteUserByUID(uid: string): Promise<void> {
    const deleteUser = httpsCallable(functions, 'deleteUser');
    await deleteUser({ uid });
}
