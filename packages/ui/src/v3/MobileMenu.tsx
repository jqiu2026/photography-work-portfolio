"use client";

import { useRef } from "react";
import type { NavLink } from "./chrome";

/** Full-screen sheet on a native <dialog>: focus trap, Esc, inert page and focus return come from the platform. */
export function MobileMenu({ links, current }: { links: NavLink[]; current?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  return (
    <>
      <button type="button" className="hl3-menu-btn" aria-haspopup="dialog" onClick={() => ref.current?.showModal()}>
        Menu
      </button>
      <dialog
        ref={ref}
        className="hl3-sheet"
        aria-label="Menu"
        onClick={(e) => e.target === ref.current && ref.current?.close()}
      >
        <button type="button" className="hl3-menu-btn hl3-sheet__close" onClick={() => ref.current?.close()}>
          Close
        </button>
        <nav aria-label="Menu">
          <ul>
            {links.map((l, i) => (
              <li key={l.href} style={{ ["--i" as string]: i }}>
                <a href={l.href} aria-current={current === l.href ? "page" : undefined} onClick={() => ref.current?.close()}>
                  {l.label}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </dialog>
    </>
  );
}
