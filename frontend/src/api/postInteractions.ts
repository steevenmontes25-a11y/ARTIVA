import { apiClient } from './client';

export interface LikeResponse {
  liked: boolean;
  likes_count: number;
}

export interface SaveResponse {
  saved: boolean;
}

export async function likePost(postId: number): Promise<LikeResponse> {
  const { data } = await apiClient.post<LikeResponse>(`/posts/${postId}/like`);
  return data;
}

export async function unlikePost(postId: number): Promise<LikeResponse> {
  const { data } = await apiClient.delete<LikeResponse>(`/posts/${postId}/like`);
  return data;
}

export async function savePost(postId: number): Promise<SaveResponse> {
  const { data } = await apiClient.post<SaveResponse>(`/posts/${postId}/save`);
  return data;
}

export async function unsavePost(postId: number): Promise<SaveResponse> {
  const { data } = await apiClient.delete<SaveResponse>(`/posts/${postId}/save`);
  return data;
}
