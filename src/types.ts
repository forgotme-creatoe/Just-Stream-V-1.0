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
  type: 'Movie' | 'Series' | 'Shorts';
  meta: string;
  rating?: number;
  year?: number;
  tags?: string[];
  trailerUrl?: string;
  videoUrl?: string;
  dubs?: AudioTrack[];
  subs?: SubtitleTrack[];
  authorId?: string;
  streamingLinks?: { name: string; url: string }[];
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
}
