import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { TagEditorForm } from "./TagEditorForm";

export function TagCreatePage() {
  const navigate = useNavigate();

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/tags"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to tags
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        New tag
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Tags are shared across posts. Create labels here, then attach up to five per post from the post editor.
      </Typography>
      <TagEditorForm mode="create" onCancel={() => navigate("/tags")} onSaved={(newId) => navigate(`/tags/${newId}`)} />
    </Box>
  );
}
