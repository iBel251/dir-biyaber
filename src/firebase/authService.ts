import { getAuth, signInWithEmailAndPassword, signOut } from "firebase/auth";
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
