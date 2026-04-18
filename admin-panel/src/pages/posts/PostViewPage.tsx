import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useAdminPostDetailQuery } from "@/store/baseApi";
import { DeletePostDialog } from "./DeletePostDialog";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function PostViewPage() {
  const { postId = "" } = useParams<{ postId: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isFetching, isError, error } = useAdminPostDetailQuery(postId, {
    skip: !isMongoObjectId(postId),
  });

  if (!isMongoObjectId(postId)) {
    return <Navigate to="/posts" replace />;
  }

  const catLabel = data?.category ? `${data.category.parent.name} › ${data.category.name}` : "—";

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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Post
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            component={RouterLink}
            to={`/posts/${postId}/edit`}
            variant="outlined"
            startIcon={<EditIcon />}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Edit
          </Button>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={() => setDeleteOpen(true)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            Delete
          </Button>
        </Stack>
      </Stack>

      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {apiErrorMessage(error, "Could not load post.")}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, maxWidth: 900, width: "100%" }}>
          <Typography variant="h6" sx={{ mb: 1 }}>
            {data.title}
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
            <Chip size="small" label={data.status} color={data.status === "published" ? "success" : "secondary"} variant="filled" />
            <Chip size="small" variant="outlined" label={data.slug} />
            {data.author && <Chip size="small" variant="outlined" label={data.author.email} />}
            <Chip size="small" variant="outlined" label={`Category: ${catLabel}`} />
          </Stack>
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Excerpt
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {data.excerpt}
          </Typography>
          <Divider sx={{ my: 2 }} />
          <Typography variant="subtitle2" color="text.secondary" gutterBottom>
            Content
          </Typography>
          <Box
            component="pre"
            sx={{
              m: 0,
              p: 2,
              bgcolor: "action.hover",
              borderRadius: 1,
              overflow: "auto",
              fontSize: "0.8125rem",
              whiteSpace: "pre-wrap",
              wordBreak: "break-word",
            }}
          >
            {data.content}
          </Box>
          {data.tags?.length ? (
            <Typography variant="body2" sx={{ mt: 2 }} color="text.secondary">
              Tags: {data.tags.join(", ")}
            </Typography>
          ) : null}
          <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 2 }}>
            Updated {data.updatedAt ? new Date(data.updatedAt).toLocaleString() : "—"}
            {data.publishedAt ? ` · Published ${new Date(data.publishedAt).toLocaleString()}` : ""}
          </Typography>
        </Paper>
      )}

      <DeletePostDialog
        open={deleteOpen}
        id={postId}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          setDeleteOpen(false);
          navigate("/posts");
        }}
      />
    </Box>
  );
}
