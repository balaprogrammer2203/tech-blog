export type UserRole = "user" | "admin";

export type User = {
  id: string;
  email: string;
  name: string;
  role: UserRole;
};

export type PostListItem = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  tags: string[];
  coverImageUrl?: string;
  readTimeMinutes?: number;
  publishedAt?: string;
  likeCount: number;
  commentCount: number;
  author: { name: string } | null;
};

export type PostDetail = PostListItem & {
  content: string;
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
