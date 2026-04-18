export async function downloadTagsExport(
  baseUrl: string,
  token: string | null,
  params: { scope: "filter"; q?: string } | { scope: "selected"; ids: string[] }
): Promise<void> {
  const root = baseUrl.replace(/\/$/, "");
  const headers: Record<string, string> = {};
  if (token) headers.Authorization = `Bearer ${token}`;

  let res: Response;
  let filename: string;

  if (params.scope === "selected") {
    filename = "tags-selected.csv";
    res = await fetch(`${root}/api/admin/tags/export`, {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json", ...headers },
      body: JSON.stringify({ ids: params.ids }),
    });
  } else {
    filename = "tags.csv";
    const sp = new URLSearchParams();
    if (params.q) sp.set("q", params.q);
    res = await fetch(`${root}/api/admin/tags/export?${sp.toString()}`, {
      credentials: "include",
      ...(Object.keys(headers).length ? { headers } : {}),
    });
  }

  if (!res.ok) {
    let msg = res.statusText;
    try {
      const j = (await res.json()) as { message?: string };
      if (j?.message) msg = j.message;
    } catch {
      try {
        const t = await res.text();
        if (t) msg = t.slice(0, 200);
      } catch {
        /* ignore */
      }
    }
    throw new Error(msg);
  }
  const blob = await res.blob();
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}
