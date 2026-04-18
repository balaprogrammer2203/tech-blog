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
import { useAdminUserDetailQuery, useSetUserRoleMutation } from "@/store/baseApi";
import { useAppSelector } from "@/store/hooks";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function UserEditPage() {
  const { userId = "" } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const me = useAppSelector((s) => s.auth.user);
  const { data, isFetching, isError, error } = useAdminUserDetailQuery(userId, {
    skip: !isMongoObjectId(userId),
  });
  const [setRole, { isLoading }] = useSetUserRoleMutation();
  const [role, setRoleLocal] = useState<"admin" | "user">("user");
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (data?.role) setRoleLocal(data.role as "admin" | "user");
  }, [data?.role]);

  if (!isMongoObjectId(userId)) {
    return <Navigate to="/users" replace />;
  }

  const isSelf = userId === me?.id;

  async function handleSave() {
    if (!data || isSelf) return;
    setFormError(null);
    try {
      await setRole({ id: userId, role }).unwrap();
      navigate(`/users/${userId}`);
    } catch (e) {
      setFormError(apiErrorMessage(e, "Update failed."));
    }
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to={`/users/${userId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to user
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Edit role
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Change administrator access. You cannot change your own role here.
      </Typography>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load user.")}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, borderRadius: 2, width: "100%" }}>
          <Typography variant="body2" sx={{ mb: 2 }}>
            <strong>{data.email}</strong> — {data.name}
          </Typography>
          {isSelf && (
            <Alert severity="info" sx={{ mb: 2 }}>
              You cannot change your own role from this screen.
            </Alert>
          )}
          {formError && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
              {formError}
            </Alert>
          )}
          <FormControl fullWidth disabled={isSelf} sx={{ mb: 2 }}>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={role} onChange={(e) => setRoleLocal(e.target.value as "admin" | "user")}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button component={RouterLink} to={`/users/${userId}`} sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={() => void handleSave()}
              disabled={isLoading || isSelf || role === data.role}
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
