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
import VisibilityIcon from "@mui/icons-material/Visibility";
import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  DataGrid,
  type GridColDef,
  type GridPaginationModel,
  type GridRowSelectionModel,
  type GridSortModel,
} from "@mui/x-data-grid";
import { useAdminCategoryListQuery, useCategoriesTreeQuery } from "@/store/baseApi";
import type { RootState } from "@/store/store";
import type { AdminCategoryRow } from "@/types/categories";
import { apiErrorMessage } from "./categories/apiErrorMessage";
import { BulkDeleteCategoriesDialog } from "./categories/BulkDeleteCategoriesDialog";
import { DeleteCategoryDialog } from "./categories/DeleteCategoryDialog";
import { downloadCategoriesExport } from "./categories/categoryCsvExport";
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

type LevelFilter = "all" | "root" | "child";

const defaultSort: GridSortModel = [{ field: "sortOrder", sort: "asc" }];

export function CategoriesAdminPage() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL as string;
  const token = useSelector((s: RootState) => s.auth.accessToken);

  const knownRowsRef = useRef(new Map<string, AdminCategoryRow>());

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [level, setLevel] = useState<LevelFilter>("all");
  const [parentId, setParentId] = useState("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>(defaultSort);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [debouncedQ, level, parentId]);

  useEffect(() => {
    if (level !== "child") setParentId("");
  }, [level]);

  useEffect(() => {
    setRowSelectionModel([]);
    knownRowsRef.current = new Map();
  }, [debouncedQ, level, parentId]);

  const rawField = sortModel[0]?.field;
  const allowedSort: "name" | "slug" | "sortOrder" | "createdAt" | "postCount" =
    rawField && ["name", "slug", "sortOrder", "createdAt", "postCount"].includes(String(rawField))
      ? (String(rawField) as "name" | "slug" | "sortOrder" | "createdAt" | "postCount")
      : "sortOrder";
  const sortOrderDir: "asc" | "desc" = sortModel[0]?.sort === "desc" ? "desc" : "asc";

  const listArgs = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      q: debouncedQ || undefined,
      level: level === "all" ? undefined : level,
      parentId: level === "child" && parentId ? parentId : undefined,
      sortField: allowedSort,
      sortOrder: sortOrderDir,
    }),
    [paginationModel, debouncedQ, level, parentId, allowedSort, sortOrderDir]
  );

  const { data, isFetching, isError, error, refetch } = useAdminCategoryListQuery(listArgs);
  const { data: tree } = useCategoriesTreeQuery();

  useEffect(() => {
    for (const r of data?.items ?? []) {
      knownRowsRef.current.set(r.id, r);
    }
  }, [data?.items]);

  useEffect(() => {
    if (isError) setListError(listErrorMessage(error, "Failed to load categories."));
    else setListError(null);
  }, [isError, error]);

  const roots = tree?.roots ?? [];

  const selectedIds = useMemo(() => [...rowSelectionModel].map((id) => String(id)), [rowSelectionModel]);

  const handleExport = useCallback(async () => {
    setExportError(null);
    try {
      if (selectedIds.length > 0) {
        await downloadCategoriesExport(apiBase, token, { scope: "selected", ids: [...selectedIds] });
      } else {
        await downloadCategoriesExport(apiBase, token, {
          scope: "filter",
          q: debouncedQ || undefined,
          level,
          parentId: level === "child" && parentId ? parentId : undefined,
        });
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    }
  }, [apiBase, token, debouncedQ, level, parentId, selectedIds]);

  const columns: GridColDef<AdminCategoryRow>[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 180,
        renderCell: (p) => (
          <Box sx={{ py: 0.5, minWidth: 0 }}>
            <Typography variant="body2" sx={{ fontWeight: 700, color: adminLayout.textPrimary, lineHeight: 1.25 }} noWrap title={p.row.name}>
              {p.row.name}
            </Typography>
            <Typography variant="caption" sx={{ color: adminLayout.textMuted, display: "block", lineHeight: 1.2 }} noWrap title={p.row.slug}>
              {p.row.slug}
            </Typography>
          </Box>
        ),
      },
      {
        field: "level",
        headerName: "Level",
        width: 100,
        sortable: false,
        align: "center",
        headerAlign: "center",
        renderCell: (p) => {
          const root = p.row.level === 0;
          return (
            <Chip
              size="small"
              label={root ? "Root" : "Sub"}
              color={root ? "success" : "secondary"}
              variant="filled"
              sx={{ fontWeight: 700, minWidth: 72 }}
            />
          );
        },
      },
      {
        field: "parentName",
        headerName: "Parent",
        flex: 0.7,
        minWidth: 120,
        sortable: false,
        valueGetter: (_v, row) => row.parentName ?? "—",
        renderCell: (p) => {
          const label = p.row.parentName ?? "—";
          return (
            <Typography variant="body2" color="text.secondary" noWrap title={label}>
              {label}
            </Typography>
          );
        },
      },
      {
        field: "postCount",
        headerName: "Posts",
        type: "number",
        width: 88,
        renderCell: (p) => (
          <Typography variant="body2" sx={{ fontWeight: 600, color: adminLayout.textPrimary }}>
            {p.value}
          </Typography>
        ),
      },
      {
        field: "sortOrder",
        headerName: "Order",
        type: "number",
        width: 80,
        renderCell: (p) => (
          <Typography variant="body2" color="text.secondary">
            {p.value}
          </Typography>
        ),
      },
      {
        field: "createdAt",
        headerName: "Created",
        minWidth: 120,
        valueFormatter: (v) => (v ? new Date(String(v)).toLocaleDateString() : ""),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 132,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.75} onClick={(e) => e.stopPropagation()} sx={{ py: 0.25 }}>
            <Tooltip title="View">
              <IconButton size="small" aria-label="View" onClick={() => navigate(`/categories/${params.row.id}`)} sx={actionIconSx}>
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" aria-label="Edit" onClick={() => navigate(`/categories/${params.row.id}/edit`)} sx={actionIconSx}>
                <EditIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
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
        ),
      },
    ],
    [navigate]
  );

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700 }}>
        Categories
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage the taxonomy: roots and subcategories. Published posts must use a leaf subcategory. Use search, filters,
        column headers to sort, and export for backups. <strong>Export CSV</strong> downloads the current filter when
        nothing is selected, or only the <strong>selected rows</strong> when you have a selection.
      </Typography>

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
          placeholder="Name or slug"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Level</InputLabel>
          <Select label="Level" value={level} onChange={(e) => setLevel(e.target.value as LevelFilter)}>
            <MenuItem value="all">All</MenuItem>
            <MenuItem value="root">Root only</MenuItem>
            <MenuItem value="child">Subcategories</MenuItem>
          </Select>
        </FormControl>
        {level === "child" && (
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel>Parent root</InputLabel>
            <Select label="Parent root" value={parentId} onChange={(e) => setParentId(e.target.value)}>
              <MenuItem value="">
                <em>Any root</em>
              </MenuItem>
              {roots.map((r) => (
                <MenuItem key={r.id} value={r.id}>
                  {r.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        )}
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => navigate("/categories/new")}>
          New category
        </Button>
        <Tooltip
          title={
            selectedIds.length > 0
              ? `Download ${selectedIds.length} selected categories as CSV`
              : "Download all categories matching the current search and filters (up to server limit)"
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

      <Paper
        variant="outlined"
        sx={{
          width: "100%",
          minHeight: 480,
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
            pagination: {
              labelRowsPerPage: "Rows per page",
            },
          }}
        />
      </Paper>

      <DeleteCategoryDialog
        open={Boolean(deleteId)}
        id={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={(removedId) => {
          setRowSelectionModel((prev) => prev.filter((rid) => String(rid) !== removedId));
          void refetch();
        }}
      />
      <BulkDeleteCategoriesDialog
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
          } else if (deleted < total) {
            setBulkFeedback(
              `Removed ${deleted} of ${total}. Others could not be deleted (for example, they still have posts or subcategories).`
            );
          } else if (deleted > 0) {
            setBulkFeedback(`Removed ${deleted} categories.`);
          } else {
            setBulkFeedback("No categories were removed.");
          }
        }}
      />
    </Box>
  );
}
