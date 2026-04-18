import { useEffect, useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { setUser } from "@/store/authSlice";
import { useUpdateMeMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { adminLayout } from "@/theme/adminTheme";

export function AccountProfilePage() {
  const dispatch = useAppDispatch();
  const authUser = useAppSelector((s) => s.auth.user);
  const [name, setName] = useState(authUser?.name ?? "");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [updateMe, { isLoading }] = useUpdateMeMutation();

  useEffect(() => {
    if (authUser?.name) setName(authUser.name);
  }, [authUser?.name]);

  const submit = async () => {
    setError(null);
    setSuccess(false);
    try {
      const res = await updateMe({ name: name.trim() }).unwrap();
      dispatch(setUser(res.user));
      setSuccess(true);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not update profile."));
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Profile
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Your display name as it appears in the admin. Email is managed separately and cannot be changed here.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Profile saved.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, borderRadius: 2, borderColor: adminLayout.border }}>
        <Stack spacing={2}>
          <TextField label="Email" value={authUser?.email ?? ""} disabled fullWidth helperText="Read only" />
          <TextField label="Role" value={authUser?.role ?? ""} disabled fullWidth />
          <TextField label="Display name" value={name} onChange={(e) => setName(e.target.value)} required fullWidth inputProps={{ maxLength: 80 }} />
          <Button variant="contained" onClick={() => void submit()} disabled={isLoading || !name.trim()}>
            Save changes
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
