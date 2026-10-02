export interface Category {
  id: number;
  name: string;
  slug: string;
  icon: string | null;
}

export interface CategoriesResponse {
  data: Category[];
}
