/**
 * OpenAPI 3.0 document for Swagger UI (`/api-docs`).
 * If `servers` is omitted, Swagger UI uses the current browser origin for Try it out.
 */
export const openApiDocument = {
  openapi: "3.0.3",
  info: {
    title: "Tech Blog API",
    version: "1.0.0",
    description:
      "REST API for the tech blog. Use **Authorize** with a Bearer access token from `POST /api/auth/login` or `POST /api/auth/register`. Refresh cookie is set automatically on login.",
  },
  tags: [
    { name: "Health" },
    { name: "Auth" },
    { name: "Categories" },
    { name: "Tags" },
    { name: "Posts" },
    { name: "Comments" },
    { name: "Likes" },
    { name: "Bookmarks" },
    { name: "Reports" },
    { name: "Admin" },
    { name: "Upload" },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "Short-lived access token: send header Authorization: Bearer plus your access token value",
      },
    },
    schemas: {
      Error: {
        type: "object",
        properties: {
          message: { type: "string" },
          details: { type: "object" },
        },
      },
      RegisterBody: {
        type: "object",
        required: ["email", "password", "name"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string", minLength: 8 },
          name: { type: "string" },
        },
      },
      LoginBody: {
        type: "object",
        required: ["email", "password"],
        properties: {
          email: { type: "string", format: "email" },
          password: { type: "string" },
        },
      },
      AuthResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
          user: { $ref: "#/components/schemas/User" },
        },
      },
      RefreshResponse: {
        type: "object",
        properties: {
          accessToken: { type: "string" },
        },
      },
      User: {
        type: "object",
        properties: {
          id: { type: "string" },
          email: { type: "string" },
          name: { type: "string" },
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
      SelfProfilePatch: {
        type: "object",
        required: ["name"],
        properties: { name: { type: "string", minLength: 1, maxLength: 80 } },
      },
      ChangePasswordBody: {
        type: "object",
        required: ["currentPassword", "newPassword"],
        properties: {
          currentPassword: { type: "string" },
          newPassword: { type: "string", minLength: 8, maxLength: 72 },
        },
      },
      PostCreate: {
        type: "object",
        required: ["title", "excerpt", "content"],
        properties: {
          title: { type: "string" },
          excerpt: { type: "string" },
          content: { type: "string" },
          tags: {
            type: "array",
            description:
              "Up to five existing Tag document ids (24-character hex strings). The server stores each as tagId plus denormalized name and slug on the post.",
            items: { type: "string", pattern: "^[a-fA-F0-9]{24}$" },
            maxItems: 5,
          },
          status: { type: "string", enum: ["draft", "published"] },
          categoryId: { type: "string", description: "Leaf category ObjectId; required when status is published" },
          coverImageUrl: { type: "string" },
          readTimeMinutes: { type: "integer" },
        },
      },
      CommentCreate: {
        type: "object",
        required: ["body"],
        properties: {
          body: { type: "string" },
          parentId: { type: "string" },
        },
      },
      ReportCreate: {
        type: "object",
        required: ["targetType", "targetId", "reason"],
        properties: {
          targetType: { type: "string", enum: ["post", "comment"] },
          targetId: { type: "string" },
          reason: { type: "string" },
        },
      },
      RolePatch: {
        type: "object",
        required: ["role"],
        properties: {
          role: { type: "string", enum: ["user", "admin"] },
        },
      },
      PostStatusPatch: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["draft", "published"] },
        },
      },
      ReportStatusPatch: {
        type: "object",
        required: ["status"],
        properties: {
          status: { type: "string", enum: ["pending", "resolved", "dismissed"] },
        },
      },
      ReportExportIds: {
        type: "object",
        required: ["ids"],
        properties: {
          ids: { type: "array", items: { type: "string" }, minItems: 1, maxItems: 500 },
        },
      },
    },
  },
  paths: {
    "/health": {
      get: {
        tags: ["Health"],
        summary: "Liveness probe",
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/categories": {
      get: {
        tags: ["Categories"],
        summary: "List two-level category tree (roots with children)",
        responses: { "200": { description: "{ roots: [{ id, name, slug, children: [...] }] }" } },
      },
    },
    "/api/auth/register": {
      post: {
        tags: ["Auth"],
        summary: "Register",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RegisterBody" } } },
        },
        responses: {
          "201": { description: "Created", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "400": { description: "Validation", content: { "application/json": { schema: { $ref: "#/components/schemas/Error" } } } },
          "409": { description: "Email taken" },
        },
      },
    },
    "/api/auth/login": {
      post: {
        tags: ["Auth"],
        summary: "Login (sets refresh cookie)",
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/LoginBody" } } },
        },
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/AuthResponse" } } } },
          "401": { description: "Invalid credentials" },
        },
      },
    },
    "/api/auth/refresh": {
      post: {
        tags: ["Auth"],
        summary: "Refresh access token (uses httpOnly cookie)",
        responses: {
          "200": { description: "OK", content: { "application/json": { schema: { $ref: "#/components/schemas/RefreshResponse" } } } },
          "401": { description: "Missing or invalid refresh" },
        },
      },
    },
    "/api/auth/logout": {
      post: {
        tags: ["Auth"],
        summary: "Logout",
        security: [{ bearerAuth: [] }],
        responses: { "204": { description: "No content" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/auth/me": {
      get: {
        tags: ["Auth"],
        summary: "Current user (optional auth; omit Bearer to see guest)",
        responses: {
          "200": {
            description: "JSON body includes user object or user: null",
            content: { "application/json": { schema: { type: "object" } } },
          },
        },
      },
      patch: {
        tags: ["Auth"],
        summary: "Update current user profile (name)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/SelfProfilePatch" } } },
        },
        responses: {
          "200": { description: "Updated user", content: { "application/json": { schema: { type: "object" } } } },
          "401": { description: "Unauthorized" },
        },
      },
    },
    "/api/auth/change-password": {
      post: {
        tags: ["Auth"],
        summary: "Change password for the authenticated user",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ChangePasswordBody" } } },
        },
        responses: {
          "204": { description: "Password updated" },
          "401": { description: "Wrong current password or unauthorized" },
        },
      },
    },
    "/api/posts": {
      get: {
        tags: ["Posts"],
        summary: "List published posts",
        parameters: [
          { name: "page", in: "query", schema: { type: "integer", default: 1 } },
          { name: "limit", in: "query", schema: { type: "integer", default: 12, maximum: 30 } },
          { name: "q", in: "query", schema: { type: "string" }, description: "Full-text search" },
          { name: "category", in: "query", schema: { type: "string" }, description: "Leaf category ObjectId (mutually exclusive with categorySlug)" },
          { name: "categorySlug", in: "query", schema: { type: "string" }, description: "Leaf category slug, e.g. typescript or node-js" },
        ],
        responses: {
          "200": { description: "Paginated list (items include category when set)" },
          "404": { description: "Unknown category or categorySlug" },
        },
      },
      post: {
        tags: ["Posts"],
        summary: "Create post",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PostCreate" } } },
        },
        responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/posts/mine": {
      get: {
        tags: ["Posts"],
        summary: "My posts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/posts/slug/{slug}": {
      get: {
        tags: ["Posts"],
        summary: "Get published post by slug",
        parameters: [{ name: "slug", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "Post" }, "404": { description: "Not found" } },
      },
    },
    "/api/posts/{id}": {
      get: {
        tags: ["Posts"],
        summary: "Get post by id (published or own draft)",
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
      patch: {
        tags: ["Posts"],
        summary: "Update own post",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: { content: { "application/json": { schema: { $ref: "#/components/schemas/PostCreate" } } } },
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
      delete: {
        tags: ["Posts"],
        summary: "Delete own post",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },
    "/api/posts/{postId}/comments": {
      get: {
        tags: ["Comments"],
        summary: "List comments",
        parameters: [
          { name: "postId", in: "path", required: true, schema: { type: "string" } },
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" }, "404": { description: "Post not found" } },
      },
      post: {
        tags: ["Comments"],
        summary: "Add comment",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/CommentCreate" } } },
        },
        responses: { "201": { description: "Created" }, "401": { description: "Unauthorized" } },
      },
    },
    "/api/posts/{postId}/comments/{commentId}": {
      delete: {
        tags: ["Comments"],
        summary: "Delete own comment (or admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "postId", in: "path", required: true, schema: { type: "string" } },
          { name: "commentId", in: "path", required: true, schema: { type: "string" } },
        ],
        responses: { "204": { description: "Deleted" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/posts/{postId}/likes": {
      get: {
        tags: ["Likes"],
        summary: "Like status (optional auth)",
        parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }],
        security: [{ bearerAuth: [] }],
        responses: { "200": { description: "{ liked, likeCount }" } },
      },
    },
    "/api/posts/{postId}/likes/toggle": {
      post: {
        tags: ["Likes"],
        summary: "Toggle like",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "{ liked, likeCount }" } },
      },
    },
    "/api/bookmarks": {
      get: {
        tags: ["Bookmarks"],
        summary: "List bookmarks",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/bookmarks/{postId}/status": {
      get: {
        tags: ["Bookmarks"],
        summary: "Bookmarked?",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "{ bookmarked }" } },
      },
    },
    "/api/bookmarks/{postId}/toggle": {
      post: {
        tags: ["Bookmarks"],
        summary: "Toggle bookmark",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "postId", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "{ bookmarked }" } },
      },
    },
    "/api/reports": {
      post: {
        tags: ["Reports"],
        summary: "Submit report",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReportCreate" } } },
        },
        responses: { "201": { description: "Created" } },
      },
    },
    "/api/reports/admin/export": {
      get: {
        tags: ["Reports", "Admin"],
        summary: "Export reports CSV (current filters)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "q", in: "query", schema: { type: "string" } },
          { name: "status", in: "query", schema: { type: "string", enum: ["pending", "resolved", "dismissed"] } },
        ],
        responses: { "200": { description: "CSV file" }, "403": { description: "Forbidden" } },
      },
      post: {
        tags: ["Reports", "Admin"],
        summary: "Export selected reports as CSV",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReportExportIds" } } },
        },
        responses: { "200": { description: "CSV file" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/reports/admin": {
      get: {
        tags: ["Reports", "Admin"],
        summary: "List reports (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
          { name: "q", in: "query", schema: { type: "string" } },
          {
            name: "sortField",
            in: "query",
            schema: { type: "string", enum: ["status", "targetType", "targetId", "reason", "createdAt", "updatedAt"] },
          },
          { name: "sortOrder", in: "query", schema: { type: "string", enum: ["asc", "desc"] } },
        ],
        responses: { "200": { description: "OK" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/reports/admin/{id}": {
      get: {
        tags: ["Reports", "Admin"],
        summary: "Get report (admin)",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "200": { description: "OK" }, "404": { description: "Not found" } },
      },
      patch: {
        tags: ["Reports", "Admin"],
        summary: "Update report status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/ReportStatusPatch" } } },
        },
        responses: { "200": { description: "OK" } },
      },
      delete: {
        tags: ["Reports", "Admin"],
        summary: "Delete report",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" }, "404": { description: "Not found" } },
      },
    },
    "/api/admin/users": {
      get: {
        tags: ["Admin"],
        summary: "List users",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "q", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" }, "403": { description: "Forbidden" } },
      },
    },
    "/api/admin/users/{id}/role": {
      patch: {
        tags: ["Admin"],
        summary: "Set user role",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/RolePatch" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/admin/users/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete user and posts",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/admin/users/posts": {
      get: {
        tags: ["Admin"],
        summary: "List all posts",
        security: [{ bearerAuth: [] }],
        parameters: [
          { name: "page", in: "query", schema: { type: "integer" } },
          { name: "limit", in: "query", schema: { type: "integer" } },
          { name: "status", in: "query", schema: { type: "string" } },
        ],
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/admin/users/posts/{id}/status": {
      patch: {
        tags: ["Admin"],
        summary: "Set post status",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        requestBody: {
          required: true,
          content: { "application/json": { schema: { $ref: "#/components/schemas/PostStatusPatch" } } },
        },
        responses: { "200": { description: "OK" } },
      },
    },
    "/api/admin/users/posts/{id}": {
      delete: {
        tags: ["Admin"],
        summary: "Delete any post",
        security: [{ bearerAuth: [] }],
        parameters: [{ name: "id", in: "path", required: true, schema: { type: "string" } }],
        responses: { "204": { description: "Deleted" } },
      },
    },
    "/api/upload/image": {
      post: {
        tags: ["Upload"],
        summary: "Upload image (multipart field: file)",
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: { "multipart/form-data": { schema: { type: "object", properties: { file: { type: "string", format: "binary" } }, required: ["file"] } } },
        },
        responses: { "200": { description: "{ url }" }, "503": { description: "Cloudinary not configured" } },
      },
    },
  },
};
