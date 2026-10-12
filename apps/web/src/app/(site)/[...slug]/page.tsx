import { notFound, permanentRedirect, redirect } from "next/navigation";
import { lookupRedirect } from "@/lib/content-db";

/** Unmatched URLs: follow a redirect rule from the CMS if one exists, otherwise render the site's own 404 page. */
export default async function CatchAll({ params }: { params: Promise<{ slug: string[] }> }) {
  const { slug } = await params;
  let path: string;
  try {
    path = `/${slug.map(decodeURIComponent).join("/")}`;
  } catch {
    notFound();
  }
  const hit = await lookupRedirect("hub", path);
  if (hit) (hit.permanent ? permanentRedirect : redirect)(hit.to);
  notFound();
}
