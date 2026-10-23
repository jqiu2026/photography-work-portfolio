import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { shootType, shootTypes } from "@/content/shoot-types";

export function generateStaticParams() {
  return shootTypes.map((t) => ({ type: t.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ type: string }> }): Promise<Metadata> {
  const t = shootType((await params).type);
  return t ? { title: `Book: ${t.label}`, description: t.blurb } : {};
}

/** Old per-type links (shared, bookmarked, in emails) land in the questionnaire with that kind already chosen. */
export default async function BookType({ params }: { params: Promise<{ type: string }> }) {
  const t = shootType((await params).type);
  if (!t) notFound();
  redirect(`/book?type=${t.slug}`);
}
