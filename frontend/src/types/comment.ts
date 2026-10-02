export interface CommentAuthor {
  id: number;
  username: string;
  avatar_url: string | null;
}

export interface Comment {
  id: number;
  content: string;
  parent_id: number | null;
  user: CommentAuthor;
  replies: Comment[];
  created_at: string;
}

export interface CommentsMeta {
  current_page: number;
  last_page: number;
  per_page: number;
  total: number;
}

export interface CommentsResponse {
  data: Comment[];
  meta: CommentsMeta;
}

export interface CreatedCommentResponse {
  data: Comment;
}
