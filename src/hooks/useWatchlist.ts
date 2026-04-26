import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, doc, setDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { Show } from '../types';

export function useWatchlist() {
  const { user } = useAuth();
  const [watchlist, setWatchlist] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setWatchlist([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const q = query(
      collection(db, 'users', user.uid, 'watchlist'),
      orderBy('addedAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const showIds: string[] = [];
      snapshot.forEach((doc) => {
        showIds.push(doc.data().id);
      });
      setWatchlist(showIds);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching watchlist:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const addToWatchlist = async (showId: string) => {
    if (user) {
      try {
        const docRef = doc(db, 'users', user.uid, 'watchlist', showId);
        await setDoc(docRef, {
          id: showId,
          addedAt: new Date().toISOString()
        });
      } catch (error) {
        console.error("Error adding to watchlist:", error);
      }
    }
  };

  const removeFromWatchlist = async (showId: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'users', user.uid, 'watchlist', showId));
      } catch (error) {
        console.error("Error removing from watchlist:", error);
      }
    }
  };
  
  const isInWatchlist = (showId: string) => {
    return watchlist.includes(showId);
  }

  return { watchlist, loading, addToWatchlist, removeFromWatchlist, isInWatchlist };
}
