import { getAuth, signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
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
