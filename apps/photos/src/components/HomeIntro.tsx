"use client";

import { ProtectedImage } from "@halation/ui/media";
import { type ComponentProps, useEffect, useState } from "react";

type Asset = ComponentProps<typeof ProtectedImage>["asset"];
const KEY = "pub-intro";
/** Length of the sequence in ms. Keep in step with the `--intro` custom property in public.css. */
const LENGTH = 4600;

/**
 * First-visit intro for the home page: a line draws, opens into the lead photograph, the name rises, and the curtain lifts to
 * reveal the page while the top bar and the opening text arrive. The whole sequence is CSS (it works the moment the page
 * paints); this component only ends it early (click, key, Escape), remembers it for the session, switches it off for reduced
 * motion, and keeps the page behind it from scrolling or taking focus. Without JavaScript a <noscript> rule hides it.
 */
export function HomeIntro({ lead }: { lead?: Asset }) {
  const [state, setState] = useState<"playing" | "done" | "skipped" | "gone">("playing");

  useEffect(() => {
    let seen = false;
    try {
      seen = Boolean(sessionStorage.getItem(KEY));
    } catch {}
    if (seen || matchMedia("(prefers-reduced-motion: reduce)").matches) {
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
      try {
        sessionStorage.setItem(KEY, "1");
      } catch {}
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
        <div className="pi-photo">
          {lead ? <ProtectedImage asset={lead} alt="" fill priority sizes="100vw" /> : null}
        </div>
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
