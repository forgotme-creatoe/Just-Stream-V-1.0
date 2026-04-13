import { useState, useEffect, useRef } from 'react';
import { Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ShowCard } from '../components/ShowCard';
import { HeroSection } from '../components/HeroSection';
import { HorizontalRow } from '../components/HorizontalRow';
import { api } from '../services/api';
import { Show } from '../types';
import { useWatchHistory } from '../hooks/useWatchHistory';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

// Helper to interleave arrays
function interleaveShows(...arrays: Show[][]): Show[] {
  const result: Show[] = [];
  const maxLength = Math.max(...arrays.map(arr => arr.length));
  for (let i = 0; i < maxLength; i++) {
    for (const arr of arrays) {
      if (arr[i]) result.push(arr[i]);
    }
  }
  return result;
}

export function Home() {
  const [featuredShows, setFeaturedShows] = useState<Show[]>([]);
  const [trendingSeries, setTrendingSeries] = useState<Show[]>([]);
  const [popularOriginals, setPopularOriginals] = useState<Show[]>([]);
  const { history: watchHistory } = useWatchHistory();
  
  // Infinite scroll state
  const [discoverShows, setDiscoverShows] = useState<Show[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const observerTarget = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      if (!hasMore) return;
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);

      try {
        if (page === 1) {
          const [originals, series, movies] = await Promise.all([
            api.getTrendingAnime(1), // Now returns Originals
            api.getTrendingSeries(1),
            api.getTrendingMovies(1)
          ]);
          
          if (isMounted) {
            if (originals.length > 0) {
              setFeaturedShows(originals.slice(0, 10));
              setPopularOriginals(originals.slice(0, 10)); // Using same for now since mock data is small
            }
            if (series.length > 0) {
              setTrendingSeries(series.slice(0, 10));
            }
            
            // Mix the remaining items for the discover section
            const remainingOriginals = originals.slice(10);
            const remainingSeries = series.slice(10);
            const mixed = interleaveShows(remainingOriginals, remainingSeries, movies);
            setDiscoverShows(mixed);
          }
        } else {
          // For infinite scroll on home, fetch more of everything and mix
          const [moreOriginals, moreSeries, moreMovies] = await Promise.all([
            api.getTrendingAnime(page),
            api.getTrendingSeries(page),
            api.getTrendingMovies(page)
          ]);
          
          if (isMounted) {
            if (moreOriginals.length === 0 && moreSeries.length === 0 && moreMovies.length === 0) {
              setHasMore(false);
            } else {
              const mixed = interleaveShows(moreOriginals, moreSeries, moreMovies);
              setDiscoverShows(prev => {
                const newShows = [...prev, ...mixed];
                // Filter duplicates
                return Array.from(new Map(newShows.map(item => [item.id, item])).values());
              });
            }
          }
        }
      } catch (error) {
        console.error("Failed to load home data", error);
        if (isMounted) setHasMore(false);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    }
    loadData();
    return () => { isMounted = false; };
  }, [page]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !isLoadingMore) {
          setPage(p => p + 1);
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, isLoadingMore]);

  if (loading && page === 1) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-20"
    >
      {featuredShows.length > 0 && <HeroSection shows={featuredShows} />}

      {/* Content Rows */}
      <div className="max-w-7xl mx-auto px-6 -mt-10 relative z-10 space-y-12">
        <HorizontalRow 
          title="Continue Watching" 
          shows={watchHistory} 
          emptyMessage="You haven't watched anything yet. Start exploring!"
        />
        <HorizontalRow title="Trending Series" shows={trendingSeries} viewAllLink="/browse?type=series" />
        <HorizontalRow title="Popular Originals" shows={popularOriginals} viewAllLink="/browse?type=originals" />
        
        {/* Discover More (Infinite Grid) */}
        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="pt-8"
        >
          <h2 className="text-2xl font-bold mb-6">Discover More</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {discoverShows.map((show, i) => (
              <ShowCard key={show.id} show={show} index={i} layout="grid" />
            ))}
          </div>
          
          {/* Infinite Scroll Sentinel */}
          {!loading && hasMore && (
            <div ref={observerTarget} className="flex justify-center py-8 mt-4">
              <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            </div>
          )}
          {!hasMore && discoverShows.length > 0 && (
            <div className="text-center py-8 text-white/50 mt-4">
              You've reached the end!
            </div>
          )}
        </motion.section>
      </div>
    </motion.div>
  );
}
