import { useState } from "react";
import {
  Box,
  Button,
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
  Typography,
} from "@mui/material";
import { useAdminReportsQuery, useSetReportStatusMutation } from "@/store/baseApi";

export function ReportsAdminPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const { data, isFetching } = useAdminReportsQuery({ page, status: status || undefined });
  const [setReport] = useSetReportStatusMutation();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Reports
      </Typography>
      <FormControl size="small" sx={{ minWidth: 160, mb: 2 }}>
        <InputLabel>Status</InputLabel>
        <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <MenuItem value="">All</MenuItem>
          <MenuItem value="pending">Pending</MenuItem>
          <MenuItem value="resolved">Resolved</MenuItem>
          <MenuItem value="dismissed">Dismissed</MenuItem>
        </Select>
      </FormControl>
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Target</TableCell>
              <TableCell>Reason</TableCell>
              <TableCell>Reporter</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((r) => (
              <TableRow key={r.id}>
                <TableCell>
                  {r.targetType} / {r.targetId}
                </TableCell>
                <TableCell sx={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{r.reason}</TableCell>
                <TableCell>{r.reporter?.email ?? "—"}</TableCell>
                <TableCell align="right">
                  <Button variant="outlined" size="small" onClick={() => void setReport({ id: r.id, status: "resolved" })}>
                    Resolve
                  </Button>
                  <Button variant="outlined" size="small" sx={{ ml: 1 }} onClick={() => void setReport({ id: r.id, status: "dismissed" })}>
                    Dismiss
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
      {isFetching && <Typography sx={{ mt: 1 }}>Loading…</Typography>}
      {data && data.totalPages > 1 && (
        <Box sx={{ mt: 2, display: "flex", gap: 1 }}>
          <Button variant="outlined" disabled={page <= 1} onClick={() => setPage((x) => Math.max(1, x - 1))}>
            Prev
          </Button>
          <Button variant="outlined" disabled={page >= data.totalPages} onClick={() => setPage((x) => x + 1)}>
            Next
          </Button>
        </Box>
      )}
    </Box>
  );
}
