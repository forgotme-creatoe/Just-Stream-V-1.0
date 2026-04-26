import React from 'react';
import { Play } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { Show } from '../types';

interface ShowCardProps {
  key?: React.Key;
  show: Show;
  className?: string;
  index?: number;
  layout?: 'grid' | 'list';
}

export function ShowCard({ show, className, index = 0, layout = 'grid' }: ShowCardProps) {
  if (layout === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: false, margin: "-40px" }}
        transition={{ duration: 0.4, delay: index * 0.05, ease: "easeOut" }}
        className={className}
      >
        <Link to={`/details/${show.id}`} className="group flex flex-col sm:flex-row gap-4 md:gap-6 bg-white/5 border border-white/5 hover:border-purple-500/30 rounded-xl p-3 transition-all hover:bg-white/10 hover:shadow-[0_0_20px_rgba(168,85,247,0.1)]">
          <div className="relative w-full sm:w-48 md:w-64 aspect-video rounded-lg overflow-hidden flex-shrink-0">
            <img 
              src={show.imageUrl} 
              alt={show.title} 
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
              loading="lazy" 
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <Play className="w-8 h-8 text-white" fill="currentColor" />
            </div>
          </div>
          <div className="flex-1 min-w-0 py-2 flex flex-col justify-center">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-lg md:text-xl font-bold text-white/90 group-hover:text-purple-400 transition-colors truncate">{show.title}</h3>
              {show.tier === 'Premium' && (
                <span className="px-2 py-0.5 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] uppercase tracking-wider font-bold rounded-sm">Premium</span>
              )}
            </div>
            <p className="text-sm text-purple-400 mb-2 font-medium">{show.meta}</p>
            <p className="text-sm text-white/60 line-clamp-2 md:line-clamp-3 leading-relaxed">{show.description || 'Follow the epic journey in this highly acclaimed series. Stream now in premium quality.'}</p>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: false, margin: "-40px" }}
      transition={{ duration: 0.5, delay: index * 0.05, ease: "easeOut" }}
      className={`flex flex-col ${className || ''}`}
    >
      <Link to={`/details/${show.id}`} className="group relative flex-shrink-0 cursor-pointer block flex-1">
        <div className="relative w-full overflow-hidden rounded-xl aspect-[3/4] bg-white/5 border border-white/5 transition-all duration-300 group-hover:border-purple-500/50 group-hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]">
          <img 
            src={show.imageUrl} 
            alt={show.title} 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            loading="lazy"
            referrerPolicy="no-referrer"
          />
          
          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
            <div className="w-12 h-12 rounded-full bg-purple-500/80 backdrop-blur-sm flex items-center justify-center transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
              <Play className="w-5 h-5 text-white ml-1" fill="currentColor" />
            </div>
          </div>
          
          {show.tier === 'Premium' && (
            <div className="absolute top-2 right-2 px-2 py-1 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-[10px] uppercase tracking-wider font-bold rounded shadow-lg z-10">
              Premium
            </div>
          )}
        </div>
        
        <div className="mt-3 flex flex-col">
          <h3 className="font-medium text-white/90 truncate group-hover:text-purple-400 transition-colors" title={show.title}>
            {show.title}
          </h3>
          <p className="text-xs text-white/50 mt-1 truncate">
            {show.meta}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
