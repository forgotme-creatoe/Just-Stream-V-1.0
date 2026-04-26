import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { collection, query, getDocs, where, documentId } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useWatchlist } from '../hooks/useWatchlist';
import { ShowCard } from '../components/ShowCard';
import { Navbar } from '../components/Navbar';
import { Show } from '../types';
import { Bookmark, Loader2 } from 'lucide-react';

export default function WatchlistPage() {
  const { watchlist, loading: watchlistLoading } = useWatchlist();
  const [shows, setShows] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchWatchlistShows() {
      if (watchlist.length === 0) {
        setShows([]);
        setLoading(false);
        return;
      }
      
      setLoading(true);
      try {
        // Firestore 'in' query supports up to 30 items. We split it if needed.
        const chunks = [];
        for (let i = 0; i < watchlist.length; i += 30) {
          chunks.push(watchlist.slice(i, i + 30));
        }
        
        let allShows: Show[] = [];
        for (const chunk of chunks) {
          const q = query(collection(db, 'shows'), where(documentId(), 'in', chunk));
          const snapshot = await getDocs(q);
          const chunkShows = snapshot.docs.map(doc => doc.data() as Show);
          allShows = [...allShows, ...chunkShows];
        }
        
        // Sort shows to preserve the watchlist order (most recently added first)
        allShows.sort((a, b) => watchlist.indexOf(a.id) - watchlist.indexOf(b.id));
        setShows(allShows);
      } catch (err) {
        console.error("Failed to load watchlist shows", err);
      } finally {
        setLoading(false);
      }
    }
    
    if (!watchlistLoading) {
      fetchWatchlistShows();
    }
  }, [watchlist, watchlistLoading]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <Navbar />
      <div className="pt-24 pb-12 px-6 max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-8">
          <Bookmark className="w-8 h-8 text-purple-500" />
          <h1 className="text-3xl font-bold">My Watchlist</h1>
        </div>

        {watchlistLoading || loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          </div>
        ) : shows.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-6">
            {shows.map((show, i) => (
              <ShowCard key={show.id} show={show} index={i} layout="grid" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-white/10">
            <Bookmark className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-white/50 mb-2">Your watchlist is empty</h2>
            <p className="text-white/40">Shows and movies you add will appear here.</p>
          </div>
        )}
      </div>
    </div>
  );
}
