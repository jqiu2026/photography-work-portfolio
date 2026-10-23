"use client";

import { HelpIcon, Kbd, KbdGroup, Tooltip } from "@holominimal/ui";
import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";

const MIN = 1;
const MAX = 6;
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/**
 * Zoom and pan for whatever sits inside it (a protected photograph in a viewer): wheel or trackpad pinch zooms toward
 * the pointer, double-click or double-tap toggles, drag pans, two fingers pinch, the + and - keys and the buttons zoom,
 * 0 resets. At 1x everything else (swipe to the next photograph, click the backdrop to close) behaves as before.
 * It transforms the picture only; the photograph is still the same token-fetched blob, so protection is unchanged.
 */
export function ZoomStage({
  children,
  onZoomChange,
  className,
}: {
  children: ReactNode;
  onZoomChange?: (zoomed: boolean) => void;
  className?: string;
}) {
  const box = useRef<HTMLDivElement>(null);
  const view = useRef({ k: 1, x: 0, y: 0 });
  const [k, setK] = useState(1);
  const [dragging, setDragging] = useState(false);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const pinch = useRef<{ d: number; k: number } | null>(null);
  const moved = useRef(false);
  const wasZoomed = useRef(false);

  const apply = useCallback(
    (next: { k: number; x: number; y: number }) => {
      const el = box.current;
      if (!el) return;
      const w = el.clientWidth;
      const h = el.clientHeight;
      const kk = clamp(next.k, MIN, MAX);
      // keep the picture covering the window: it can slide only as far as its enlarged edge
      const mx = ((kk - 1) * w) / 2;
      const my = ((kk - 1) * h) / 2;
      view.current = { k: kk, x: clamp(next.x, -mx, mx), y: clamp(next.y, -my, my) };
      if (kk === 1) view.current = { k: 1, x: 0, y: 0 };
      el.style.setProperty("--zk", String(view.current.k));
      el.style.setProperty("--zx", `${view.current.x}px`);
      el.style.setProperty("--zy", `${view.current.y}px`);
      const zoomed = view.current.k > 1.001;
      if (zoomed !== wasZoomed.current) {
        wasZoomed.current = zoomed;
        onZoomChange?.(zoomed);
      }
      setK(view.current.k);
    },
    [onZoomChange],
  );

  /** Zoom to `kk`, keeping the point under (cx, cy) (relative to the window's center) where it is. */
  const zoomAt = useCallback(
    (kk: number, cx: number, cy: number) => {
      const v = view.current;
      const target = clamp(kk, MIN, MAX);
      const r = target / v.k;
      apply({ k: target, x: cx - (cx - v.x) * r, y: cy - (cy - v.y) * r });
    },
    [apply],
  );
  const around = useCallback((e: { clientX: number; clientY: number }) => {
    const r = box.current?.getBoundingClientRect();
    return r ? { cx: e.clientX - r.left - r.width / 2, cy: e.clientY - r.top - r.height / 2 } : { cx: 0, cy: 0 };
  }, []);

  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const { cx, cy } = around(e);
      zoomAt(view.current.k * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0022)), cx, cy);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt, around]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "+" || e.key === "=") zoomAt(view.current.k * 1.5, 0, 0);
      else if (e.key === "-" || e.key === "_") zoomAt(view.current.k / 1.5, 0, 0);
      else if (e.key === "0") apply({ k: 1, x: 0, y: 0 });
      else return;
      e.preventDefault();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [apply, zoomAt]);

  const down = (e: React.PointerEvent) => {
    if ((e.target as Element).closest("button")) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    moved.current = false;
    if (pointers.current.size === 2) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      pinch.current = { d: Math.hypot(a.x - b.x, a.y - b.y), k: view.current.k };
    }
    if (view.current.k > 1) {
      (e.currentTarget as Element).setPointerCapture?.(e.pointerId);
      setDragging(true);
    }
  };
  const move = (e: React.PointerEvent) => {
    const p = pointers.current.get(e.pointerId);
    if (!p) return;
    const dx = e.clientX - p.x;
    const dy = e.clientY - p.y;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.abs(dx) + Math.abs(dy) > 1) moved.current = true;
    if (pointers.current.size === 2 && pinch.current) {
      const [a, b] = [...pointers.current.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const d = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = around({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      zoomAt(pinch.current.k * (d / Math.max(1, pinch.current.d)), mid.cx, mid.cy);
    } else if (view.current.k > 1) {
      apply({ ...view.current, x: view.current.x + dx, y: view.current.y + dy });
    }
  };
  const up = (e: React.PointerEvent) => {
    pointers.current.delete(e.pointerId);
    if (pointers.current.size < 2) pinch.current = null;
    if (!pointers.current.size) setDragging(false);
  };

  const zoomed = k > 1.001;
  return (
    <div
      ref={box}
      className={["pm-zoom", zoomed && "is-zoomed", dragging && "is-dragging", className].filter(Boolean).join(" ")}
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      onDoubleClick={(e) => {
        if ((e.target as Element).closest("button")) return;
        const { cx, cy } = around(e);
        if (view.current.k > 1.001) apply({ k: 1, x: 0, y: 0 });
        else zoomAt(2.6, cx, cy);
      }}
    >
      <div className="pm-zoom-inner">{children}</div>
      <div className="pm-zoom-bar" role="group" aria-label="Zoom">
        <button
          type="button"
          aria-label="Zoom out"
          disabled={!zoomed}
          onClick={() => zoomAt(view.current.k / 1.6, 0, 0)}
        >
          −
        </button>
        <button type="button" aria-label="Reset zoom" disabled={!zoomed} onClick={() => apply({ k: 1, x: 0, y: 0 })}>
          {Math.round(k * 100)}%
        </button>
        <button
          type="button"
          aria-label="Zoom in"
          disabled={k >= MAX}
          onClick={() => zoomAt(view.current.k * 1.6, 0, 0)}
        >
          +
        </button>
        <Tooltip
          side="top"
          align="end"
          content={
            <dl className="pm-zoom-hint">
              <div>
                <dt>
                  <Kbd>Scroll</Kbd>
                </dt>
                <dd>Zoom</dd>
              </div>
              <div>
                <dt>
                  <KbdGroup>
                    <Kbd>+</Kbd>
                    <Kbd>−</Kbd>
                  </KbdGroup>
                </dt>
                <dd>Zoom in, out</dd>
              </div>
              <div>
                <dt>
                  <Kbd>0</Kbd>
                </dt>
                <dd>Reset</dd>
              </div>
              <div>
                <dt>
                  <Kbd>Double-click</Kbd>
                </dt>
                <dd>Toggle</dd>
              </div>
              <div>
                <dt>
                  <Kbd>Drag</Kbd>
                </dt>
                <dd>Move</dd>
              </div>
            </dl>
          }
        >
          <button type="button" className="pm-zoom-help" aria-label="Zoom shortcuts">
            <HelpIcon />
          </button>
        </Tooltip>
      </div>
    </div>
  );
}
