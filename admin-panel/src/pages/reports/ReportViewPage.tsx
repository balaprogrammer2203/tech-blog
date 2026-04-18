import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import EditIcon from "@mui/icons-material/Edit";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import HighlightOffOutlinedIcon from "@mui/icons-material/HighlightOffOutlined";
import { useAdminReportDetailQuery, useSetReportStatusMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

function statusChipColor(status: string): "warning" | "success" | "default" {
  if (status === "pending") return "warning";
  if (status === "resolved") return "success";
  return "default";
}

export function ReportViewPage() {
  const { reportId = "" } = useParams<{ reportId: string }>();
  const [actionError, setActionError] = useState<string | null>(null);

  const { data, isFetching, isError, error, refetch } = useAdminReportDetailQuery(reportId, {
    skip: !isMongoObjectId(reportId),
  });
  const [setReportStatus, { isLoading: statusBusy }] = useSetReportStatusMutation();

  if (!isMongoObjectId(reportId)) {
    return <Navigate to="/reports" replace />;
  }

  const postAdminLink = data?.targetType === "post" ? `/posts/${data.targetId}` : null;

  async function setReport(next: "pending" | "resolved" | "dismissed") {
    setActionError(null);
    try {
      await setReportStatus({ id: reportId, status: next }).unwrap();
      void refetch();
    } catch (e) {
      setActionError(apiErrorMessage(e, "Update failed."));
    }
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/reports"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to reports
      </Button>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Report
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            component={RouterLink}
            to={`/reports/${reportId}/edit`}
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Edit status
          </Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load report.")}
        </Alert>
      )}

      {actionError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setActionError(null)}>
          {actionError}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 720, width: "100%", borderRadius: 2 }}>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip size="small" label={data.status} color={statusChipColor(data.status)} variant="filled" sx={{ fontWeight: 700, textTransform: "capitalize" }} />
            <Chip size="small" variant="outlined" label={`Target: ${data.targetType}`} />
            <Chip size="small" variant="outlined" label={`ID ${data.targetId}`} />
          </Stack>

          {postAdminLink && (
            <Button component={RouterLink} to={postAdminLink} variant="text" size="small" sx={{ mb: 2, px: 0 }}>
              Open reported post in admin
            </Button>
          )}

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Reason
          </Typography>
          <Typography variant="body2" sx={{ mb: 2, whiteSpace: "pre-wrap" }}>
            {data.reason}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Reporter
          </Typography>
          {data.reporter ? (
            <Typography variant="body2" sx={{ mb: 1 }}>
              {data.reporter.name} · {data.reporter.email}
            </Typography>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              —
            </Typography>
          )}

          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Submitted {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}
            {data.updatedAt ? ` · Updated ${new Date(data.updatedAt).toLocaleString()}` : ""}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Quick status
          </Typography>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={1} flexWrap="wrap" useFlexGap>
            <Button
              variant="outlined"
              size="small"
              startIcon={<FlagOutlinedIcon />}
              disabled={statusBusy || data.status === "pending"}
              onClick={() => void setReport("pending")}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Reopen (pending)
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="success"
              startIcon={<CheckCircleOutlineIcon />}
              disabled={statusBusy || data.status === "resolved"}
              onClick={() => void setReport("resolved")}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Resolve
            </Button>
            <Button
              variant="outlined"
              size="small"
              color="inherit"
              startIcon={<HighlightOffOutlinedIcon />}
              disabled={statusBusy || data.status === "dismissed"}
              onClick={() => void setReport("dismissed")}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              Dismiss
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
