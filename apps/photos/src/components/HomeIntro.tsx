"use client";

import { ProtectedImage } from "@halation/ui/media";
import { type ComponentProps, useEffect, useState } from "react";

type Asset = ComponentProps<typeof ProtectedImage>["asset"];
/** Set once the intro has played in this page load, so moving around the site and back to home does not replay it. */
let played = false;
/** Length of the sequence in ms. Keep in step with the `--intro` custom property in public.css. */
const LENGTH = 6000;

/**
 * Intro for the home page, on every fresh load: a line draws, opens onto a quick cut of three photographs, the name rises, and the curtain lifts to
 * reveal the page while the top bar and the opening text arrive. The whole sequence is CSS (it works the moment the page
 * paints); this component only ends it early (click, key, Escape), plays once per page load, switches it off for reduced
 * motion, and keeps the page behind it from scrolling or taking focus. Without JavaScript a <noscript> rule hides it.
 */
export function HomeIntro({ shots }: { shots: Asset[] }) {
  const [state, setState] = useState<"playing" | "done" | "skipped" | "gone">("playing");

  useEffect(() => {
    if (played || matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setState("skipped");
      return;
    }
    const root = document.documentElement;
    const behind = document.querySelectorAll<HTMLElement>(".pub-bar, .pub-foot, .pub-main > :not(.pub-intro)");
    root.style.overflow = "hidden";
    for (const el of behind) el.inert = true;
    const release = () => {
      root.style.overflow = "";
      for (const el of behind) el.inert = false;
    };
    const finish = (how: "done" | "skipped") => {
      played = true;
      release();
      setState(how);
    };
    const timer = setTimeout(() => finish("done"), LENGTH);
    const gone = setTimeout(() => setState("gone"), LENGTH + 100);
    const onKey = (e: KeyboardEvent) => {
      if (["Escape", "Enter", " "].includes(e.key)) {
        clearTimeout(timer);
        finish("skipped");
      }
    };
    window.addEventListener("keydown", onKey);
    (window as unknown as { __skipIntro?: () => void }).__skipIntro = () => {
      clearTimeout(timer);
      finish("skipped");
    };
    return () => {
      clearTimeout(timer);
      clearTimeout(gone);
      window.removeEventListener("keydown", onKey);
      release();
    };
  }, []);

  if (state === "gone" || state === "skipped") return <div className="pub-intro" data-state="skipped" hidden />;
  return (
    <div className="pub-intro" data-state={state}>
      <div className="pi-line" aria-hidden="true" />
      <div className="pi-frame" aria-hidden="true">
        {shots.map((a, i) => (
          <div className="pi-photo" key={a.id ?? i}>
            <ProtectedImage asset={a} alt="" fill priority sizes="100vw" />
          </div>
        ))}
      </div>
      <div className="pi-title" aria-hidden="true">
        <h2>
          <span className="pi-word">
            <b>Jerry</b>
          </span>{" "}
          <span className="pi-word">
            <b>Qiu</b>
          </span>
        </h2>
        <p>Photography · New York</p>
      </div>
      <button
        type="button"
        className="pi-skip"
        onClick={() => (window as unknown as { __skipIntro?: () => void }).__skipIntro?.()}
      >
        Skip intro
      </button>
    </div>
  );
}
