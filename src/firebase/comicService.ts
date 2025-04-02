import { db } from './firebaseConfig';
import { collection, query, orderBy, limit, startAfter, getDocs } from 'firebase/firestore';

interface Comic {
  id: string;
  title: string;
  description: string;
  genre: string;
  cover: string;
  pages: string[];
  releaseDate: string;
  [key: string]: any; // Add additional fields as needed
}

// Local cache for comics
let cachedComics: Comic[] = [];
let lastVisible: any = null; // Tracks the last document for pagination

// Fetch comics with pagination
export const getPaginatedComics = async (pageSize: number): Promise<Comic[]> => {
  try {
    const comicsRef = collection(db, 'comics');
    let comicsQuery;

    // If this is the first page, fetch from the start
    if (!lastVisible) {
      comicsQuery = query(comicsRef, orderBy('title'), limit(pageSize));
    } else {
      // For subsequent pages, start after the last visible document
      comicsQuery = query(comicsRef, orderBy('title'), startAfter(lastVisible), limit(pageSize));
    }

    const querySnapshot = await getDocs(comicsQuery);

    // Update the last visible document for the next page
    lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1];

    // Map the fetched comics and add them to the cache
    const newComics = querySnapshot.docs.map(doc => {
      const { id, ...data } = doc.data() as Comic;
      return { id: doc.id, ...data };
    });
    cachedComics = [...cachedComics, ...newComics];

    return newComics;
  } catch (error) {
    console.error('Error fetching paginated comics: ', error);
    throw error;
  }
};

// Get cached comics
export const getCachedComics = (): Comic[] => {
  return cachedComics;
};

// Fetch all comics from Firebase
export const fetchAllComics = async (): Promise<Comic[]> => {
  try {
    const comicsRef = collection(db, 'comics');
    const querySnapshot = await getDocs(comicsRef);

    const comics = querySnapshot.docs.map(doc => ({
      ...(doc.data() as Comic),
    }));

    return comics;
  } catch (error) {
    console.error('Error fetching all comics: ', error);
    throw error;
  }
};