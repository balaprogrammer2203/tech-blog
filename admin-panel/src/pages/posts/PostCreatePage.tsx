import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PostEditorForm } from "./PostEditorForm";

export function PostCreatePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/posts"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to posts
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        New post
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Drafts may omit category; publishing requires a leaf subcategory.
      </Typography>
      <PostEditorForm mode="create" onCancel={() => navigate("/posts")} onSaved={(id) => navigate(`/posts/${id}`)} />
    </Box>
  );
}
