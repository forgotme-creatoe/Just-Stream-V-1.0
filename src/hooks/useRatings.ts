import { useState, useEffect } from 'react';
import { collection, query, doc, setDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useRatings(showId: string) {
  const { user } = useAuth();
  const [userRating, setUserRating] = useState<number | null>(null);
  const [averageRating, setAverageRating] = useState<number | null>(null);
  const [totalRatings, setTotalRatings] = useState(0);

  useEffect(() => {
    if (!showId) return;

    const q = query(collection(db, 'shows', showId, 'ratings'));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      let total = 0;
      let count = 0;
      let currentUserRating = null;

      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.rating) {
          total += data.rating;
          count++;
          if (user && data.userId === user.uid) {
            currentUserRating = data.rating;
          }
        }
      });

      setTotalRatings(count);
      setAverageRating(count > 0 ? Number((total / count).toFixed(1)) : null);
      setUserRating(currentUserRating);
    }, (error) => {
      console.error("Error fetching ratings:", error);
    });

    return () => unsubscribe();
  }, [showId, user]);

  const submitRating = async (rating: number) => {
    if (!user) return;
    try {
      const ratingRef = doc(db, 'shows', showId, 'ratings', user.uid);
      await setDoc(ratingRef, {
        rating,
        userId: user.uid,
        updatedAt: new Date().toISOString()
      });
    } catch (error) {
      console.error("Error submitting rating:", error);
    }
  };

  return { averageRating, totalRatings, userRating, submitRating };
}
