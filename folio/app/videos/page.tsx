import type { Metadata } from "next";
import { VideoGrid } from "@/components/VideoGrid";
import { VIDEOS } from "@/lib/videos";

export const metadata: Metadata = { title: "Videos", description: "Videos by Jerry Qiu." };

export default function VideosPage() {
  return (
    <>
      <section className="hero">
        <h1>
          Videos<span className="irid">.</span>
        </h1>
      </section>
      <main id="videos">
        {VIDEOS.length ? (
          <VideoGrid videos={VIDEOS} />
        ) : (
          <div className="empty">
            <p style={{ margin: 0 }}>Videos are on the way. Check back soon.</p>
          </div>
        )}
      </main>
    </>
  );
}
