/**
 * The stage renderer (Flow): one fixed canvas, one scene graph, written for Halation UI on top of `ogl`.
 *
 * Passes per frame: a small stable-fluids solver (semi-Lagrangian advection, curl + vorticity confinement, Jacobi
 * pressure projection) driven by the pointer and by scene "beats", then ONE composite pass that draws the world's field
 * shader, the dye, an anamorphic streak (horizontal blur of the highlights), a halation bloom (wide, red-biased) and a
 * little grain. Everything is a pure function of (time, scroll, pointer, palette), so a scene can be reproduced.
 *
 * The solver follows the textbook method (Stam, "Stable Fluids"); no code from any other implementation is used.
 * Loaded lazily by <Stage>; never imported on the server.
 */
import { Program, RenderTarget, Renderer, Mesh, Triangle, type OGLRenderingContext } from "ogl";
import { tierSettings, type Tier } from "./tier";

type World = "hub" | "photos" | "music" | "flying";

export type StageInputs = {
  /** 0..1 progress through the whole page */
  progress: number;
  /** scroll velocity in viewport heights per second, signed */
  velocity: number;
  /** pointer in 0..1 (y up), plus its velocity in the same units per second */
  pointer: { x: number; y: number; vx: number; vy: number; down: boolean };
  /** the current scene's palette (linear-ish sRGB 0..1) */
  field: [number, number, number];
  accent: [number, number, number];
  /** world-specific scalar: altitude 0..1 (flying), aperture 0..1 (photos), spotlight radius (music) */
  param: number;
  /** current scene index as a float so shaders can blend between scenes */
  scene: number;
};

const VERT = /* glsl */ `#version 300 es
in vec2 position; in vec2 uv; out vec2 vUv;
void main(){ vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }`;

const HEAD = /* glsl */ `#version 300 es
precision highp float; precision highp sampler2D;
in vec2 vUv; out vec4 outColor;`;

const ADVECT = `${HEAD}
uniform sampler2D uVel; uniform sampler2D uSrc; uniform vec2 uTexel; uniform float uDt; uniform float uDissipation;
void main(){
  vec2 coord = vUv - uDt * texture(uVel, vUv).xy * uTexel;
  outColor = uDissipation * texture(uSrc, coord);
}`;

const SPLAT = `${HEAD}
uniform sampler2D uSrc; uniform vec2 uPoint; uniform vec3 uColor; uniform float uRadius; uniform float uAspect;
void main(){
  vec2 p = vUv - uPoint; p.x *= uAspect;
  vec3 splat = exp(-dot(p, p) / uRadius) * uColor;
  outColor = vec4(texture(uSrc, vUv).rgb + splat, 1.0);
}`;

const CURL = `${HEAD}
uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).y; float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).y;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).x; float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).x;
  outColor = vec4(0.5 * (R - L - T + B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `${HEAD}
uniform sampler2D uVel; uniform sampler2D uCurl; uniform vec2 uTexel; uniform float uStrength; uniform float uDt;
void main(){
  float L = texture(uCurl, vUv - vec2(uTexel.x, 0.0)).x; float R = texture(uCurl, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uCurl, vUv - vec2(0.0, uTexel.y)).x; float T = texture(uCurl, vUv + vec2(0.0, uTexel.y)).x;
  float C = texture(uCurl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  force /= length(force) + 0.0001; force *= uStrength * C; force.y *= -1.0;
  vec2 v = texture(uVel, vUv).xy + force * uDt;
  outColor = vec4(clamp(v, -1000.0, 1000.0), 0.0, 1.0);
}`;

const DIVERGENCE = `${HEAD}
uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uVel, vUv - vec2(uTexel.x, 0.0)).x; float R = texture(uVel, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uVel, vUv - vec2(0.0, uTexel.y)).y; float T = texture(uVel, vUv + vec2(0.0, uTexel.y)).y;
  outColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uDiv; uniform vec2 uTexel;
