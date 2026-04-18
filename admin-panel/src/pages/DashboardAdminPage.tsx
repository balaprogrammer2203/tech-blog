import {
  Alert,
  Box,
  Button,
  Chip,
  Divider,
  LinearProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import { Link as RouterLink } from "react-router-dom";
import { useAdminDashboardQuery } from "@/store/baseApi";

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string | number;
  hint?: string;
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        height: "100%",
        borderRadius: 2,
        bgcolor: "background.paper",
        borderColor: "divider",
        boxShadow: "0 1px 3px rgba(17, 24, 39, 0.06), 0 1px 2px rgba(17, 24, 39, 0.04)",
      }}
    >
      <Typography variant="overline" color="text.secondary" display="block" sx={{ lineHeight: 1.2 }}>
        {label}
      </Typography>
      <Typography variant="h4" component="p" sx={{ my: 0.5, fontWeight: 600 }}>
        {value}
      </Typography>
      {hint ? (
        <Typography variant="caption" color="text.secondary">
          {hint}
        </Typography>
      ) : null}
    </Paper>
  );
}

function formatWhen(iso: string): string {
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return iso;
  }
}

export function DashboardAdminPage() {
  const { data, isFetching, isError, refetch } = useAdminDashboardQuery();

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Dashboard
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Snapshot of your tech blog: content, audience, taxonomy, and moderation.{" "}
        {data ? <span>Figures as of {formatWhen(data.generatedAt)}.</span> : null}
      </Typography>

      {isError && (
        <Alert
          severity="error"
          sx={{ mb: 2 }}
          action={
            <Button color="inherit" size="small" onClick={() => void refetch()}>
              Retry
            </Button>
          }
        >
          Could not load dashboard metrics.
        </Alert>
      )}

      {isFetching && !data && <LinearProgress sx={{ mb: 2 }} />}

      {data && (
        <>
          {data.reports.pending > 0 && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              {data.reports.pending} report{data.reports.pending === 1 ? "" : "s"} awaiting review.{" "}
              <Button component={RouterLink} to="/reports" size="small" sx={{ ml: 1 }}>
                Open reports
              </Button>
            </Alert>
          )}

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Content and engagement
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              mb: 3,
            }}
          >
            <StatCard label="Posts (total)" value={data.posts.total} />
            <StatCard label="Published" value={data.posts.published} hint="Live on the site" />
            <StatCard label="Drafts" value={data.posts.draft} hint="Not published" />
            <StatCard
              label="Published (7 days)"
              value={data.posts.publishedLast7Days}
              hint="New or republished in the last week"
            />
            <StatCard label="Comments" value={data.comments.total} hint="Across all posts" />
            <StatCard label="Likes (sum)" value={data.engagement.totalLikes} hint="Stored like counts on posts" />
            <StatCard label="Registered users" value={data.users.total} />
            <StatCard label="Admins" value={data.users.admins} hint="Accounts with admin role" />
          </Box>

          <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 1.5 }}>
            Taxonomy and moderation
          </Typography>
          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
              mb: 3,
            }}
          >
            <StatCard label="Categories (total)" value={data.categories.total} />
            <StatCard label="Root categories" value={data.categories.roots} />
            <StatCard label="Subcategories" value={data.categories.children} hint="Leaf nodes for posts" />
            <StatCard label="Reports (pending)" value={data.reports.pending} hint={`${data.reports.total} total`} />
            <StatCard label="Reports resolved" value={data.reports.resolved} />
            <StatCard label="Reports dismissed" value={data.reports.dismissed} />
          </Box>

          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mb: 3 }}>
            <Button component={RouterLink} to="/posts" variant="contained" size="small">
              Manage posts
            </Button>
            <Button component={RouterLink} to="/categories" variant="outlined" size="small">
              Categories
            </Button>
            <Button component={RouterLink} to="/users" variant="outlined" size="small">
              Users
            </Button>
            <Button component={RouterLink} to="/reports" variant="outlined" size="small">
              Reports
            </Button>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "grid",
              gap: 2,
              gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
              alignItems: "start",
            }}
          >
            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Recently updated posts
                </Typography>
                <Button component={RouterLink} to="/posts" size="small">
                  View all
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Title</TableCell>
                      <TableCell>Author</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell align="right">Likes / comments</TableCell>
                      <TableCell align="right">Updated</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.recentPosts.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5}>
                          <Typography variant="body2" color="text.secondary">
                            No posts yet.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.recentPosts.map((p) => (
                        <TableRow key={p.id} hover>
                          <TableCell sx={{ maxWidth: 220 }}>
                            <Typography variant="body2" noWrap title={p.title}>
                              {p.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" noWrap display="block">
                              {p.slug}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 140 }}>
                            <Typography variant="body2" noWrap title={p.author?.email ?? ""}>
                              {p.author?.name || "—"}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              size="small"
                              label={p.status}
                              color={p.status === "published" ? "success" : "secondary"}
                              variant="filled"
                              sx={{ fontWeight: 700, textTransform: "capitalize", minWidth: 88 }}
                            />
                          </TableCell>
                          <TableCell align="right">
                            {p.likeCount} / {p.commentCount}
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {formatWhen(p.updatedAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Box>

            <Box>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
                <Typography variant="subtitle1" fontWeight={600}>
                  Pending reports
                </Typography>
                <Button component={RouterLink} to="/reports" size="small">
                  View all
                </Button>
              </Box>
              <Paper variant="outlined" sx={{ borderRadius: 2, overflow: "hidden", bgcolor: "background.paper" }}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>Target</TableCell>
                      <TableCell>Reason</TableCell>
                      <TableCell>Reporter</TableCell>
                      <TableCell align="right">Submitted</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {data.pendingReports.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4}>
                          <Typography variant="body2" color="text.secondary">
                            No pending reports. Good news.
                          </Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      data.pendingReports.map((r) => (
                        <TableRow key={r.id} hover>
                          <TableCell sx={{ whiteSpace: "nowrap" }}>
                            {r.targetType} · {r.targetId.slice(0, 8)}…
                          </TableCell>
                          <TableCell sx={{ maxWidth: 200 }}>
                            <Typography variant="body2" sx={{ overflow: "hidden", textOverflow: "ellipsis" }} noWrap title={r.reason}>
                              {r.reason}
                            </Typography>
                          </TableCell>
                          <TableCell sx={{ maxWidth: 140 }}>
                            <Typography variant="body2" noWrap title={r.reporter?.email ?? ""}>
                              {r.reporter?.email ?? "—"}
                            </Typography>
                          </TableCell>
                          <TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
                            {formatWhen(r.createdAt)}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </Paper>
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
