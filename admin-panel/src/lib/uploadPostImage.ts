export async function uploadPostImage(args: { apiBaseUrl: string; token: string | null; file: File }): Promise<string> {
  const root = args.apiBaseUrl.replace(/\/$/, "");
  const fd = new FormData();
  fd.append("file", args.file);
  const headers: Record<string, string> = {};
  if (args.token) headers.Authorization = `Bearer ${args.token}`;
  const res = await fetch(`${root}/api/upload/image`, {
    method: "POST",
    credentials: "include",
    headers,
    body: fd,
  });
  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      /* ignore */
    }
    throw new Error(msg);
  }
  const data = (await res.json()) as { url?: string };
  if (!data.url) throw new Error("Upload response missing url");
  return data.url;
}
