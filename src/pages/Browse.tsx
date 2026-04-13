import { useState, useEffect, useRef, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, LayoutGrid, List as ListIcon, ChevronDown, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
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

export function Browse() {
  const [searchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const type = searchParams.get('type') || 'originals';

  const [featuredShows, setFeaturedShows] = useState<Show[]>([]);
  const [trendingShows, setTrendingShows] = useState<Show[]>([]);
  const [gridShows, setGridShows] = useState<Show[]>([]);
  const { history } = useWatchHistory();
  
  const [loading, setLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  const observerTarget = useRef<HTMLDivElement>(null);

  // Filter states
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [isApplying, setIsApplying] = useState(false);

  const genres = ['Action', 'Adventure', 'Comedy', 'Drama', 'Fantasy', 'Sci-Fi', 'Romance', 'Thriller', 'Documentary', 'Nature'];

  const toggleFilter = (genre: string) => {
    setActiveFilters(prev => 
      prev.includes(genre) ? prev.filter(g => g !== genre) : [...prev, genre]
    );
  };

  const applyFilters = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
    }, 800);
  };

  const watchHistory = useMemo(() => {
    if (type === 'movies') {
      return history.filter(s => s.type === 'Movie');
    } else if (type === 'series') {
      return history.filter(s => s.type === 'Series');
    } else if (type === 'shorts') {
      return history.filter(s => s.type === 'Shorts');
    } else {
      return history.filter(s => s.type === 'Originals');
    }
  }, [history, type]);

  // Reset when query or type changes
  useEffect(() => {
    setFeaturedShows([]);
    setTrendingShows([]);
    setGridShows([]);
    setPage(1);
    setHasMore(true);
  }, [query, type]);

  useEffect(() => {
    let isMounted = true;

    async function fetchData() {
      if (!hasMore) return;
      
      if (page === 1) setLoading(true);
      else setIsLoadingMore(true);

      try {
        let results: Show[] = [];
        
        if (query) {
          if (type === 'movies') results = await api.searchMovies(query, page);
          else if (type === 'series') results = await api.searchSeries(query, page);
          else results = await api.searchAnime(query, page); // Now returns originals
        } else {
          if (type === 'movies') results = await api.getTrendingMovies(page);
          else if (type === 'series') results = await api.getTrendingSeries(page);
          else if (type === 'shorts') results = await api.getKidsShows(page); // Now returns shorts
          else results = await api.getTrendingAnime(page); // Now returns originals
        }
        
        if (isMounted) {
          if (results.length === 0) {
            setHasMore(false);
          } else {
            if (page === 1 && !query) {
              // Set up Hero and Trending row for page 1 in browse mode
              setFeaturedShows(results.slice(0, 10));
              setTrendingShows(results.slice(10, 20));
              setGridShows(results.slice(20));
            } else {
              // Just append to grid
              setGridShows(prev => {
                const newShows = page === 1 ? results : [...prev, ...results];
                return Array.from(new Map(newShows.map(item => [item.id, item])).values());
              });
            }
          }
        }
      } catch (e) {
        console.error(e);
        if (isMounted) setHasMore(false);
      } finally {
        if (isMounted) {
          setLoading(false);
          setIsLoadingMore(false);
        }
      }
    }
    
    fetchData();
    return () => { isMounted = false; };
  }, [query, type, page]);

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

  // Client-side filtering if active filters exist
  const displayedShows = activeFilters.length > 0 
    ? gridShows.filter(show => show.tags?.some(tag => activeFilters.includes(tag)))
    : gridShows;

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="pb-20"
    >
      {/* Hero Section (Only in Browse Mode) */}
      {!query && featuredShows.length > 0 && <HeroSection shows={featuredShows} />}

      <div className={`max-w-7xl mx-auto px-6 ${!query && featuredShows.length > 0 ? '-mt-10 relative z-10' : 'pt-28'} pb-8`}>
        
        {/* Continue Watching Row (Only in Browse Mode) */}
        {!query && (
          <div className="mb-12">
            <HorizontalRow 
              title={`Continue Watching ${type.replace('-', ' ')}`} 
              shows={watchHistory} 
              emptyMessage={`You haven't watched any ${type.replace('-', ' ')} yet.`}
            />
          </div>
        )}

        {/* Trending Row (Only in Browse Mode) */}
        {!query && trendingShows.length > 0 && (
          <div className="mb-12">
            <HorizontalRow title={`Trending ${type.replace('-', ' ')}`} shows={trendingShows} />
          </div>
        )}

        <div className="flex flex-col md:flex-row gap-8">
          {/* Sidebar Filters */}
          <motion.aside 
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="w-full md:w-64 flex-shrink-0"
          >
            <div className="glass-panel rounded-2xl p-5 sticky top-24">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-lg">All Filters</h3>
                <ChevronDown className="w-4 h-4 text-white/50" />
              </div>
              
              <div className="space-y-2 mb-8">
                {genres.map((genre) => {
                  const isActive = activeFilters.includes(genre);
                  return (
                    <label 
                      key={genre} 
                      onClick={() => toggleFilter(genre)}
                      className="flex items-center justify-between group cursor-pointer p-2 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      <span className={`text-sm ${isActive ? 'text-purple-400 font-medium' : 'text-white/70 group-hover:text-white'}`}>
                        {genre}
                      </span>
                      <div className={`w-4 h-4 rounded-full border flex items-center justify-center transition-colors ${isActive ? 'border-purple-500 bg-purple-500/10' : 'border-white/20'}`}>
                        {isActive && <motion.div layoutId={`dot-${genre}`} className="w-2 h-2 rounded-full bg-purple-500" />}
                      </div>
                    </label>
                  );
                })}
              </div>

              <button 
                onClick={applyFilters}
                disabled={isApplying}
                className="w-full py-3 bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition-colors text-purple-300 disabled:opacity-50"
              >
                {isApplying ? <Loader2 className="w-4 h-4 animate-spin" /> : <Filter className="w-4 h-4" />}
                {isApplying ? 'Applying...' : 'Apply Filters'}
              </button>
            </div>
          </motion.aside>

          {/* Main Content */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1"
          >
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold mb-2 capitalize">
                  {query ? `Search Results for "${query}"` : `All ${type.replace('-', ' ')}`}
                </h1>
                <p className="text-white/60">
                  {loading && page === 1 ? 'Loading...' : `Found ${displayedShows.length} results`}
                </p>
              </div>

              <div className="flex items-center gap-2 bg-white/5 rounded-lg p-1 border border-white/10">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded shadow-sm transition-colors ${viewMode === 'grid' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded shadow-sm transition-colors ${viewMode === 'list' ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white'}`}
                >
                  <ListIcon className="w-4 h-4" />
                </button>
              </div>
            </div>

            {loading && page === 1 ? (
              <div className="flex items-center justify-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            ) : displayedShows.length === 0 && !isApplying ? (
              <div className="text-center py-20 text-white/50">
                No results found. Try adjusting your search or filters.
              </div>
            ) : (
              <div className={viewMode === 'grid' 
                ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6" 
                : "flex flex-col gap-4"
              }>
                <AnimatePresence mode="popLayout">
                  {displayedShows.map((show, i) => (
                    <ShowCard key={show.id} show={show} index={i} layout={viewMode} />
                  ))}
                </AnimatePresence>
              </div>
            )}

            {/* Infinite Scroll Sentinel */}
            {!loading && hasMore && (
              <div ref={observerTarget} className="flex justify-center py-8 mt-4">
                <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
              </div>
            )}
            {!hasMore && displayedShows.length > 0 && (
              <div className="text-center py-8 text-white/50 mt-4">
                You've reached the end!
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
