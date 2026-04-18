import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useAdminCategoryDetailQuery } from "@/store/baseApi";
import { CategoryDetailFields } from "./CategoryDetailFields";
import { DeleteCategoryDialog } from "./DeleteCategoryDialog";
import { apiErrorMessage } from "./apiErrorMessage";
import { isMongoObjectId } from "./isMongoObjectId";

export function CategoryViewPage() {
  const { categoryId = "" } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isFetching, isError, error } = useAdminCategoryDetailQuery(categoryId, {
    skip: !isMongoObjectId(categoryId),
  });

  if (!isMongoObjectId(categoryId)) {
    return <Navigate to="/categories" replace />;
  }

  return (
    <Box>
      <Button component={RouterLink} to="/categories" startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to categories
      </Button>
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1 }}>
          Category
        </Typography>
        <Stack direction="row" spacing={1}>
          <Button component={RouterLink} to={`/categories/${categoryId}/edit`} variant="outlined" startIcon={<EditIcon />}>
            Edit
          </Button>
          <Button color="error" variant="outlined" startIcon={<DeleteOutlineIcon />} onClick={() => setDeleteOpen(true)}>
            Delete
          </Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load category.")}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: 3, maxWidth: 640 }}>
          <CategoryDetailFields d={data} />
        </Paper>
      )}

      <DeleteCategoryDialog
        open={deleteOpen}
        id={categoryId}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          setDeleteOpen(false);
          navigate("/categories");
        }}
      />
    </Box>
  );
}
