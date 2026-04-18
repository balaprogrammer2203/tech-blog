import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  IconButton,
  Paper,
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
import { useAdminTagListQuery } from "@/store/baseApi";
import type { RootState } from "@/store/store";
import type { AdminTagRow } from "@/types/tags";
import { apiErrorMessage } from "./categories/apiErrorMessage";
import { BulkDeleteTagsDialog } from "./tags/BulkDeleteTagsDialog";
import { DeleteTagDialog } from "./tags/DeleteTagDialog";
import { downloadTagsExport } from "./tags/tagCsvExport";
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

const defaultSort: GridSortModel = [{ field: "sortOrder", sort: "asc" }];

export function TagsAdminPage() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL as string;
  const token = useSelector((s: RootState) => s.auth.accessToken);

  const knownRowsRef = useRef(new Map<string, AdminTagRow>());

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
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
  }, [debouncedQ]);

  useEffect(() => {
    setRowSelectionModel([]);
    knownRowsRef.current = new Map();
  }, [debouncedQ]);

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
      sortField: allowedSort,
      sortOrder: sortOrderDir,
    }),
    [paginationModel, debouncedQ, allowedSort, sortOrderDir]
  );

  const { data, isFetching, isError, error, refetch } = useAdminTagListQuery(listArgs);

  useEffect(() => {
    for (const r of data?.items ?? []) {
      knownRowsRef.current.set(r.id, r);
    }
  }, [data?.items]);

  useEffect(() => {
    if (isError) setListError(listErrorMessage(error, "Failed to load tags."));
    else setListError(null);
  }, [isError, error]);

  const selectedIds = useMemo(() => [...rowSelectionModel].map((id) => String(id)), [rowSelectionModel]);

  const handleExport = useCallback(async () => {
    setExportError(null);
    try {
      if (selectedIds.length > 0) {
        await downloadTagsExport(apiBase, token, { scope: "selected", ids: [...selectedIds] });
      } else {
        await downloadTagsExport(apiBase, token, { scope: "filter", q: debouncedQ || undefined });
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    }
  }, [apiBase, token, debouncedQ, selectedIds]);

  const columns: GridColDef<AdminTagRow>[] = useMemo(
    () => [
      {
        field: "name",
        headerName: "Name",
        flex: 1,
        minWidth: 160,
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
        field: "postCount",
        headerName: "Posts",
        width: 88,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "sortOrder",
        headerName: "Order",
        width: 88,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "createdAt",
        headerName: "Created",
        minWidth: 110,
        valueFormatter: (v) => (v ? new Date(String(v)).toLocaleDateString() : ""),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 108,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.75} onClick={(e) => e.stopPropagation()} sx={{ py: 0.25 }}>
            <Tooltip title="View">
              <IconButton size="small" aria-label="View" onClick={() => navigate(`/tags/${params.row.id}`)} sx={actionIconSx}>
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" aria-label="Edit" onClick={() => navigate(`/tags/${params.row.id}/edit`)} sx={actionIconSx}>
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
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Tags
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Manage labels used on posts (up to five per post). Create tags here, then pick them in the post editor.
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
        <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={() => navigate("/tags/new")}>
          New tag
        </Button>
        <Tooltip
          title={
            selectedIds.length > 0
              ? `Download ${selectedIds.length} selected tags as CSV`
              : "Download tags matching the current search"
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
            minWidth: { xs: 520, sm: "auto" },
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

      <DeleteTagDialog
        open={Boolean(deleteId)}
        id={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={(removedId) => {
          setRowSelectionModel((prev) => prev.filter((rid) => String(rid) !== removedId));
          setDeleteId(null);
        }}
      />

      <BulkDeleteTagsDialog
        open={bulkDeleteOpen}
        ids={selectedIds}
        rowsById={knownRowsRef.current}
        onClose={() => setBulkDeleteOpen(false)}
        onFinished={({ deleted, errors, total }) => {
          setBulkFeedback(
            `Attempted ${total} deletes.\nSuccessful: ${deleted}.\n` +
              (errors.length ? `Skipped / failed:\n${errors.join("\n")}` : "")
          );
          setRowSelectionModel([]);
        }}
      />
    </Box>
  );
}
