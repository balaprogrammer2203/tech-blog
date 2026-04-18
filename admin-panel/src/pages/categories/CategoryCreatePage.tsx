import { Alert, Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { CategoryEditorForm } from "./CategoryEditorForm";
import { apiErrorMessage } from "./apiErrorMessage";
import { useAdminCategoryRoots } from "./useAdminCategoryRoots";

export function CategoryCreatePage() {
  const navigate = useNavigate();
  const { roots, isFetching, isError, error, refetch } = useAdminCategoryRoots();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/categories"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to categories
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        New category
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Create a root category or a subcategory under an existing root. Published posts must use a leaf subcategory.
        Parent options are loaded from the database (root categories only).
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
        mode="create"
        roots={roots}
        onCancel={() => navigate("/categories")}
        onSaved={(newId) => navigate(`/categories/${newId}`)}
      />
    </Box>
  );
}
