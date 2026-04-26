import { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, getDocs, doc, setDoc, limit, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';
import { useWatchHistory } from './useWatchHistory';
import { useWatchlist } from './useWatchlist';
import { Notification } from '../types';

export function useNotifications() {
  const { user } = useAuth();
  const { history: watchHistory } = useWatchHistory();
  const { watchlist } = useWatchlist();
  
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!user) {
      setNotifications([]);
      setReadIds(new Set());
      setUnreadCount(0);
      setLoading(false);
      return;
    }

    // 1. Listen to global notifications AND user notifications
    // Since firestore doesn't do OR well with snapshot listeners on multiple where clauses without multiple listeners
    // We can just listen to 'target' == 'all' and 'target' == user.uid using "in" if supported.
    const q = query(
      collection(db, 'notifications'),
      where('target', 'in', ['all', user.uid]),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    const unsubscribeNotifications = onSnapshot(q, (snapshot) => {
      const allNotifs: Notification[] = [];
      snapshot.forEach(doc => {
        allNotifs.push(doc.data() as Notification);
      });
      
      // Client-side filtering: keep if it's not a show notification, 
      // OR if it is a show notification, check if showId is in history or watchlist.
      const relevantShows = new Set([...watchHistory.map(s => s.id), ...watchlist]);
      const filteredNotifs = allNotifs.filter(n => {
        if (!n.showId) return true;
        return relevantShows.has(n.showId);
      });
      
      setNotifications(filteredNotifs);
      setLoading(false);
    });

    // 2. Fetch read notifications
    const qRead = query(collection(db, 'users', user.uid, 'readNotifications'));
    const unsubscribeRead = onSnapshot(qRead, (snapshot) => {
      const readSet = new Set<string>();
      snapshot.forEach(doc => readSet.add(doc.id));
      setReadIds(readSet);
    });

    return () => {
      unsubscribeNotifications();
      unsubscribeRead();
    };
  }, [user, watchHistory, watchlist]);

  // Recalculate unread count when notifications or read state changes
  useEffect(() => {
    let unread = 0;
    notifications.forEach(n => {
      if (!readIds.has(n.id)) unread++;
    });
    setUnreadCount(unread);
  }, [notifications, readIds]);

  const markAsRead = async (notificationId: string) => {
    if (!user) return;
    if (readIds.has(notificationId)) return;
    try {
      await setDoc(doc(db, 'users', user.uid, 'readNotifications', notificationId), {
        id: notificationId
      });
    } catch(e) {
      console.error("Failed to mark notification as read", e);
    }
  };

  const markAllAsRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      const unreadNotifs = notifications.filter(n => !readIds.has(n.id));
      await Promise.all(unreadNotifs.map(n => 
        setDoc(doc(db, 'users', user.uid, 'readNotifications', n.id), { id: n.id })
      ));
    } catch(e) {
      console.error("Failed to mark all as read", e);
    }
  };

  return { notifications, readIds, unreadCount, loading, markAsRead, markAllAsRead };
}
