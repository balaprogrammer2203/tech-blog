import { Box, Button, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { PostEditorForm } from "./PostEditorForm";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function PostEditPage() {
  const { postId = "" } = useParams<{ postId: string }>();
  const navigate = useNavigate();

  if (!isMongoObjectId(postId)) {
    return <Navigate to="/posts" replace />;
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to={`/posts/${postId}`}
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to post
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Edit post
      </Typography>
      <PostEditorForm
        mode="edit"
        postId={postId}
        onCancel={() => navigate(`/posts/${postId}`)}
        onSaved={() => navigate(`/posts/${postId}`)}
      />
    </Box>
  );
}
