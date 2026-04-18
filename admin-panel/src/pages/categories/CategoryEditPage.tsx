import { Alert, Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CategoryEditorForm } from "./CategoryEditorForm";
import { apiErrorMessage } from "./apiErrorMessage";
import { isMongoObjectId } from "./isMongoObjectId";
import { useAdminCategoryRoots } from "./useAdminCategoryRoots";

export function CategoryEditPage() {
  const { categoryId = "" } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();
  const { roots, isFetching, isError, error, refetch } = useAdminCategoryRoots();

  if (!isMongoObjectId(categoryId)) {
    return <Navigate to="/categories" replace />;
  }

  return (
    <Box>
      <Button component={RouterLink} to={`/categories/${categoryId}`} startIcon={<ArrowBackIcon />} sx={{ mb: 2 }}>
        Back to category
      </Button>
      <Typography variant="h5" gutterBottom>
        Edit category
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Update name, slug, description, sort order, or (for subcategories) parent root. Parent options are root
        categories from the database.
      </Typography>
      {isError && (
        <Alert severity="warning" sx={{ mb: 2 }} action={<Button onClick={() => void refetch()}>Retry</Button>}>
          Could not load root categories for the parent list: {apiErrorMessage(error, "Unknown error.")}
        </Alert>
      )}
      {isFetching && roots.length === 0 && !isError && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Loading root categories…
        </Typography>
      )}
      <CategoryEditorForm
        mode="edit"
        categoryId={categoryId}
        roots={roots}
        onCancel={() => navigate(`/categories/${categoryId}`)}
        onSaved={() => navigate(`/categories/${categoryId}`)}
      />
    </Box>
  );
}
