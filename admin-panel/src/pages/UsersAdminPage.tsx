import { useState } from "react";
import { Box, Button, Chip, Paper, Table, TableBody, TableCell, TableHead, TableRow, TextField, Typography } from "@mui/material";
import { useAdminUsersQuery, useDeleteUserMutation, useSetUserRoleMutation } from "@/store/baseApi";
import { useAppSelector } from "@/store/hooks";

export function UsersAdminPage() {
  const me = useAppSelector((s) => s.auth.user);
  const [page, setPage] = useState(1);
  const [q, setQ] = useState("");
  const { data, isFetching } = useAdminUsersQuery({ page, q: q || undefined });
  const [setRole] = useSetUserRoleMutation();
  const [remove] = useDeleteUserMutation();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Users
      </Typography>
      <TextField
        size="small"
        label="Search email"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        sx={{ mb: 2 }}
      />
      <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Email</TableCell>
              <TableCell>Name</TableCell>
              <TableCell>Role</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data?.items.map((u) => (
              <TableRow key={u.id}>
                <TableCell>
                  <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary" }}>
                    {u.email}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">
                    {u.name}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip
                    size="small"
                    label={u.role}
                    color={u.role === "admin" ? "error" : "success"}
                    variant="filled"
                    sx={{ fontWeight: 700, textTransform: "capitalize", minWidth: 72 }}
                  />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    size="small"
                    disabled={u.id === me?.id}
                    onClick={() => void setRole({ id: u.id, role: u.role === "admin" ? "user" : "admin" })}
                  >
                    Toggle role
                  </Button>
                  <Button
                    variant="outlined"
                    size="small"
                    color="error"
                    disabled={u.id === me?.id}
                    sx={{ ml: 1 }}
                    onClick={() => {
                      if (window.confirm("Delete user and their posts?")) void remove(u.id);
                    }}
                  >
                    Delete
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
