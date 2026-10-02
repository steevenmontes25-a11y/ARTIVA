export type PostType = 'video' | 'image' | 'audio' | 'text';
export type PostMediaType = 'video' | 'image' | 'audio';

export interface PostMedia {
  id: number;
  url: string;
  type: PostMediaType;
  position: number;
  duration_seconds: number | null;
}

export interface PostCategory {
  id: number;
  name: string;
  slug: string;
}

export interface PostAuthor {
  id: number;
  username: string;
  avatar_url: string | null;
  discipline: string | null;
}

export interface PostCounts {
  likes: number;
  comments: number;
}

export interface Post {
  id: number;
  type: PostType;
  caption: string | null;
  category: PostCategory | null;
  media: PostMedia[];
  hashtags?: string[];
  author: PostAuthor;
  counts: PostCounts;
  viewer_has_liked: boolean;
  viewer_has_saved: boolean;
  created_at: string;
}

export interface CreatedPostResponse {
  data: Post;
}

export interface FeedMeta {
  next_cursor: string | null;
  prev_cursor: string | null;
  has_more: boolean;
}

export interface FeedResponse {
  data: Post[];
  meta: FeedMeta;
}
