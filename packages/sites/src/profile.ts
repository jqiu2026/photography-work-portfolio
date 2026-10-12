/** Facts about the owner shared by every site. Real facts come from the original site; the rest are dev-only placeholders (A30). */
type SocialLink = { label: string; href: string; icon: string };

/** Dev-only placeholder. In production builds this returns undefined so empty facts are hidden. */
export const todo = (what: string): string | undefined =>
  process.env.NODE_ENV === "production" ? undefined : `TODO(owner): ${what}`;

export const person = {
  name: "Jerry Qiu",
  firstName: "Jerry",
  location: "New York",
  email: "hello@jerryqiu.com",
  bookingEmail: "bookings@jerryqiu.com",
  languages: ["English", "Mandarin Chinese", "French"],
  // TODO(owner): rewrite headline in your voice
  headline: "I take photographs, build things with code, and fly drones.",
  currently: todo("one line about what you're doing right now"),
};

/** Real links found in the original site. Edited in the CMS from Phase 2. */
export const socials: SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jqiu2026/", icon: "linkedin" },
  { label: "Instagram", href: "https://ig.jerryqiu.com", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/@jqiu2026", icon: "youtube" },
  { label: "Email", href: `mailto:${person.email}`, icon: "email" },
];

/** Legal pages live on the hub only; other sites link to them absolutely. */
export const legalPaths = [
  { label: "Privacy", path: "/privacy" },
  { label: "Terms", path: "/terms" },
  { label: "Licensing", path: "/licensing" },
  { label: "Accessibility", path: "/accessibility" },
];
