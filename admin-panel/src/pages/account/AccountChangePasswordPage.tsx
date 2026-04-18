import { useState } from "react";
import { Alert, Box, Button, Paper, Stack, TextField, Typography } from "@mui/material";
import { useChangePasswordMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";
import { adminLayout } from "@/theme/adminTheme";

export function AccountChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const submit = async () => {
    setError(null);
    setSuccess(false);
    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    try {
      await changePassword({ currentPassword, newPassword }).unwrap();
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setSuccess(true);
    } catch (e) {
      setError(apiErrorMessage(e, "Could not change password."));
    }
  };

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Change password
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        After a successful change you stay signed in. Use your new password next time you log in.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}
      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(false)}>
          Password updated.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, borderRadius: 2, borderColor: adminLayout.border }}>
        <Stack spacing={2}>
          <TextField
            label="Current password"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            autoComplete="current-password"
            fullWidth
          />
          <TextField
            label="New password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
            helperText="At least 8 characters."
          />
          <TextField
            label="Confirm new password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            fullWidth
          />
          <Button
            variant="contained"
            onClick={() => void submit()}
            disabled={isLoading || !currentPassword || !newPassword || !confirmPassword}
          >
            Update password
          </Button>
        </Stack>
      </Paper>
    </Box>
  );
}
