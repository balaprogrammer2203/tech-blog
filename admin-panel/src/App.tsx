import { useCallback, useEffect, useRef, useState, type ReactElement, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Avatar,
  Badge,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  InputAdornment,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  TextField,
  Toolbar,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import SearchIcon from "@mui/icons-material/Search";
import LightModeOutlinedIcon from "@mui/icons-material/LightModeOutlined";
import FullscreenIcon from "@mui/icons-material/Fullscreen";
import FullscreenExitIcon from "@mui/icons-material/FullscreenExit";
import NotificationsNoneOutlinedIcon from "@mui/icons-material/NotificationsNoneOutlined";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import RefreshOutlinedIcon from "@mui/icons-material/RefreshOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
import LocalOfferOutlinedIcon from "@mui/icons-material/LocalOfferOutlined";
import PeopleOutlineIcon from "@mui/icons-material/PeopleOutline";
import FlagOutlinedIcon from "@mui/icons-material/FlagOutlined";
import { SessionBootstrap } from "@/components/SessionBootstrap";
import { LoginPage } from "@/pages/LoginPage";
import { PostsAdminPage } from "@/pages/posts/PostsAdminPage";
import { PostCreatePage } from "@/pages/posts/PostCreatePage";
import { PostEditPage } from "@/pages/posts/PostEditPage";
import { PostViewPage } from "@/pages/posts/PostViewPage";
import { UsersAdminPage } from "@/pages/users/UsersAdminPage";
import { UserViewPage } from "@/pages/users/UserViewPage";
import { UserEditPage } from "@/pages/users/UserEditPage";
import { UserCreatePage } from "@/pages/users/UserCreatePage";
import { ReportsAdminPage } from "@/pages/ReportsAdminPage";
import { ReportEditPage } from "@/pages/reports/ReportEditPage";
import { ReportViewPage } from "@/pages/reports/ReportViewPage";
import { CategoriesAdminPage } from "@/pages/CategoriesAdminPage";
import { TagsAdminPage } from "@/pages/TagsAdminPage";
import { TagCreatePage } from "@/pages/tags/TagCreatePage";
import { TagEditPage } from "@/pages/tags/TagEditPage";
import { TagViewPage } from "@/pages/tags/TagViewPage";
import { CategoryCreatePage } from "@/pages/categories/CategoryCreatePage";
import { CategoryEditPage } from "@/pages/categories/CategoryEditPage";
import { CategoryViewPage } from "@/pages/categories/CategoryViewPage";
import { DashboardAdminPage } from "@/pages/DashboardAdminPage";
import { AccountProfilePage } from "@/pages/account/AccountProfilePage";
import { AccountSettingsPage } from "@/pages/account/AccountSettingsPage";
import { AccountChangePasswordPage } from "@/pages/account/AccountChangePasswordPage";
import PersonOutlineIcon from "@mui/icons-material/PersonOutline";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { useAppSelector } from "@/store/hooks";
import { useDispatch } from "react-redux";
import { useAdminDashboardQuery, useLogoutMutation, baseApi } from "@/store/baseApi";
import { adminLayout, adminMainContentInnerSx } from "@/theme/adminTheme";

const drawerWidthExpanded = 220;
const drawerWidthCollapsed = 72;

function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.up("md"));
  const dispatch = useDispatch();
  const user = useAppSelector((s) => s.auth.user);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileAnchor, setProfileAnchor] = useState<null | HTMLElement>(null);
  const [headerSearch, setHeaderSearch] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const headerSearchRef = useRef<HTMLInputElement>(null);
  const [logout] = useLogoutMutation();
  const { data: dashboard } = useAdminDashboardQuery();

  const drawerWidth = isMd ? (sidebarCollapsed ? drawerWidthCollapsed : drawerWidthExpanded) : drawerWidthExpanded;

  useEffect(() => {
    const onFs = () => setFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", onFs);
    return () => document.removeEventListener("fullscreenchange", onFs);
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        headerSearchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) void document.documentElement.requestFullscreen().catch(() => {});
    else void document.exitFullscreen().catch(() => {});
  }, []);

  const invalidateCaches = useCallback(() => {
    dispatch(
      baseApi.util.invalidateTags([
        "AdminDashboard",
        "AdminPosts",
        "AdminUsers",
        "AdminReports",
        "Categories",
        "AdminCategories",
        "AdminTags",
        "PublicTags",
      ])
    );
  }, [dispatch]);

  const submitHeaderSearch = useCallback(() => {
    const q = headerSearch.trim();
    if (q) navigate(`/posts?q=${encodeURIComponent(q)}`);
    else navigate("/posts");
  }, [headerSearch, navigate]);

  const brandInitial = (user?.name?.[0] ?? user?.email?.[0] ?? "T").toUpperCase();

  const items: { label: string; path: string; icon: ReactElement }[] = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: "Posts", path: "/posts", icon: <ArticleOutlinedIcon fontSize="small" /> },
    { label: "Categories", path: "/categories", icon: <CategoryOutlinedIcon fontSize="small" /> },
    { label: "Tags", path: "/tags", icon: <LocalOfferOutlinedIcon fontSize="small" /> },
    { label: "Users", path: "/users", icon: <PeopleOutlineIcon fontSize="small" /> },
    { label: "Reports", path: "/reports", icon: <FlagOutlinedIcon fontSize="small" /> },
  ];

  const drawer = (
    <Box sx={{ pt: 1 }}>
      <Toolbar
        sx={{
          px: sidebarCollapsed && isMd ? 1 : 2,
          minHeight: 56,
          flexDirection: sidebarCollapsed && isMd ? "column" : "row",
          justifyContent: sidebarCollapsed && isMd ? "center" : "flex-start",
          alignItems: sidebarCollapsed && isMd ? "center" : "stretch",
          gap: sidebarCollapsed && isMd ? 0.5 : 0,
        }}
      >
        {!(sidebarCollapsed && isMd) && (
          <>
            <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, letterSpacing: "-0.02em", color: "text.primary" }}>
              Tech Blog
            </Typography>
            <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.disabled", fontWeight: 500 }}>
              Admin
            </Typography>
          </>
        )}
        {sidebarCollapsed && isMd && (
          <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: "0.875rem", fontWeight: 700 }}>{brandInitial}</Avatar>
        )}
      </Toolbar>
      <Divider sx={{ borderColor: "divider" }} />
      <List dense sx={{ px: 1, py: 1.5 }}>
        {items.map((it) => {
          const selected =
            it.path === "/categories"
              ? location.pathname === "/categories" || location.pathname.startsWith("/categories/")
              : it.path === "/tags"
                ? location.pathname === "/tags" || location.pathname.startsWith("/tags/")
                : it.path === "/posts"
                  ? location.pathname === "/posts" || location.pathname.startsWith("/posts/")
                  : it.path === "/users"
                    ? location.pathname === "/users" || location.pathname.startsWith("/users/")
                    : it.path === "/reports"
                      ? location.pathname === "/reports" || location.pathname.startsWith("/reports/")
                      : location.pathname === it.path;
          const btn = (
            <ListItemButton
              key={it.path}
              selected={selected}
              onClick={() => {
                navigate(it.path);
                setMobileOpen(false);
              }}
              sx={{
                borderRadius: 2,
                mb: 0.25,
                py: 1,
                justifyContent: sidebarCollapsed && isMd ? "center" : "flex-start",
                px: sidebarCollapsed && isMd ? 1 : 2,
                "& .MuiListItemIcon-root": {
                  minWidth: sidebarCollapsed && isMd ? 0 : 36,
                  color: selected ? "primary.contrastText" : "text.secondary",
                },
                "& .MuiListItemText-primary": {
                  fontSize: "0.875rem",
                  fontWeight: selected ? 600 : 500,
                  color: selected ? "primary.contrastText" : "text.secondary",
                },
                "&.Mui-selected": {
                  backgroundColor: "primary.main",
                  "&:hover": { backgroundColor: "primary.dark" },
                },
                "&:hover:not(.Mui-selected)": {
                  backgroundColor: "action.hover",
                },
              }}
            >
              <ListItemIcon sx={{ justifyContent: "center" }}>{it.icon}</ListItemIcon>
              {!(sidebarCollapsed && isMd) && <ListItemText primary={it.label} />}
            </ListItemButton>
          );
          return sidebarCollapsed && isMd ? (
            <Tooltip key={it.path} title={it.label} placement="right">
              {btn}
            </Tooltip>
          ) : (
            btn
          );
        })}
      </List>
    </Box>
  );

  const headerIconBtnSx = {
    border: `1px solid ${adminLayout.borderStrong}`,
    borderRadius: 1.5,
    bgcolor: "background.paper",
    color: "text.secondary",
    "&:hover": { bgcolor: adminLayout.canvas, color: "text.primary" },
  } as const;

  const pendingCount = dashboard?.reports.pending ?? 0;

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1, borderBottom: `1px solid ${adminLayout.border}` }}>
        <Toolbar sx={{ pt: "env(safe-area-inset-top, 0px)", gap: 1.5, minHeight: 64, px: { xs: 1, sm: 2 } }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexShrink: 0 }}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: "primary.main", fontSize: "0.9375rem", fontWeight: 800 }}>{brandInitial}</Avatar>
            <Typography
              variant="subtitle1"
              noWrap
              sx={{ fontWeight: 800, letterSpacing: "-0.03em", color: "primary.main", display: { xs: "none", sm: "block" } }}
            >
              Tech Blog
            </Typography>
            <Tooltip title={isMd ? (sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar") : "Open menu"}>
              <IconButton
                edge="start"
                onClick={() => {
                  if (isMd) setSidebarCollapsed((c) => !c);
                  else setMobileOpen(true);
                }}
                sx={{ color: "text.secondary" }}
                aria-label={isMd ? "toggle sidebar" : "open menu"}
              >
                <MenuIcon />
              </IconButton>
            </Tooltip>
          </Box>

          <TextField
            inputRef={headerSearchRef}
            placeholder="Search posts… (Ctrl+K)"
            value={headerSearch}
            onChange={(e) => setHeaderSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") submitHeaderSearch();
            }}
            size="small"
            sx={{
              flex: 1,
              maxWidth: { xs: 1, sm: 360, md: 520 },
              mx: "auto",
              display: { xs: "none", sm: "block" },
              "& .MuiOutlinedInput-root": { borderRadius: 2, bgcolor: "background.paper" },
            }}
            slotProps={{
              input: {
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" edge="end" aria-label="Search posts" onClick={() => submitHeaderSearch()} sx={{ mr: -0.5 }}>
                      <SearchIcon fontSize="small" />
                    </IconButton>
                  </InputAdornment>
                ),
              },
            }}
          />

          <Box sx={{ display: { xs: "flex", sm: "none" }, flex: 1, justifyContent: "flex-end" }}>
            <Tooltip title="Search posts">
              <IconButton aria-label="Search posts" onClick={() => navigate("/posts")} sx={{ ...headerIconBtnSx }}>
                <SearchIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexShrink: 0 }}>
            <Tooltip title="Light mode">
              <span>
                <IconButton size="small" sx={{ ...headerIconBtnSx, display: { xs: "none", md: "flex" } }} aria-label="Theme">
                  <LightModeOutlinedIcon sx={{ fontSize: 20 }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={fullscreen ? "Exit fullscreen" : "Fullscreen"}>
              <IconButton
                size="small"
                onClick={() => toggleFullscreen()}
                sx={{ ...headerIconBtnSx, display: { xs: "none", sm: "flex" } }}
                aria-label={fullscreen ? "Exit fullscreen" : "Fullscreen"}
              >
                {fullscreen ? <FullscreenExitIcon sx={{ fontSize: 20 }} /> : <FullscreenIcon sx={{ fontSize: 20 }} />}
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh data">
              <IconButton size="small" onClick={() => invalidateCaches()} sx={{ ...headerIconBtnSx, display: { xs: "none", sm: "flex" } }} aria-label="Refresh">
                <RefreshOutlinedIcon sx={{ fontSize: 20 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Notifications">
              <IconButton size="small" onClick={() => navigate("/reports")} sx={{ ...headerIconBtnSx }} aria-label="Notifications">
                <Badge badgeContent={pendingCount} color="error" invisible={pendingCount < 1} max={99}>
                  <NotificationsNoneOutlinedIcon sx={{ fontSize: 20 }} />
                </Badge>
              </IconButton>
            </Tooltip>

            <Box sx={{ ml: 0.5, pl: 1, borderLeft: `1px solid ${adminLayout.border}`, display: "flex", alignItems: "center" }}>
              <Box
                component="button"
                type="button"
                onClick={(e) => setProfileAnchor(e.currentTarget)}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.75,
                  cursor: "pointer",
                  border: "none",
                  bgcolor: "transparent",
                  p: 0.5,
                  borderRadius: 2,
                  "&:hover": { bgcolor: "action.hover" },
                }}
                aria-haspopup="true"
                aria-expanded={Boolean(profileAnchor)}
              >
                <Avatar sx={{ width: 32, height: 32, bgcolor: "grey.300", color: "text.primary", fontSize: "0.8125rem" }}>
                  {brandInitial}
                </Avatar>
                <Typography variant="body2" sx={{ fontWeight: 600, color: "text.primary", display: { xs: "none", md: "block" }, maxWidth: 140 }} noWrap>
                  {user?.name || user?.email || "Admin"}
                </Typography>
                <KeyboardArrowDownIcon sx={{ fontSize: 20, color: "text.secondary", display: { xs: "none", md: "block" } }} />
              </Box>
              <Menu
                anchorEl={profileAnchor}
                open={Boolean(profileAnchor)}
                onClose={() => setProfileAnchor(null)}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                transformOrigin={{ vertical: "top", horizontal: "right" }}
                slotProps={{ paper: { sx: { minWidth: 220, mt: 0.5 } } }}
              >
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate("/account/profile");
                  }}
                >
                  <ListItemIcon>
                    <PersonOutlineIcon fontSize="small" />
                  </ListItemIcon>
                  Profile
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate("/account/settings");
                  }}
                >
                  <ListItemIcon>
                    <SettingsOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Settings
                </MenuItem>
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    navigate("/account/change-password");
                  }}
                >
                  <ListItemIcon>
                    <LockOutlinedIcon fontSize="small" />
                  </ListItemIcon>
                  Change password
                </MenuItem>
                <Divider />
                <MenuItem
                  onClick={() => {
                    setProfileAnchor(null);
                    void logout();
                  }}
                >
                  <ListItemIcon>
                    <LogoutIcon fontSize="small" />
                  </ListItemIcon>
                  Log out
                </MenuItem>
              </Menu>
            </Box>
          </Box>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 }, transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shorter }) }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidthExpanded },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shorter }),
            "& .MuiDrawer-paper": {
              boxSizing: "border-box",
              width: drawerWidth,
              overflowX: "hidden",
              transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shorter }),
            },
          }}
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          overflowX: "auto",
          p: { xs: 1.5, sm: 2, md: 2.5, lg: 3 },
          width: { xs: "100%", md: `calc(100% - ${drawerWidth}px)` },
          transition: (t) => t.transitions.create("width", { duration: t.transitions.duration.shorter }),
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, sm: 64 } }} />
        <Box sx={adminMainContentInnerSx}>{children}</Box>
      </Box>
    </Box>
  );
}

