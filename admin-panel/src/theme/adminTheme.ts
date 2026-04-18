import { createTheme } from "@mui/material/styles";

/** Dashboard reference: light grey canvas, purple primary, soft cards, dense tables. */
const canvas = "#F9FAFB";
const paper = "#FFFFFF";
const border = "#E5E7EB";
const borderStrong = "#D1D5DB";
const textPrimary = "#111827";
const textBody = "#4B5563";
/** Outlined / secondary actions: slightly darker than body (matches reference). */
const textButton = "#374151";
const textMuted = "#9CA3AF";
const headerBg = "#F3F4F6";
const headerText = "#6B7280";
const primaryBrand = "#5c5ce0";
const success = "#10B981";
const danger = "#EF4444";
const slate = "#64748B";

export const adminTheme = createTheme({
  palette: {
    mode: "light",
    primary: { main: primaryBrand, contrastText: "#FFFFFF" },
    secondary: { main: slate, contrastText: "#FFFFFF" },
    success: { main: success, contrastText: "#FFFFFF" },
    error: { main: danger, contrastText: "#FFFFFF" },
    background: { default: canvas, paper },
    text: { primary: textPrimary, secondary: textBody, disabled: textMuted },
    divider: border,
    action: { hover: "rgba(17, 24, 39, 0.04)", selected: "rgba(92, 92, 224, 0.1)" },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: ['"Inter"', "system-ui", "-apple-system", "BlinkMacSystemFont", '"Segoe UI"', "Roboto", "sans-serif"].join(","),
    h5: { fontWeight: 700, fontSize: "1.25rem", color: textPrimary, letterSpacing: "-0.02em" },
    h6: { fontWeight: 600, fontSize: "1rem", color: textPrimary },
    subtitle1: { fontWeight: 600, color: textPrimary },
    body1: { fontSize: "0.875rem", color: textBody },
    body2: { fontSize: "0.875rem", color: textBody },
    caption: { fontSize: "0.75rem", color: textMuted },
    button: { textTransform: "none", fontWeight: 600, fontSize: "0.875rem", letterSpacing: "0.01em" },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: { body: { backgroundColor: canvas } },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
        outlined: {
          borderColor: border,
          boxShadow: "0 1px 2px rgba(17, 24, 39, 0.04)",
        },
        elevation1: {
          boxShadow: "0 1px 3px rgba(17, 24, 39, 0.06), 0 1px 2px rgba(17, 24, 39, 0.04)",
        },
      },
    },
    MuiButton: {
      defaultProps: { disableElevation: true },
      styleOverrides: {
        root: {
          borderRadius: 10,
          fontWeight: 600,
          fontSize: "0.875rem",
          lineHeight: 1.25,
          boxSizing: "border-box",
          justifyContent: "center",
          textAlign: "center",
          /* Symmetric horizontal padding; icon spacing handled below (no negative start margin). */
          padding: "10px 20px",
          minHeight: 40,
          "& .MuiButton-startIcon": {
            marginLeft: 0,
            marginRight: 10,
          },
          "& .MuiButton-endIcon": {
            marginRight: 0,
            marginLeft: 10,
          },
        },
        sizeSmall: {
          padding: "8px 16px",
          minHeight: 34,
          fontSize: "0.875rem",
          borderRadius: 10,
          "& .MuiButton-startIcon": { marginRight: 8 },
          "& .MuiButton-endIcon": { marginLeft: 8 },
        },
        sizeLarge: {
          padding: "12px 24px",
          minHeight: 46,
          fontSize: "0.9375rem",
          "& .MuiButton-startIcon": { marginRight: 12 },
          "& .MuiButton-endIcon": { marginLeft: 12 },
        },
        containedPrimary: {
          boxShadow: "none",
          "&:hover": { boxShadow: "0 1px 3px rgba(92, 92, 224, 0.45)" },
        },
        outlined: {
          borderColor: borderStrong,
          color: textButton,
          backgroundColor: paper,
          "&:hover": {
            borderColor: borderStrong,
            backgroundColor: canvas,
            color: textButton,
          },
        },
        outlinedPrimary: {
          borderColor: "rgba(92, 92, 224, 0.55)",
          color: primaryBrand,
          "&:hover": {
            borderColor: primaryBrand,
            backgroundColor: "rgba(92, 92, 224, 0.06)",
            color: primaryBrand,
          },
        },
        outlinedError: {
          borderColor: "rgba(239, 68, 68, 0.45)",
          color: danger,
          "&:hover": { borderColor: danger, backgroundColor: "rgba(239, 68, 68, 0.04)" },
        },
        text: { color: textButton },
      },
    },
    MuiTextField: {
      defaultProps: { size: "small" },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          backgroundColor: paper,
          "& .MuiOutlinedInput-notchedOutline": { borderColor: borderStrong },
          "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: textMuted },
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: primaryBrand, borderWidth: "1px" },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: { root: { color: textBody, "&.Mui-focused": { color: primaryBrand } } },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: paper,
          color: textPrimary,
          boxShadow: `0 1px 0 ${border}`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: paper,
          borderRight: `1px solid ${border}`,
          boxShadow: "none",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: headerBg,
          color: headerText,
          fontWeight: 700,
          fontSize: "0.6875rem",
          letterSpacing: "0.06em",
          textTransform: "uppercase",
          borderBottom: `1px solid ${border}`,
          lineHeight: 1.2,
        },
        body: {
          fontSize: "0.875rem",
          color: textBody,
          borderBottom: `1px solid ${border}`,
        },
      },
    },
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:last-of-type .MuiTableCell-body": { borderBottom: "none" },
          "&:hover": { backgroundColor: canvas },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 700, fontSize: "0.6875rem", borderRadius: 999 },
        colorSuccess: { backgroundColor: success, color: "#FFFFFF" },
        colorSecondary: { backgroundColor: slate, color: "#FFFFFF" },
        outlined: { borderColor: borderStrong, color: textBody },
      },
    },
    MuiAlert: {
      styleOverrides: { standardInfo: { backgroundColor: "#EEF2FF", color: "#3730A3" } },
    },
  },
});

export const adminLayout = {
  canvas,
  paper,
  border,
  borderStrong,
  textPrimary,
  textBody,
  textButton,
  textMuted,
  headerBg,
  headerText,
  /** Primary brand purple (sidebar active, contained buttons). */
  primaryBrand,
  success,
  danger,
  slate,
} as const;

/** Shared MUI X DataGrid surface styles (categories and any other grids). */
export const dataGridAdminSx = {
  border: "none",
  borderRadius: 2,
  fontSize: "0.875rem",
  "& .MuiDataGrid-main": { borderRadius: 2 },
  "& .MuiDataGrid-columnHeaders": {
    backgroundColor: headerBg,
    borderBottom: `1px solid ${border}`,
    borderRadius: "8px 8px 0 0",
  },
  "& .MuiDataGrid-columnHeader": { borderBottom: "none" },
  "& .MuiDataGrid-columnHeaderTitle": {
    fontWeight: 700,
    fontSize: "0.6875rem",
    letterSpacing: "0.06em",
    textTransform: "uppercase",
    color: headerText,
  },
  "& .MuiDataGrid-cell": {
    borderBottom: `1px solid ${border}`,
    color: textBody,
    fontSize: "0.875rem",
  },
  "& .MuiDataGrid-row:hover": {
    backgroundColor: canvas,
  },
  "& .MuiDataGrid-footerContainer": {
    borderTop: `1px solid ${border}`,
    backgroundColor: paper,
    borderRadius: "0 0 8px 8px",
  },
  "& .MuiDataGrid-columnSeparator": { display: "none" },
} as const;
