import fs from "node:fs";
import path from "node:path";
import { sql } from "drizzle-orm";
import matter from "gray-matter";
import type { Database } from "./client";
import * as s from "./schema";

/**
 * Imports the content that exists in the repo (MDX posts and projects, social links, about facts) into the database.
 * Idempotent: rows are keyed by slug/label and left alone if they already exist (owner edits are never overwritten).
 * Real facts only (see docs/project/audit-once-ui.md); nothing is invented.
 */
export type SeedOptions = { webRoot: string; adminEmails?: string[] };

const readMdx = (dir: string) =>
  fs.existsSync(dir)
    ? fs
        .readdirSync(dir)
        .filter((f) => f.endsWith(".mdx"))
        .map((f) => {
          const { data, content } = matter(fs.readFileSync(path.join(dir, f), "utf8"));
          return { slug: f.replace(/\.mdx$/, ""), data, content };
        })
    : [];

const minutes = (text: string) => Math.max(1, Math.round(text.split(/\s+/).length / 220));

export async function seed(db: Database, opts: SeedOptions) {
  const out = { users: 0, posts: 0, projects: 0, social: 0, timeline: 0, settings: 0 };

  for (const email of opts.adminEmails ?? []) {
    const r = await db
      .insert(s.users)
      .values({ email: email.toLowerCase(), role: "owner", addedBy: "seed" })
      .onConflictDoNothing()
      .returning({ id: s.users.id });
    out.users += r.length;
  }

  const posts = readMdx(path.join(opts.webRoot, "src/content/posts"));
  for (const p of posts) {
    const r = await db
      .insert(s.posts)
      .values({
        site: "hub",
        slug: p.slug,
        title: String(p.data.title ?? p.slug),
        subtitle: p.data.subtitle || null,
        summary: p.data.summary || null,
        body: p.content.trim(),
        tags: p.data.tag ? [String(p.data.tag)] : [],
        status: "published",
        publishAt: p.data.publishedAt ? new Date(p.data.publishedAt) : new Date(),
        readingMinutes: minutes(p.content),
        updatedBy: "seed",
      })
      .onConflictDoNothing()
      .returning({ id: s.posts.id });
    out.posts += r.length;
  }

  const projects = readMdx(path.join(opts.webRoot, "src/content/projects"));
  for (const [i, p] of projects.entries()) {
    const credits = Array.isArray(p.data.team)
      ? p.data.team.map((t: { name: string; role: string; instagram?: string }) => ({
          name: t.name,
          role: t.role,
          url: t.instagram,
        }))
      : [];
    const r = await db
      .insert(s.projects)
      .values({
        site: "hub",
        slug: p.slug,
        type: "photography",
        title: String(p.data.title ?? p.slug),
        summary: p.data.summary || null,
        date: p.data.publishedAt ? String(p.data.publishedAt).slice(0, 10) : null,
        blocks: [{ type: "text", markdown: p.content.trim() }],
        credits,
        status: "published",
        protectedPage: p.data.protected === true,
        sort: projects.length - i,
        updatedBy: "seed",
      })
      .onConflictDoNothing()
      .returning({ id: s.projects.id });
    out.projects += r.length;
  }

  // Real links found on the original site.
  const links = [
    {
      label: "LinkedIn",
      href: "https://www.linkedin.com/in/jqiu2026/",
      icon: "linkedin",
      showHeader: false,
      showFooter: true,
    },
    { label: "Instagram", href: "https://ig.jerryqiu.com", icon: "instagram", showHeader: false, showFooter: true },
    {
      label: "YouTube",
      href: "https://www.youtube.com/@jqiu2026",
      icon: "youtube",
      showHeader: false,
      showFooter: true,
    },
    { label: "Email", href: "mailto:hello@jerryqiu.com", icon: "email", showHeader: false, showFooter: true },
  ];
  const existing = await db.select({ label: s.socialLinks.label }).from(s.socialLinks);
  for (const [i, l] of links.entries()) {
    if (existing.some((e) => e.label === l.label)) continue;
    await db.insert(s.socialLinks).values({ ...l, sort: i, site: "all", updatedBy: "seed" });
    out.social++;
  }

  // Real timeline facts from the original About page.
  const have = await db.select({ title: s.timelineEntries.title }).from(s.timelineEntries);
  const timeline = [
    {
      category: "work" as const,
      title: "Student Teaching Assistant",
      org: "Monroe YABC",
      startDate: "2025-02-01",
      endDate: "2025-06-30",
      summary: "Helped teach a drone piloting class.",
    },
    {
      category: "education" as const,
      title: "Stuyvesant High School",
      org: null,
      startDate: null,
      endDate: "2026-06-30",
      summary: "High school diploma with an advanced Regents designation.",
    },
  ];
  for (const [i, t] of timeline.entries()) {
    if (have.some((h) => h.title === t.title)) continue;
    await db.insert(s.timelineEntries).values({ ...t, sort: i, updatedBy: "seed" });
    out.timeline++;
  }

  const defaults: [string, string, unknown][] = [
    [
      "hub",
      "profile",
      {
        name: "Jerry Qiu",
        headline: "I take photographs, build things with code, and fly drones.",
        location: "New York",
        currently: "",
        email: "hello@jerryqiu.com",
        bookingEmail: "bookings@jerryqiu.com",
        languages: ["English", "Mandarin Chinese", "French"],
      },
    ],
    [
      "hub",
      "seo",
      {
        title: "Jerry Qiu",
        description: "Photographs, projects and writing by Jerry Qiu, a photographer and builder in New York.",
      },
    ],
    [
      "all",
      "protection",
      { portfolio: "light", clientGalleries: "strict", watermark: false, watermarkText: "© Jerry Qiu" },
    ],
    ["all", "maintenance", { enabled: false, message: "Back soon." }],
    [
      "photos",
      "seo",
      {
        title: "Photography · Jerry Qiu",
        description: "Photography by Jerry Qiu: theater, events, street and aviation.",
      },
    ],
  ];
  for (const [site, key, value] of defaults) {
    const r = await db
      .insert(s.settings)
      .values({ site: site as "hub", key, value, updatedBy: "seed" })
      .onConflictDoNothing()
      .returning({ key: s.settings.key });
    out.settings += r.length;
  }
  await db.execute(sql`select 1`);
  return out;
}
