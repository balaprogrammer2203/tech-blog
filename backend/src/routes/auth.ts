import { Router } from "express";
import type { Env } from "../config/env.js";
import { User } from "../models/User.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import { hashToken } from "../utils/tokenHash.js";
import { asyncHandler } from "../middleware/asyncHandler.js";
import { HttpError } from "../middleware/errorHandler.js";
import { authMiddleware, type AuthedRequest } from "../middleware/auth.js";
import { loginSchema, registerSchema } from "../validators/schemas.js";

const REFRESH_COOKIE = "rt";

function cookieOptions(env: Env) {
  const prod = env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: prod,
    sameSite: (prod ? "none" : "lax") as "none" | "lax",
    path: "/api/auth",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function createAuthRouter(env: Env) {
  const router = Router();

  router.post(
    "/register",
    asyncHandler(async (req, res) => {
      const body = registerSchema.parse(req.body);
      const exists = await User.exists({ email: body.email });
      if (exists) throw new HttpError(409, "Email already registered");
      const passwordHash = await hashPassword(body.password);
      const user = await User.create({
        email: body.email,
        passwordHash,
        name: body.name,
        role: "user",
      });
      const access = signAccessToken(env, { sub: String(user._id), role: "user" });
      const refresh = signRefreshToken(env, String(user._id));
      await User.updateOne({ _id: user._id }, { refreshTokenHash: hashToken(refresh) });
      res.cookie(REFRESH_COOKIE, refresh, cookieOptions(env));
      res.status(201).json({
        accessToken: access,
        user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
      });
    })
  );

  router.post(
    "/login",
    asyncHandler(async (req, res) => {
      const body = loginSchema.parse(req.body);
      const user = await User.findOne({ email: body.email }).select("+passwordHash +refreshTokenHash");
      if (!user || !(await verifyPassword(body.password, user.passwordHash))) {
        throw new HttpError(401, "Invalid credentials");
      }
      const access = signAccessToken(env, { sub: String(user._id), role: user.role });
      const refresh = signRefreshToken(env, String(user._id));
      await User.updateOne({ _id: user._id }, { refreshTokenHash: hashToken(refresh) });
      res.cookie(REFRESH_COOKIE, refresh, cookieOptions(env));
      res.json({
        accessToken: access,
        user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
      });
    })
  );

  router.post(
    "/refresh",
    asyncHandler(async (req, res) => {
      const token = req.cookies?.[REFRESH_COOKIE] as string | undefined;
      if (!token) throw new HttpError(401, "Missing refresh token");
      let sub: string;
      try {
        sub = verifyRefreshToken(env, token).sub;
      } catch {
        throw new HttpError(401, "Invalid refresh token");
      }
      const user = await User.findById(sub).select("+refreshTokenHash");
      if (!user?.refreshTokenHash || user.refreshTokenHash !== hashToken(token)) {
        throw new HttpError(401, "Invalid refresh token");
      }
      const access = signAccessToken(env, { sub: String(user._id), role: user.role });
      const newRefresh = signRefreshToken(env, String(user._id));
      await User.updateOne({ _id: user._id }, { refreshTokenHash: hashToken(newRefresh) });
      res.cookie(REFRESH_COOKIE, newRefresh, cookieOptions(env));
      res.json({ accessToken: access });
    })
  );

  router.post(
    "/logout",
    authMiddleware(env),
    asyncHandler(async (req: AuthedRequest, res) => {
      await User.updateOne({ _id: req.user!.id }, { $unset: { refreshTokenHash: 1 } });
      res.clearCookie(REFRESH_COOKIE, { ...cookieOptions(env), maxAge: 0 });
      res.status(204).end();
    })
  );

  router.get(
    "/me",
    authMiddleware(env, true),
    asyncHandler(async (req: AuthedRequest, res) => {
      if (!req.user) {
        res.json({ user: null });
        return;
      }
      const user = await User.findById(req.user.id).select("email name role").lean();
      if (!user) throw new HttpError(401, "Unauthorized");
      res.json({
        user: { id: String(user._id), email: user.email, name: user.name, role: user.role },
      });
    })
  );

  return router;
}
