import { notFound } from "next/navigation";

/** Unmatched URLs render the site's own 404 page (with the shared layout, lang and navigation). */
export default function CatchAll() {
  notFound();
}
