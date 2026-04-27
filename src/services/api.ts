import { Show, Episode } from '../types';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit, deleteDoc, updateDoc, increment } from 'firebase/firestore';

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
  async trackView(showId: string, episodeId?: string): Promise<void> {
    try {
      const ref = episodeId ? doc(db, 'shows', showId, 'episodes', episodeId) : doc(db, 'shows', showId);
      await updateDoc(ref, {
        "viewMetrics.views": increment(1),
        "viewMetrics.dropped": increment(1)
      });
    } catch (e) {
      console.error("View tracking error:", e);
    }
  },

  async trackCompletion(showId: string, episodeId?: string): Promise<void> {
    try {
      const ref = episodeId ? doc(db, 'shows', showId, 'episodes', episodeId) : doc(db, 'shows', showId);
      await updateDoc(ref, {
        "viewMetrics.completed": increment(1),
        "viewMetrics.dropped": increment(-1)
      });
    } catch (e) {
      console.error("Completion tracking error:", e);
    }
  },

  async deleteShow(showId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'shows', showId));
    } catch (e) {
      console.error("Failed to delete show:", e);
      throw e;
    }
  },

  async deleteEpisode(showId: string, episodeId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'shows', showId, 'episodes', episodeId));
    } catch (e) {
      console.error("Failed to delete episode:", e);
      throw e;
    }
  },

  async getTop10Shows(type?: string): Promise<Show[]> {
    try {
      let q;
      if (type) {
        q = query(collection(db, 'shows'), where('type', '==', type), limit(200));
      } else {
        q = query(collection(db, 'shows'), limit(200));
      }
      const snapshot = await getDocs(q);
      const allShows = snapshot.docs.map(doc => doc.data() as Show);
      return allShows.sort((a,b) => (b.viewMetrics?.views || 0) - (a.viewMetrics?.views || 0)).slice(0, 10);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getTrendingMusic(page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Music'), limit(200));
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
      const q = query(collection(db, 'shows'), where('type', '==', 'Movie'), limit(200));
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
      const q = query(collection(db, 'shows'), where('type', '==', 'Shorts'), limit(200));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async searchMusic(searchQuery: string, page = 1): Promise<Show[]> {
    if (page > 1) return [];
    try {
      const q = query(collection(db, 'shows'), where('type', '==', 'Music'), limit(200));
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
      const q = query(collection(db, 'shows'), where('type', '==', 'Series'), limit(200));
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
      const q = query(collection(db, 'shows'), where('type', '==', 'Series'), limit(200));
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
      const q = query(collection(db, 'shows'), where('type', '==', 'Movie'), limit(200));
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
      const q = query(collection(db, 'shows'), where('type', '==', 'Movie'), limit(200));
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Show);
    } catch (e) {
      console.error(e);
      return [];
    }
  },

  async getSuggestedShows(watchHistory: Show[], limitCount = 10): Promise<Show[]> {
    try {
      if (watchHistory.length === 0) return [];

      // Extract types and tags from history
      const types = Array.from(new Set(watchHistory.map(show => show.type))).filter(Boolean);
      const rawTags = watchHistory.map(show => show.tags || []).flat();

      const tagCounts: Record<string, number> = {};
      rawTags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });

      const topTags = Object.entries(tagCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([tag]) => tag);

      let q;
      if (topTags.length > 0) {
        q = query(collection(db, 'shows'), where('tags', 'array-contains-any', topTags), limit(limitCount + watchHistory.length));
      } else if (types.length > 0) {
        q = query(collection(db, 'shows'), where('type', 'in', types.slice(0, 10)), limit(limitCount + watchHistory.length));
      } else {
        return [];
      }

      const snapshot = await getDocs(q);
      const historyIds = new Set(watchHistory.map(s => s.id));

      return snapshot.docs
        .map(doc => doc.data() as Show)
        .filter(show => !historyIds.has(show.id)) // Exclude already watched
        .slice(0, limitCount);

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

  async getEpisodes(showId: string): Promise<Episode[]> {
    try {
      const q = query(
        collection(db, 'shows', showId, 'episodes'),
        orderBy('episodeNumber', 'asc')
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => doc.data() as Episode);
    } catch (e) {
      console.error(e);
      return [];
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
