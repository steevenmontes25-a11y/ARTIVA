import { apiClient } from './client';
import { appendFile } from './formDataFile';
import type { CreatedPostResponse, Post, PostType } from '../types/post';

export interface CreatePostMedia {
  uri: string;
  name: string;
  mimeType: string;
}

export interface CreatePostPayload {
  type: PostType;
  caption?: string | null;
  categoryId?: number | null;
  hashtags?: string[];
  media?: CreatePostMedia | null;
}

export async function createPost(
  payload: CreatePostPayload,
  onProgress?: (percent: number) => void
): Promise<Post> {
  const formData = new FormData();
  formData.append('type', payload.type);

  if (payload.caption) {
    formData.append('caption', payload.caption);
  }

  if (payload.categoryId) {
    formData.append('category_id', String(payload.categoryId));
  }

  payload.hashtags?.forEach((tag) => {
    formData.append('hashtags[]', tag);
  });

  if (payload.media) {
    await appendFile(formData, 'media', {
      uri: payload.media.uri,
      name: payload.media.name,
      type: payload.media.mimeType,
    });
  }

  const { data } = await apiClient.post<CreatedPostResponse>('/posts', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });

  return data.data;
}

export async function deletePost(postId: number): Promise<void> {
  await apiClient.delete(`/posts/${postId}`);
}
