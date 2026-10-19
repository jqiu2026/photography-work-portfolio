"use client";

import { useEffect } from "react";

/**
 * For a page that opens as a story (the home page): the dock and the top bar stay out of the way until the reader
 * reaches the end of the page (the element marked `data-bar-end`), then slide in, and step back out when the reader
 * scrolls up into the story again. Without JavaScript nothing is hidden. Pressing Tab shows them for good, so keyboard
 * users can always reach the navigation. Styles: public.css (`.pub[data-bar]`).
 */
export function ChromeReveal() {
  useEffect(() => {
    const root = document.querySelector<HTMLElement>(".pub[data-intro]");
    const end = document.querySelector("[data-bar-end]");
    if (!root || !end) return;
    let pinned = false;
    let raf = 0;
    // shown once the end of the page has come a quarter of the way up the window (works for jumps and anchor links too)
    const check = () => {
      raf = 0;
      const shown = pinned || end.getBoundingClientRect().top < innerHeight * 0.75;
      root.setAttribute("data-bar", shown ? "shown" : "hidden");
    };
    const onScroll = () => {
      raf ||= requestAnimationFrame(check);
    };
    check();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onScroll);
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;
      pinned = true;
      check();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onScroll);
      window.removeEventListener("keydown", onKey);
      root.removeAttribute("data-bar");
    };
  }, []);
  return null;
}
