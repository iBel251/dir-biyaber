import { getFirestore, collection, getDocs, addDoc, doc, getDoc, setDoc, updateDoc, deleteDoc, arrayUnion, arrayRemove } from "firebase/firestore";
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
export async function addPost(post: { header: string; body: string; image: File | null; section: string; amharicHeader?: string; amharicBody?: string }) {
    try {
        // Validate post content
        if (!post.header.trim() || !post.body.trim() || !post.section.trim()) {
            throw new Error("Header, body, and section cannot be empty.");
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
            section: post.section, // Add section field
            amharicHeader: post.amharicHeader || null, // Save as null if not provided
            amharicBody: post.amharicBody || null,     // Save as null if not provided
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
export async function editPost(postId: string, updatedFields: { header: string; body: string; section: string; amharicHeader?: string; amharicBody?: string }) {
    try {
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

        // Update the post with new fields, including Amharic fields
        posts[postIndex] = {
            ...posts[postIndex],
            header: updatedFields.header,
            body: updatedFields.body,
            section: updatedFields.section,
            amharicHeader: updatedFields.amharicHeader || null, // Save as null if not provided
            amharicBody: updatedFields.amharicBody || null,     // Save as null if not provided
        };

        // Save the updated posts array back to Firestore
        await setDoc(sectionsDocRef, { posts });
    } catch (error) {
        console.error("Error editing post:", error);
        throw error;
    }
}

/*
 * Admin roles are stored twice, on purpose:
 *
 *  - legacy: a single roles/user_status document holding an array of user objects.
 *  - current: one document per admin in the adminRoles collection, keyed by lowercased
 *    email.
 *
 * Only the second shape can be read from Firestore security rules — the rules language
 * cannot search an array of maps for a matching field. Every mutation below writes both
 * shapes and every read prefers adminRoles but falls back to the array, so the portal
 * behaves identically whether or not migrateAdminRoles() has been run yet.
 *
 * Once the adminRoles collection is populated and the rules are deployed, the legacy
 * array and the dual-write can be dropped.
 */

const ADMIN_ROLES_COLLECTION = 'adminRoles';
const LEGACY_ROLES_DOC = ['roles', 'user_status'] as const;

// Document IDs and the email claim compared against them in rules are both lowercased,
// so that a difference in capitalisation can never cost an admin their access.
function adminRoleKey(email: string) {
    return email.trim().toLowerCase();
}

function legacyRolesRef() {
    return doc(db, LEGACY_ROLES_DOC[0], LEGACY_ROLES_DOC[1]);
}

async function readLegacyRoles(): Promise<any[]> {
    const docSnap = await getDoc(legacyRolesRef());
    if (!docSnap.exists()) return [];
    return docSnap.data()?.userRoles || [];
}

async function writeLegacyRoles(userRoles: any[]) {
    await setDoc(legacyRolesRef(), { userRoles }, { merge: true });
}

// Function to set user role in the "adminRoles" collection (and the legacy array)
export async function setUserRole(email: string, role: string, name: string, uid?: string) {
    const key = adminRoleKey(email);
    const userObj = { email: key, role, name, uid: uid ?? null };

    await setDoc(doc(db, ADMIN_ROLES_COLLECTION, key), userObj);

    const legacy = await readLegacyRoles();
    const withoutUser = legacy.filter((u: any) => adminRoleKey(u.email || '') !== key);
    await writeLegacyRoles([...withoutUser, userObj]);
}

// Function to fetch every admin, preferring adminRoles and falling back to the legacy array
export async function fetchUserRoles() {
    const snapshot = await getDocs(collection(db, ADMIN_ROLES_COLLECTION));
    if (!snapshot.empty) {
        return snapshot.docs.map((d) => ({ ...d.data(), email: d.id }));
    }
    return readLegacyRoles();
}

// Function to update the role of an existing user
export async function updateUserRole(email: string, newRole: string) {
    const key = adminRoleKey(email);

    const adminRoleRef = doc(db, ADMIN_ROLES_COLLECTION, key);
    if ((await getDoc(adminRoleRef)).exists()) {
        await updateDoc(adminRoleRef, { role: newRole });
    }

    const legacy = await readLegacyRoles();
    await writeLegacyRoles(
        legacy.map((u: any) => (adminRoleKey(u.email || '') === key ? { ...u, role: newRole } : u))
    );
}

// Function to remove a user role from both stores
export async function removeUserRole(email: string) {
    const key = adminRoleKey(email);

    await deleteDoc(doc(db, ADMIN_ROLES_COLLECTION, key));

    const legacy = await readLegacyRoles();
    await writeLegacyRoles(legacy.filter((u: any) => adminRoleKey(u.email || '') !== key));
}

/**
 * Re-seeds the adminRoles collection from the legacy roles/user_status array.
 *
 * This was run once on 2026-08-10 to populate adminRoles, and the button that invoked it
 * has since been removed from the portal. It is kept as a recovery path: adminRoles is
 * what firestore.rules reads to authorise every admin, so if that collection is ever lost
 * or restored empty, every admin is locked out of the portal and out of the console-free
 * means of fixing it. Wire this to a temporary button, or recreate the handful of
 * documents by hand in the Firebase console.
 *
 * Safe to run repeatedly; does not delete the legacy array.
 *
 * @returns the emails that were written.
 */
export async function migrateAdminRoles(): Promise<string[]> {
    const legacy = await readLegacyRoles();
    const migrated: string[] = [];

    for (const user of legacy) {
        if (!user?.email) continue;
        const key = adminRoleKey(user.email);
        await setDoc(
            doc(db, ADMIN_ROLES_COLLECTION, key),
            { email: key, role: user.role, name: user.name ?? '', uid: user.uid ?? null },
            { merge: true }
        );
        migrated.push(key);
    }

    return migrated;
}

// Function to delete a user by UID using Firebase Functions
export async function deleteUserByUID(uid: string): Promise<void> {
    const deleteUser = httpsCallable(functions, 'deleteUser');
    await deleteUser({ uid });
}

// Function to fetch a user's role by email, preferring adminRoles over the legacy array
export async function fetchUserRoleByEmail(email: string): Promise<string | null> {
    const key = adminRoleKey(email);
    try {
        const adminRoleDoc = await getDoc(doc(db, ADMIN_ROLES_COLLECTION, key));
        if (adminRoleDoc.exists()) {
            return adminRoleDoc.data()?.role || null;
        }

        // Not migrated yet — fall back to the legacy array so the portal keeps working.
        const legacy = await readLegacyRoles();
        return legacy.find((u: any) => adminRoleKey(u.email || '') === key)?.role || null;
    } catch (error) {
        console.error("Error fetching user role by email:", error);
        throw error;
    }
}

/**
 * Updates the order of posts in the "sections" document in the "posts" collection.
 * @param updatedPosts - The rearranged array of posts.
 */
export async function updatePostsOrder(updatedPosts: any[]) {
    try {
        const sectionsDocRef = doc(db, "posts", "sections");

        // Ensure the document exists before updating
        const sectionsDoc = await getDoc(sectionsDocRef);
        if (!sectionsDoc.exists()) {
            throw new Error("Sections document does not exist.");
        }

        // Update the posts array with the new order
        await setDoc(sectionsDocRef, { posts: updatedPosts });
    } catch (error) {
        console.error("Error updating posts order:", error);
        throw error;
    }
}

// Function to add a form to the "forms" document in the "posts" collection
export async function addForm(form: { nameAm: string; nameEn: string; file: File; description: string }) {
    try {
        // Validate form fields
        if (!form.nameAm.trim() || !form.nameEn.trim() || !form.file) {
            throw new Error("Form name (Amharic), name (English), and file are required.");
        }

        // Validate file type (PDF, DOC, DOCX)
        const validFileTypes = [
            "application/pdf",
            "application/msword",
            "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ];
        if (!validFileTypes.includes(form.file.type)) {
            throw new Error("Invalid file type. Only PDF, DOC, and DOCX are allowed.");
        }
        if (form.file.size > 10 * 1024 * 1024) { // 10MB limit
            throw new Error("File size must be less than 10MB.");
        }

        // Use English form name for file name in storage
        const extension = form.file.name.split('.').pop();
        const sanitizedEnName = form.nameEn.replace(/[^a-zA-Z0-9-_ ]/g, '').replace(/\s+/g, '_');
        const fileNameForStorage = `${sanitizedEnName}_${Date.now()}.${extension}`;
        const storageRef = ref(getStorage(), `forms/${fileNameForStorage}`);
        const snapshot = await uploadBytes(storageRef, form.file);
        const fileUrl = await getDownloadURL(snapshot.ref);

        // Reference to the "forms" document in the "posts" collection
        const formsDocRef = doc(db, "posts", "forms");
        const formsDoc = await getDoc(formsDocRef);

        const newForm = {
            id: uuidv4(),
            nameAm: form.nameAm,
            nameEn: form.nameEn,
            fileUrl,
            fileName: `${sanitizedEnName}.${extension}`,
            description: form.description,
            createdAt: new Date().toISOString(),
        };

        if (!formsDoc.exists()) {
            // If the document doesn't exist, create it with an initial array
            await setDoc(formsDocRef, {
                forms: [newForm],
            });
        } else {
            // If the document exists, update it by appending the new form
            await updateDoc(formsDocRef, {
                forms: arrayUnion(newForm),
            });
        }
    } catch (error) {
        console.error("Error adding form:", error);
        throw error;
    }
}

// Function to fetch all forms from the "forms" document in the "posts" collection
export async function fetchForms() {
    try {
        const formsDocRef = doc(db, "posts", "forms");
        const formsDoc = await getDoc(formsDocRef);
        if (!formsDoc.exists()) {
            return [];
        }
        const data = formsDoc.data();
        return data?.forms || [];
    } catch (error) {
        console.error("Error fetching forms:", error);
        throw error;
    }
}

// Function to remove a form from the "forms" document in the "posts" collection
export async function removeForm(formId: string) {
    try {
        const formsDocRef = doc(db, "posts", "forms");
        const formsDoc = await getDoc(formsDocRef);
        if (!formsDoc.exists()) {
            throw new Error("Forms document does not exist.");
        }
        const data = formsDoc.data();
        const forms = data?.forms || [];
        const formToRemove = forms.find((f: any) => f.id === formId);
        if (!formToRemove) {
            throw new Error("Form not found.");
        }
        // Remove file from storage
        if (formToRemove.fileUrl) {
            try {
                const storage = getStorage();
                // Extract the path after the storage bucket domain
                const url = new URL(formToRemove.fileUrl);
                const pathStart = url.pathname.indexOf('/o/') + 3;
                const pathEnd = url.pathname.indexOf('?');
                let filePath = decodeURIComponent(url.pathname.substring(pathStart));
                if (filePath.endsWith('.pdf') || filePath.endsWith('.doc') || filePath.endsWith('.docx')) {
                  // do nothing, filePath is correct
                }
                const fileRef = ref(storage, filePath);
                await deleteObject(fileRef);
            } catch (e) {
                // Ignore storage deletion errors
            }
        }
        // Remove form from array
        const updatedForms = forms.filter((f: any) => f.id !== formId);
        await setDoc(formsDocRef, { forms: updatedForms });
    } catch (error) {
        console.error("Error removing form:", error);
        throw error;
    }
}

// Function to edit the names and description of a form in the "forms" document in the "posts" collection
export async function editForm(formId: string, updatedFields: { nameAm?: string; nameEn?: string; description?: string }) {
    try {
        const formsDocRef = doc(db, "posts", "forms");
        const formsDoc = await getDoc(formsDocRef);
        if (!formsDoc.exists()) {
            throw new Error("Forms document does not exist.");
        }
        const data = formsDoc.data();
        const forms = data?.forms || [];
        const formIndex = forms.findIndex((f: any) => f.id === formId);
        if (formIndex === -1) {
            throw new Error("Form not found.");
        }
        // Update the form fields
        forms[formIndex] = {
            ...forms[formIndex],
            ...updatedFields,
        };
        await setDoc(formsDocRef, { forms });
    } catch (error) {
        console.error("Error editing form:", error);
        throw error;
    }
}
