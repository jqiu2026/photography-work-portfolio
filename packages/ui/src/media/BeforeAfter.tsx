"use client";

import { useState, type ReactNode } from "react";

/** Drag (or use arrow keys on the slider) to compare two images of the same size. */
export function BeforeAfter({ before, after, label = "Comparison position" }: { before: ReactNode; after: ReactNode; label?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="ph-ba">
      <div className="ph-ba__layer">{after}</div>
      <div className="ph-ba__layer" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>{before}</div>
      <span className="ph-ba__bar" style={{ left: `${pos}%` }} aria-hidden />
      <input className="ph-ba__range" type="range" min={0} max={100} value={pos} onChange={(e) => setPos(+e.target.value)} aria-label={label} />
    </div>
  );
}
