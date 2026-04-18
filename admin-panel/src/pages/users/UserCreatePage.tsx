import { useState, type FormEvent } from "react";
import {
  Alert,
  Box,
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
import { Link as RouterLink, useNavigate } from "react-router-dom";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useCreateAdminUserMutation } from "@/store/baseApi";
import { apiErrorMessage } from "../categories/apiErrorMessage";

export function UserCreatePage() {
  const navigate = useNavigate();
  const [createUser, { isLoading }] = useCreateAdminUserMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"user" | "admin">("user");
  const [formError, setFormError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFormError(null);
    if (password.length < 8) {
      setFormError("Password must be at least 8 characters.");
      return;
    }
    try {
      const res = await createUser({ email: email.trim(), password, name: name.trim(), role }).unwrap();
      navigate(`/users/${res.id}`);
    } catch (err) {
      setFormError(apiErrorMessage(err, "Could not create user."));
    }
  }

  return (
    <Box sx={{ minWidth: 0 }}>
      <Button
        component={RouterLink}
        to="/users"
        startIcon={<ArrowBackIcon />}
        sx={{ mb: 2, width: { xs: "100%", sm: "auto" } }}
      >
        Back to users
      </Button>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        New user
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Create an account with email and password. The user can sign in with these credentials. Assign <strong>Admin</strong> only
        when you trust this person with moderation access.
      </Typography>

      <Paper
        variant="outlined"
        component="form"
        onSubmit={(ev) => void handleSubmit(ev)}
        sx={{ p: { xs: 2, sm: 3 }, maxWidth: 480, width: "100%", borderRadius: 2 }}
      >
        {formError && (
          <Alert severity="error" sx={{ mb: 2 }} onClose={() => setFormError(null)}>
            {formError}
          </Alert>
        )}
        <Stack spacing={2}>
          <TextField label="Email" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} required fullWidth autoComplete="off" />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(ev) => setPassword(ev.target.value)}
            required
            fullWidth
            autoComplete="new-password"
            helperText="Minimum 8 characters (same limit as public registration)."
          />
          <TextField label="Display name" value={name} onChange={(ev) => setName(ev.target.value)} required fullWidth />
          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select label="Role" value={role} onChange={(ev) => setRole(ev.target.value as "user" | "admin")}>
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </Select>
          </FormControl>
          <Stack
            direction={{ xs: "column-reverse", sm: "row" }}
            spacing={2}
            justifyContent="flex-end"
            alignItems={{ xs: "stretch", sm: "center" }}
          >
            <Button component={RouterLink} to="/users" sx={{ width: { xs: "100%", sm: "auto" } }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isLoading} sx={{ width: { xs: "100%", sm: "auto" } }}>
              {isLoading ? "Creating…" : "Create user"}
            </Button>
          </Stack>
        </Stack>
      </Paper>
    </Box>
  );
}
