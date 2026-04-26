import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash, Play, Activity } from 'lucide-react';
import { db } from '../lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { useCanUpload } from '../hooks/useCanUpload';
import { AdItem } from '../types';
import { useNavigate } from 'react-router-dom';

export function AdInventory() {
  const { user } = useAuth();
  const { canUpload, isSuperAdmin, loading: checkingUploadAccess } = useCanUpload();
  const navigate = useNavigate();

  const [ads, setAds] = useState<AdItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAd, setNewAd] = useState({ title: '', videoUrl: '', targetUrl: '' });

  useEffect(() => {
    if (!checkingUploadAccess && !canUpload) {
      navigate('/');
    }
  }, [canUpload, checkingUploadAccess, navigate]);

  useEffect(() => {
    if (canUpload) {
      loadAds();
    }
  }, [canUpload]);

  const loadAds = async () => {
    try {
      const snap = await getDocs(collection(db, 'ads'));
      setAds(snap.docs.map(d => ({ ...d.data(), id: d.id } as AdItem)));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    try {
      const adData = {
        title: newAd.title,
        videoUrl: newAd.videoUrl,
        targetUrl: newAd.targetUrl || '',
        authorId: user.uid,
        views: 0,
        createdAt: new Date().toISOString()
      };
      
      const docRef = doc(collection(db, 'ads'));
      await addDoc(collection(db, 'ads'), { ...adData, id: docRef.id });
      // Actually we just use addDoc without pre-minting id, wait, the rules say id == adId
      // Let's use setDoc
      const { setDoc } = await import('firebase/firestore');
      await setDoc(docRef, { ...adData, id: docRef.id });
      
      setNewAd({ title: '', videoUrl: '', targetUrl: '' });
      setShowAddModal(false);
      loadAds();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      if (confirm('Are you sure you want to delete this ad?')) {
        await deleteDoc(doc(db, 'ads', id));
        loadAds();
      }
    } catch (e) {
      console.error(e);
    }
  };

  if (loading || checkingUploadAccess) {
    return <div className="min-h-screen pt-24 text-center text-white">Loading...</div>;
  }

  return (
    <div className="min-h-screen pt-24 px-6 max-w-7xl mx-auto text-white">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-4xl font-bold font-sans tracking-tight mb-2">Ad Inventory</h1>
          <p className="text-white/60">Manage platform video advertisements</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 rounded-full font-bold transition-all"
        >
          <Plus className="w-5 h-5" /> New Ad
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {ads.map(ad => (
          <div key={ad.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 relative overflow-hidden group">
            <h3 className="text-xl font-bold mb-2 pr-8">{ad.title}</h3>
            <p className="text-sm text-white/50 mb-4 truncate" title={ad.targetUrl}>{ad.targetUrl || 'No target URL'}</p>
            
            <div className="flex items-center gap-4 text-purple-400">
              <div className="flex items-center gap-1">
                <Activity className="w-4 h-4" />
                <span className="font-bold">{ad.views}</span> views
              </div>
            </div>

            <button 
              onClick={() => handleDelete(ad.id)}
              className="absolute top-4 right-4 p-2 text-white/30 hover:text-red-400 hover:bg-white/10 rounded-full opacity-0 group-hover:opacity-100 transition-all"
            >
              <Trash className="w-4 h-4" />
            </button>
          </div>
        ))}

        {ads.length === 0 && (
          <div className="col-span-full py-12 text-center text-white/50 border border-dashed border-white/20 rounded-2xl">
            No ads uploaded yet.
          </div>
        )}
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-[#111] border border-white/10 rounded-3xl p-6 shadow-2xl"
          >
            <h2 className="text-2xl font-bold mb-6">Create New Ad</h2>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Ad Title</label>
                <input 
                  type="text" 
                  required 
                  value={newAd.title}
                  onChange={e => setNewAd({...newAd, title: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500" 
                  placeholder="e.g. Summer Sale 2026"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Video File URL</label>
                <input 
                  type="url" 
                  required 
                  value={newAd.videoUrl}
                  onChange={e => setNewAd({...newAd, videoUrl: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500" 
                  placeholder="Direct link to .mp4 file"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-white/70 mb-1">Target URL (Optional)</label>
                <input 
                  type="url" 
                  value={newAd.targetUrl}
                  onChange={e => setNewAd({...newAd, targetUrl: e.target.value})}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 outline-none focus:border-purple-500" 
                  placeholder="Where the user goes if they click"
                />
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl font-medium transition-colors">Cancel</button>
                <button type="submit" className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-bold transition-colors">Save Ad</button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
