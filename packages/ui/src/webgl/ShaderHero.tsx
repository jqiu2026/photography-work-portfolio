"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { useCalm } from "../motion/core";

const vertex = /* glsl */ `
attribute vec2 uv; attribute vec2 position; varying vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const fragment = /* glsl */ `
precision highp float;
uniform sampler2D tMap; uniform vec2 uRes; uniform vec2 uImg; uniform vec2 uMouse;
uniform float uTime; uniform float uScroll; uniform float uIntensity; uniform float uReveal;
varying vec2 vUv;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ return 0.5*n(p) + 0.25*n(p*2.0) + 0.125*n(p*4.0); }
vec2 cover(vec2 uv){ float ra = uRes.x/uRes.y, ia = uImg.x/uImg.y;
  vec2 s = ra > ia ? vec2(1.0, ia/ra) : vec2(ra/ia, 1.0); return (uv - 0.5) * s + 0.5; }
void main(){
  vec2 uv = cover(vUv);
  vec2 aspect = vec2(uRes.x/uRes.y, 1.0);
  float d = distance(vUv*aspect, uMouse*aspect);
  float m = smoothstep(0.5, 0.0, d);
  vec2 flow = vec2(fbm(uv*3.0 + uTime*0.04), fbm(uv*3.0 + 7.0 - uTime*0.04)) - 0.5;
  vec2 disp = flow * 0.018 * uIntensity + (uv - cover(uMouse)) * m * 0.025 * uIntensity;
  uv = (uv - 0.5) * (1.0 - uScroll * 0.08 - (1.0-uReveal) * 0.06) + 0.5;
  float ca = 0.0045 * m * uIntensity;
  vec3 col = vec3(texture2D(tMap, uv + disp + vec2(ca, 0.0)).r, texture2D(tMap, uv + disp).g, texture2D(tMap, uv + disp - vec2(ca, 0.0)).b);
  float leak = smoothstep(0.85, 0.0, distance(vUv, vec2(1.0 + sin(uTime*0.15)*0.12, 0.05))) * 0.14 * uIntensity;
  col += vec3(1.0, 0.55, 0.3) * leak;
  gl_FragColor = vec4(col * uReveal, 1.0);
}`;

export type ShaderHeroProps = {
  src: string;
  alt: string;
  /** 0 to 1.5, strength of the displacement / light leak. */
  intensity?: number;
  /** Responsive candidates for the fallback <img> (the WebGL texture uses `src`). */
  srcSet?: string;
  sizes?: string;
  className?: string;
  /** Rendered on top of the canvas (headline etc). */
  children?: ReactNode;
};

function lowPower() {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return !!nav.connection?.saveData || (nav.deviceMemory ?? 8) <= 2 || (navigator.hardwareConcurrency ?? 8) <= 2;
}

/**
 * Hero image with a soft WebGL treatment (drifting displacement, pointer-reactive chromatic split,
 * a faint light leak, slow zoom on scroll). ogl is imported on demand, rendering pauses off-screen,
 * DPR is capped at 1.5, and it falls back to the plain image for reduced motion, Save-Data,
 * low-power devices or when WebGL is unavailable. The image is always in the DOM (alt text, no-JS, LCP).
 */
export function ShaderHero({ src, alt, intensity = 1, srcSet, sizes, className, children }: ShaderHeroProps) {
  const calm = useCalm();
  const wrap = useRef<HTMLDivElement>(null);
  const canvasHost = useRef<HTMLDivElement>(null);
  const [live, setLive] = useState(false);

  useEffect(() => {
    if (calm || lowPower()) return;
    let dispose = () => {};
    let cancelled = false;
    (async () => {
      const host = canvasHost.current;
      const box = wrap.current;
      if (!host || !box) return;
      const probe = document.createElement("canvas");
      if (!(probe.getContext("webgl") || probe.getContext("webgl2"))) return;
      const { Renderer, Program, Mesh, Triangle, Texture } = await import("ogl");
      if (cancelled) return;
      const renderer = new Renderer({ dpr: Math.min(window.devicePixelRatio || 1, 1.5), alpha: false, antialias: false });
      const gl = renderer.gl;
      host.appendChild(gl.canvas);
      gl.canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%;display:block";
      const texture = new Texture(gl, { generateMipmaps: false });
      const program = new Program(gl, {
        vertex, fragment,
        uniforms: { tMap: { value: texture }, uRes: { value: [1, 1] }, uImg: { value: [1, 1] }, uMouse: { value: [0.5, 0.5] }, uTime: { value: 0 }, uScroll: { value: 0 }, uIntensity: { value: intensity }, uReveal: { value: 0 } },
      });
      const mesh = new Mesh(gl, { geometry: new Triangle(gl), program });
      const mouse = [0.5, 0.5];
      const target = [0.5, 0.5];
      const resize = () => {
        renderer.setSize(box.clientWidth, box.clientHeight);
        program.uniforms.uRes.value = [box.clientWidth, box.clientHeight];
      };
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
        if (cancelled) return;
        texture.image = img;
        program.uniforms.uImg.value = [img.naturalWidth, img.naturalHeight];
        resize();
        setLive(true);
        start();
      };
      img.src = src;

      let raf = 0;
      let visible = true;
      let t0 = performance.now();
      let reveal = 0;
      const frame = (t: number) => {
        raf = requestAnimationFrame(frame);
        if (!visible) return;
        mouse[0] += (target[0] - mouse[0]) * 0.08;
        mouse[1] += (target[1] - mouse[1]) * 0.08;
        reveal = Math.min(1, reveal + 0.02);
        const r = box.getBoundingClientRect();
        const u = program.uniforms;
        u.uMouse.value = [mouse[0], mouse[1]];
        u.uTime.value = (t - t0) / 1000;
        u.uScroll.value = Math.max(0, Math.min(1, -r.top / Math.max(1, r.height)));
        u.uReveal.value = 1 - (1 - reveal) ** 3;
        renderer.render({ scene: mesh });
      };
      const start = () => { cancelAnimationFrame(raf); raf = requestAnimationFrame(frame); };
      const onMove = (e: PointerEvent) => {
        const r = box.getBoundingClientRect();
        target[0] = (e.clientX - r.left) / r.width;
        target[1] = 1 - (e.clientY - r.top) / r.height;
      };
      const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
      io.observe(box);
      const ro = new ResizeObserver(resize);
      ro.observe(box);
      window.addEventListener("pointermove", onMove, { passive: true });
      dispose = () => {
        cancelAnimationFrame(raf);
        io.disconnect(); ro.disconnect();
        window.removeEventListener("pointermove", onMove);
        gl.canvas.remove();
        gl.getExtension("WEBGL_lose_context")?.loseContext();
      };
    })();
    return () => { cancelled = true; dispose(); };
  }, [src, intensity, calm]);

  return (
    <div ref={wrap} className={className} style={{ position: "relative", overflow: "hidden", background: "var(--ph-cinema)" }}>
      {/* biome-ignore lint/performance/noImgElement: framework-agnostic package */}
      <img src={src} srcSet={srcSet} sizes={sizes} alt={alt} fetchPriority="high" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", opacity: live ? 0 : 1, transition: "opacity 0.6s" }} />
      <div ref={canvasHost} aria-hidden style={{ position: "absolute", inset: 0 }} />
      {children ? <div style={{ position: "relative", height: "100%" }}>{children}</div> : null}
    </div>
  );
}
