import type { NextFunction, Request, Response } from "express";
import type { Env } from "../config/env.js";
import { HttpError } from "./errorHandler.js";
import { verifyAccessToken } from "../utils/jwt.js";

export type AuthedRequest = Request & { user?: { id: string; role: "user" | "admin" } };

export function authMiddleware(env: Env, optional = false) {
  return (req: AuthedRequest, _res: Response, next: NextFunction) => {
    const header = req.headers.authorization;
    const token = header?.startsWith("Bearer ") ? header.slice(7) : undefined;
    if (!token) {
      if (optional) return next();
      next(new HttpError(401, "Unauthorized"));
      return;
    }
    try {
      const payload = verifyAccessToken(env, token);
      req.user = { id: payload.sub, role: payload.role };
      next();
    } catch {
      if (optional) return next();
      next(new HttpError(401, "Unauthorized"));
    }
  };
}

export function requireAdmin(req: AuthedRequest, _res: Response, next: NextFunction): void {
  if (req.user?.role !== "admin") {
    next(new HttpError(403, "Forbidden"));
    return;
  }
  next();
}
