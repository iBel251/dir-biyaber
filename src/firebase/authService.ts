import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword } from "firebase/auth";
import { initializeApp, deleteApp } from "firebase/app";
import { app, firebaseConfig } from "./firebaseConfig"; // Ensure this file exports your Firebase configuration

const auth = getAuth(app);

// Function to handle user login
export async function login(email: string, password: string): Promise<void> {
    try {
        await signInWithEmailAndPassword(auth, email, password);
        console.log("User logged in successfully");
    } catch (error: any) {
        console.error("Error logging in:", error.code, error.message);
        throw error;
    }
}

// Function to handle user logout
export async function logout(): Promise<void> {
    try {
        await signOut(auth);
        console.log("User logged out successfully");
    } catch (error) {
        console.error("Error logging out:", error);
        throw error;
    }
}

// Function to get the currently logged-in user
export const getCurrentUser = () => {
    return auth.currentUser; // Returns the currently logged-in user or null if no user is logged in
};

// Function to handle password reset
export async function resetPassword(email: string): Promise<void> {
    try {
        await sendPasswordResetEmail(auth, email);
        console.log("If an account with this email exists, a password reset email has been sent.");
    } catch (error: any) {
        console.error("Error sending password reset email:", error.code, error.message);
        throw error;
    }
}

// Function to create an admin user.
// Runs on a temporary secondary Firebase app so that createUserWithEmailAndPassword
// signs the new user into *that* app instead of replacing the current admin's session.
export async function createAdminUser(email: string, password: string) {
    const secondaryApp = initializeApp(firebaseConfig, `admin-creation-${Date.now()}`);
    try {
        const secondaryAuth = getAuth(secondaryApp);
        const userCredential = await createUserWithEmailAndPassword(secondaryAuth, email, password);
        const { uid } = userCredential.user;
        await signOut(secondaryAuth);
        return { uid, email };
    } catch (error) {
        console.error("Error creating admin user:", error);
        throw error;
    } finally {
        await deleteApp(secondaryApp);
    }
}

// NOTE: deleting another user's auth account requires the Admin SDK and cannot be done
// from the client. Use deleteUserByUID() in firebaseAdminServices.ts, which invokes the
// 'deleteUser' callable Cloud Function.
