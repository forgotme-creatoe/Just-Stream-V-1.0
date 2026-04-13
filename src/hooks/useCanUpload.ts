import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { doc, getDoc } from 'firebase/firestore';

const SUPER_ADMINS = ['simplynoone.writer@gmail.com', 'pratham.tyagi369@gmail.com'];

export function useCanUpload() {
  const { user } = useAuth();
  const [canUpload, setCanUpload] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAccess() {
      if (!user || !user.email) {
        setCanUpload(false);
        setLoading(false);
        return;
      }
      if (SUPER_ADMINS.includes(user.email)) {
        setCanUpload(true);
        setLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'allowedUploaders', user.email);
        const docSnap = await getDoc(docRef);
        setCanUpload(docSnap.exists());
      } catch (e) {
        console.error(e);
        setCanUpload(false);
      } finally {
        setLoading(false);
      }
    }
    checkAccess();
  }, [user]);

  return { 
    canUpload, 
    loading, 
    isSuperAdmin: user?.email ? SUPER_ADMINS.includes(user.email) : false 
  };
}
