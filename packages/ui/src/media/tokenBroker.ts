/**
 * Client-side broker for image tokens. Pages that render photographs carry only opaque ids (so they stay cacheable);
 * the browser asks `POST /api/img/token` for short-lived, width-bound tokens, batched so a gallery costs one request.
 * Tokens are cached for a little less than their lifetime and re-requested on a 403.
 */
export type Tokens = Record<number, string>;
const TTL_MS = 4 * 60 * 1000;
const cache = new Map<string, { tokens: Tokens; at: number; url: string }>();
const waiting = new Map<string, { url: string; resolvers: ((t: Tokens | null) => void)[] }>();
let timer: ReturnType<typeof setTimeout> | undefined;

async function flush() {
  timer = undefined;
  const batch = [...waiting.entries()];
  waiting.clear();
  const byUrl = new Map<string, typeof batch>();
  for (const e of batch) byUrl.set(e[1].url, [...(byUrl.get(e[1].url) ?? []), e]);
  for (const [url, entries] of byUrl)
    for (let i = 0; i < entries.length; i += 40) {
      const chunk = entries.slice(i, i + 40);
      let found: Record<string, Tokens> = {};
      try {
        const res = await fetch(url, {
          method: "POST",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids: chunk.map(([id]) => id) }),
        });
        if (res.ok) found = ((await res.json()) as { tokensById?: Record<string, Tokens> }).tokensById ?? {};
      } catch {}
      for (const [id, w] of chunk) {
        const tokens = found[id] ?? null;
        if (tokens) cache.set(id, { tokens, at: Date.now(), url });
        for (const r of w.resolvers) r(tokens);
      }
    }
}

export function requestTokens(
  id: string,
  url = "/api/img/token",
  opts: { fresh?: boolean } = {},
): Promise<Tokens | null> {
  const hit = cache.get(id);
  if (!opts.fresh && hit && hit.url === url && Date.now() - hit.at < TTL_MS) return Promise.resolve(hit.tokens);
  return new Promise((resolve) => {
    const w = waiting.get(id) ?? { url, resolvers: [] };
    w.resolvers.push(resolve);
    waiting.set(id, w);
    timer ??= setTimeout(() => void flush(), 25);
  });
}

/** Tests only. */
export function resetTokenBroker() {
  cache.clear();
  waiting.clear();
}
