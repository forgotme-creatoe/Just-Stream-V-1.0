export interface Show {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  bannerUrl?: string;
  type: 'Originals' | 'Movie' | 'Series' | 'Shorts';
  meta: string;
  rating?: number;
  year?: number;
  tags?: string[];
  trailerUrl?: string;
  videoUrl?: string;
  authorId?: string;
  streamingLinks?: { name: string; url: string }[];
}