function RequireAdmin({ children }: { children: React.ReactElement }) {
  const user = useAppSelector((s) => s.auth.user);
  if (!user) return <Navigate to="/login" replace />;
  if (user.role !== "admin") return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <SessionBootstrap>
      <CssBaseline />
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/dashboard"
          element={
            <RequireAdmin>
              <AdminShell>
                <DashboardAdminPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/account/profile"
          element={
            <RequireAdmin>
              <AdminShell>
                <AccountProfilePage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/account/settings"
          element={
            <RequireAdmin>
              <AdminShell>
                <AccountSettingsPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/account/change-password"
          element={
            <RequireAdmin>
              <AdminShell>
                <AccountChangePasswordPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/posts/new"
          element={
            <RequireAdmin>
              <AdminShell>
                <PostCreatePage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/posts/:postId/edit"
          element={
            <RequireAdmin>
              <AdminShell>
                <PostEditPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/posts/:postId"
          element={
            <RequireAdmin>
              <AdminShell>
                <PostViewPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/posts"
          element={
            <RequireAdmin>
              <AdminShell>
                <PostsAdminPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/categories/new"
          element={
            <RequireAdmin>
              <AdminShell>
                <CategoryCreatePage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/categories/:categoryId/edit"
          element={
            <RequireAdmin>
              <AdminShell>
                <CategoryEditPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/categories/:categoryId"
          element={
            <RequireAdmin>
              <AdminShell>
                <CategoryViewPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/categories"
          element={
            <RequireAdmin>
              <AdminShell>
                <CategoriesAdminPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/tags/new"
          element={
            <RequireAdmin>
              <AdminShell>
                <TagCreatePage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/tags/:tagId/edit"
          element={
            <RequireAdmin>
              <AdminShell>
                <TagEditPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/tags/:tagId"
          element={
            <RequireAdmin>
              <AdminShell>
                <TagViewPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/tags"
          element={
            <RequireAdmin>
              <AdminShell>
                <TagsAdminPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/users/new"
          element={
            <RequireAdmin>
              <AdminShell>
                <UserCreatePage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/users/:userId/edit"
          element={
            <RequireAdmin>
              <AdminShell>
                <UserEditPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/users/:userId"
          element={
            <RequireAdmin>
              <AdminShell>
                <UserViewPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/users"
          element={
            <RequireAdmin>
              <AdminShell>
                <UsersAdminPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/reports/:reportId/edit"
          element={
            <RequireAdmin>
              <AdminShell>
                <ReportEditPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/reports/:reportId"
          element={
            <RequireAdmin>
              <AdminShell>
                <ReportViewPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route
          path="/reports"
          element={
            <RequireAdmin>
              <AdminShell>
                <ReportsAdminPage />
              </AdminShell>
            </RequireAdmin>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </SessionBootstrap>
  );
}
