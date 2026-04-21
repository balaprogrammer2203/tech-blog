/**
 * Jest runs without Vite; replace `import.meta.env.VITE_API_URL` with a string literal.
 */
module.exports = function replaceImportMetaEnvViteApiUrl({ types: t }) {
  const replacement = process.env.VITE_API_URL ?? "http://127.0.0.1:9999";

  return {
    name: "replace-import-meta-env-vite-api-url",
    visitor: {
      MemberExpression(path) {
        if (path.matchesPattern("import.meta.env.VITE_API_URL")) {
          path.replaceWith(t.stringLiteral(replacement));
        }
      },
    },
  };
};
