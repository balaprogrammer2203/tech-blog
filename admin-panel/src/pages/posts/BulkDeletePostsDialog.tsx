import { useState } from "react";
import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from "@mui/material";
import { useDeletePostMutation, type AdminPostListRow } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";

export function BulkDeletePostsDialog({
  open,
  ids,
  rowsById,
  onClose,
  onFinished,
}: {
  open: boolean;
  ids: readonly string[];
  rowsById: Map<string, AdminPostListRow>;
  onClose: () => void;
  onFinished: (result: { deleted: number; errors: string[]; total: number }) => void;
}) {
  const [remove] = useDeletePostMutation();
  const [busy, setBusy] = useState(false);

  const confirm = async () => {
    setBusy(true);
    const errors: string[] = [];
    let deleted = 0;
    try {
      for (const id of ids) {
        try {
          await remove(id).unwrap();
          deleted++;
        } catch (e) {
          const row = rowsById.get(id);
          const label = row ? `${row.title} (${row.slug})` : id;
          errors.push(`${label}: ${apiErrorMessage(e, "Delete failed")}`);
        }
      }
      onFinished({ deleted, errors, total: ids.length });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onClose={busy ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Delete {ids.length} posts?</DialogTitle>
      <DialogContent>
        <Typography variant="body2" sx={{ mb: 1 }}>
          This runs one delete per post. Related comments and likes are removed with each post.
        </Typography>
        <Typography variant="caption" color="text.secondary" component="div" sx={{ maxHeight: 160, overflow: "auto" }}>
          {ids.map((id) => {
            const r = rowsById.get(id);
            return <div key={id}>{r ? `${r.title} · ${r.slug}` : id}</div>;
          })}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          Cancel
        </Button>
        <Button color="error" variant="contained" onClick={() => void confirm()} disabled={busy || ids.length === 0}>
          Delete ({ids.length})
        </Button>
      </DialogActions>
    </Dialog>
  );
}
