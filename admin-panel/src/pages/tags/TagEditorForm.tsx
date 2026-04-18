import { useEffect, useState } from "react";
import { Alert, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAdminTagDetailQuery, useCreateAdminTagMutation, useUpdateAdminTagMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";

type Props =
  | { mode: "create"; onCancel: () => void; onSaved: (newId: string) => void }
  | { mode: "edit"; tagId: string; onCancel: () => void; onSaved: () => void };

export function TagEditorForm(props: Props) {
  const tagId = props.mode === "edit" ? props.tagId : "";
  const { data: detail, isFetching } = useAdminTagDetailQuery(tagId, { skip: props.mode !== "edit" || !tagId });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [formError, setFormError] = useState<string | null>(null);

  const [createTag, { isLoading: creating }] = useCreateAdminTagMutation();
  const [updateTag, { isLoading: updating }] = useUpdateAdminTagMutation();

  useEffect(() => {
    setFormError(null);
    if (props.mode === "create") {
      setName("");
      setSlug("");
      setDescription("");
      setSortOrder("0");
      return;
    }
    if (detail?.id === tagId) {
      setName(detail.name);
      setSlug(detail.slug);
      setDescription(detail.description ?? "");
      setSortOrder(String(detail.sortOrder ?? 0));
    }
  }, [props.mode, tagId, detail]);

  const saving = creating || updating;

  async function handleSubmit() {
    setFormError(null);
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError("Name is required.");
      return;
    }
    const so = Number.parseInt(sortOrder, 10);
    const sortOrderNum = Number.isFinite(so) ? so : 0;
    try {
      if (props.mode === "create") {
        const res = await createTag({
          name: trimmed,
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          sortOrder: sortOrderNum,
        }).unwrap();
        props.onSaved(res.id);
      } else {
        await updateTag({
          id: tagId,
          body: {
            name: trimmed,
            ...(slug.trim() ? { slug: slug.trim() } : {}),
            description: description.trim() || undefined,
            sortOrder: sortOrderNum,
          },
        }).unwrap();
        props.onSaved();
      }
    } catch (e) {
      setFormError(apiErrorMessage(e, "Save failed."));
    }
  }

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, width: "100%", borderRadius: 2 }}>
      {props.mode === "edit" && isFetching && !detail && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Loading tag…
        </Typography>
      )}
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}
      <Stack spacing={2}>
        <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth />
        <TextField
          label="Slug (optional)"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          fullWidth
          helperText="Leave blank to generate from the name."
        />
        <TextField
          label="Description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          multiline
          minRows={2}
        />
        <TextField
          label="Sort order"
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          type="number"
          fullWidth
        />
        <Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} justifyContent="flex-end">
          <Button onClick={props.onCancel} disabled={saving} sx={{ width: { xs: "100%", sm: "auto" } }}>
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => void handleSubmit()}
            disabled={saving || (props.mode === "edit" && isFetching && !detail)}
            sx={{ width: { xs: "100%", sm: "auto" } }}
          >
            {saving ? "Saving…" : "Save"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
