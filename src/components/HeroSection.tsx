import { useState, useEffect } from 'react';
import { Play, Info, Star } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Show } from '../types';

export function HeroSection({ shows }: { shows: Show[] }) {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (!shows || shows.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % shows.length);
    }, 8000); // 8 seconds per slide
    
    return () => clearInterval(interval);
  }, [shows]);

  if (!shows || shows.length === 0) return null;

  const show = shows[currentIndex];

  return (
    <section className="relative w-full h-[70vh] min-h-[500px] max-h-[800px] overflow-hidden bg-[var(--color-background)]">
      <AnimatePresence mode="popLayout">
        <motion.div
          key={show.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2, ease: "easeInOut" }}
          className="absolute inset-0"
        >
          {/* Background Image with Gradients */}
          <motion.div 
            initial={{ scale: 1.05 }}
            animate={{ scale: 1 }}
            transition={{ duration: 8, ease: "linear" }}
            className="absolute inset-0"
            style={{ willChange: "transform" }}
          >
            <img 
              src={show.bannerUrl || show.imageUrl} 
              alt={show.title}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-background)] via-[var(--color-background)]/80 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-[var(--color-background)] via-transparent to-transparent" />
          </motion.div>

          {/* Hero Content */}
          <div className="relative h-full max-w-7xl mx-auto px-6 flex flex-col justify-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
              className="max-w-2xl mt-12"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="px-3 py-1 bg-purple-500/20 text-purple-400 rounded-full text-sm font-bold border border-purple-500/30">
                  {show.type}
                </span>
                <span className="text-white/70 text-sm font-medium">{show.meta}</span>
                {show.rating && (
                  <div className="flex items-center gap-1 text-yellow-500">
                    <Star className="w-4 h-4 fill-current" />
                    <span className="text-sm font-bold">{show.rating}</span>
                  </div>
                )}
              </div>
              
              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-4 leading-tight">
                {show.title}
              </h1>
              
              <p className="text-base md:text-lg text-white/70 mb-8 line-clamp-3 leading-relaxed">
                {show.description}
              </p>
              
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 md:gap-4">
                <Link 
                  to={`/details/${show.id}`}
                  className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-3.5 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white rounded-full font-medium transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)] hover:shadow-[0_0_30px_rgba(168,85,247,0.6)] hover:-translate-y-0.5"
                >
                  <Play className="w-5 h-5" fill="currentColor" />
                  Play Now
                </Link>
                <button 
                  onClick={() => navigate(`/details/${show.id}`)}
                  className="flex items-center justify-center gap-2 px-6 lg:px-8 py-3 lg:py-3.5 glass-panel hover:bg-white/10 text-white rounded-full font-medium transition-all"
                >
                  <Info className="w-5 h-5" />
                  Learn More
                </button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Dots */}
      {shows.length > 1 && (
        <div className="absolute bottom-12 right-6 md:right-12 flex items-center gap-2 z-20">
          {shows.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`transition-all duration-300 rounded-full ${
                idx === currentIndex 
                  ? 'w-8 h-2 bg-purple-500' 
                  : 'w-2 h-2 bg-white/30 hover:bg-white/50'
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}
