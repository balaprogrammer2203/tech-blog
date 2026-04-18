export type PostCategory = {
  id: string;
  slug: string;
  name: string;
  parent: { slug: string; name: string };
} | null;

export type CategoryChild = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  parent?: { slug: string; name: string };
};

export type CategoryRoot = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  children: CategoryChild[];
};

export type CategoriesTreeResponse = {
  roots: CategoryRoot[];
};

/** Admin list row from `GET /api/admin/categories`. */
export type AdminCategoryRow = {
  id: string;
  name: string;
  slug: string;
  level: number;
  parentId: string | null;
  parentName: string | null;
  parentSlug: string | null;
  postCount: number;
  sortOrder: number;
  description: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Admin detail from `GET /api/admin/categories/:id`. */
export type AdminCategoryDetail = {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  parent: { id: string; name: string; slug: string } | null;
  level: number;
  description: string | null;
  sortOrder: number;
  postCount: number;
  childCount: number;
  createdAt: string;
  updatedAt: string;
};
