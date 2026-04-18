import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, Typography } from "@mui/material";
import { Link as RouterLink, Navigate, useNavigate, useParams } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import { useAdminTagDetailQuery } from "@/store/baseApi";
import { DeleteTagDialog } from "./DeleteTagDialog";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { isMongoObjectId } from "../categories/isMongoObjectId";

export function TagViewPage() {
  const { tagId = "" } = useParams<{ tagId: string }>();
  const navigate = useNavigate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  const { data, isFetching, isError, error } = useAdminTagDetailQuery(tagId, {
    skip: !isMongoObjectId(tagId),
  });

  if (!isMongoObjectId(tagId)) {
    return <Navigate to="/tags" replace />;
  }

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
      <Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "stretch", sm: "center" }} sx={{ mb: 2 }}>
        <Typography variant="h5" sx={{ flexGrow: 1, fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Tag
        </Typography>
        <Stack direction={{ xs: "column", sm: "row" }} spacing={1} sx={{ width: { xs: "100%", sm: "auto" } }}>
          <Button
            component={RouterLink}
            to={`/tags/${tagId}/edit`}
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
          {apiErrorMessage(error, "Could not load tag.")}
        </Alert>
      )}

      {isFetching && !data && <Typography variant="body2">Loading…</Typography>}

      {data && (
        <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, width: "100%", borderRadius: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1" sx={{ mb: 2, fontWeight: 600 }}>
            {data.name}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Slug
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {data.slug}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Posts using tag
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {data.postCount}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Sort order
          </Typography>
          <Typography variant="body2" sx={{ mb: 2 }}>
            {data.sortOrder}
          </Typography>
          {data.description && (
            <>
              <Typography variant="body2" color="text.secondary">
                Description
              </Typography>
              <Typography variant="body2" sx={{ mb: 2 }}>
                {data.description}
              </Typography>
            </>
          )}
          <Typography variant="caption" color="text.secondary" display="block">
            Created {data.createdAt ? new Date(data.createdAt).toLocaleString() : "—"}
            {data.updatedAt ? ` · Updated ${new Date(data.updatedAt).toLocaleString()}` : ""}
          </Typography>
        </Paper>
      )}

      <DeleteTagDialog
        open={deleteOpen}
        id={tagId}
        onClose={() => setDeleteOpen(false)}
        onDeleted={() => {
          setDeleteOpen(false);
          navigate("/tags");
        }}
      />
    </Box>
  );
}
