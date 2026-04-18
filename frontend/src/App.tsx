import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { SessionBootstrap } from "@/components/SessionBootstrap";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { HomePage } from "@/pages/HomePage";
import { CategoryPage } from "@/pages/CategoryPage";
import { ArticlePage } from "@/pages/ArticlePage";
import { LoginPage } from "@/pages/LoginPage";
import { RegisterPage } from "@/pages/RegisterPage";
import { MyPostsPage } from "@/pages/MyPostsPage";

const BookmarksPage = lazy(() => import("@/pages/BookmarksPage").then((m) => ({ default: m.BookmarksPage })));

export default function App() {
  return (
    <SessionBootstrap>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="category/:parentSlug/:childSlug" element={<CategoryPage />} />
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
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </SessionBootstrap>
  );
}
