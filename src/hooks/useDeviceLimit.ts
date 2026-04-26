import { useState, useEffect } from 'react';
import { collection, doc, setDoc, onSnapshot, deleteDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../contexts/AuthContext';

export function useDeviceLimit() {
  const { userProfile, user } = useAuth();
  const [deviceAllowed, setDeviceAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) {
      setDeviceAllowed(true);
      return;
    }

    let isSubscribed = true;

    // Get or generate device ID
    let deviceId = localStorage.getItem('deviceId');
    if (!deviceId) {
      deviceId = Math.random().toString(36).substring(2, 15);
      localStorage.setItem('deviceId', deviceId);
    }
    
    // Heartbeat every 20 seconds
    const sessionRef = doc(db, 'users', user.uid, 'sessions', deviceId);
    
    const updateSession = async () => {
      if (!isSubscribed) return;
      try {
        await setDoc(sessionRef, {
          id: deviceId,
          lastActive: new Date().toISOString()
        });
      } catch (e) {
        console.error("Failed to update session", e);
      }
    };
    
    updateSession();
    const interval = setInterval(updateSession, 20000);
    
    const cleanupSession = async () => {
      try {
        await deleteDoc(sessionRef);
      } catch (e) {}
    }
    
    // Listen to all sessions for this user
    const q = collection(db, 'users', user.uid, 'sessions');
    const unsubscribe = onSnapshot(q, (snapshot) => {
      if (!isSubscribed) return;
      
      let activeSessions: {id: string, lastActive: string}[] = [];
      const now = Date.now();
      
      snapshot.forEach(doc => {
        const data = doc.data();
        if (data.lastActive) {
          const activeTime = new Date(data.lastActive).getTime();
          // Consider active if updated within last 60 seconds
          if (now - activeTime < 60000) {
            activeSessions.push({ id: data.id, lastActive: data.lastActive });
          }
        }
      });
      
      // Sort by last active descending (most recently active stays)
      // Actually, younger sessions might be priority, or older sessions? 
      // Netflix prioritizes current watcher unless limit is hit. 
      // Let's sort by last modified descending
      activeSessions.sort((a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime());
      
      const plan = userProfile?.plan || 'Free';
      let limit = 1;
      if (plan === 'Casual') limit = 3;
      if (plan === 'Premium') limit = 4;
      
      // If our device is in the top N active sessions, we are allowed
      const allowedSessionIds = activeSessions.slice(0, limit).map(s => s.id);
      
      if (allowedSessionIds.includes(deviceId!)) {
        setDeviceAllowed(true);
      } else {
        // If there are fewer sessions than limit, we are allowed too (maybe our write hasn't propagated yet)
        if (activeSessions.length < limit) {
           setDeviceAllowed(true);
        } else {
           setDeviceAllowed(false);
        }
      }
    }, (error) => {
      console.error(error);
    });

    window.addEventListener('beforeunload', cleanupSession);

    return () => {
      isSubscribed = false;
      clearInterval(interval);
      unsubscribe();
      window.removeEventListener('beforeunload', cleanupSession);
      cleanupSession();
    };
  }, [user, userProfile]);

  return { deviceAllowed };
}
