import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShowCard } from './ShowCard';
import { Show } from '../types';

interface HorizontalRowProps {
  title: string;
  shows: Show[];
  viewAllLink?: string;
  emptyMessage?: string;
}

export function HorizontalRow({ title, shows, viewAllLink, emptyMessage }: HorizontalRowProps) {
  if (!emptyMessage && (!shows || shows.length === 0)) return null;
  
  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: false, margin: "-100px" }}
      transition={{ duration: 0.6 }}
    >
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold capitalize">{title}</h2>
        {viewAllLink && shows && shows.length > 0 && (
          <Link to={viewAllLink} className="text-sm text-purple-400 hover:text-purple-300 font-medium transition-colors">
            View All
          </Link>
        )}
      </div>
      {(!shows || shows.length === 0) ? (
        <div className="h-40 md:h-48 flex items-center justify-center border border-white/5 rounded-xl bg-white/5 text-white/40 text-sm mb-6">
          {emptyMessage}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x">
          {shows.map((show, i) => (
            <ShowCard key={show.id} show={show} index={i} className="w-40 md:w-48 flex-shrink-0 snap-start" />
          ))}
        </div>
      )}
    </motion.section>
  );
}
