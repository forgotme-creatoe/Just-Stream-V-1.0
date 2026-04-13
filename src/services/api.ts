import { Show } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit } from 'firebase/firestore';

export interface WatchProvider {
  provider_id: number;
  provider_name: string;
  logo_path?: string;
  url?: string;
}

export interface WatchProvidersData {
  link?: string;
  flatrate?: WatchProvider[];
  rent?: WatchProvider[];
  buy?: WatchProvider[];
}

// --- API Service ---

export const api = {
  async getTrendingAnime(page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Originals'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getAnimeMovies(page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Movie'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getKidsShows(page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Shorts'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async searchAnime(searchQuery: string, page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), limit(50));
      const snapshot = await getDocs(q);
      const allShows = snapshot.docs.map(doc => doc.data() as Show);
      return allShows.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getTrendingSeries(page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Series'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async searchSeries(searchQuery: string, page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Series'), limit(50));
      const snapshot = await getDocs(q);
      const allShows = snapshot.docs.map(doc => doc.data() as Show);
      return allShows.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async searchMovies(searchQuery: string, page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Movie'), limit(50));
      const snapshot = await getDocs(q);
      const allShows = snapshot.docs.map(doc => doc.data() as Show);
      return allShows.filter(s => s.title.toLowerCase().includes(searchQuery.toLowerCase()));
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getTrendingMovies(page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Movie'), limit(20));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getDetails(id: string): Promise<Show | null> {
    try {
      const docRef = doc(db, 'shows', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return docSnap.data() as Show;
      }
      return null;
    } catch (e) {
      console.error(e);
      return null;
    }
  },

  async getWatchProviders(title: string, type: string, year?: number): Promise<WatchProvidersData | null> {
    return {
      flatrate: [{
        provider_id: 1,
        provider_name: 'JustStream',
      }]
    };
  }
};
