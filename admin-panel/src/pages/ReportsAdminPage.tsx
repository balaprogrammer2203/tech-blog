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
import { useAdminReportsQuery, useSetReportStatusMutation } from "@/store/baseApi";
import type { AdminReportRow } from "@/types/reports";
import type { RootState } from "@/store/store";
import { apiErrorMessage } from "./categories/apiErrorMessage";
import { adminLayout, dataGridAdminSx } from "@/theme/adminTheme";
import { BulkDeleteReportsDialog } from "./reports/BulkDeleteReportsDialog";
import { DeleteReportDialog } from "./reports/DeleteReportDialog";
import { downloadReportsExport } from "./reports/reportCsvExport";

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

function statusChipColor(status: string): "warning" | "success" | "default" {
  if (status === "pending") return "warning";
  if (status === "resolved") return "success";
  return "default";
}

const defaultSort: GridSortModel = [{ field: "createdAt", sort: "desc" }];

export function ReportsAdminPage() {
  const navigate = useNavigate();
  const apiBase = import.meta.env.VITE_API_URL as string;
  const token = useSelector((s: RootState) => s.auth.accessToken);

  const knownRowsRef = useRef(new Map<string, AdminReportRow>());

  const [searchInput, setSearchInput] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [statusFilter, setStatusFilter] = useState<"" | "pending" | "resolved" | "dismissed">("");
  const [paginationModel, setPaginationModel] = useState<GridPaginationModel>({ page: 0, pageSize: 25 });
  const [sortModel, setSortModel] = useState<GridSortModel>(defaultSort);
  const [rowSelectionModel, setRowSelectionModel] = useState<GridRowSelectionModel>([]);

  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [bulkFeedback, setBulkFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQ(searchInput.trim()), 400);
    return () => window.clearTimeout(t);
  }, [searchInput]);

  useEffect(() => {
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [debouncedQ, statusFilter]);

  useEffect(() => {
    setRowSelectionModel([]);
    knownRowsRef.current = new Map();
  }, [debouncedQ, statusFilter]);

  const rawField = sortModel[0]?.field;
  const allowedSort: "status" | "targetType" | "targetId" | "reason" | "createdAt" | "updatedAt" =
    rawField && ["status", "targetType", "targetId", "reason", "createdAt", "updatedAt"].includes(String(rawField))
      ? (String(rawField) as "status" | "targetType" | "targetId" | "reason" | "createdAt" | "updatedAt")
      : "createdAt";
  const sortOrderDir: "asc" | "desc" = sortModel[0]?.sort === "asc" ? "asc" : "desc";

  const listArgs = useMemo(
    () => ({
      page: paginationModel.page + 1,
      limit: paginationModel.pageSize,
      q: debouncedQ || undefined,
      ...(statusFilter ? { status: statusFilter } : {}),
      sortField: allowedSort,
      sortOrder: sortOrderDir,
    }),
    [paginationModel, debouncedQ, statusFilter, allowedSort, sortOrderDir]
  );

  const { data, isFetching, isError, error, refetch } = useAdminReportsQuery(listArgs);
  const [setReport, { isLoading: patchBusy }] = useSetReportStatusMutation();

  useEffect(() => {
    for (const r of data?.items ?? []) {
      knownRowsRef.current.set(r.id, r);
    }
  }, [data?.items]);

  useEffect(() => {
    if (isError) setListError(listErrorMessage(error, "Failed to load reports."));
    else setListError(null);
  }, [isError, error]);

  const selectedIds = useMemo(() => [...rowSelectionModel].map((id) => String(id)), [rowSelectionModel]);

  const handleExport = useCallback(async () => {
    setExportError(null);
    try {
      if (selectedIds.length > 0) {
        await downloadReportsExport(apiBase, token, { scope: "selected", ids: [...selectedIds] });
      } else {
        await downloadReportsExport(apiBase, token, {
          scope: "filter",
          q: debouncedQ || undefined,
          ...(statusFilter ? { status: statusFilter } : {}),
        });
      }
    } catch (e) {
      setExportError(e instanceof Error ? e.message : "Export failed.");
    }
  }, [apiBase, token, debouncedQ, statusFilter, selectedIds]);

  const patchRow = useCallback(
    async (id: string, status: "pending" | "resolved" | "dismissed") => {
      setActionError(null);
      try {
        await setReport({ id, status }).unwrap();
      } catch (e) {
        setActionError(apiErrorMessage(e, "Could not update report."));
      }
    },
    [setReport]
  );

  const columns: GridColDef<AdminReportRow>[] = useMemo(
    () => [
      {
        field: "targetType",
        headerName: "Type",
        width: 100,
        renderCell: (p) => (
          <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
            {p.row.targetType}
          </Typography>
        ),
      },
      {
        field: "targetId",
        headerName: "Target ID",
        flex: 0.45,
        minWidth: 120,
        renderCell: (p) => (
          <Typography variant="body2" color="text.secondary" noWrap title={p.row.targetId} sx={{ fontFamily: "ui-monospace, monospace", fontSize: "0.8125rem" }}>
            {p.row.targetId}
          </Typography>
        ),
      },
      {
        field: "reason",
        headerName: "Reason",
        flex: 1,
        minWidth: 180,
        renderCell: (p) => (
          <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }} title={p.row.reason}>
            {p.row.reason}
          </Typography>
        ),
      },
      {
        field: "reporter",
        headerName: "Reporter",
        flex: 0.55,
        minWidth: 160,
        sortable: false,
        valueGetter: (_v, row) => row.reporter?.email ?? "—",
        renderCell: (p) => {
          const r = p.row.reporter;
          if (!r) return <Typography variant="body2" color="text.disabled">—</Typography>;
          return (
            <Box sx={{ minWidth: 0 }}>
              <Typography variant="body2" noWrap title={r.email}>
                {r.email}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap title={r.name}>
                {r.name}
              </Typography>
            </Box>
          );
        },
      },
      {
        field: "createdAt",
        headerName: "Submitted",
        minWidth: 118,
        valueFormatter: (v) => (v ? new Date(String(v)).toLocaleString() : ""),
      },
      {
        field: "updatedAt",
        headerName: "Updated",
        minWidth: 118,
        valueFormatter: (v) => (v ? new Date(String(v)).toLocaleString() : ""),
      },
      {
        field: "status",
        headerName: "Status",
        width: 120,
        renderCell: (p) => (
          <Chip
            size="small"
            label={p.row.status}
            color={statusChipColor(p.row.status)}
            variant="filled"
            sx={{ fontWeight: 700, textTransform: "capitalize", minWidth: 88 }}
          />
        ),
      },
      {
        field: "queue",
        headerName: "Queue",
        width: 168,
        sortable: false,
        renderCell: (p) => (
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap onClick={(e) => e.stopPropagation()}>
            <Button
              size="small"
              variant="text"
              color="success"
              disabled={patchBusy || p.row.status === "resolved"}
              onClick={() => void patchRow(p.row.id, "resolved")}
              sx={{ minWidth: 0, px: 0.75, fontSize: "0.7rem" }}
            >
              Resolve
            </Button>
            <Button
              size="small"
              variant="text"
              disabled={patchBusy || p.row.status === "dismissed"}
              onClick={() => void patchRow(p.row.id, "dismissed")}
              sx={{ minWidth: 0, px: 0.75, fontSize: "0.7rem" }}
            >
              Dismiss
            </Button>
          </Stack>
        ),
      },
      {
        field: "actions",
        headerName: "Actions",
        width: 176,
        sortable: false,
        filterable: false,
        disableColumnMenu: true,
        renderCell: (params) => (
          <Stack direction="row" spacing={0.75} onClick={(e) => e.stopPropagation()} sx={{ py: 0.25 }}>
            <Tooltip title="View">
              <IconButton size="small" aria-label="View" onClick={() => navigate(`/reports/${params.row.id}`)} sx={actionIconSx}>
                <VisibilityIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit status">
              <IconButton size="small" aria-label="Edit" onClick={() => navigate(`/reports/${params.row.id}/edit`)} sx={actionIconSx}>
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
    [navigate, patchBusy, patchRow]
  );

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Reports
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Search, filter by status, sort columns, export CSV (current filter or selected rows), and manage flags with view, edit,
        quick resolve or dismiss, and delete. Row double-click opens the detail view.
      </Typography>

      {listError && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setListError(null)}>
          {listError}{" "}
          <Button size="small" onClick={() => void refetch()}>
            Retry
          </Button>
        </Alert>
      )}
      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
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
          placeholder="Reason, target id, type, reporter"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          sx={{ minWidth: 220, flex: 1 }}
        />
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 200 } }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="dismissed">Dismissed</MenuItem>
          </Select>
        </FormControl>
        <Tooltip
          title={
            selectedIds.length > 0
              ? `Download ${selectedIds.length} selected reports as CSV`
              : "Download reports matching the current search and status (server limit)"
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
          <Button variant="contained" color="error" size="small" startIcon={<DeleteOutlineIcon />} onClick={() => setBulkDeleteOpen(true)}>
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
            onRowDoubleClick={(p) => navigate(`/reports/${p.row.id}`)}
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

      <DeleteReportDialog
        open={Boolean(deleteId)}
        id={deleteId}
        onClose={() => setDeleteId(null)}
        onDeleted={(removedId) => {
          setRowSelectionModel((prev) => prev.filter((rid) => String(rid) !== removedId));
          void refetch();
        }}
      />
      <BulkDeleteReportsDialog
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
            setBulkFeedback(`Removed ${deleted} report(s).`);
          } else {
            setBulkFeedback("No reports were removed.");
          }
        }}
      />
    </Box>
  );
}
