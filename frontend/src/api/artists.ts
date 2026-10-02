import { apiClient } from './client';
import type { ArtistProfile, ArtistProfileResponse, ToggleFollowResponse } from '../types/artist';
import type { PostThumbnail, PostThumbnailsResponse } from '../types/postThumbnail';

export async function fetchArtistProfile(username: string): Promise<ArtistProfile> {
  const { data } = await apiClient.get<ArtistProfileResponse>(`/artists/${username}`);
  return data.data;
}

export interface ArtistPostsPage {
  posts: PostThumbnail[];
  nextCursor: string | null;
  hasMore: boolean;
}

export async function fetchArtistPosts(
  username: string,
  cursor: string | null,
  perPage = 15
): Promise<ArtistPostsPage> {
  const { data } = await apiClient.get<PostThumbnailsResponse>(`/artists/${username}/posts`, {
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

export async function toggleFollow(username: string): Promise<ToggleFollowResponse> {
  const { data } = await apiClient.post<ToggleFollowResponse>(`/artists/${username}/follow`);
  return data;
}