void main(){
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x; float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x; float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  outColor = vec4((L + R + B + T - texture(uDiv, vUv).x) * 0.25, 0.0, 0.0, 1.0);
}`;

const GRADIENT = `${HEAD}
uniform sampler2D uPressure; uniform sampler2D uVel; uniform vec2 uTexel;
void main(){
  float L = texture(uPressure, vUv - vec2(uTexel.x, 0.0)).x; float R = texture(uPressure, vUv + vec2(uTexel.x, 0.0)).x;
  float B = texture(uPressure, vUv - vec2(0.0, uTexel.y)).x; float T = texture(uPressure, vUv + vec2(0.0, uTexel.y)).x;
  vec2 v = texture(uVel, vUv).xy - vec2(R - L, T - B);
  outColor = vec4(v, 0.0, 1.0);
}`;

const CLEAR = `${HEAD}
uniform sampler2D uSrc; uniform float uValue;
void main(){ outColor = uValue * texture(uSrc, vUv); }`;

/**
 * Composite: world field + dye + anamorphic streak + halation + grain.
 * uMode: 0 hub (blue-white streak field), 1 photos (dark with an iris glow), 2 music (spotlight), 3 flying (altitude).
 */
const COMPOSE = `${HEAD}
uniform sampler2D uDye; uniform vec2 uTexel; uniform vec2 uRes; uniform float uTime;
uniform int uMode; uniform float uProgress; uniform float uParam; uniform float uScene;
uniform vec3 uField; uniform vec3 uAccent; uniform vec3 uHalation; uniform vec2 uPointer;
uniform float uStreak; uniform float uHalationAmt; uniform float uVelocity; uniform float uLight;
float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f*f*(3.0-2.0*f);
  return mix(mix(h(i), h(i+vec2(1,0)), f.x), mix(h(i+vec2(0,1)), h(i+vec2(1,1)), f.x), f.y); }
