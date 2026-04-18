import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import {
  useAdminCategoryDetailQuery,
  useCreateAdminCategoryMutation,
  useUpdateAdminCategoryMutation,
} from "@/store/baseApi";
import type { AdminCategoryRow, CategoryRoot } from "@/types/categories";
import { apiErrorMessage } from "./apiErrorMessage";
import { isMongoObjectId } from "./isMongoObjectId";

type Props =
  | {
      mode: "create";
      roots: CategoryRoot[];
      onCancel: () => void;
      onSaved: (newId: string) => void;
    }
  | {
      mode: "edit";
      categoryId: string;
      roots: CategoryRoot[];
      initialRow?: AdminCategoryRow | null;
      onCancel: () => void;
      onSaved: () => void;
    };

export function CategoryEditorForm(props: Props) {
  const roots = props.roots;
  const categoryId = props.mode === "edit" ? props.categoryId : "";
  const initialRow = props.mode === "edit" ? (props.initialRow ?? null) : null;

  const { data: detail, isFetching } = useAdminCategoryDetailQuery(categoryId, {
    skip: props.mode !== "edit" || !categoryId,
  });

  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [sortOrder, setSortOrder] = useState("0");
  const [createLevel, setCreateLevel] = useState<"root" | "child">("root");
  const [parentId, setParentId] = useState("");
  const [editParentId, setEditParentId] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const [createCat, { isLoading: creating }] = useCreateAdminCategoryMutation();
  const [updateCat, { isLoading: updating }] = useUpdateAdminCategoryMutation();

  function editParentIdFromDetail(d: typeof detail): string {
    if (!d) return "";
    const fromPopulated = d.parent?.id;
    if (fromPopulated && isMongoObjectId(fromPopulated)) return fromPopulated;
    const raw = d.parentId ?? "";
    if (raw && isMongoObjectId(raw)) return raw;
    return "";
  }

  useEffect(() => {
    setFormError(null);
    if (props.mode === "create") {
      setName("");
      setSlug("");
      setDescription("");
      setSortOrder("0");
      setCreateLevel("root");
      setParentId("");
      setEditParentId("");
      return;
    }
    if (detail && detail.id === categoryId) {
      setName(detail.name);
      setSlug(detail.slug);
      setDescription(detail.description ?? "");
      setSortOrder(String(detail.sortOrder ?? 0));
      setEditParentId(editParentIdFromDetail(detail));
    } else if (initialRow && initialRow.id === categoryId) {
      setName(initialRow.name);
      setSlug(initialRow.slug);
      setDescription(initialRow.description ?? "");
      setSortOrder(String(initialRow.sortOrder ?? 0));
      const pid = initialRow.parentId ?? "";
      setEditParentId(pid && isMongoObjectId(pid) ? pid : "");
    }
  }, [props.mode, categoryId, detail, initialRow]);

  const saving = creating || updating;
  const isChild =
    props.mode === "create" ? createLevel === "child" : (detail?.level ?? initialRow?.level) === 1;
  const loadingPrefill = props.mode === "edit" && isFetching && !detail && !initialRow;

  const handleSubmit = async () => {
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
        if (createLevel === "child" && !parentId) {
          setFormError("Choose a root parent for a subcategory.");
          return;
        }
        const res = await createCat({
          name: trimmed,
          ...(slug.trim() ? { slug: slug.trim() } : {}),
          ...(createLevel === "child" && parentId ? { parentId } : {}),
          ...(description.trim() ? { description: description.trim() } : {}),
          sortOrder: sortOrderNum,
        }).unwrap();
        props.onSaved(res.id);
      } else {
        const body: Parameters<typeof updateCat>[0]["body"] = {
          name: trimmed,
          sortOrder: sortOrderNum,
          description: description.trim() || undefined,
        };
        const s = slug.trim();
        if (s && s !== detail?.slug) body.slug = s;
        if (isChild && editParentId) body.parentId = editParentId;
        await updateCat({ id: categoryId, body }).unwrap();
        props.onSaved();
      }
    } catch (e) {
      setFormError(apiErrorMessage(e, "Save failed."));
    }
  };

  const title = props.mode === "create" ? "New category" : "Edit category";

  return (
    <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 560, width: "100%" }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      {formError && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
          {formError}
        </Alert>
      )}
      {loadingPrefill ? (
        <Typography variant="body2">Loading…</Typography>
      ) : (
        <Stack spacing={2}>
          {props.mode === "create" && (
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select
                label="Type"
                value={createLevel}
                onChange={(e) => setCreateLevel(e.target.value as "root" | "child")}
              >
                <MenuItem value="root">Root category</MenuItem>
                <MenuItem value="child">Subcategory (under a root)</MenuItem>
              </Select>
            </FormControl>
          )}
          {props.mode === "create" && createLevel === "child" && (
            <>
              {roots.length === 0 ? (
                <Alert severity="info">
                  No root categories exist yet. Create a <strong>root</strong> category first, then add a subcategory
                  under it.
                </Alert>
              ) : (
                <FormControl fullWidth size="small">
                  <InputLabel>Parent root (from database)</InputLabel>
                  <Select label="Parent root (from database)" value={parentId} onChange={(e) => setParentId(e.target.value)}>
                    <MenuItem value="">
                      <em>Select root…</em>
                    </MenuItem>
                    {roots.map((r) => (
                      <MenuItem key={r.id} value={r.id}>
                        {r.name} ({r.slug})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
            </>
          )}
          {props.mode === "edit" && (
            <FormControl fullWidth size="small">
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={isChild ? "child" : "root"} disabled>
                <MenuItem value="root">Root category</MenuItem>
                <MenuItem value="child">Subcategory (under a root)</MenuItem>
              </Select>
            </FormControl>
          )}
          {props.mode === "edit" && isChild && (
            <FormControl fullWidth size="small" disabled={roots.length === 0 && !detail?.parent}>
              <InputLabel>Parent root (from database)</InputLabel>
              <Select label="Parent root (from database)" value={editParentId} onChange={(e) => setEditParentId(e.target.value)}>
                {editParentId &&
                  detail?.parent?.id === editParentId &&
                  !roots.some((r) => r.id === editParentId) && (
                    <MenuItem value={detail.parent.id}>
                      {detail.parent.name} ({detail.parent.slug})
                    </MenuItem>
                  )}
                {roots.map((r) => (
                  <MenuItem key={r.id} value={r.id}>
                    {r.name} ({r.slug})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          )}
          <TextField label="Name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth size="small" />
          <TextField
            label="Slug (optional)"
            value={slug}
            onChange={(e) => setSlug(e.target.value)}
            helperText="Leave blank to auto-generate on create."
            fullWidth
            size="small"
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={2}
            fullWidth
            size="small"
          />
          <TextField
            label="Sort order"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            type="number"
            fullWidth
            size="small"
          />
        </Stack>
      )}
      <Stack
        direction={{ xs: "column-reverse", sm: "row" }}
        spacing={1}
        justifyContent="flex-end"
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mt: 3 }}
      >
        <Button onClick={props.onCancel} disabled={saving} sx={{ width: { xs: "100%", sm: "auto" } }}>
          Cancel
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving || loadingPrefill}
          sx={{ width: { xs: "100%", sm: "auto" } }}
        >
          Save
        </Button>
      </Stack>
    </Paper>
  );
}
