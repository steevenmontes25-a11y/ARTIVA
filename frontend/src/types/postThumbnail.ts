import type { PostMediaType } from './post';

export interface PostThumbnail {
  id: number;
  thumbnail_url: string | null;
  media_type: PostMediaType | null;
  likes_count: number;
  comments_count: number;
}

export interface PostThumbnailsResponse {
  data: PostThumbnail[];
  meta: {
    next_cursor: string | null;
    has_more: boolean;
  };
}
