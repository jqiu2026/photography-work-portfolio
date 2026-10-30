import { Gallery } from "@/components/Gallery";
import { CATEGORIES } from "@/lib/photos-data";

export const metadata = { title: "Photos" };

export default function PhotosPage() {
  return (
    <>
      <section className="hero">
        <h1>
          Photos<span className="irid">.</span>
        </h1>
        <p>Events, sports, stage and the people in them. Scroll.</p>
      </section>
      <Gallery categories={CATEGORIES} />
    </>
  );
}
