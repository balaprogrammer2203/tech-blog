import { useState } from "react";
import {
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
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
    <Box sx={{ minWidth: 0 }}>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "flex-start" }} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" }, fontWeight: 700, flex: 1 }}>
          Reports
        </Typography>
        <FormControl size="small" sx={{ minWidth: { xs: "100%", sm: 180 }, maxWidth: { sm: 240 } }}>
          <InputLabel>Status</InputLabel>
          <Select label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
            <MenuItem value="">All</MenuItem>
            <MenuItem value="pending">Pending</MenuItem>
            <MenuItem value="resolved">Resolved</MenuItem>
            <MenuItem value="dismissed">Dismissed</MenuItem>
          </Select>
        </FormControl>
      </Stack>
      <Paper variant="outlined" sx={{ borderRadius: 2, bgcolor: "background.paper" }}>
        <TableContainer sx={{ overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
          <Table size="small" sx={{ minWidth: 560 }}>
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
                  <TableCell sx={{ whiteSpace: "nowrap" }}>
                    {r.targetType} / {r.targetId}
                  </TableCell>
                  <TableCell sx={{ maxWidth: 280, whiteSpace: "pre-wrap" }}>{r.reason}</TableCell>
                  <TableCell>{r.reporter?.email ?? "—"}</TableCell>
                  <TableCell align="right">
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      alignItems={{ xs: "stretch", sm: "flex-end" }}
                      justifyContent="flex-end"
                      sx={{ py: { xs: 0.5, sm: 0 } }}
                    >
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => void setReport({ id: r.id, status: "resolved" })}
                        sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 88 } }}
                      >
                        Resolve
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => void setReport({ id: r.id, status: "dismissed" })}
                        sx={{ width: { xs: "100%", sm: "auto" }, minWidth: { sm: 88 } }}
                      >
                        Dismiss
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
      {isFetching && <Typography sx={{ mt: 1 }}>Loading…</Typography>}
      {data && data.totalPages > 1 && (
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ mt: 2 }} useFlexGap>
          <Button
            variant="outlined"
            disabled={page <= 1}
            onClick={() => setPage((x) => Math.max(1, x - 1))}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Prev
          </Button>
          <Button
            variant="outlined"
            disabled={page >= data.totalPages}
            onClick={() => setPage((x) => x + 1)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Next
          </Button>
        </Stack>
      )}
    </Box>
  );
}
