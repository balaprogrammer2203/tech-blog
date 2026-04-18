import { Stack, Typography } from "@mui/material";
import type { AdminCategoryDetail } from "@/types/categories";

export function CategoryDetailFields({ d }: { d: AdminCategoryDetail }) {
  return (
    <Stack spacing={1.5} sx={{ mt: 1 }}>
      <Typography variant="body2">
        <strong>Name:</strong> {d.name}
      </Typography>
      <Typography variant="body2">
        <strong>Slug:</strong> {d.slug}
      </Typography>
      <Typography variant="body2">
        <strong>Level:</strong> {d.level === 0 ? "Root" : "Subcategory"}
      </Typography>
      {d.parent && (
        <Typography variant="body2">
          <strong>Parent:</strong> {d.parent.name} ({d.parent.slug})
        </Typography>
      )}
      <Typography variant="body2">
        <strong>Sort order:</strong> {d.sortOrder}
      </Typography>
      <Typography variant="body2">
        <strong>Posts:</strong> {d.postCount} · <strong>Child categories:</strong> {d.childCount}
      </Typography>
      {d.description && (
        <Typography variant="body2">
          <strong>Description:</strong> {d.description}
        </Typography>
      )}
      <Typography variant="caption" color="text.secondary">
        Created {new Date(d.createdAt).toLocaleString()} · Updated {new Date(d.updatedAt).toLocaleString()}
      </Typography>
    </Stack>
  );
}
