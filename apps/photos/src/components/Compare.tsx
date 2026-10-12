"use client";

import { BeforeAfter, Image, type GalleryImage } from "@halation/ui/media";
import { useState } from "react";

/**
 * Drag to compare. Today it compares each photograph in colour with a monochrome conversion.
 * TODO(owner): to show real "straight out of camera vs edited" pairs, supply the unedited files and
 * add them to `content/portfolio.ts` (`edits`); this component then switches to those automatically.
 */
export function Compare({ photos }: { photos: GalleryImage[] }) {
  const [i, setI] = useState(0);
  const p = photos[i];
  return (
    <div className="compare">
      <div className="compare__stage">
        <BeforeAfter
          key={p.files[0].src}
          beforeLabel="Colour"
          afterLabel="Monochrome"
          label={`Compare colour and monochrome versions of ${p.alt}`}
          before={<Image asset={p} alt={`${p.alt}, in colour`} sizes="(min-width: 860px) 60vw, 100vw" />}
          after={
            <Image
              asset={p}
              alt=""
              sizes="(min-width: 860px) 60vw, 100vw"
              style={{ filter: "grayscale(1) contrast(1.12) brightness(0.96)" }}
            />
          }
        />
      </div>
      <div>
        <p className="hl-eyebrow" style={{ marginBottom: "1rem" }}>
          Compare
        </p>
        <h2 className="hl-heading hl-heading--display" style={{ fontSize: "var(--hl-text-4xl)" }}>
          Colour, or not.
        </h2>
        <p className="hl-text hl-text--muted" style={{ marginTop: "1rem" }}>
          Drag the handle. The same frame, with and without its colour: sometimes the picture is the light, sometimes it
          is the colour.
        </p>
        <div className="compare__picks" role="group" aria-label="Choose a photograph">
          {photos.map((x, n) => (
            <button
              key={x.files[0].src}
              type="button"
              aria-pressed={n === i}
              onClick={() => setI(n)}
            >{`Photo ${n + 1}`}</button>
          ))}
        </div>
      </div>
    </div>
  );
}
