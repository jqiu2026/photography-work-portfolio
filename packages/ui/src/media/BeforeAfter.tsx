"use client";

import { useState, type ReactNode } from "react";

/** Drag (or use arrow keys on the slider) to compare two images of the same size. */
export function BeforeAfter({
  before,
  after,
  label = "Comparison position",
  beforeLabel,
  afterLabel,
}: { before: ReactNode; after: ReactNode; label?: string; beforeLabel?: string; afterLabel?: string }) {
  const [pos, setPos] = useState(50);
  return (
    <div className="hl-ba">
      <div className="hl-ba__layer">{after}</div>
      <div className="hl-ba__layer" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {before}
      </div>
      {beforeLabel ? <span className="hl-ba__tag hl-ba__tag--l">{beforeLabel}</span> : null}
      {afterLabel ? <span className="hl-ba__tag hl-ba__tag--r">{afterLabel}</span> : null}
      <span className="hl-ba__bar" style={{ left: `${pos}%` }} aria-hidden />
      <input
        className="hl-ba__range"
        type="range"
        min={0}
        max={100}
        value={pos}
        onChange={(e) => setPos(+e.target.value)}
        aria-label={label}
      />
    </div>
  );
}
