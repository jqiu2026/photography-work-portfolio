export type RedirectCheck =
  | { ok: true; from: string; to: string }
  | { ok: false; field: "fromPath" | "toPath"; error: string };

const clean = (s: string) => s.trim();

/**
 * Redirect rules: the source is a path on this site; the target is a path or an https URL. Paths are never allowed to be
 * protocol-relative ("//host") or contain control characters, so a redirect cannot become an open-redirect trick or a loop.
 */
export function validateRedirect(fromRaw: string, toRaw: string): RedirectCheck {
  const from = clean(fromRaw).replace(/\/+$/, "") || "/";
  const to = clean(toRaw);
  // biome-ignore lint/suspicious/noControlCharactersInRegex: rejecting control characters is the point
  const bad = /[\u0000-\u001f\u007f\s\\]/;
  if (!from.startsWith("/") || from.startsWith("//") || bad.test(from) || from.length > 300)
    return { ok: false, field: "fromPath", error: "Start with a single / and use no spaces, e.g. /old-page" };
  if (from === "/" || from.startsWith("/admin") || from.startsWith("/api"))
    return { ok: false, field: "fromPath", error: "That path cannot be redirected." };
  const isPath = to.startsWith("/") && !to.startsWith("//");
  const isHttps = /^https:\/\/[^\s/]+\.[^\s/]+/i.test(to);
  if (!(isPath || isHttps) || bad.test(to) || to.length > 500)
    return { ok: false, field: "toPath", error: "Use a path like /new-page or a full https:// link" };
  if (isPath && to.replace(/\/+$/, "") === from)
    return { ok: false, field: "toPath", error: "That would redirect to itself." };
  return { ok: true, from, to };
}
