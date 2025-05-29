import { getFirestore, collection, getDocs, updateDoc, doc } from 'firebase/firestore';

const db = getFirestore();

/**
 * Cleans up the "fullName" field in each document of the "membersListOld" collection.
 * Fixes double spaces and removes trailing codes after " - ".
 */
export async function cleanUpFullNames() {
  const membersCollection = collection(db, 'membersListOld');
  const snapshot = await getDocs(membersCollection);

  const updates = snapshot.docs.map(async (document) => {
    const data = document.data();
    let fullName = data.fullName;

    if (fullName) {
      // Remove unnecessary double spaces
      fullName = fullName.replace(/\s+/g, ' ').trim();

      // Remove trailing code after " - "
      const nameParts = fullName.split(' - ');
      fullName = nameParts[0];

      // Capitalize the first letter of each word
      fullName = fullName
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      // Update the document if the fullName was modified
      await updateDoc(doc(db, 'membersListOld', document.id), { fullName });
    }
  });

  await Promise.all(updates);
  console.log('Full names cleaned up successfully.');
}

/**
 * Tests the cleanup process for full names without updating the database.
 * Logs and returns the cleaned results for testing purposes.
 */
export async function testCleanUpFullNames() {
  const membersCollection = collection(db, 'membersListOld');
  const snapshot = await getDocs(membersCollection);

  const results = snapshot.docs.slice(0, 20).map((document) => {
    const data = document.data();
    let fullName = data.fullName;

    if (fullName) {
      // Remove unnecessary double spaces
      fullName = fullName.replace(/\s+/g, ' ').trim();

      // Remove trailing code after " - "
      const nameParts = fullName.split(' - ');
      fullName = nameParts[0];

      // Capitalize the first letter of each word
      fullName = fullName
        .split(' ')
        .map((word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');

      return { id: document.id, original: data.fullName, cleaned: fullName };
    }

    return { id: document.id, original: data.fullName, cleaned: null };
  });

  console.log('Test results (first 20):', results);
  return results;
}

/**
 * Cleans up the "phone" field in each document of the "membersListOld" collection.
 * Fixes formatting issues and ensures a standard format.
 */
export async function cleanUpPhoneNumbers() {
  const membersCollection = collection(db, 'membersListOld');
  const snapshot = await getDocs(membersCollection);

  const updates = snapshot.docs.map(async (document) => {
    const data = document.data();
    let phone = data.phone;

    if (phone) {
      // Remove any non-numeric characters except for slashes
      phone = phone.replace(/[^0-9/]/g, '');

      // Split multiple phone numbers by slash or space
      const phoneNumbers = phone.split(/\s|\//).filter(Boolean);

      // Format each phone number to the standard format (e.g., 909-123-1234)
      const formattedNumbers = phoneNumbers.map((num: string) => {
        if (num.length === 10) {
          return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
        }
        return num; // Keep as is if not 10 digits
      });

      // Join multiple numbers with a slash
      const formattedPhone = formattedNumbers.join(' / ');

      // Update the document if the phone was modified
      await updateDoc(doc(db, 'membersListOld', document.id), { phone: formattedPhone });
    }
  });

  await Promise.all(updates);
  console.log('Phone numbers cleaned up successfully.');
}

/**
 * Tests the cleanup process for phone numbers without updating the database.
 * Logs and returns the cleaned results for testing purposes.
 */
export async function testCleanUpPhoneNumbers2() {
  const membersCollection = collection(db, 'membersListOld');
  const snapshot = await getDocs(membersCollection);

  const results = snapshot.docs.slice(0, 20).map((document) => {
    const data = document.data();
    let phone = data.phone;

    if (phone) {
      // Remove any non-numeric characters except for slashes
      phone = phone.replace(/[^0-9/]/g, '');

      // Split multiple phone numbers by slash or space
      const phoneNumbers = phone.split(/\s|\//).filter(Boolean);

      // Format each phone number to the standard format (e.g., 909-123-1234)
      const formattedNumbers = phoneNumbers.map((num: string) => {
        if (num.length === 10) {
          return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
        }
        return num; // Keep as is if not 10 digits
      });

      // Join multiple numbers with a slash
      const formattedPhone = formattedNumbers.join(' / ');

      return { id: document.id, original: data.phone, cleaned: formattedPhone };
    }

    return { id: document.id, original: data.phone, cleaned: null };
  });

  console.log('Test results (first 20):', results);
  return results;
}

/**
 * Tests the cleanup process for phone numbers (last 20 documents) without updating the database.
 * Logs and returns the cleaned results for testing purposes.
 */
export async function testCleanUpPhoneNumbers() {
  const membersCollection = collection(db, 'membersListOld');
  const snapshot = await getDocs(membersCollection);

  const docs = snapshot.docs;
  const results = docs.slice(-20).map((document) => {
    const data = document.data();
    let phone = data.phone;

    if (phone) {
      // Remove any non-numeric characters except for slashes
      phone = phone.replace(/[^0-9/]/g, '');

      // Split multiple phone numbers by slash or space
      const phoneNumbers = phone.split(/\s|\//).filter(Boolean);

      // Format each phone number to the standard format (e.g., 909-123-1234)
      const formattedNumbers = phoneNumbers.map((num: string) => {
        if (num.length === 10) {
          return `${num.slice(0, 3)}-${num.slice(3, 6)}-${num.slice(6)}`;
        }
        return num; // Keep as is if not 10 digits
      });

      // Join multiple numbers with a slash
      const formattedPhone = formattedNumbers.join(' / ');

      return { id: document.id, original: data.phone, cleaned: formattedPhone };
    }

    return { id: document.id, original: data.phone, cleaned: null };
  });

  console.log('Test results (last 20):', results);
  return results;
}

/**
 * Updates the status field for a specific member in the membersListOld collection.
 * @param memberId The ID of the member to update.
 * @param newStatus The new status value to set.
 */
export async function updateMemberStatus(memberId: string, newStatus: string) {
  try {
    const memberRef = doc(db, 'membersListOld', memberId);
    await updateDoc(memberRef, { status: newStatus });
    console.log(`Status updated for member ${memberId} to '${newStatus}'.`);
    return true;
  } catch (error) {
    console.error('Error updating member status:', error);
    return false;
  }
}