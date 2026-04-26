export interface Show {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  type: 'Movie' | 'Series' | 'Shorts' | 'Music';
  meta: string;
  rating?: number;
  year?: number;
  tags?: string[];
  streamingLinks?: { name: string; url: string }[];
}

export const originalShows: Show[] = [];

export const featuredShow: Show | null = null;
export const continueWatching: Show[] = [];
export const popularShows: Show[] = [];

export const episodes: any[] = [];

