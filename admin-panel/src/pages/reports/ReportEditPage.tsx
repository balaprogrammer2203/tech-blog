import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAdminReportDetailQuery, useSetReportStatusMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function ReportEditPage() {
  const { reportId = "" } = useParams<{ reportId: string }>();
  const navigate = useNavigate();
  const { data, isFetching, isError, error } = useAdminReportDetailQuery(reportId, {
    skip: !isMongoObjectId(reportId),
  });
  const [setReportStatus, { isLoading }] = useSetReportStatusMutation();
  const [status, setStatusLocal] = useState<"pending" | "resolved" | "dismissed">("pending");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.status) setStatusLocal(data.status as "pending" | "resolved" | "dismissed");
  }, [data?.status]);

  if (!isMongoObjectId(reportId)) {
    return <Navigate to="/reports" replace />;
  }

  async function handleSave() {
    if (!data) return;
    setFormError(null);
    try {
      await setReportStatus({ id: reportId, status }).unwrap();
      navigate(`/reports/${reportId}`);
    } catch (e) {
      setFormError(apiErrorMessage(e, "Update failed."));
    }
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to={`/reports/${reportId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to report
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Edit report status
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Set moderation outcome. Pending means the report is still in the queue.
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load report.")}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, borderRadius: 2, width: "100%" }}>
          <Typography variant="body2" sx={{ mb: 2 }} color="text.secondary">
            Target: <strong>{data.targetType}</strong> · {data.targetId}
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }} noWrap title={data.reason}>
            {data.reason.length > 120 ? `${data.reason.slice(0, 120)}…` : data.reason}
          </Typography>
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={status}
              onChange={(e) => setStatusLocal(e.target.value as "pending" | "resolved" | "dismissed")}
            >
              <MenuItem value="pending">Pending</MenuItem>
              <MenuItem value="resolved">Resolved</MenuItem>
              <MenuItem value="dismissed">Dismissed</MenuItem>
            </Select>
          </FormControl>
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button component={RouterLink} to={`/reports/${reportId}`} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={isLoading || status === data.status}
              sx={{ width: { xs: "100%", sm: "auto" } }}
            >
              {isLoading ? "Saving…" : "Save"}
            </Button>
          </Stack>
        </Paper>
      )}
    </Box>
  );
}
