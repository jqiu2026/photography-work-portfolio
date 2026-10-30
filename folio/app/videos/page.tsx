import type { Metadata } from "next";
import Link from "next/link";
import { SingleVideos } from "@/components/SingleVideos";
import { thumbOf } from "@/components/yt";
import { PLAYLISTS, SINGLES } from "@/lib/videos-data";

export const metadata: Metadata = { title: "Videos", description: "Videos by Jerry Qiu: concerts, showcases and shows." };

export default function VideosPage() {
  return (
    <>
      <section className="hero">
        <h1>
          Videos<span className="irid">.</span>
        </h1>
        <p>Concerts, showcases and shows. Everything plays right here.</p>
      </section>
      <main id="videos">
        <section className="cat" aria-labelledby="pl-h">
          <h2 id="pl-h">
            Playlists<small>{String(PLAYLISTS.length).padStart(2, "0")}</small>
          </h2>
          <div className="plgrid">
            {PLAYLISTS.map((p) => (
              <Link key={p.slug} href={`/videos/${p.slug}`} className="plcard">
                <span className="plthumb">
                  {/* biome-ignore lint/performance/noImgElement: local thumbnail files */}
                  <img src={thumbOf(p.videos[0].id)} alt="" width={640} height={360} loading="lazy" decoding="async" draggable={false} />
                  <span className="plcount">{p.videos.length} videos</span>
                </span>
                <span className="vtitle">{p.title}</span>
              </Link>
            ))}
          </div>
        </section>
        <section className="cat" aria-labelledby="all-h">
          <h2 id="all-h">
            More videos<small>{String(SINGLES.length).padStart(2, "0")}</small>
          </h2>
          <SingleVideos videos={SINGLES} />
        </section>
      </main>
    </>
  );
}
