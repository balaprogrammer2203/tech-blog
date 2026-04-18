import { useState, type ReactElement, type ReactNode } from "react";
import { Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import {
  AppBar,
  Box,
  CssBaseline,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutIcon from "@mui/icons-material/Logout";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import ArticleOutlinedIcon from "@mui/icons-material/ArticleOutlined";
import CategoryOutlinedIcon from "@mui/icons-material/CategoryOutlined";
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
import { CategoriesAdminPage } from "@/pages/CategoriesAdminPage";
import { CategoryCreatePage } from "@/pages/categories/CategoryCreatePage";
import { CategoryEditPage } from "@/pages/categories/CategoryEditPage";
import { CategoryViewPage } from "@/pages/categories/CategoryViewPage";
import { DashboardAdminPage } from "@/pages/DashboardAdminPage";
import { useAppSelector } from "@/store/hooks";
import { useLogoutMutation } from "@/store/baseApi";
import { adminMainContentInnerSx } from "@/theme/adminTheme";

const drawerWidth = 220;

function AdminShell({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [logout] = useLogoutMutation();

  const items: { label: string; path: string; icon: ReactElement }[] = [
    { label: "Dashboard", path: "/dashboard", icon: <DashboardOutlinedIcon fontSize="small" /> },
    { label: "Posts", path: "/posts", icon: <ArticleOutlinedIcon fontSize="small" /> },
    { label: "Categories", path: "/categories", icon: <CategoryOutlinedIcon fontSize="small" /> },
    { label: "Users", path: "/users", icon: <PeopleOutlineIcon fontSize="small" /> },
    { label: "Reports", path: "/reports", icon: <FlagOutlinedIcon fontSize="small" /> },
  ];

  const drawer = (
    <Box sx={{ pt: 1 }}>
      <Toolbar sx={{ px: 2, minHeight: 56 }}>
        <Typography variant="subtitle1" noWrap sx={{ fontWeight: 700, letterSpacing: "-0.02em", color: "text.primary" }}>
          Tech Blog
        </Typography>
        <Typography component="span" variant="caption" sx={{ ml: 1, color: "text.disabled", fontWeight: 500 }}>
          Admin
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: "divider" }} />
      <List dense sx={{ px: 1, py: 1.5 }}>
        {items.map((it) => {
          const selected =
            it.path === "/categories"
              ? location.pathname === "/categories" || location.pathname.startsWith("/categories/")
              : it.path === "/posts"
                ? location.pathname === "/posts" || location.pathname.startsWith("/posts/")
                : it.path === "/users"
                  ? location.pathname === "/users" || location.pathname.startsWith("/users/")
                  : location.pathname === it.path;
          return (
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
                "& .MuiListItemIcon-root": {
                  minWidth: 36,
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
              <ListItemIcon>{it.icon}</ListItemIcon>
              <ListItemText primary={it.label} />
            </ListItemButton>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Toolbar sx={{ pt: "env(safe-area-inset-top, 0px)" }}>
          <IconButton
            edge="start"
            onClick={() => setMobileOpen(true)}
            sx={{ mr: 2, display: { md: "none" }, color: "text.secondary" }}
            aria-label="open menu"
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{
              flexGrow: 1,
              fontWeight: 600,
              fontSize: { xs: "0.9375rem", sm: "1rem" },
              color: "text.primary",
            }}
          >
            Moderation
          </Typography>
          <IconButton onClick={() => void logout()} sx={{ color: "text.secondary" }} aria-label="log out">
            <LogoutIcon />
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: { md: 0 } }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{ display: { xs: "block", md: "none" }, "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth } }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": { boxSizing: "border-box", width: drawerWidth },
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
          minHeight: "100vh",
          bgcolor: "background.default",
        }}
      >
        <Toolbar />
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
