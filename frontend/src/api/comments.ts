import { apiClient } from './client';
import type { Comment, CommentsResponse, CreatedCommentResponse } from '../types/comment';

export interface CommentsPage {
  comments: Comment[];
  currentPage: number;
  lastPage: number;
  total: number;
}

export async function fetchComments(postId: number, page = 1): Promise<CommentsPage> {
  const { data } = await apiClient.get<CommentsResponse>(`/posts/${postId}/comments`, {
    params: { page },
  });

  return {
    comments: data.data,
    currentPage: data.meta.current_page,
    lastPage: data.meta.last_page,
    total: data.meta.total,
  };
}

export async function createComment(
  postId: number,
  content: string,
  parentId?: number | null
): Promise<Comment> {
  const { data } = await apiClient.post<CreatedCommentResponse>(`/posts/${postId}/comments`, {
    content,
    ...(parentId ? { parent_id: parentId } : {}),
  });

  return data.data;
}
