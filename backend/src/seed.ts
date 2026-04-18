/**
 * Seeds the database with deterministic demo data.
 * Run: npm run seed  (requires MONGODB_URI in .env)
 *
 * Clears: reports, likes, bookmarks, comments, posts, categories, users — then inserts fresh rows.
 * Login after seed: admin@seed.local / password123  or  user@seed.local / password123
 */
import "dotenv/config";
import mongoose from "mongoose";
import { hashPassword } from "./utils/password.js";
import { User } from "./models/User.js";
import { Category } from "./models/Category.js";
import { Post, type PostDoc } from "./models/Post.js";
import { Comment } from "./models/Comment.js";
import { Like } from "./models/Like.js";
import { Bookmark } from "./models/Bookmark.js";
import { Report } from "./models/Report.js";
import { SEED_ARTICLES, type SeedArticleCategorySlug } from "./seed/postContents.js";

const passwordPlain = "password123";

/** Fixed UTC timestamps so seeded categories look like realistic historical data. */
function catDate(year: number, monthIndex: number, day: number, hour = 12, minute = 0): Date {
  return new Date(Date.UTC(year, monthIndex, day, hour, minute, 0, 0));
}

async function seedCategories(): Promise<Record<SeedArticleCategorySlug, mongoose.Types.ObjectId>> {
  const roots = await Category.insertMany([
    {
      name: "Frontend technologies",
      slug: "frontend-technologies",
      parent: null,
      sortOrder: 1,
      description: "Browser UI, components, and styling stacks.",
      createdAt: catDate(2024, 0, 18, 10, 5),
      updatedAt: catDate(2025, 2, 3, 14, 22),
    },
    {
      name: "Backend technologies",
      slug: "backend-technologies",
      parent: null,
      sortOrder: 2,
      description: "Servers, runtimes, and backend languages.",
      createdAt: catDate(2024, 1, 6, 9, 40),
      updatedAt: catDate(2025, 3, 11, 11, 8),
    },
  ]);
  const frontRoot = roots[0];
  const backRoot = roots[1];

  const children = await Category.insertMany([
    {
      name: "React.js",
      slug: "react-js",
      parent: frontRoot._id,
      sortOrder: 1,
      description: "Component-driven UI with the React library.",
      createdAt: catDate(2024, 1, 12, 15, 0),
      updatedAt: catDate(2025, 0, 9, 8, 15),
    },
    {
      name: "JavaScript",
      slug: "javascript",
      parent: frontRoot._id,
      sortOrder: 2,
      description: "Core language for web interactivity.",
      createdAt: catDate(2024, 1, 20, 11, 30),
      updatedAt: catDate(2025, 1, 4, 16, 50),
    },
    {
      name: "TypeScript",
      slug: "typescript",
      parent: frontRoot._id,
      sortOrder: 3,
      description: "Typed JavaScript for safer frontends and tooling.",
      createdAt: catDate(2024, 2, 3, 13, 10),
      updatedAt: catDate(2025, 2, 18, 10, 0),
    },
    {
      name: "HTML",
      slug: "html",
      parent: frontRoot._id,
      sortOrder: 4,
      description: "Markup structure and semantics.",
      createdAt: catDate(2024, 2, 18, 9, 0),
      updatedAt: catDate(2024, 10, 1, 12, 0),
    },
    {
      name: "CSS",
      slug: "css",
      parent: frontRoot._id,
      sortOrder: 5,
      description: "Layout, design tokens, and responsive styling.",
      createdAt: catDate(2024, 2, 25, 14, 45),
      updatedAt: catDate(2025, 3, 2, 9, 30),
    },
    {
      name: "Node.js",
      slug: "node-js",
      parent: backRoot._id,
      sortOrder: 1,
      description: "JavaScript runtime for APIs and services.",
      createdAt: catDate(2024, 2, 8, 10, 20),
      updatedAt: catDate(2025, 1, 27, 17, 5),
    },
    {
      name: "Java",
      slug: "java",
      parent: backRoot._id,
      sortOrder: 2,
      description: "JVM ecosystem and enterprise backends.",
      createdAt: catDate(2024, 2, 22, 8, 55),
      updatedAt: catDate(2024, 11, 15, 13, 40),
    },
    {
      name: "PHP",
      slug: "php",
      parent: backRoot._id,
      sortOrder: 3,
      description: "PHP for web apps and CMS-style stacks.",
      createdAt: catDate(2024, 3, 5, 16, 12),
      updatedAt: catDate(2025, 0, 21, 10, 18),
    },
  ]);

  const bySlug = new Map<string, mongoose.Types.ObjectId>();
  for (const c of children) {
    bySlug.set(c.slug, c._id);
  }
  const ids = (slug: SeedArticleCategorySlug) => bySlug.get(slug)!;
  return {
    "react-js": ids("react-js"),
    javascript: ids("javascript"),
    typescript: ids("typescript"),
    html: ids("html"),
    css: ids("css"),
    "node-js": ids("node-js"),
    java: ids("java"),
    php: ids("php"),
  };
}

