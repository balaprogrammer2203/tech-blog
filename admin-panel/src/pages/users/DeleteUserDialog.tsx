import { useEffect, useState } from "react";
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useAdminUserDetailQuery, useDeleteUserMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";

export function DeleteUserDialog({
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
  const { data, isFetching } = useAdminUserDetailQuery(id ?? "", { skip: !open || !id });
  const [remove, { isLoading }] = useDeleteUserMutation();
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
      <DialogTitle>Delete user?</DialogTitle>
      <DialogContent>
        {isFetching && <Typography variant="body2">Loading…</Typography>}
        {data && (
          <Typography variant="body2" sx={{ mb: 1 }}>
            Remove <strong>{data.email}</strong> ({data.name})? Their posts and related data will be deleted.
          </Typography>
        )}
        {data?.isSelf && (
          <Alert severity="warning" sx={{ mt: 1 }}>
            You cannot delete your own account from this dialog.
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
        <Button
          color="error"
          variant="contained"
          onClick={() => void confirm()}
          disabled={isLoading || !id || data?.isSelf}
        >
          Delete
        </Button>
      </DialogActions>
    </Dialog>
  );
}
