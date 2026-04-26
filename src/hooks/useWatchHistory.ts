import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, limit, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Show } from '../types';

const STORAGE_KEY = 'ais_streaming_watch_history_v2';

export function useWatchHistory() {
  const { user } = useAuth();
  const [history, setHistory] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      // Load from local storage
      try {
        const data = localStorage.getItem(STORAGE_KEY);
        if (data) {
          setHistory(JSON.parse(data));
        } else {
          setHistory([]);
        }
      } catch (e) {
        console.warn('localStorage is blocked');
      }
      setLoading(false);
      
      const handleLocalChange = () => {
        try {
          const data = localStorage.getItem(STORAGE_KEY);
          if (data) setHistory(JSON.parse(data));
        } catch (e) {}
      };
      window.addEventListener('watchHistoryChanged', handleLocalChange);
      return () => window.removeEventListener('watchHistoryChanged', handleLocalChange);
    }

    // Load from Firestore
    setLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'watchHistory'),
      orderBy('watchedAt', 'desc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const shows: Show[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        shows.push({
          id: data.id,
          title: data.title,
          imageUrl: data.imageUrl,
          type: data.type as any,
          meta: data.meta || '',
          description: '', // Not stored to save space
        });
      });
      setHistory(shows);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching watch history:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToHistory = async (show: Show) => {
    // Check incognito first
    try {
      const { getUserSettings } = await import('../utils/userSettings');
      const settings = getUserSettings();
      if (settings.incognitoMode) return;
    } catch (e) {}

    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'watchHistory', show.id);
        await setDoc(docRef, {
          id: show.id,
          title: show.title,
          imageUrl: show.imageUrl,
          type: show.type,
          meta: show.meta || '',
          watchedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error adding to watch history:", error);
      }
    } else {
      // Local storage fallback
      try {
        const current = localStorage.getItem(STORAGE_KEY);
        let parsed: Show[] = current ? JSON.parse(current) : [];
        parsed = parsed.filter(s => s.id !== show.id);
        parsed.unshift(show);
        parsed = parsed.slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
        window.dispatchEvent(new Event('watchHistoryChanged'));
      } catch (e) {}
    }
  };

  const clearHistory = async () => {
    if (user) {
      // In a real app, we'd batch delete or use a cloud function.
      // For now, we just delete the docs we have in state.
      try {
        for (const show of history) {
          await deleteDoc(doc(db, 'users', user.uid, 'watchHistory', show.id));
        }
      } catch (error) {
        console.error("Error clearing watch history:", error);
      }
    } else {
      try {
        localStorage.removeItem(STORAGE_KEY);
        window.dispatchEvent(new Event('watchHistoryChanged'));
      } catch (e) {}
    }
  };

  const removeFromHistory = async (showId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'watchHistory', showId));
      } catch (error) {
        console.error("Error removing from watch history:", error);
      }
    } else {
      try {
        const current = localStorage.getItem(STORAGE_KEY);
        if (current) {
          let parsed: Show[] = JSON.parse(current);
          parsed = parsed.filter(s => s.id !== showId);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed));
          window.dispatchEvent(new Event('watchHistoryChanged'));
        }
      } catch (e) {}
    }
  };

  return { history, loading, addToHistory, removeFromHistory, clearHistory };
}