async function main(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("Missing MONGODB_URI");
    process.exit(1);
    return;
  }
  await mongoose.connect(uri, { maxPoolSize: 5 });
  console.log("Connected. Clearing collections…");

  await Report.deleteMany({});
  await Like.deleteMany({});
  await Bookmark.deleteMany({});
  await Comment.deleteMany({});
  await Post.deleteMany({});
  await Category.deleteMany({});
  await User.deleteMany({});

  const passwordHash = await hashPassword(passwordPlain);

  const admin = await User.create({
    email: "admin@seed.local",
    passwordHash,
    name: "Seed Admin",
    role: "admin",
  });
  const user = await User.create({
    email: "user@seed.local",
    passwordHash,
    name: "Seed Author",
    role: "user",
  });

  const categories = await seedCategories();

  const now = new Date();

  const createdPosts: PostDoc[] = [];
  let publishedIndex = 0;
  for (let i = 0; i < SEED_ARTICLES.length; i++) {
    const def = SEED_ARTICLES[i];
    const author = i % 2 === 0 ? user._id : admin._id;
    const publishedAt =
      def.status === "published" ? new Date(now.getTime() - publishedIndex * 60 * 60 * 1000) : undefined;
    if (def.status === "published") publishedIndex += 1;

    const post = await Post.create({
      author,
      title: def.title,
      slug: def.slug,
      excerpt: def.excerpt,
      content: def.content,
      tags: def.tags,
      status: def.status,
      readTimeMinutes: def.readTimeMinutes,
      publishedAt,
      likeCount: 0,
      commentCount: 0,
      category: categories[def.categorySlug],
    });
    createdPosts.push(post);
  }

  const publishedMain = createdPosts.find((p) => p.slug === SEED_ARTICLES[0].slug)!;
  const publishedShort = createdPosts.find((p) => p.slug === SEED_ARTICLES[1].slug)!;
  const draft = createdPosts.find((p) => p.status === "draft")!;

  const c1 = await Comment.create({
    post: publishedMain._id,
    author: admin._id,
    parent: null,
    depth: 0,
    body: "Great overview of the stack. Thanks for seeding this!",
  });
  const c2 = await Comment.create({
    post: publishedMain._id,
    author: user._id,
    parent: null,
    depth: 0,
    body: "Second top-level comment for pagination tests (single page here).",
  });
  await Comment.create({
    post: publishedMain._id,
    author: user._id,
    parent: c1._id,
    depth: 1,
    body: "Replying to admin: agreed on the API shape.",
  });

  await Post.updateOne({ _id: publishedMain._id }, { commentCount: 3 });

  await Like.create({ user: user._id, post: publishedMain._id });
  await Like.create({ user: admin._id, post: publishedMain._id });
  await Like.create({ user: user._id, post: publishedShort._id });
  await Post.updateOne({ _id: publishedMain._id }, { likeCount: 2 });
  await Post.updateOne({ _id: publishedShort._id }, { likeCount: 1 });

  await Bookmark.create({ user: admin._id, post: publishedMain._id });
  await Bookmark.create({ user: user._id, post: publishedShort._id });

  await Report.create({
    reporter: user._id,
    targetType: "comment",
    targetId: c2._id,
    reason: "Seed report: example flagged comment (safe to dismiss).",
    status: "pending",
  });
  await Report.create({
    reporter: admin._id,
    targetType: "post",
    targetId: publishedShort._id,
    reason: "Seed report: example flagged post.",
    status: "pending",
  });

  console.log("Seed complete.");
  console.log("  Users:  admin@seed.local (admin), user@seed.local (user)");
  console.log(`  Password (both): ${passwordPlain}`);
  console.log("  Categories: Frontend technologies + Backend technologies (leaf subcategories for posts)");
  const publishedSlugs = createdPosts.filter((p) => p.status === "published").map((p) => p.slug);
  console.log(`  Posts: ${createdPosts.length} (${publishedSlugs.length} published, 1 draft)`);
  console.log(`  Demo comments/likes on: ${publishedMain.slug}, ${publishedShort.slug}`);
  console.log(`  Draft id: ${String(draft._id)}`);
  await mongoose.disconnect();
}

main().catch(async (err) => {
  console.error(err);
  await mongoose.disconnect().catch(() => {});
  process.exit(1);
});
