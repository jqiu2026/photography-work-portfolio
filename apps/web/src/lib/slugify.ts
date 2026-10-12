/** "My Title: A Story!" -> "my-title-a-story". Shared by the forms (live URL preview) and the Server Actions. */
export function slugify(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/\p{M}/gu, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}
