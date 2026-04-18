import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SessionBootstrap } from "@/components/SessionBootstrap";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { ArticlePage } from "@/pages/ArticlePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MyPostsPage } from "@/pages/MyPostsPage";

const BookmarksPage = lazy(() => import("@/pages/BookmarksPage").then((m) => ({ default: m.BookmarksPage })));
const WritePage = lazy(() => import("@/pages/WritePage").then((m) => ({ default: m.WritePage })));

export default function App() {
  return (
    <SessionBootstrap>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="p/:slug" element={<ArticlePage />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<RegisterPage />} />
          <Route
            path="bookmarks"
            element={
              <ProtectedRoute>
                <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
                  <BookmarksPage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="me"
            element={
              <ProtectedRoute>
                <MyPostsPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="write"
            element={
              <ProtectedRoute>
                <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
                  <WritePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route
            path="write/:postId"
            element={
              <ProtectedRoute>
                <Suspense fallback={<p className="text-sm text-ink-muted">Loading…</p>}>
                  <WritePage />
                </Suspense>
              </ProtectedRoute>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </SessionBootstrap>
  );
}
