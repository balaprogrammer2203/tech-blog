import { useCallback, useEffect, useState } from "react";
import { Alert, Box, FormControlLabel, Paper, Stack, Switch, Typography } from "@mui/material";
import { adminLayout } from "@/theme/adminTheme";

const STORAGE_KEY = "tech-blog-admin-settings";

type AdminUiSettings = {
  confirmDestructive: boolean;
  compactTables: boolean;
};

const defaultSettings: AdminUiSettings = {
  confirmDestructive: true,
  compactTables: false,
};

function loadSettings(): AdminUiSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...defaultSettings };
    const parsed = JSON.parse(raw) as Partial<AdminUiSettings>;
    return { ...defaultSettings, ...parsed };
  } catch {
    return { ...defaultSettings };
  }
}

function saveSettings(s: AdminUiSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export function AccountSettingsPage() {
  const [settings, setSettings] = useState<AdminUiSettings>(() => loadSettings());
  const [saved, setSaved] = useState(false);

  const patch = useCallback((partial: Partial<AdminUiSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveSettings(next);
      return next;
    });
    setSaved(true);
  }, []);

  useEffect(() => {
    if (!saved) return;
    const id = window.setTimeout(() => setSaved(false), 2000);
    return () => window.clearTimeout(id);
  }, [saved]);

  return (
    <Box sx={{ minWidth: 0 }}>
      <Typography variant="h5" gutterBottom sx={{ fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }}>
        Settings
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Preferences for this browser only. They are not synced to the server.
      </Typography>

      {saved && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSaved(false)}>
          Settings saved locally.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, maxWidth: 520, borderRadius: 2, borderColor: adminLayout.border }}>
        <Stack spacing={1}>
          <FormControlLabel
            control={
              <Switch
                checked={settings.confirmDestructive}
                onChange={(_, v) => patch({ confirmDestructive: v })}
                color="primary"
              />
            }
            label="Confirm before destructive actions"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4.5, mt: -0.5 }}>
            When supported, bulk delete and similar actions may ask for confirmation first.
          </Typography>

          <FormControlLabel
            sx={{ mt: 1 }}
            control={<Switch checked={settings.compactTables} onChange={(_, v) => patch({ compactTables: v })} color="primary" />}
            label="Prefer compact table density"
          />
          <Typography variant="caption" color="text.secondary" sx={{ display: "block", ml: 4.5, mt: -0.5 }}>
            Reserved for future list views; stored for when the UI reads this flag.
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
}
