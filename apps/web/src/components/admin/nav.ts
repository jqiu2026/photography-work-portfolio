export type AdminSite = "hub" | "photos" | "music" | "flying";
export const adminSites: { id: AdminSite; label: string; note: string }[] = [
  { id: "hub", label: "Hub", note: "jerryqiu.com" },
  { id: "photos", label: "Photography", note: "photos." },
  { id: "music", label: "Music", note: "music." },
  { id: "flying", label: "Flying", note: "flying." },
];

export type NavItem = { label: string; href: string; sites?: AdminSite[]; owner?: boolean; hint?: string };
export type NavGroup = { title: string; items: NavItem[] };

/** Sections that depend on the selected site list `sites`; the rest are global. */
export const navGroups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { label: "Dashboard", href: "/admin" },
      { label: "Health", href: "/admin/health", hint: "env, database, storage" },
    ],
  },
  {
    title: "Content",
    items: [
      { label: "Profile & links", href: "/admin/profile", sites: ["hub"], hint: "headline, socials, skills" },
      { label: "Timeline", href: "/admin/timeline", sites: ["hub"], hint: "work, school, flying, music" },
      { label: "Posts", href: "/admin/posts", sites: ["hub"] },
      { label: "Projects", href: "/admin/projects", sites: ["hub"] },
      { label: "Galleries", href: "/admin/galleries", sites: ["photos"] },
      { label: "Music", href: "/admin/music", sites: ["music"], hint: "recordings and performances" },
      { label: "Flight log", href: "/admin/flying", sites: ["flying"], hint: "milestones, flights, aircraft" },
      { label: "Pages & settings", href: "/admin/settings", owner: true },
    ],
  },
  {
    title: "Library",
    items: [
      { label: "Media", href: "/admin/media" },
      { label: "Inbox", href: "/admin/inbox" },
      { label: "Trash", href: "/admin/trash" },
    ],
  },
  {
    title: "Admin",
    items: [
      { label: "Users", href: "/admin/users", owner: true },
      { label: "Audit log", href: "/admin/audit" },
      { label: "Redirects", href: "/admin/redirects" },
    ],
  },
];

export function itemsFor(site: AdminSite, role: "owner" | "editor" | "client"): NavGroup[] {
  return navGroups
    .map((g) => ({
      ...g,
      items: g.items.filter((i) => (!i.sites || i.sites.includes(site)) && (!i.owner || role === "owner")),
    }))
    .filter((g) => g.items.length);
}
