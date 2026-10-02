import { apiClient } from './client';
import type { CategoriesResponse, Category } from '../types/category';

export async function fetchCategories(): Promise<Category[]> {
  const { data } = await apiClient.get<CategoriesResponse>('/categories');
  return data.data;
}
