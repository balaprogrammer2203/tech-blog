import { useMemo } from "react";
import { useAdminCategoryListQuery } from "@/store/baseApi";
import type { CategoryRoot } from "@/types/categories";

/** Root categories from `GET /api/admin/categories` (for parent dropdowns on create/edit). */
export function useAdminCategoryRoots() {
  const { data, isFetching, isError, error, refetch } = useAdminCategoryListQuery({
    page: 1,
    limit: 100,
    level: "root",
    sortField: "sortOrder",
    sortOrder: "asc",
  });

  const roots: CategoryRoot[] = useMemo(
    () =>
      (data?.items ?? []).map((r) => ({
        id: r.id,
        name: r.name,
        slug: r.slug,
        description: r.description ?? undefined,
        children: [],
      })),
    [data?.items]
  );

  return { roots, isFetching, isError, error, refetch };
}
