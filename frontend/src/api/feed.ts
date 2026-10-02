import { apiClient } from './client';
import type { FeedResponse, Post } from '../types/post';

export interface FeedPage {
  posts: Post[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchFeed(cursor: string | null, perPage = 10): Promise<FeedPage> {
  const { data } = await apiClient.get<FeedResponse>('/feed', {
    params: {
      per_page: perPage,
      ...(cursor ? { cursor } : {}),
    },
  });

  return {
    posts: data.data,
    nextCursor: data.meta.next_cursor,
    hasMore: data.meta.has_more,
  };
}
