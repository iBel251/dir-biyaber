import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail, createUserWithEmailAndPassword, deleteUser } from "firebase/auth";
import { app } from "./firebaseConfig"; // Ensure this file exports your Firebase configuration

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

// Function to create an admin user
export async function createAdminUser(email: string, password: string) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        return userCredential.user;
    } catch (error) {
        console.error("Error creating admin user:", error);
        throw error;
    }
}

// Function to delete an admin user
export async function deleteAdminUser(uid: string): Promise<void> {
    try {
        await deleteUser(auth.currentUser!); // The user object must be the one you intend to delete, if logged in
        console.log("Admin user deleted successfully.");
    } catch (error) {
        console.error("Error deleting admin user:", error);
        throw error;
    }
}
