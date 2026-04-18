import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import {
  useAdminPostsQuery,
  useCategoriesTreeQuery,
  useDeletePostMutation,
  useSetPostStatusMutation,
} from "@/store/baseApi";
import type { CategoryChild } from "@/types/categories";

function apiErrorMessage(e: unknown, fallback: string): string {
  const err = e as FetchBaseQueryError | undefined;
  if (err && typeof err === "object" && "data" in err && err.data && typeof err.data === "object" && "message" in err.data) {
    return String((err.data as { message: string }).message);
  }
  return fallback;
}

function flattenLeaves(roots: { children: CategoryChild[] }[] | undefined): { slug: string; label: string }[] {
  if (!roots) return [];
  const out: { slug: string; label: string }[] = [];
  for (const r of roots) {
    for (const ch of r.children) {
      const parentName = ch.parent?.name ?? "—";
      out.push({ slug: ch.slug, label: `${parentName} › ${ch.name}` });
    }
  }
  return out.sort((a, b) => a.label.localeCompare(b.label));
}

export function PostsAdminPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [categorySlug, setCategorySlug] = useState<string>("");
  const { data: tree } = useCategoriesTreeQuery();
  const leafOptions = useMemo(() => flattenLeaves(tree?.roots), [tree?.roots]);

  const { data, isFetching, isError, refetch, error } = useAdminPostsQuery({
    page,
    status: status || undefined,
    categorySlug: categorySlug || undefined,
  });
  const [updatePostStatus] = useSetPostStatusMutation();
  const [remove] = useDeletePostMutation();
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [status, categorySlug]);

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Posts
      </Typography>
      {actionError && (
        <Alert severity="error" onClose={() => setActionError(null)} sx={{ mb: 2 }}>
          {actionError}
        </Alert>
      )}
      {isError && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Failed to load posts.")}{" "}
          <Button size="small" onClick={() => void refetch()}>
            Retry
          </Button>
        </Alert>
      )}
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 2, mb: 2 }}>
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="published">Published</MenuItem>
            <MenuItem value="draft">Draft</MenuItem>
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 260 }}>
          <InputLabel>Leaf category</InputLabel>
          <Select label="Leaf category" value={categorySlug} onChange={(e) => setCategorySlug(e.target.value)}>
            <MenuItem value="">All categories</MenuItem>
            {leafOptions.map((o) => (
              <MenuItem key={o.slug} value={o.slug}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Author</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((p) => {
              const catLabel = p.category
                ? `${p.category.parent.name} › ${p.category.name}`
                : "—";
              const canPublish = p.status !== "published" && Boolean(p.category);
              const publishTitle = !p.category
                ? "Add a leaf category on the public site before publishing (API enforces this)."
                : "Publish";

              return (
                <TableRow key={p.id}>
                  <TableCell sx={{ maxWidth: 260 }}>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: "text.primary" }} noWrap title={p.title}>
                      {p.title}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2">{catLabel}</Typography>
                    {p.category && (
                      <Typography variant="caption" color="text.secondary" display="block">
                        {p.category.slug}
                      </Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" noWrap title={p.author?.email ?? ""}>
                      {p.author?.email ?? "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={p.status}
                      color={p.status === "published" ? "success" : "secondary"}
                      variant="filled"
                      sx={{ fontWeight: 700, textTransform: "capitalize", minWidth: 88 }}
                    />
                  </TableCell>
                  <TableCell align="right">
                    {p.status === "published" ? (
                      <Button variant="outlined" size="small" onClick={() => void updatePostStatus({ id: p.id, status: "draft" })}>
                        Unpublish
                      </Button>
                    ) : (
                      <Tooltip title={publishTitle}>
                        <span>
                          <Button
                            variant="outlined"
                            size="small"
                            disabled={!canPublish}
                            onClick={async () => {
                              setActionError(null);
                              try {
                                await updatePostStatus({ id: p.id, status: "published" }).unwrap();
                              } catch (e) {
                                setActionError(apiErrorMessage(e, "Could not publish (category may be missing)."));
                              }
                            }}
                          >
                            Publish
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                    <Button
                      variant="outlined"
                      size="small"
                      color="error"
                      sx={{ ml: 1 }}
                      onClick={() => {
                        if (window.confirm("Delete?")) void remove(p.id);
                      }}
                    >
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
      {isFetching && <Typography sx={{ mt: 1 }}>Loading…</Typography>}
      {data && data.totalPages > 1 && (
        <Box sx={{ mt: 2, display: "flex", gap: 1, alignItems: "center" }}>
          <Button variant="outlined" disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
            Prev
          </Button>
          <Typography variant="body2">
            Page {data.page}/{data.totalPages}
          </Typography>
          <Button variant="outlined" disabled={page >= data.totalPages} onClick={() => setPage((x) => x + 1)}>
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
