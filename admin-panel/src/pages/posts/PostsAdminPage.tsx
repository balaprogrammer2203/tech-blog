import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import CloseIcon from "@mui/icons-material/Close";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import DownloadIcon from "@mui/icons-material/Download";
import EditIcon from "@mui/icons-material/Edit";
import PublishIcon from "@mui/icons-material/Publish";
import UnpublishedIcon from "@mui/icons-material/Unpublished";
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import {
  useAdminPostsQuery,
  useCategoriesTreeQuery,
  useSetPostStatusMutation,
} from "@/store/baseApi";
import type { AdminPostListRow } from "@/store/baseApi";
import type { RootState } from "@/store/store";
import type { CategoryChild } from "@/types/categories";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { BulkDeletePostsDialog } from "./BulkDeletePostsDialog";
import { DeletePostDialog } from "./DeletePostDialog";
import { downloadPostsExport } from "./postCsvExport";
import { adminLayout, dataGridAdminSx } from "@/theme/adminTheme";

const actionIconSx = {
  border: `1px solid ${adminLayout.borderStrong}`,
  borderRadius: 1.5,
  bgcolor: adminLayout.paper,
  p: 0.65,
  "&:hover": { bgcolor: adminLayout.canvas },
} as const;

function listErrorMessage(e: unknown, fallback: string): string {
  return apiErrorMessage(e as FetchBaseQueryError, fallback);
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

const defaultSort: GridSortModel = [{ field: "updatedAt", sort: "desc" }];

export function PostsAdminPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const qFromUrl = searchParams.get("q") ?? "";
  const apiBase = import.meta.env.VITE_API_URL as string;
  const token = useSelector((s: RootState) => s.auth.accessToken);

  const knownRowsRef = useRef(new Map<string, AdminPostListRow>());

  const [searchInput, setSearchInput] = useState(qFromUrl);
  const [debouncedQ, setDebouncedQ] = useState("");
  const [status, setStatus] = useState<"" | "draft" | "published">("");
  const [categorySlug, setCategorySlug] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>(defaultSort);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const { data: tree } = useCategoriesTreeQuery();
  const leafOptions = useMemo(() => flattenLeaves(tree?.roots), [tree?.roots]);

  useEffect(() => {
    setSearchInput((prev) => (qFromUrl !== prev ? qFromUrl : prev));
  }, [qFromUrl]);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [debouncedQ, status, categorySlug]);

  useEffect(() => {
    setRowSelectionModel([]);
    knownRowsRef.current = new Map();
  }, [debouncedQ, status, categorySlug]);

  const rawField = sortModel[0]?.field;
  const allowedSort: "title" | "slug" | "status" | "updatedAt" | "publishedAt" | "createdAt" | "likeCount" | "commentCount" =
    rawField &&
    ["title", "slug", "status", "updatedAt", "publishedAt", "createdAt", "likeCount", "commentCount"].includes(String(rawField))
      ? (String(rawField) as "title" | "slug" | "status" | "updatedAt" | "publishedAt" | "createdAt" | "likeCount" | "commentCount")
      : "updatedAt";
  const sortOrderDir: "asc" | "desc" = sortModel[0]?.sort === "asc" ? "asc" : "desc";

  const listArgs = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      q: debouncedQ || undefined,
      status: status || undefined,
      categorySlug: categorySlug || undefined,
      sortField: allowedSort,
      sortOrder: sortOrderDir,
    }),
    [paginationModel, debouncedQ, status, categorySlug, allowedSort, sortOrderDir]
  );

  const { data, isFetching, isError, error, refetch } = useAdminPostsQuery(listArgs);
  const [updatePostStatus] = useSetPostStatusMutation();

  useEffect(() => {
    for (const r of data?.items ?? []) {
      knownRowsRef.current.set(r.id, r);
    }
  }, [data?.items]);

  useEffect(() => {
    if (isError) setListError(listErrorMessage(error, "Failed to load posts."));
    else setListError(null);
  }, [isError, error]);

  const selectedIds = useMemo(() => [...rowSelectionModel].map((id) => String(id)), [rowSelectionModel]);

  const handleExport = useCallback(async () => {
    setExportError(null);
    try {
      if (selectedIds.length > 0) {
        await downloadPostsExport(apiBase, token, { scope: "selected", ids: [...selectedIds] });
      } else {
        await downloadPostsExport(apiBase, token, {
          scope: "filter",
          q: debouncedQ || undefined,
          status: status || undefined,
          categorySlug: categorySlug || undefined,
        });
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    }
  }, [apiBase, token, debouncedQ, status, categorySlug, selectedIds]);

  const columns: GridColDef<AdminPostListRow>[] = useMemo(
    () => [
      {
        field: "title",
        headerName: "Title",
        flex: 1,
        minWidth: 200,
        renderCell: (p) => (
          <Box sx={{ py: 0.5, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: adminLayout.textPrimary, lineHeight: 1.25 }} noWrap title={p.row.title}>
              {p.row.title}
            </Typography>
            <Typography variant="caption" sx={{ color: adminLayout.textMuted, display: "block", lineHeight: 1.2 }} noWrap title={p.row.slug}>
              {p.row.slug}
            </Typography>
          </Box>
        ),
      },
      {
        field: "category",
        headerName: "Category",
        flex: 0.8,
        minWidth: 140,
        sortable: false,
        valueGetter: (_v, row) =>
          row.category ? `${row.category.parent.name} › ${row.category.name}` : "—",
        renderCell: (p) => {
          const label = p.row.category ? `${p.row.category.parent.name} › ${p.row.category.name}` : "—";
          return (
            <Typography variant="body2" color="text.secondary" noWrap title={label}>
              {label}
            </Typography>
          );
        },
      },
      {
        field: "author",
        headerName: "Author",
        flex: 0.7,
        minWidth: 140,
        sortable: false,
        renderCell: (p) => (
          <Typography variant="body2" color="text.secondary" noWrap title={p.row.author?.email ?? ""}>
            {p.row.author?.email ?? "—"}
          </Typography>
        ),
      },
      {
        field: "status",
        headerName: "Status",
        width: 110,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.row.status}
            color={p.row.status === "published" ? "success" : "secondary"}
            variant="filled"
            sx={{ fontWeight: 700, textTransform: "capitalize", minWidth: 88 }}
          />
        ),
      },
      { field: "likeCount", headerName: "Likes", type: "number", width: 80 },
      { field: "commentCount", headerName: "Comments", type: "number", width: 100 },
      {
        field: "updatedAt",
        headerName: "Updated",
        minWidth: 120,
        valueFormatter: (v) => (v ? new Date(String(v)).toLocaleString() : ""),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 176,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => {
          const canPublish = params.row.status !== "published" && Boolean(params.row.category);
          const publishTitle = !params.row.category
            ? "Assign a leaf category before publishing."
            : "Publish";
          return (
            <Stack direction="row" spacing={0.75} onClick={(e) => e.stopPropagation()} sx={{ py: 0.25 }}>
              <Tooltip title="View">
                <IconButton size="small" aria-label="View" onClick={() => navigate(`/posts/${params.row.id}`)} sx={actionIconSx}>
                  <VisibilityIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              <Tooltip title="Edit">
                <IconButton size="small" aria-label="Edit" onClick={() => navigate(`/posts/${params.row.id}/edit`)} sx={actionIconSx}>
                  <EditIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
              {params.row.status === "published" ? (
                <Tooltip title="Unpublish">
                  <IconButton
                    size="small"
                    aria-label="Unpublish"
                    onClick={() => void updatePostStatus({ id: params.row.id, status: "draft" })}
                    sx={actionIconSx}
                  >
                    <UnpublishedIcon sx={{ fontSize: 18 }} />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title={publishTitle}>
                  <span>
                    <IconButton
                      size="small"
                      aria-label="Publish"
                      disabled={!canPublish}
                      onClick={async () => {
                        setActionError(null);
                        try {
                          await updatePostStatus({ id: params.row.id, status: "published" }).unwrap();
                        } catch (e) {
                          setActionError(listErrorMessage(e, "Could not publish."));
                        }
                      }}
                      sx={actionIconSx}
                    >
                      <PublishIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </span>
                </Tooltip>
              )}
              <Tooltip title="Delete">
                <IconButton
                  size="small"
                  aria-label="Delete"
                  color="error"
                  onClick={() => setDeleteId(params.row.id)}
                  sx={{
                    ...actionIconSx,
                    borderColor: "rgba(239, 68, 68, 0.35)",
                    "&:hover": { bgcolor: "rgba(239, 68, 68, 0.06)" },
                  }}
                >
                  <DeleteOutlineIcon sx={{ fontSize: 18 }} />
                </IconButton>
              </Tooltip>
            </Stack>
          );
        },
      },
    ],
    [navigate, updatePostStatus]
  );

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Posts
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search, filter by status and leaf category, sort columns, export CSV (current filter or selected rows), and manage
        posts with view, edit, publish, and delete. <strong>New post</strong> opens the editor.
      </Typography>

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}
      {listError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setListError(null)}>
          {listError}{" "}
          <Button size="small" onClick={() => void refetch()}>
            Retry
          </Button>
        </Alert>
      )}
      {exportError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setExportError(null)}>
          {exportError}
        </Alert>
      )}
      {bulkFeedback && (
        <Alert severity="info" sx={{ mb: 2, whiteSpace: "pre-line" }} onClose={() => setBulkFeedback(null)}>
          {bulkFeedback}
        </Alert>
      )}

      <Stack direction={{ xs: "column", md: "row" }} spacing={2} sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <TextField
          size="small"
          label="Search"
          placeholder="Title, slug, or excerpt"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
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
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => navigate("/posts/new")}>
          New post
        </Button>
        <Tooltip
          title={
            selectedIds.length > 0
              ? `Download ${selectedIds.length} selected posts as CSV`
              : "Download posts matching the current search and filters (server limit)"
          }
        >
          <Button variant="outlined" startIcon={<DownloadIcon />} onClick={() => void handleExport()}>
            {selectedIds.length > 0 ? `Export selected (${selectedIds.length})` : "Export CSV"}
          </Button>
        </Tooltip>
      </Stack>

      {rowSelectionModel.length > 0 && (
        <Paper
          variant="outlined"
          sx={{
            mb: 2,
            px: 2,
            py: 1.25,
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            bgcolor: adminLayout.paper,
            borderRadius: 2,
            borderColor: adminLayout.border,
            boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)",
          }}
        >
          <Typography variant="body2" fontWeight={600}>
            {rowSelectionModel.length} selected
          </Typography>
          <Button
            variant="contained"
            color="error"
            size="small"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setBulkDeleteOpen(true)}
          >
            Delete ({rowSelectionModel.length})
          </Button>
          <Button variant="outlined" size="small" startIcon={<CloseIcon />} onClick={() => setRowSelectionModel([])}>
            Clear
          </Button>
        </Paper>
      )}

      <Box sx={{ width: "100%", minWidth: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
        <Paper
          variant="outlined"
          sx={{
            width: "100%",
            minWidth: { xs: 560, sm: "auto" },
            minHeight: { xs: 400, sm: 480 },
            borderRadius: 2,
            overflow: "hidden",
            bgcolor: adminLayout.paper,
            borderColor: adminLayout.border,
          }}
        >
          <DataGrid
            rows={data?.items ?? []}
            columns={columns}
            getRowId={(r) => r.id}
            loading={isFetching}
            rowCount={data?.total ?? 0}
            pageSizeOptions={[10, 25, 50, 100]}
            paginationModel={paginationModel}
            paginationMode="server"
            onPaginationModelChange={setPaginationModel}
            sortModel={sortModel}
            sortingMode="server"
            onSortModelChange={(m) => setSortModel(m.length ? m : defaultSort)}
            checkboxSelection
            keepNonExistentRowsSelected
            rowSelectionModel={rowSelectionModel}
            onRowSelectionModelChange={setRowSelectionModel}
            disableRowSelectionOnClick
            density="standard"
            rowHeight={56}
            sx={{
              ...dataGridAdminSx,
              border: "none",
              "& .MuiDataGrid-cell": { alignItems: "center" },
              "& .MuiDataGrid-row": { maxHeight: "unset" },
            }}
            slotProps={{
              pagination: { labelRowsPerPage: "Rows per page" },
            }}
          />
        </Paper>
      </Box>

      <DeletePostDialog
        open={Boolean(deleteId)}
        id={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={(removedId) => {
          setRowSelectionModel((prev) => prev.filter((rid) => String(rid) !== removedId));
          void refetch();
        }}
      />
      <BulkDeletePostsDialog
        open={bulkDeleteOpen}
        ids={selectedIds}
        rowsById={knownRowsRef.current}
        onClose={() => setBulkDeleteOpen(false)}
        onFinished={({ deleted, errors, total }) => {
          setRowSelectionModel([]);
          void refetch();
          if (errors.length) {
            setBulkFeedback(
              `Removed ${deleted} of ${total}. Errors:\n${errors.slice(0, 10).join("\n")}${errors.length > 10 ? "\n…" : ""}`
            );
          } else if (deleted > 0) {
            setBulkFeedback(`Removed ${deleted} post(s).`);
          } else {
            setBulkFeedback("No posts were removed.");
          }
        }}
      />
    </Box>
  );
}
