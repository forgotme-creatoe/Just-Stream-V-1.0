import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Maximize, Settings, ChevronDown, Search, Check, Loader2, ExternalLink } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShowCard } from '../components/ShowCard';
import { api } from '../services/api';
import { Show, Episode, AdItem } from '../types';
import { useWatchHistory } from '../hooks/useWatchHistory';
import { useDeviceLimit } from '../hooks/useDeviceLimit';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../lib/firebase';
import { collection, getDocs, doc, updateDoc, increment } from 'firebase/firestore';

const pageVariants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 }
};

export function Player() {
  const { id } = useParams<{ id: string }>();
  const [show, setShow] = useState<Show | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [related, setRelated] = useState<Show[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToHistory } = useWatchHistory();
  const { deviceAllowed } = useDeviceLimit();

  const searchParams = new URLSearchParams(window.location.search);
  const queryEpId = searchParams.get('ep');

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [activeEpId, setActiveEpId] = useState(queryEpId || '');
  const [activeSub, setActiveSub] = useState('English');
  const [activeDub, setActiveDub] = useState('Default');
  const [epSearch, setEpSearch] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [autoPlayNext, setAutoPlayNext] = useState(() => {
    return localStorage.getItem('autoPlayNext') !== 'false';
  });

  const activeEp = episodes.find(e => e.id === activeEpId);
  const baseVideoUrl = show ? ((show.type === 'Series' && activeEp) ? activeEp.videoUrl : (show.videoUrl || show.trailerUrl)) : '';
  const currentDubs = show ? ((activeEp ? activeEp.dubs : show.dubs) || []) : [];
  const currentSubs = show ? ((activeEp ? activeEp.subs : show.subs) || []) : [];

  const currentVideoUrl = activeDub === 'Default' 
    ? baseVideoUrl 
    : currentDubs.find(d => d.language === activeDub)?.url || baseVideoUrl;

  const { userProfile } = useAuth();
  const [adItem, setAdItem] = useState<AdItem | null>(null);
  const [isAdPlaying, setIsAdPlaying] = useState(false);
  const [adSkipCountdown, setAdSkipCountdown] = useState(5);
  const [adPlayed, setAdPlayed] = useState(false);

  useEffect(() => {
    async function checkAds() {
      if (userProfile?.plan === 'Premium') return;
      try {
        const snap = await getDocs(collection(db, 'ads'));
        if (!snap.empty) {
          const adsList = snap.docs.map(d => ({ ...d.data(), id: d.id } as AdItem));
          setAdItem(adsList[Math.floor(Math.random() * adsList.length)]);
        }
      } catch (e) {
        console.error("Failed to load ads", e);
      }
    }
    checkAds();
  }, [userProfile?.plan]);

  useEffect(() => {
    if (adItem && !adPlayed && currentVideoUrl && !currentVideoUrl.includes('youtube.com')) {
      setIsAdPlaying(true);
      setAdSkipCountdown(5);
    } else {
      setIsAdPlaying(false);
    }
  }, [currentVideoUrl, adItem, adPlayed]);

  useEffect(() => {
    let timer: any;
    if (isAdPlaying && adSkipCountdown > 0) {
      timer = setTimeout(() => {
        setAdSkipCountdown(prev => prev - 1);
      }, 1000);
    }
    return () => clearTimeout(timer);
  }, [isAdPlaying, adSkipCountdown]);

  const handleAdEnded = () => {
    setIsAdPlaying(false);
    setAdPlayed(true);
    if (adItem?.id) {
      updateDoc(doc(db, 'ads', adItem.id), { views: increment(1) }).catch(console.error);
    }
  };

  const handleSkipAd = () => {
    if (adSkipCountdown <= 0) {
      handleAdEnded();
    }
  };

  const adPlayerSrc = isAdPlaying ? adItem?.videoUrl : currentVideoUrl;

  useEffect(() => {
    localStorage.setItem('autoPlayNext', autoPlayNext.toString());
  }, [autoPlayNext]);

  const handleVideoEnded = () => {
    if (show) {
      api.trackCompletion(show.id, activeEpId || undefined);
    }
    if (autoPlayNext && show?.type === 'Series' && episodes.length > 0) {
      const currentIndex = episodes.findIndex(e => e.id === activeEpId);
      if (currentIndex >= 0 && currentIndex < episodes.length - 1) {
        setActiveEpId(episodes[currentIndex + 1].id);
      }
    }
  };

  useEffect(() => {
    if (show) {
      api.trackView(show.id, activeEpId || undefined);
    }
  }, [show, activeEpId]);

  useEffect(() => {
    async function loadShow() {
      if (!id) return;
      setLoading(true);
      try {
        const data = await api.getDetails(id);
        setShow(data);
        
        if (data) {
          addToHistory(data);
        }
        
        // Fetch some related content based on type
        if (data?.type === 'Series') {
          const fetchedEps = await api.getEpisodes(data.id);
          setEpisodes(fetchedEps);
          if (!activeEpId && fetchedEps.length > 0) {
            setActiveEpId(fetchedEps[0].id);
          }
          setRelated(await api.getTrendingSeries());
        } else if (data?.type === 'Movie') {
          setRelated(await api.getTrendingMovies());
        } else if (data?.type === 'Shorts') {
          setRelated(await api.getKidsShows()); // Returns shorts
        } else {
          setRelated(await api.getTrendingMusic());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadShow();
  }, [id]);

  const filteredEpisodes = episodes.filter(ep => 
    ep.title.toLowerCase().includes(epSearch.toLowerCase()) || 
    ep.description.toLowerCase().includes(epSearch.toLowerCase())
  );

  if (deviceAllowed === false) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a] text-white">
        <div className="max-w-md text-center bg-white/5 p-8 rounded-2xl border border-white/10">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Settings className="w-8 h-8 text-red-500" />
          </div>
          <h2 className="text-2xl font-bold mb-4">Device Limit Reached</h2>
          <p className="text-white/60 mb-6">
            You're watching on too many devices right now. Please stop playback on another device to continue watching.
          </p>
          <a href="/?bypass=true" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-colors">
            Go to Homepage
          </a>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen flex items-center justify-center text-white/50">
        Show not found.
      </div>
    );
  }

  if (show.tier === 'Premium' && (!userProfile?.plan || userProfile.plan === 'Free')) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-white p-6 text-center">
        <h2 className="text-3xl font-bold mb-4">Premium Content</h2>
        <p className="text-white/60 mb-8 max-w-md">
          You need a Casual or Premium plan to watch this content. Please upgrade your subscription from settings.
        </p>
      </div>
    );
  }

  return (
    <motion.div 
      variants={pageVariants}
      initial="initial"
      animate="animate"
      exit="exit"
      className="max-w-[1600px] mx-auto px-4 sm:px-6 pt-28 pb-6"
    >
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Sidebar - Episode List */}
        <motion.div 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="w-full lg:w-80 flex-shrink-0 order-2 lg:order-1"
        >
          <div className="glass-panel rounded-2xl p-4 h-[600px] flex flex-col">
            
            <div className="mb-4">
              <h2 className="text-xl font-bold mb-1 line-clamp-1">{show.title}</h2>
              <button className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors">
                Season 1 <ChevronDown className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center justify-between text-sm text-white/50 mb-4 px-2">
              <span>Season 1</span>
              <span>24 min</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 space-y-2 scrollbar-hide">
              {filteredEpisodes.map((ep, i) => {
                const isActive = ep.id === activeEpId;
                return (
                  <motion.div 
                    key={ep.id} 
                    onClick={() => setActiveEpId(ep.id)}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.4, delay: 0.3 + i * 0.05 }}
                    className={`flex gap-3 p-2 rounded-xl cursor-pointer transition-colors group ${
                      isActive ? 'bg-purple-500/20 border border-purple-500/30' : 'hover:bg-white/5 border border-transparent'
                    }`}
                  >
                    <div className="relative w-24 h-16 rounded-lg overflow-hidden flex-shrink-0 bg-black/50">
                      <img src={show.imageUrl} alt={ep.title} className="w-full h-full object-cover opacity-60" referrerPolicy="no-referrer" />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <Play className="w-6 h-6 text-white" fill="currentColor" />
                      </div>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                      <h4 className={`text-sm font-medium truncate ${isActive ? 'text-purple-400' : 'text-white/90'}`}>
                        {ep.title}
                      </h4>
                      <p className="text-xs text-white/50 truncate mt-0.5">{ep.description}</p>
                    </div>
                  </motion.div>
                );
              })}
              {filteredEpisodes.length === 0 && (
                <div className="text-center text-white/50 text-sm py-8">
                  No episodes found.
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t border-white/10 relative">
              <Search className="w-4 h-4 text-white/50 absolute left-3 top-1/2 -translate-y-1/2 mt-2" />
              <input 
                type="text" 
                placeholder="Search episodes..." 
                value={epSearch}
                onChange={(e) => setEpSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2.5 pl-9 pr-4 text-sm outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>
        </motion.div>

        {/* Main Player Area */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="flex-1 order-1 lg:order-2"
        >
          {/* Video Player Placeholder / Iframe */}
          <div className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/5 group">
            
            {adPlayerSrc ? (
              adPlayerSrc.includes('youtube.com/embed') ? (
                <iframe 
                  src={adPlayerSrc} 
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
              ) : (
                <div className="w-full h-full relative">
                  <video 
                    src={adPlayerSrc} 
                    className="w-full h-full"
                    controls={!isAdPlaying}
                    crossOrigin="anonymous"
                    autoPlay
                    controlsList="nodownload"
                    onEnded={isAdPlaying ? handleAdEnded : handleVideoEnded}
                    onClick={() => {
                      if (isAdPlaying && adItem?.targetUrl) {
                        window.open(adItem.targetUrl, '_blank');
                      }
                    }}
                  >
                    {!isAdPlaying && currentSubs.map((sub, i) => (
                      <track 
                        key={sub.url} 
                        kind="subtitles" 
                        srcLang={sub.language.substring(0,2).toLowerCase()} 
                        src={sub.url} 
                        label={sub.language} 
                        default={i === 0} 
                      />
                    ))}
                  </video>
                  {isAdPlaying && (
                    <div className="absolute top-4 right-4 z-10 flex flex-col items-end">
                      <div className="bg-black/60 backdrop-blur-md px-4 py-2 text-white text-sm font-medium rounded-full mb-2 border border-white/10">
                        Ad: {adItem?.title}
                      </div>
                      <button
                        onClick={handleSkipAd}
                        disabled={adSkipCountdown > 0}
                        className={`px-4 py-2 rounded-full text-sm font-bold border backdrop-blur-md transition-all ${
                          adSkipCountdown > 0 
                            ? 'bg-black/50 text-white/50 border-white/10 cursor-not-allowed' 
                            : 'bg-white text-black border-white hover:scale-105'
                        }`}
                      >
                        {adSkipCountdown > 0 ? `Skip Ad in ${adSkipCountdown}` : 'Skip Ad'}
                      </button>
                    </div>
                  )}
                  {isAdPlaying && adItem?.targetUrl && (
                    <div className="absolute bottom-6 left-6 z-10">
                      <a href={adItem.targetUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-xl font-bold shadow-xl transition-transform hover:-translate-y-1">
                        Visit Site <ExternalLink className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </div>
              )
            ) : (
              <>
                <img 
                  src={show.bannerUrl || show.imageUrl} 
                  alt="Video frame" 
                  referrerPolicy="no-referrer"
                  className={`w-full h-full object-cover transition-opacity duration-500 ${isPlaying ? 'opacity-100' : 'opacity-60'}`}
                />
                
                {!isPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-20 h-20 bg-purple-500/80 backdrop-blur-md rounded-full flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.5)]">
                      <Play className="w-10 h-10 text-white ml-2" fill="currentColor" />
                    </div>
                  </div>
                )}
                
                {/* Player Controls Overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                  
                  {/* Progress Bar */}
                  <div className="w-full h-1.5 bg-white/20 rounded-full mb-6 cursor-pointer relative">
                    <div className="absolute top-0 left-0 h-full bg-purple-500 rounded-full w-1/3 shadow-[0_0_10px_rgba(168,85,247,0.8)]"></div>
                    <div className="absolute top-1/2 -translate-y-1/2 left-1/3 w-3 h-3 bg-white rounded-full shadow"></div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <button onClick={() => setIsPlaying(!isPlaying)} className="text-white hover:text-purple-400 transition-colors">
                        {isPlaying ? <Pause className="w-6 h-6" fill="currentColor" /> : <Play className="w-6 h-6" fill="currentColor" />}
                      </button>
                      <button className="text-white hover:text-purple-400 transition-colors">
                        <SkipBack className="w-5 h-5" fill="currentColor" />
                      </button>
                      <button className="text-white hover:text-purple-400 transition-colors">
                        <SkipForward className="w-5 h-5" fill="currentColor" />
                      </button>
                      <div className="flex items-center gap-2 group/vol">
                        <button onClick={() => setIsMuted(!isMuted)} className="text-white hover:text-purple-400 transition-colors">
                          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                        </button>
                        <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300">
                          <div className="w-20 h-1 bg-white/20 rounded-full mt-2">
                            <div className={`h-full bg-white rounded-full transition-all ${isMuted ? 'w-0' : 'w-2/3'}`}></div>
                          </div>
                        </div>
                      </div>
                      <span className="text-sm font-medium text-white/80">08:24 / 24:00</span>
                    </div>

                    <div className="flex items-center gap-6 relative">
                      <button 
                        onClick={() => setShowSettings(!showSettings)}
                        className={`transition-colors flex items-center gap-2 text-sm font-medium ${showSettings ? 'text-purple-400' : 'text-white hover:text-purple-400'}`}
                      >
                        <Settings className="w-5 h-5" />
                      </button>
                      
                      {/* Settings Popover */}
                      <AnimatePresence>
                        {showSettings && (
                          <motion.div 
                            initial={{ opacity: 0, y: 10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 10, scale: 0.95 }}
                            className="absolute bottom-full right-0 mb-4 w-64 glass-panel rounded-xl p-4 shadow-2xl"
                          >
                            <div className="mb-4 flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white">Autoplay Next</h4>
                              <button
                                onClick={() => setAutoPlayNext(!autoPlayNext)}
                                className={`w-10 h-5 rounded-full relative transition-colors ${autoPlayNext ? 'bg-purple-500' : 'bg-white/20'}`}
                              >
                                <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${autoPlayNext ? 'translate-x-5' : 'translate-x-0'}`} />
                              </button>
                            </div>
                            <h4 className="text-sm font-bold mb-3 text-white">Subtitles</h4>
                            <div className="space-y-1">
                              {['English', 'Japanese', 'Spanish'].map(sub => (
                                <div 
                                  key={sub}
                                  onClick={() => { setActiveSub(sub); setShowSettings(false); }}
                                  className={`flex items-center justify-between text-sm p-2 rounded cursor-pointer transition-colors ${
                                    activeSub === sub 
                                      ? 'bg-purple-500/20 text-purple-400' 
                                      : 'hover:bg-white/5 text-white/70 hover:text-white'
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    {activeSub === sub && <Check className="w-3 h-3" />}
                                    <span>{sub}</span>
                                  </div>
                                  {sub === 'English' && <span className="text-xs border border-current px-1 rounded opacity-50">CC</span>}
                                </div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <button className="text-white hover:text-purple-400 transition-colors">
                        <Maximize className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="mt-6 flex flex-col md:flex-row md:items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">{show.title} {activeEp ? `- Episode ${activeEp.episodeNumber}` : ''}</h1>
              <p className="text-white/70 leading-relaxed max-w-3xl">{activeEp ? activeEp.description : show.description}</p>
            </div>
            
            {(currentDubs.length > 0 || currentSubs.length > 0) && (
              <div className="flex gap-4 p-4 bg-white/5 border border-white/10 rounded-xl min-w-[240px]">
                {currentDubs.length > 0 && (
                  <div className="flex-1">
                    <label className="text-xs font-bold text-white/50 uppercase tracking-wider mb-2 block">Audio Track</label>
                    <select 
                      value={activeDub}
                      onChange={(e) => setActiveDub(e.target.value)}
                      className="w-full bg-black/50 border border-white/20 rounded-lg px-3 py-2 text-sm text-white"
                    >
                      <option value="Default">Default</option>
                      {currentDubs.map(dub => (
                        <option key={dub.language} value={dub.language}>{dub.language}</option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* More Like This */}
          {related.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: false, margin: "-50px" }}
              transition={{ duration: 0.6 }}
              className="mt-12"
            >
              <h3 className="text-xl font-bold mb-6">More like {show.title}</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-4">
                {related.slice(0, 5).map((s, i) => (
                  <ShowCard key={s.id} show={s} index={i} />
                ))}
              </div>
            </motion.div>
          )}
        </motion.div>

      </div>
    </motion.div>
  );
}
