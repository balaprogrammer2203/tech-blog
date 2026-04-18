export type PostTag = { id: string; name: string; slug: string };

export type AdminTagRow = PostTag & {
  postCount: number;
  sortOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

export type AdminTagDetail = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  sortOrder: number;
  postCount: number;
  createdAt: string;
  updatedAt: string;
};
