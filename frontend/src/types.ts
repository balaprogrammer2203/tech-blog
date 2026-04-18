export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type PostTag = { id: string; name: string; slug: string };

export type PostCategory = {
  id: string;
  slug: string;
  name: string;
  parent: { slug: string; name: string };
};

export type PublicCategoryChild = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: { slug: string; name: string };
};

export type PublicCategoryRoot = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children: PublicCategoryChild[];
};

export type CategoriesTreeResponse = {
  roots: PublicCategoryRoot[];
};

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: PostTag[];
  category?: PostCategory | null;
  coverImageUrl?: string;
  readTimeMinutes?: number;
  publishedAt?: string;
  likeCount: number;
  commentCount: number;
  author: { name: string } | null;
};

export type PostDetail = PostListItem & {
  /** TipTap JSON document or legacy markdown string. */
  content: string | Record<string, unknown>;
  createdAt?: string;
  updatedAt?: string;
  status?: string;
};

export type Paginated<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};
