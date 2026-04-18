import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from "@mui/material";
import { useAdminCategoryDetailQuery, useDeleteAdminCategoryMutation } from "@/store/baseApi";
import { apiErrorMessage } from "./apiErrorMessage";

export function DeleteCategoryDialog({
  open,
  id,
  onClose,
  onDeleted,
}: {
  open: boolean;
  id: string | null;
  onClose: () => void;
  onDeleted: (deletedId: string) => void;
}) {
  const { data, isFetching } = useAdminCategoryDetailQuery(id ?? "", { skip: !open || !id });
  const [remove, { isLoading }] = useDeleteAdminCategoryMutation();
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    if (open) setErr(null);
  }, [open]);

  const confirm = async () => {
    if (!id) return;
    setErr(null);
    try {
      await remove(id).unwrap();
      onDeleted(id);
      onClose();
    } catch (e) {
      setErr(apiErrorMessage(e, "Delete failed."));
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
      <DialogTitle>Delete category?</DialogTitle>
      <DialogContent>
        {isFetching && <Typography variant="body2">Loading…</Typography>}
        {data && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Remove <strong>{data.name}</strong> ({data.slug})? This cannot be undone if the server allows deletion.
          </Typography>
        )}
        {data && (data.postCount > 0 || data.childCount > 0) && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            {data.childCount > 0 && `This category has ${data.childCount} subcategories. `}
            {data.postCount > 0 && `${data.postCount} post(s) reference this category. `}
            The server will reject the delete until those are cleared.
          </Alert>
        )}
        {err && (
          <Alert severity="error" sx={{ mt: 1 }}>
            {err}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={isLoading}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={() => void confirm()} disabled={isLoading || !id}>
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
