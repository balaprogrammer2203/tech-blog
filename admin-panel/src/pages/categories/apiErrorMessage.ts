import type { FetchBaseQueryError } from "@reduxjs/toolkit/query";

export function apiErrorMessage(e: unknown, fallback: string): string {
  const err = e as FetchBaseQueryError | undefined;
  if (err && typeof err === "object" && "data" in err && err.data && typeof err.data === "object" && "message" in err.data) {
    return String((err.data as { message: string }).message);
  }
  return fallback;
}
