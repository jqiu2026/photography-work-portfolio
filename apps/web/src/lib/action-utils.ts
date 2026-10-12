import { z } from "zod";
import type { ActionState } from "@/components/admin/form-kit";

/** FormData helpers: checkboxes, optional text, comma lists. */
export const fdStr = (fd: FormData, k: string) => {
  const v = fd.get(k);
  return typeof v === "string" ? v : "";
};
export const fdBool = (fd: FormData, k: string) => fd.get(k) === "on" || fd.get(k) === "true";
export const fdList = (fd: FormData, k: string) =>
  fdStr(fd, k)
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
/** Empty string becomes undefined, so optional DB columns store null. */
export const blank = (s: string | undefined) => (s && s.trim() ? s.trim() : null);

export const slug = z
  .string()
  .trim()
  .min(1, "Required")
  .max(80)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers and dashes only");
export const optionalUrl = z
  .string()
  .trim()
  .max(500)
  .refine((v) => v === "" || /^(https?:\/\/|mailto:|\/)/i.test(v), "Must start with https://, mailto: or /");

export function parseForm<T extends z.ZodType>(
  schema: T,
  data: Record<string, unknown>,
): { ok: true; data: z.infer<T> } | { ok: false; state: ActionState } {
  const r = schema.safeParse(data);
  if (r.success) return { ok: true, data: r.data };
  const fieldErrors: Record<string, string> = {};
  for (const issue of r.error.issues) fieldErrors[String(issue.path[0] ?? "form")] ??= issue.message;
  return { ok: false, state: { ok: false, error: "Check the highlighted fields.", fieldErrors } };
}

/** "My Title: A Story!" -> "my-title-a-story" */
export function slugify(s: string): string {
  return (
    s
      .normalize("NFKD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 80) || "untitled"
  );
}

export function readingMinutes(markdown: string): number {
  return Math.max(1, Math.round(markdown.split(/\s+/).filter(Boolean).length / 220));
}
