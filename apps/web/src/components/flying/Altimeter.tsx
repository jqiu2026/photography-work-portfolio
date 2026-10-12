"use client";

import { useStageOptional } from "@halation/ui/stage";
import { useEffect, useRef } from "react";

/**
 * Cockpit-style readout: scroll is the climb. A metaphor, not a real altitude (labelled "scroll altitude" for
 * assistive technology; the visual readout is aria-hidden). Updates the text directly, no React state per frame.
 */
export function Altimeter() {
  const stage = useStageOptional();
  const alt = useRef<HTMLSpanElement>(null);
  const hdg = useRef<HTMLSpanElement>(null);
  useEffect(() => {
    if (!stage) return;
    let raf = 0;
    const tick = () => {
      raf = requestAnimationFrame(tick);
      const p = stage.store.progress;
      if (alt.current) alt.current.textContent = String(Math.round(p * 12500)).padStart(5, "0");
      if (hdg.current) hdg.current.textContent = String(Math.round((p * 270 + 60) % 360)).padStart(3, "0");
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [stage]);
  return (
    <div className="fl-altimeter" aria-hidden="true">
      <p>
        <small>ALT FT</small>
        <span ref={alt}>00000</span>
      </p>
      <p>
        <small>HDG</small>
        <span ref={hdg}>060</span>
      </p>
    </div>
  );
}
