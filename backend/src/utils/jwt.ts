import jwt, { type SignOptions } from "jsonwebtoken";
import type { Env } from "../config/env.js";

export type AccessPayload = { sub: string; role: "user" | "admin" };

export function signAccessToken(env: Env, payload: AccessPayload): string {
  return jwt.sign(payload, env.JWT_ACCESS_SECRET, { expiresIn: env.ACCESS_TOKEN_TTL } as SignOptions);
}

export function signRefreshToken(env: Env, userId: string): string {
  return jwt.sign({ sub: userId, typ: "refresh" }, env.JWT_REFRESH_SECRET, { expiresIn: env.REFRESH_TOKEN_TTL } as SignOptions);
}

export function verifyAccessToken(env: Env, token: string): AccessPayload {
  const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as jwt.JwtPayload & AccessPayload;
  if (!decoded.sub || !decoded.role) throw new Error("Invalid access token");
  return { sub: decoded.sub, role: decoded.role };
}

export function verifyRefreshToken(env: Env, token: string): { sub: string } {
  const decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as jwt.JwtPayload;
  if (decoded.typ !== "refresh" || !decoded.sub) throw new Error("Invalid refresh token");
  return { sub: String(decoded.sub) };
}
