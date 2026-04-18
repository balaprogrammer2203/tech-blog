import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useAdminUserDetailQuery } from "@/store/baseApi";
import { DeleteUserDialog } from "./DeleteUserDialog";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function UserViewPage() {
  const { userId = "" } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isFetching, isError, error } = useAdminUserDetailQuery(userId, {
    skip: !isMongoObjectId(userId),
  });

  if (!isMongoObjectId(userId)) {
    return <Navigate to="/users" replace />;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/users"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to users
      </Button>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          User
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            component={RouterLink}
            to={`/users/${userId}/edit`}
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Edit role
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            disabled={data?.isSelf}
            onClick={() => setDeleteOpen(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load user.")}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, width: "100%", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Email
          </Typography>
          <Typography variant="body1" sx={{ fontWeight: 600, mb: 2 }}>
            {data.email}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1" sx={{ mb: 2 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Role
          </Typography>
          <Chip
            size="small"
            label={data.role}
            color={data.role === "admin" ? "error" : "success"}
            variant="filled"
            sx={{ fontWeight: 700, textTransform: "capitalize", mb: 2 }}
          />
          <Typography variant="caption" color="text.secondary" display="block">
            Joined {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}
          </Typography>
        </Paper>
      )}

      <DeleteUserDialog
        open={deleteOpen}
        id={userId}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          setDeleteOpen(false);
          navigate("/users");
        }}
      />
    </Box>
  );
}
