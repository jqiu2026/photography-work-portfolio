import type { SocialLink } from "@placeholder/ui";

/** Dev-only placeholder. In production builds this returns undefined so empty facts are hidden (A30). */
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

/** Real links found in the original site (content.tsx). Edited in the CMS from Phase 2. */
export const socials: SocialLink[] = [
  { label: "LinkedIn", href: "https://www.linkedin.com/in/jqiu2026/", icon: "linkedin" },
  { label: "Instagram", href: "https://ig.jerryqiu.com", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com/@jqiu2026", icon: "youtube" },
  { label: "Email", href: `mailto:${person.email}`, icon: "email" },
];

export const nav = [
  { label: "Work", href: "/work" },
  { label: "Writing", href: "/writing" },
  { label: "About", href: "/about" },
];

export const legalLinks = [
  { label: "Privacy", href: "/privacy" },
  { label: "Terms", href: "/terms" },
  { label: "Licensing", href: "/licensing" },
  { label: "Accessibility", href: "/accessibility" },
];
