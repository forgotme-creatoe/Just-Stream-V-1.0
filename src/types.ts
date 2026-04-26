export interface AudioTrack {
  language: string;
  url: string;
}

export interface SubtitleTrack {
  language: string;
  url: string;
}

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
  trailerUrl?: string;
  videoUrl?: string;
  tier?: 'Free' | 'Premium';
  dubs?: AudioTrack[];
  subs?: SubtitleTrack[];
  authorId?: string;
  streamingLinks?: { name: string; url: string }[];
  viewMetrics?: {
    views: number;
    completed: number;
    dropped: number;
  };
}

export interface AdItem {
  id: string;
  title: string;
  videoUrl: string;
  targetUrl?: string; // Where it redirects to
  authorId: string;
  views: number;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string;
  photoURL?: string;
  createdAt?: string;
  plan?: 'Free' | 'Casual' | 'Premium';
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type?: 'System' | 'NewEpisode' | 'Update';
  target: string;
  createdAt: string;
  link?: string;
  showId?: string;
}

export interface Episode {
  id: string;
  title: string;
  description?: string;
  videoUrl: string;
  dubs?: AudioTrack[];
  subs?: SubtitleTrack[];
  episodeNumber: number;
  createdAt: string;
  viewMetrics?: {
    views: number;
    completed: number;
    dropped: number;
  };
}
