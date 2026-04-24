import { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Play, ArrowLeft, Star, Calendar, Clock, Info, Trash, Settings2 } from 'lucide-react';
import { Show, Episode } from '../types';
import { api, WatchProvidersData } from '../services/api';
import { useCanUpload } from '../hooks/useCanUpload';
import { ManageTracksModal } from '../components/ManageTracksModal';

export function Details() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { canUpload } = useCanUpload();
  const [show, setShow] = useState<Show | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [providers, setProviders] = useState<WatchProvidersData | null>(null);
  const [loadingProviders, setLoadingProviders] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (!id) return;
    
    let isMounted = true;
    setLoading(true);
    
    api.getDetails(id).then(data => {
      if (isMounted) {
        setShow(data);
        setLoading(false);
        
        if (data) {
          if (data.type === 'Series') {
            api.getEpisodes(data.id).then(eps => {
              if (isMounted) setEpisodes(eps);
            });
          }

          setLoadingProviders(true);
          api.getWatchProviders(data.title, data.type, data.year).then(provs => {
            if (isMounted) {
              setProviders(provs);
              setLoadingProviders(false);
            }
          });
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [id]);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingEpisodeId, setDeletingEpisodeId] = useState<string | null>(null);

  const [managingTracksEpisode, setManagingTracksEpisode] = useState<Episode | null>(null);
  const [isManagingShowTracks, setIsManagingShowTracks] = useState(false);

  const fetchShowAndEpisodes = () => {
    if (!id) return;
    api.getDetails(id).then(data => {
      setShow(data);
      if (data?.type === 'Series') {
        api.getEpisodes(data.id).then(setEpisodes);
      }
    });
  };

  const handleDeleteShow = async () => {
    if (!show) return;
    if (!showDeleteConfirm) {
      setShowDeleteConfirm(true);
      return;
    }
    try {
      await api.deleteShow(show.id);
      navigate('/');
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete show: ' + (err.message || String(err)));
    }
  };

  const handleDeleteEpisode = async (e: React.MouseEvent, episodeId: string, episodeTitle: string) => {
    e.preventDefault();
    e.stopPropagation(); // prevent link navigation
    if (!show) return;
    
    if (deletingEpisodeId !== episodeId) {
      setDeletingEpisodeId(episodeId);
      return;
    }
    
    try {
      await api.deleteEpisode(show.id, episodeId);
      setEpisodes(prev => prev.filter(ep => ep.id !== episodeId));
      setDeletingEpisodeId(null);
    } catch (err: any) {
      console.error(err);
      alert('Failed to delete episode: ' + (err.message || String(err)));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!show) {
    return (
      <div className="min-h-screen pt-24 flex flex-col items-center justify-center text-center px-4">
        <h1 className="text-3xl font-bold mb-4">Show Not Found</h1>
        <p className="text-white/60 mb-8">We couldn't find the details for this show.</p>
        <button onClick={() => navigate(-1)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors">
          Go Back
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20">
      {/* Hero Banner */}
      <div className="relative h-[50vh] md:h-[70vh] w-full">
        <div className="absolute inset-0">
          <img 
            src={show.bannerUrl || show.imageUrl} 
            alt={show.title}
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/50 to-transparent" />
        </div>

        <div className="absolute top-24 left-6 z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-white/70 hover:text-white transition-colors bg-black/20 backdrop-blur-md px-4 py-2 rounded-full border border-white/10"
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-6 -mt-32 relative z-10">
        <div className="flex flex-col md:flex-row gap-8 md:gap-12">
          {/* Poster */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-48 md:w-72 flex-shrink-0 mx-auto md:mx-0"
          >
            <div className="aspect-[2/3] rounded-2xl overflow-hidden shadow-2xl border border-white/10">
              <img 
                src={show.imageUrl} 
                alt={show.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
          </motion.div>

          {/* Details */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex-1 pt-4 md:pt-12 text-center md:text-left"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-4 tracking-tight">{show.title}</h1>
            
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm font-medium text-white/70 mb-8">
              {show.rating && (
                <div className="flex items-center gap-1 text-yellow-400">
                  <Star className="w-4 h-4 fill-current" />
                  <span>{show.rating}</span>
                </div>
              )}
              {show.year && (
                <div className="flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  <span>{show.year}</span>
                </div>
              )}
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4" />
                <span>{show.meta}</span>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-white/10 border border-white/10 text-white/90">
                {show.type}
              </span>
            </div>

            <div className="flex flex-wrap gap-4 justify-center md:justify-start mb-10">
              <Link 
                to={`/player/${show.id}`}
                className="flex items-center gap-3 px-8 py-4 bg-white text-black rounded-full font-bold hover:bg-white/90 transition-all hover:scale-105"
              >
                <Play className="w-5 h-5" fill="currentColor" /> Play Now
              </Link>
              {canUpload && (
                <>
                  {show.type !== 'Series' && (
                    <button
                      onClick={() => setIsManagingShowTracks(true)}
                      className="flex items-center gap-2 px-6 py-4 bg-white/10 text-white rounded-full font-bold hover:bg-white/20 transition-all border border-white/20"
                    >
                      <Settings2 className="w-5 h-5" /> Manage Tracks
                    </button>
                  )}
                  <button
                    onClick={handleDeleteShow}
                    className={`flex items-center gap-2 px-6 py-4 rounded-full font-bold transition-all border ${
                      showDeleteConfirm 
                        ? 'bg-red-500 text-white border-red-500 hover:bg-red-600' 
                        : 'bg-red-500/10 text-red-400 border-red-500/20 hover:border-red-500/40 hover:bg-red-500/20'
                    }`}
                  >
                    <Trash className="w-5 h-5" /> {showDeleteConfirm ? 'Confirm Delete' : 'Delete Show'}
                  </button>
                </>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-bold mb-3">Synopsis</h3>
              <p className="text-white/70 leading-relaxed max-w-3xl">
                {show.description}
              </p>
            </div>

            {show.type === 'Series' && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4 max-w-3xl">
                  <h3 className="text-xl font-bold">Episodes</h3>
                  {canUpload && (
                    <Link 
                      to={`/upload/episode/${show.id}`}
                      className="px-4 py-2 bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 hover:text-purple-300 rounded-lg text-sm font-bold transition-colors border border-purple-500/30"
                    >
                      + Add Episode
                    </Link>
                  )}
                </div>
                {episodes.length > 0 ? (
                  <div className="space-y-3 max-w-3xl">
                    {episodes.map((ep) => (
                      <Link 
                        key={ep.id}
                        to={`/player/${show.id}?ep=${ep.id}`}
                        className="flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors group"
                      >
                        <div className="w-12 h-12 flex-shrink-0 bg-white/10 rounded-lg flex items-center justify-center group-hover:bg-purple-500/20 group-hover:text-purple-400 transition-colors">
                          <Play className="w-5 h-5 ml-1" fill="currentColor" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-bold text-lg truncate">{ep.episodeNumber}. {ep.title}</h4>
                          {ep.description && (
                            <p className="text-white/50 text-sm truncate">{ep.description}</p>
                          )}
                        </div>
                        {canUpload && (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                setManagingTracksEpisode(ep);
                              }}
                              className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                              title="Manage Tracks"
                            >
                              <Settings2 className="w-4 h-4" />
                            </button>
                            {deletingEpisodeId === ep.id && (
                              <span className="text-xs text-red-400 font-bold">Confirm?</span>
                            )}
                            <button
                              onClick={(e) => handleDeleteEpisode(e, ep.id, ep.title)}
                              className={`p-2 rounded-lg transition-colors ${
                                deletingEpisodeId === ep.id
                                  ? 'bg-red-500 text-white hover:bg-red-600'
                                  : 'text-red-400/50 hover:text-red-400 hover:bg-red-400/10'
                              }`}
                              title="Delete Episode"
                            >
                              <Trash className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 bg-white/5 border border-white/10 rounded-xl text-center max-w-3xl">
                    <p className="text-white/50">No episodes have been added yet.</p>
                  </div>
                )}
              </div>
            )}

            {show.tags && show.tags.length > 0 && (
              <div className="mb-10">
                <h3 className="text-lg font-bold mb-3">Genres</h3>
                <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                  {show.tags.map(tag => (
                    <span key={tag} className="px-3 py-1 bg-white/5 border border-white/10 rounded-lg text-sm text-white/70">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Availability Notice */}
            <div className="mt-12 p-6 bg-white/5 border border-white/10 rounded-2xl max-w-3xl">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/10 rounded-xl text-white/70">
                  <Info className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h4 className="text-lg font-bold text-white mb-2">Where to Watch</h4>
                  
                  {loadingProviders ? (
                    <div className="flex items-center gap-2 text-white/50 text-sm mt-4">
                      <div className="w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
                      Checking live streaming availability via Watchmode...
                    </div>
                  ) : providers && (providers.flatrate || providers.rent || providers.buy) ? (
                    <div className="space-y-6 mt-4">
                      <p className="text-white/70 text-sm leading-relaxed">
                        Powered by Watchmode. Here is where you can watch <strong>{show.title}</strong> right now:
                      </p>
                      
                      {providers.flatrate && (
                        <div>
                          <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Stream</h5>
                          <div className="flex flex-wrap gap-3">
                            {providers.flatrate.map(p => (
                              <a key={p.provider_id} href={p.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors">
                                <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                                  {p.provider_name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium">{p.provider_name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {providers.rent && !providers.flatrate && (
                        <div>
                          <h5 className="text-xs font-bold text-white/50 uppercase tracking-wider mb-3">Rent / Buy</h5>
                          <div className="flex flex-wrap gap-3">
                            {providers.rent.map(p => (
                              <a key={p.provider_id} href={p.url || '#'} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-lg transition-colors">
                                <div className="w-6 h-6 rounded-md bg-purple-500/20 flex items-center justify-center text-purple-400 font-bold text-xs">
                                  {p.provider_name.charAt(0)}
                                </div>
                                <span className="text-sm font-medium">{p.provider_name}</span>
                              </a>
                            ))}
                          </div>
                        </div>
                      )}

                      {providers.link && (
                        <div className="pt-2">
                          <a href={providers.link} target="_blank" rel="noopener noreferrer" className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
                            View all options on Watchmode &rarr;
                          </a>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-4">
                      <p className="text-white/70 text-sm leading-relaxed mb-4">
                        {import.meta.env.VITE_WATCHMODE_API_KEY 
                          ? `We couldn't find any streaming providers for ${show.title} in the US right now.`
                          : `To see 100% accurate live streaming data, please add a Watchmode API Key (VITE_WATCHMODE_API_KEY) to your secrets.`}
                      </p>
                      <div className="flex flex-wrap gap-3">
                        <a 
                          href={`https://www.justwatch.com/us/search?q=${encodeURIComponent(show.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#FBC500]/20 text-[#FBC500] border border-[#FBC500]/30 rounded-lg text-sm font-bold transition-colors"
                        >
                          Search JustWatch
                        </a>
                        <a 
                          href={`https://www.google.com/search?q=${encodeURIComponent('where to watch ' + show.title)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-[#4285F4]/20 text-[#4285F4] border border-[#4285F4]/30 rounded-lg text-sm font-bold transition-colors"
                        >
                          Search Google
                        </a>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </motion.div>
        </div>
      </div>

      {isManagingShowTracks && show && (
        <ManageTracksModal 
          show={show}
          onClose={() => setIsManagingShowTracks(false)}
          onSuccess={fetchShowAndEpisodes}
        />
      )}

      {managingTracksEpisode && show && (
        <ManageTracksModal 
          show={show}
          episode={managingTracksEpisode}
          onClose={() => setManagingTracksEpisode(null)}
          onSuccess={fetchShowAndEpisodes}
        />
      )}
    </div>
  );
}
