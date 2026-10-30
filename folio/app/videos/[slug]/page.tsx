import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { VideoDeck } from "@/components/VideoDeck";
import { PLAYLISTS } from "@/lib/videos-data";

type Props = { params: Promise<{ slug: string }> };

export const dynamicParams = false;
export function generateStaticParams() {
  return PLAYLISTS.map((p) => ({ slug: p.slug }));
}
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = PLAYLISTS.find((x) => x.slug === slug);
  return p ? { title: p.title, description: `${p.title}: ${p.videos.length} videos by Jerry Qiu.` } : {};
}

export default async function PlaylistPage({ params }: Props) {
  const { slug } = await params;
  const p = PLAYLISTS.find((x) => x.slug === slug);
  if (!p) notFound();
  return (
    <main className="plpage">
      <p className="crumb">
        <Link href="/videos">&larr; Videos</Link>
      </p>
      <h1 className="pltitle">{p.title}</h1>
      <p className="plmeta">{p.videos.length} videos</p>
      <VideoDeck videos={p.videos} playlistId={p.id} />
    </main>
  );
}
