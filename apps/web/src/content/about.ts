import { todo } from "./site";

/** Real facts carried over from the original About page. Anything missing is a dev-only placeholder. */
export const intro =
  "Jerry is a creator and photographer based in New York City. He approaches photography thoughtfully, aiming to capture moments that matter. He has contributed to several non-profits and his high school through his work.";

export const timeline = [
  {
    title: "Student Teaching Assistant",
    org: "Monroe YABC",
    period: "Feb – Jun 2025",
    summary: "Helped teach a drone piloting class.",
  },
  {
    title: "Stuyvesant High School",
    period: "Class of 2026",
    summary: "High school diploma with an advanced Regents designation.",
  },
  {
    title: todo("college name") ?? "",
    period: todo("start year") ?? "",
    summary: "Planning to study aerospace engineering (B.S.).",
  },
].filter((t) => t.title && t.period);

export const skills: { title: string; body: string; tags: string[] }[] = [
  {
    title: "Adobe Creative Cloud",
    body: "Several years using Lightroom and Lightroom Classic for photo editing, Premiere for video editing, and Photoshop for corrections and creative projects.",
    tags: ["Lightroom", "Premiere", "Photoshop"],
  },
  {
    title: "Drone piloting",
    body: "Certified drone pilot (FAA Part 107) with some experience in aerial photography and videography. Currently exploring FPV flying.",
    tags: ["Part 107", "DJI", "FPV"],
  },
  {
    title: "Graphic design",
    body: "Social media graphics and visual content in Figma and Canva, with a focus on clean, thoughtful design that communicates clearly.",
    tags: ["Figma", "Canva"],
  },
  {
    title: "Digital content",
    body: "Managing social media accounts, creating content and reading performance numbers. Administrator of the Roblox Shipping Lanes Wiki.",
    tags: ["Instagram", "Fandom wiki"],
  },
  {
    title: "Coding",
    body: "Python (3+ years), Lua and Luau in Roblox Studio (3+ years), Java (1+ year), plus web technologies and GitHub.",
    tags: ["Python", "Lua", "Java", "Web", "GitHub"],
  },
];

export const managed = [
  { label: "@stuyaviators", href: "https://instagram.com/stuyaviators", period: "April 2024 – present" },
  { label: "@stuycast", href: "https://instagram.com/stuycast", period: "September 2025 – present" },
  { label: "@seniorsing26", href: "https://instagram.com/seniorsing26", period: "Jan – Mar 2026" },
];
