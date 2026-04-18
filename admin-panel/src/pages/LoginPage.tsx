import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Alert, Box, Button, Container, Paper, TextField, Typography } from "@mui/material";
import { useLoginMutation } from "@/store/baseApi";
import { useAppDispatch } from "@/store/hooks";
import { setCredentials } from "@/store/authSlice";

export function LoginPage() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [login, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      const res = await login({ email, password }).unwrap();
      if (res.user.role !== "admin") {
        setError("This account is not an administrator.");
        return;
      }
      dispatch(setCredentials({ accessToken: res.accessToken, user: res.user }));
      navigate("/dashboard");
    } catch {
      setError("Invalid credentials.");
    }
  }

  return (
    <Container
      maxWidth="sm"
      sx={{
        px: { xs: 2, sm: 3 },
        py: { xs: 4, sm: 6, md: 8 },
        minHeight: "100vh",
        bgcolor: "background.default",
        display: "flex",
        alignItems: "center",
      }}
    >
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 2.5, sm: 3, md: 4 },
          borderRadius: 2,
          boxShadow: "0 1px 3px rgba(17, 24, 39, 0.06)",
          width: "100%",
        }}
      >
        <Typography variant="h5" gutterBottom sx={{ fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
          Admin sign in
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Lightweight moderation console. Uses the same API as the public site.
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Box component="form" onSubmit={(e) => void onSubmit(e)} sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField label="Email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required fullWidth />
          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
          />
          <Button type="submit" variant="contained" disabled={isLoading}>
            {isLoading ? "Signing in…" : "Sign in"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