float fbm(vec2 p){ return 0.5*n(p) + 0.25*n(p*2.0) + 0.125*n(p*4.0) + 0.0625*n(p*8.0); }
vec3 dye(vec2 uv){ return texture(uDye, uv).rgb; }
void main(){
  vec2 uv = vUv; float asp = uRes.x / uRes.y;
  vec3 col = uField;
  // On a light field the "light" becomes ink: light mode subtracts the complement of the accent (multiply-like), dark mode adds.
  vec3 acc = uLight > 0.5 ? -(vec3(1.0) - uAccent) : uAccent;
  float lgt = uLight > 0.5 ? 0.0 : 1.0;
  // World field
  if (uMode == 0) {
    // long-exposure streaks: stretched noise bands drifting sideways, brighter toward the lower third
    float bands = fbm(vec2(uv.x * 0.6 + uTime * 0.02 + uProgress * 0.8, uv.y * 40.0));
    float mask = smoothstep(0.55, 1.0, bands) * (0.35 + 0.65 * smoothstep(0.9, 0.0, uv.y));
    col += acc * mask * 0.5 * (1.0 - uProgress * 0.6);
    // one bright anamorphic flare line behind the headline, breathing slowly; it fades as the page moves on
    float flareY = 0.40 + sin(uTime * 0.17) * 0.012 - uProgress * 0.6;
    float flare = exp(-abs(uv.y - flareY) * 90.0) * (0.55 + 0.45 * sin(uv.x * 2.4 + uTime * 0.25));
    col += (acc * 0.9 + vec3(0.5)) * flare * 0.55 * (1.0 - smoothstep(0.0, 0.12, uProgress));
    col += acc * exp(-abs(uv.y - flareY) * 9.0) * 0.12 * (1.0 - smoothstep(0.0, 0.16, uProgress));
    // vanishing-point glow that grows as the corridor opens
    float d = distance(vec2(uv.x * asp, uv.y), vec2(0.5 * asp, 0.5));
    col += acc * exp(-d * 5.0) * 0.18 * smoothstep(0.15, 0.55, uProgress);
  } else if (uMode == 1) {
    // iris glow: nine-blade-ish polygon edge light whose radius follows the aperture
    vec2 p = (uv - 0.5) * vec2(asp, 1.0);
    float a = atan(p.y, p.x) + uTime * 0.03; float r = length(p);
    float blade = cos(floor(0.5 + a * 9.0 / 6.28318) * 6.28318 / 9.0 - a) * r;
    float edge = smoothstep(0.012, 0.0, abs(blade - mix(0.12, 0.62, uParam)));
    col += acc * edge * 0.5 + acc * exp(-abs(blade - mix(0.12, 0.62, uParam)) * 6.0) * 0.08;
  } else if (uMode == 2) {
    // spotlight cone from the top, following the pointer; the rest of the floor stays dim but legible
    vec2 p = (uv - uPointer) * vec2(asp, 1.0);
    float cone = exp(-dot(p, p) / mix(0.04, 0.16, uParam));
    col += acc * cone * 0.30 + vec3(1.0, 0.92, 0.75) * cone * 0.06 * lgt;
  } else {
    // atmosphere: ground haze -> cloud deck -> clear -> high; uParam is altitude 0..1
    float alt = clamp(uParam, 0.0, 1.0);
    vec3 low = vec3(0.16, 0.19, 0.25); vec3 mid = vec3(0.45, 0.55, 0.68); vec3 hi = vec3(0.02, 0.05, 0.14);
    vec3 sky = mix(mix(low, mid, smoothstep(0.0, 0.45, alt)), hi, smoothstep(0.45, 1.0, alt));
    float cloud = fbm(vec2(uv.x * 3.0 + uTime * 0.01, uv.y * 6.0 - alt * 14.0));
    float deck = smoothstep(0.55, 0.85, cloud) * (1.0 - smoothstep(0.35, 0.6, alt)) * smoothstep(0.02, 0.2, alt);
    col = mix(uField, (uLight > 0.5 ? mix(sky, vec3(1.0), 0.6) : sky * 0.55), 0.55) + vec3(deck) * 0.12 + acc * exp(-abs(uv.y - (0.18 - alt * 0.15)) * 20.0) * 0.05;
  }
  // Dye (the liquid) with an anamorphic streak and a halation bloom
  vec3 d0 = dye(uv);
  vec3 streak = vec3(0.0);
  for (int i = -8; i <= 8; i++) {
    float w = exp(-abs(float(i)) * 0.35);
    streak += dye(uv + vec2(float(i) * 0.012 / asp * 2.0, 0.0)) * w;
  }
  streak *= 0.12;
  vec3 halo = vec3(0.0);
  for (int k = 0; k < 8; k++) {
    float ang = float(k) * 0.7853982; vec2 o = vec2(cos(ang), sin(ang)) * 0.018 * vec2(1.0 / asp, 1.0);
    halo += dye(uv + o) + dye(uv + o * 2.4);
  }
  halo /= 16.0;
  vec3 lightAdd = d0 + streak * uStreak + halo * uHalation * uHalationAmt;
  if (uLight > 0.5) col -= lightAdd * (vec3(1.0) - uAccent) * 0.85; else col += lightAdd;
  // velocity makes the whole field breathe a touch brighter
  col += acc * abs(uVelocity) * 0.015;
  // grain (static blue-noise-like hash), 2%
  col += (h(uv * uRes + fract(uTime)) - 0.5) * 0.02;
  outColor = vec4(max(col, 0.0), 1.0);
}`;

type FBO = { read: RenderTarget; write: RenderTarget; swap(): void };

export class StageRenderer {
  private renderer: Renderer;
  private gl: OGLRenderingContext;
  private tri: Triangle;
  private vel!: FBO;
  private dye!: FBO;
  private pressure!: FBO;
  private div!: RenderTarget;
  private curl!: RenderTarget;
  private progs: Record<string, Program> = {};
  private meshes: Record<string, Mesh> = {};
  private raf = 0;
  private last = 0;
  private running = false;
  private rest = 0;
  private t = 0;
  private lastPointer = { x: 0.5, y: 0.5, has: false };
  private beat = 0;
  inputs: StageInputs;
  onFrame?: (ms: number) => void;
  private mode: number;

  constructor(
    private canvas: HTMLCanvasElement,
    world: World,
    private tier: Exclude<Tier, "static">,
    inputs: StageInputs,
  ) {
    const s = tierSettings[tier];
    this.renderer = new Renderer({
      canvas,
      dpr: Math.min(window.devicePixelRatio || 1, s.dprCap),
      alpha: false,
      antialias: false,
      webgl: 2,
    });
    this.gl = this.renderer.gl;
    const gl = this.gl as WebGL2RenderingContext;
    if (!gl.getExtension("EXT_color_buffer_float") && !gl.getExtension("EXT_color_buffer_half_float"))
      throw new Error("float render targets unavailable");
    gl.getExtension("OES_texture_float_linear");
    this.tri = new Triangle(this.gl);
    this.inputs = inputs;
    this.mode = { hub: 0, photos: 1, music: 2, flying: 3 }[world];
    this.build();
    this.resize();
  }

  private target(w: number, h: number): RenderTarget {
    const gl = this.gl as WebGL2RenderingContext;
    return new RenderTarget(this.gl, {
      width: w,
      height: h,
      depth: false,
      type: gl.HALF_FLOAT,
      format: gl.RGBA,
      internalFormat: gl.RGBA16F,
      minFilter: gl.LINEAR,
      magFilter: gl.LINEAR,
      wrapS: gl.CLAMP_TO_EDGE,
      wrapT: gl.CLAMP_TO_EDGE,
    });
  }

  private fbo(w: number, h: number): FBO {
    const f = {
      read: this.target(w, h),
      write: this.target(w, h),
      swap() {
        [f.read, f.write] = [f.write, f.read];
      },
    };
    return f;
  }

  private prog(name: string, fragment: string, uniforms: Record<string, { value: unknown }>) {
    const program = new Program(this.gl, {
      vertex: VERT,
      fragment,
      uniforms,
      depthTest: false,
      depthWrite: false,
      cullFace: false,
    });
    this.progs[name] = program;
    this.meshes[name] = new Mesh(this.gl, { geometry: this.tri, program });
  }

  private build() {
    const t2 = { value: [1, 1] };
    const tex = { value: null as unknown };
    this.prog("advect", ADVECT, {
      uVel: tex,
      uSrc: tex,
      uTexel: t2,
      uDt: { value: 0.016 },
      uDissipation: { value: 1 },
    });
    this.prog("splat", SPLAT, {
      uSrc: tex,
      uPoint: { value: [0.5, 0.5] },
      uColor: { value: [0, 0, 0] },
      uRadius: { value: 0.0015 },
      uAspect: { value: 1 },
    });
    this.prog("curl", CURL, { uVel: tex, uTexel: t2 });
    this.prog("vorticity", VORTICITY, {
      uVel: tex,
      uCurl: tex,
      uTexel: t2,
      uStrength: { value: 18 },
      uDt: { value: 0.016 },
    });
    this.prog("divergence", DIVERGENCE, { uVel: tex, uTexel: t2 });
    this.prog("pressure", PRESSURE, { uPressure: tex, uDiv: tex, uTexel: t2 });
    this.prog("gradient", GRADIENT, { uPressure: tex, uVel: tex, uTexel: t2 });
    this.prog("clear", CLEAR, { uSrc: tex, uValue: { value: 0.8 } });
    this.prog("compose", COMPOSE, {
      uDye: tex,
      uTexel: t2,
      uRes: { value: [1, 1] },
      uTime: { value: 0 },
      uMode: { value: this.mode },
      uProgress: { value: 0 },
      uParam: { value: 0 },
      uScene: { value: 0 },
      uField: { value: [0.03, 0.03, 0.05] },
      uAccent: { value: [0.4, 0.6, 1] },
      uHalation: { value: [1, 0.35, 0.22] },
      uPointer: { value: [0.5, 0.5] },
      uStreak: { value: 1 },
      uHalationAmt: { value: 1 },
      uVelocity: { value: 0 },
      uLight: { value: 0 },
    });
  }

  resize() {
    const s = tierSettings[this.tier];
    // The canvas is fixed and viewport-sized; ogl writes pixel sizes into its style, so hand control back to CSS.
    const w = window.innerWidth;
    const h = window.innerHeight;
    this.renderer.setSize(w, h);
    this.canvas.style.width = "100%";
    this.canvas.style.height = "100%";
    const asp = w / h;
    const sim = (res: number): [number, number] =>
      asp >= 1 ? [Math.round(res * asp), res] : [res, Math.round(res / asp)];
    const [sw, sh] = sim(s.sim);
    const [dw, dh] = sim(s.dye);
    this.vel = this.fbo(sw, sh);
    this.pressure = this.fbo(sw, sh);
    this.div = this.target(sw, sh);
    this.curl = this.target(sw, sh);
    this.dye = this.fbo(dw, dh);
    this.rest = 0;
  }

  private pass(name: string, target: RenderTarget | null, uniforms: Record<string, unknown>) {
    const p = this.progs[name];
    for (const [k, v] of Object.entries(uniforms)) (p.uniforms[k] as { value: unknown }).value = v;
    this.renderer.render({ scene: this.meshes[name], target: target ?? undefined, clear: false });
  }

  private splat(x: number, y: number, dx: number, dy: number, color: [number, number, number], radius: number) {
    const asp = this.canvas.clientWidth / Math.max(1, this.canvas.clientHeight);
    this.pass("splat", this.vel.write, {
      uSrc: this.vel.read.texture,
      uPoint: [x, y],
      uColor: [dx, dy, 0],
      uRadius: radius,
      uAspect: asp,
    });
    this.vel.swap();
    this.pass("splat", this.dye.write, {
      uSrc: this.dye.read.texture,
      uPoint: [x, y],
      uColor: color,
      uRadius: radius * 0.7,
      uAspect: asp,
    });
    this.dye.swap();
    this.rest = 0;
  }

  private sweep: { dir: 1 | -1; strength: number; t: number } | null = null;

  /** A scene beat: a streak of accent light sweeps across the stage (used by the arrival, Pour and Threshold recipes). */
  streak(direction: 1 | -1 = 1, strength = 1) {
    this.beat = 1;
    this.sweep = { dir: direction, strength, t: 0 };
    this.rest = 0;
  }

  private runSweep(dt: number) {
    const sw = this.sweep;
    if (!sw) return;
    const { accent } = this.inputs;
    const x = sw.dir === 1 ? sw.t : 1 - sw.t;
    const lines = 9;
    for (let i = 0; i < lines; i++) {
      const y = 0.3 + (i / (lines - 1)) * 0.4 + Math.sin(i * 12.9898 + sw.t * 6) * 0.01;
      const k = 0.32 * sw.strength * (1 - Math.abs(i - (lines - 1) / 2) / lines);
      this.splat(x, y, sw.dir * 700 * sw.strength, 0, [accent[0] * k, accent[1] * k, accent[2] * k], 0.0005);
    }
    sw.t += dt / 0.9;
    if (sw.t >= 1) this.sweep = null;
  }

  private step(dt: number) {
    const s = tierSettings[this.tier];
    const gl = this.gl;
    const sv = [1 / this.vel.read.width, 1 / this.vel.read.height];
    const dv = [1 / this.dye.read.width, 1 / this.dye.read.height];
    const { pointer, accent, velocity } = this.inputs;
    this.runSweep(dt);

    // Pointer injects force and a streak of dye
    const speed = Math.hypot(pointer.vx, pointer.vy);
    if (this.lastPointer.has && speed > 0.02) {
      const fx = pointer.vx * 28;
      const fy = pointer.vy * 28;
      const k = Math.min(1, speed * 0.6);
      this.splat(
        pointer.x,
        pointer.y,
        fx,
        fy,
        [accent[0] * 0.16 * k, accent[1] * 0.16 * k, accent[2] * 0.16 * k],
        0.0016,
      );
    }
    this.lastPointer = { x: pointer.x, y: pointer.y, has: true };
    // Fast scrolling stirs a thin horizontal current
    if (Math.abs(velocity) > 0.4) {
      const y = 0.2 + Math.random() * 0.6;
      this.splat(
        Math.random(),
        y,
        Math.sign(velocity) * 60 * Math.min(3, Math.abs(velocity)),
        0,
        [accent[0] * 0.05, accent[1] * 0.05, accent[2] * 0.05],
        0.0006,
      );
    }

    if (s.vorticity) {
      this.pass("curl", this.curl, { uVel: this.vel.read.texture, uTexel: sv });
      this.pass("vorticity", this.vel.write, {
        uVel: this.vel.read.texture,
        uCurl: this.curl.texture,
        uTexel: sv,
        uDt: dt,
      });
      this.vel.swap();
    }
    this.pass("divergence", this.div, { uVel: this.vel.read.texture, uTexel: sv });
    this.pass("clear", this.pressure.write, { uSrc: this.pressure.read.texture, uValue: 0.8 });
    this.pressure.swap();
    for (let i = 0; i < s.pressureIterations; i++) {
      this.pass("pressure", this.pressure.write, {
        uPressure: this.pressure.read.texture,
        uDiv: this.div.texture,
        uTexel: sv,
      });
      this.pressure.swap();
    }
    this.pass("gradient", this.vel.write, {
      uPressure: this.pressure.read.texture,
      uVel: this.vel.read.texture,
      uTexel: sv,
    });
    this.vel.swap();
    this.pass("advect", this.vel.write, {
      uVel: this.vel.read.texture,
      uSrc: this.vel.read.texture,
      uTexel: sv,
      uDt: dt,
      uDissipation: 0.985,
    });
    this.vel.swap();
    this.pass("advect", this.dye.write, {
      uVel: this.vel.read.texture,
      uSrc: this.dye.read.texture,
      uTexel: dv,
      uDt: dt,
      uDissipation: 0.972,
    });
    this.dye.swap();
    void gl;
  }

  private draw() {
    const i = this.inputs;
    const w = this.canvas.clientWidth || 1;
    const h = this.canvas.clientHeight || 1;
    this.pass("compose", null, {
      uDye: this.dye.read.texture,
      uTexel: [1 / this.dye.read.width, 1 / this.dye.read.height],
      uRes: [w, h],
      uTime: this.t,
      uProgress: i.progress,
      uParam: i.param,
      uScene: i.scene,
      uField: i.field,
      uAccent: i.accent,
      uPointer: [i.pointer.x, i.pointer.y],
      uVelocity: i.velocity,
      uLight: 0.2126 * i.field[0] + 0.7152 * i.field[1] + 0.0722 * i.field[2] > 0.5 ? 1 : 0,
      uStreak: this.tier === "full" ? 1 : 0.6,
      uHalationAmt: this.tier === "full" ? 1 : 0.6,
    });
  }

  private frame = (now: number) => {
    if (!this.running) return;
    this.raf = requestAnimationFrame(this.frame);
    const minDt = 1000 / tierSettings[this.tier].fps - 1;
    if (this.last && now - this.last < minDt) return;
    const dtMs = this.last ? now - this.last : 16;
    this.last = now;
    const dt = Math.min(dtMs / 1000, 0.033);
    this.t += dt;
    const t0 = performance.now();
    // The sim sleeps when nothing has stirred it for a while; the field still animates slowly (cheap composite only).
    const active = this.rest < 4;
    if (active) this.step(dt);
    this.rest += dt;
    this.draw();
    this.onFrame?.(performance.now() - t0 + (dtMs - 16 > 0 ? 0 : 0));
    this.beat = Math.max(0, this.beat - dt);
  };

  start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  destroy() {
    this.stop();
    (this.gl as WebGL2RenderingContext).getExtension("WEBGL_lose_context")?.loseContext();
  }
}
