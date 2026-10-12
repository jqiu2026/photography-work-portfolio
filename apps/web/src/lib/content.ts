import { getPosts } from "@/utils/utils";

export type Project = ReturnType<typeof getProjects>[number];

export function getProjects() {
  return getPosts(["src", "content", "projects"]).sort((a, b) => +new Date(b.metadata.publishedAt) - +new Date(a.metadata.publishedAt));
}

export function getWriting() {
  return getPosts(["src", "content", "posts"]).sort((a, b) => +new Date(b.metadata.publishedAt) - +new Date(a.metadata.publishedAt));
}

/** "/images/projects/stuy-sing-26/senior.png" -> optimized manifest id "stuy-sing-26-senior" */
export function imageId(src: string) {
  return src
    .replace(/^\/images\/(projects|blogs)\//, "")
    .toLowerCase()
    .replace(/\.[^.]+$/, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function projectCover(p: Project) {
  const first = p.metadata.images?.[0];
  return first ? { group: "projects" as const, id: imageId(first) } : null;
}
