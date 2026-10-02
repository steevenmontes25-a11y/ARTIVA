export interface ArtistCounts {
  followers: number;
  following: number;
  posts: number;
  collaborations: number;
  projects: number;
}

export interface ArtistProfile {
  id: number;
  username: string;
  name: string;
  avatar_url: string | null;
  bio: string | null;
  primary_discipline: string | null;
  specialties: string[] | null;
  location: string | null;
  external_links: Record<string, string | null> | null;
  counts: ArtistCounts;
  is_following: boolean;
}

export interface ArtistProfileResponse {
  data: ArtistProfile;
}

export interface ToggleFollowResponse {
  following: boolean;
  followers_count: number;
}
