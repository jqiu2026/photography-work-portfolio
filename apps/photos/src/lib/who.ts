import "server-only";
import { type Database, schema } from "@jerryqiu/db";
import { eq } from "drizzle-orm";
import { portalSession } from "@/lib/portal";
import type { GalleryAccess } from "@/lib/client-gallery";

/** How a viewer got into a gallery, in words the owner can read (never the passcode itself). */
export async function accessWords(db: Database, a: GalleryAccess): Promise<string> {
  if (a.via === "account") {
    if (a.clientId) {
      const [c] = await db.select().from(schema.studioClients).where(eq(schema.studioClients.id, a.clientId));
      if (c) return `Signed in to the client portal as ${c.email}`;
    }
    return "Signed in to the client portal";
  }
  if (a.role === "visitor") {
    const m = (await portalSession())?.m;
    if (m) {
      const [v] = await db.select().from(schema.studioVisitors).where(eq(schema.studioVisitors.id, m));
      if (v) return `Visitor who gave the email ${v.email}`;
    }
    return "Visitor through the public link (no email asked)";
  }
  return "Signed in with the gallery passcode (the client's own password)";
}

/** A browser and system in a few words, from the user-agent header. */
export function deviceWords(ua: string | null): string {
  if (!ua) return "unknown device";
  const browser = /Edg\//.test(ua)
    ? "Edge"
    : /OPR\//.test(ua)
      ? "Opera"
      : /Firefox\//.test(ua)
        ? "Firefox"
        : /Chrome\//.test(ua)
          ? "Chrome"
          : /Safari\//.test(ua)
            ? "Safari"
            : "a browser";
  const os = /iPhone|iPad/.test(ua)
    ? "iOS"
    : /Android/.test(ua)
      ? "Android"
      : /Mac OS X/.test(ua)
        ? "macOS"
        : /Windows/.test(ua)
          ? "Windows"
          : /Linux/.test(ua)
            ? "Linux"
            : "an unknown system";
  return `${browser} on ${os}`;
}
