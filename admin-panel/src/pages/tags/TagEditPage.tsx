import { Alert, Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useAdminTagDetailQuery } from "@/store/baseApi";
import { TagEditorForm } from "./TagEditorForm";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function TagEditPage() {
  const { tagId = "" } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const { isError, error } = useAdminTagDetailQuery(tagId, { skip: !isMongoObjectId(tagId) });

  if (!isMongoObjectId(tagId)) {
    return <Navigate to="/tags" replace />;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to={`/tags/${tagId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to tag
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Edit tag
      </Typography>
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load tag.")}
        </Alert>
      )}
      <TagEditorForm mode="edit" tagId={tagId} onCancel={() => navigate(`/tags/${tagId}`)} onSaved={() => navigate(`/tags/${tagId}`)} />
    </Box>
  );
}
