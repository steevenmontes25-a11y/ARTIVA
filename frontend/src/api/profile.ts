import { apiClient } from './client';
import { appendFile } from './formDataFile';
import type { AuthUser, MeResponse } from '../types/auth';

export interface UpdateProfilePayload {
  bio?: string | null;
  categoryIds?: number[];
  location?: string | null;
  externalLinks?: {
    website?: string | null;
    instagram?: string | null;
  };
  /** Local file uri devuelto por expo-image-picker (no una URL remota). */
  avatarUri?: string | null;
}

function guessImageMimeType(uri: string): string {
  const extension = uri.split('.').pop()?.toLowerCase();

  switch (extension) {
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    default:
      return 'image/jpeg';
  }
}

export async function updateProfile(payload: UpdateProfilePayload): Promise<AuthUser> {
  const formData = new FormData();

  // PHP no parsea bodies multipart/form-data en verbos PUT/PATCH reales
  // (solo en POST) — un PUT directo con FormData llega al backend con el
  // body efectivamente vacío: Laravel devuelve 200 con el usuario sin
  // cambios, sin error visible, y nada persiste. El workaround estándar de
  // Laravel es mandar un POST real con _method=PUT — la ruta sigue
  // definida como PUT (Route::put('profile', ...)) sin tocarla, Symfony/
  // Laravel resuelve el override automáticamente.
  formData.append('_method', 'PUT');

  if (payload.bio !== undefined) {
    formData.append('bio', payload.bio ?? '');
  }

  payload.categoryIds?.forEach((id) => {
    formData.append('category_ids[]', String(id));
  });

  if (payload.location !== undefined) {
    formData.append('location', payload.location ?? '');
  }

  if (payload.externalLinks) {
    if (payload.externalLinks.website) {
      formData.append('external_links[website]', payload.externalLinks.website);
    }
    if (payload.externalLinks.instagram) {
      formData.append('external_links[instagram]', payload.externalLinks.instagram);
    }
  }

  if (payload.avatarUri) {
    const name = payload.avatarUri.split('/').pop() ?? 'avatar.jpg';

    await appendFile(formData, 'avatar', {
      uri: payload.avatarUri,
      name,
      type: guessImageMimeType(payload.avatarUri),
    });
  }

  const { data } = await apiClient.post<MeResponse>('/profile', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

  return data.data;
}
