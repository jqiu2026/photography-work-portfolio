/**
 * The scene, drawn in one fragment shader: a dark room with a slow nebula and drifting motes, a black glass floor, and
 * four portals standing in it. Each is a window into its dimension (with depth: the far layers move less than the near
 * ones as the pointer moves), under a thin moving membrane, with no frame: its edge breathes and frays into iridescent
 * haze, and it thins into mist at the floor.
 * The floor reflects them. Hovering one brightens it and lets its light into the room; stepping through grows it to
 * fill the screen. WebGL 1 / GLSL ES 1.0 so it runs everywhere WebGL does.
 */
export const VERT = `
attribute vec2 p;
void main() { gl_Position = vec4(p, 0.0, 1.0); }
`;

export const FRAG = `
precision highp float;

uniform vec2 uRes;
uniform float uTime;
uniform vec2 uPointer;     // -1..1, eased
uniform vec4 uDoor[4];     // centre x, centre y, half width, half height (canvas px, y up)
uniform float uHover[4];   // 0..1, eased
uniform vec3 uAccent[4];
uniform float uFloor;      // floor line, canvas px from the bottom
uniform float uDive;       // 0..1
uniform float uDiveIdx;    // which portal, or -1
uniform float uFade;       // 0..1, the scene fades as the page scrolls past it
uniform float uOpen[4];    // 0..1, each portal blooming out of the mist on arrival
uniform vec2 uCursor;      // the pointer in canvas px (y up), for the light you carry

#define TAU 6.28318530718

float hash(vec2 p) { p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 5; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v;
}
float fbm3(vec2 p) {
  float v = 0.0, a = 0.5;
  mat2 r = mat2(0.8, -0.6, 0.6, 0.8);
  for (int i = 0; i < 3; i++) { v += a * noise(p); p = r * p * 2.02; a *= 0.5; }
  return v / 0.875;
}
vec2 rot(vec2 p, float a) { float c = cos(a), s = sin(a); return vec2(c * p.x - s * p.y, s * p.x + c * p.y); }

// Holominimal's iridescence: cyan, blue, violet, magenta, around and back
vec3 iris(float t) {
  t = fract(t);
  vec3 a = vec3(0.37, 0.92, 1.0), b = vec3(0.36, 0.52, 1.0), c = vec3(0.66, 0.42, 1.0), d = vec3(1.0, 0.42, 0.86);
  if (t < 0.25) return mix(a, b, t * 4.0);
  if (t < 0.5) return mix(b, c, (t - 0.25) * 4.0);
  if (t < 0.75) return mix(c, d, (t - 0.5) * 4.0);
  return mix(d, a, (t - 0.75) * 4.0);
}

// an arch: a box with a half-circle on top. q in px from the centre, a = half width, b = half height
float sdArch(vec2 q, float a, float b) {
  float yc = b - a;
  if (q.y > yc) return length(q - vec2(0.0, yc)) - a;
  vec2 e = vec2(abs(q.x) - a, -q.y - b);
  return length(max(e, 0.0)) + min(max(e.x, e.y), 0.0);
}

float stars(vec2 uv, float density, float t) {
  vec2 g = floor(uv), f = fract(uv) - 0.5;
  float h = hash(g);
  if (h > density) return 0.0;
  vec2 o = vec2(hash(g + 7.1), hash(g + 3.3)) - 0.5;
  float d = length(f - o * 0.7);
  float tw = 0.6 + 0.4 * sin(t * (1.0 + h * 3.0) + h * TAU);
  return smoothstep(0.08, 0.0, d) * tw;
}

// what lies beyond each portal. u: x -1..1 across the opening, y -H..H (the same scale both ways, y up); par: the
// pointer's parallax
vec3 world(int k, vec2 u, float H, vec2 par, float t, float hov) {
  vec3 col;
  float v = u.y / H; // -1..1 bottom to top
  if (k == 0) {
    // Exposure: a valley at golden hour. Hills in layers that go hazy with distance, a low sun, rays, light in the air
    vec2 s = u + par * 0.06;
    col = mix(vec3(1.0, 0.72, 0.42), vec3(0.42, 0.62, 0.9), smoothstep(-0.1, 1.0, v));
    col = mix(col, vec3(1.0, 0.86, 0.62), exp(-abs(v + 0.05) * 5.0) * 0.6);
    vec2 sun = vec2(0.22, 0.04 * H);
    vec2 ds = s - sun;
    float sd = length(ds);
    col += vec3(1.0, 0.8, 0.5) * exp(-sd * 3.2) * 0.55;
    col = mix(col, vec3(1.7, 1.5, 1.15), smoothstep(0.15, 0.135, sd));
    float rays = pow(0.5 + 0.5 * sin(atan(ds.y, ds.x) * 14.0 + t * 0.15), 6.0) * exp(-sd * 1.8);
    col += vec3(1.0, 0.85, 0.55) * rays * 0.12;
    for (int i = 0; i < 4; i++) {
      float fi = float(i);
      vec2 h = u + par * (0.1 + fi * 0.14);
      float ridge = (-0.12 - fi * 0.17) * H + 0.22 * (fbm(vec2(h.x * (0.9 + fi * 0.5) + fi * 5.3, fi * 1.7)) - 0.5)
        + 0.07 * sin(h.x * (1.6 + fi) + fi * 2.0);
      float haze = 1.0 - fi / 3.0;
      vec3 hc = mix(vec3(0.07, 0.14, 0.07), vec3(0.62, 0.55, 0.48), haze * 0.85);
      hc += vec3(0.35, 0.22, 0.05) * smoothstep(-0.12, 0.0, h.y - ridge) * (0.3 + 0.7 * (1.0 - haze));
      col = mix(col, hc, smoothstep(0.006, -0.006, h.y - ridge));
    }
    float motes = stars((u + par * 0.35 + vec2(t * 0.02, -t * 0.04)) * 13.0, 0.1, t * 2.0);
    col += vec3(1.0, 0.9, 0.65) * motes * 0.7;
  } else if (k == 1) {
    // Resonance: a violet void, two depths of stars, rings that keep time, a wave line across the floor of it
    vec2 s = u + par * 0.04;
    col = mix(vec3(0.015, 0.0, 0.045), vec3(0.2, 0.08, 0.45), exp(-length(s - vec2(0.0, 0.15 * H)) * 1.3));
    col += vec3(0.6, 0.5, 1.0) * stars((u + par * 0.08) * 22.0, 0.25, t);
    col += vec3(0.85, 0.75, 1.0) * stars((u + par * 0.22 + 4.0) * 10.0, 0.1, t * 1.3) * 1.3;
    float beat = fract(t * 92.0 / 60.0 / 2.0);
    float r = length(u + par * 0.15 - vec2(0.0, 0.15 * H));
    for (int i = 0; i < 4; i++) {
      float ph = fract(beat + float(i) * 0.25);
      col += vec3(0.72, 0.48, 1.0) * exp(-abs(r - ph * 1.9) * 34.0) * (1.0 - ph) * 0.9;
    }
    col += vec3(0.9, 0.8, 1.0) * exp(-r * 9.0) * (0.6 + 0.4 * sin(t * 9.6));
    float wave = abs(u.y + 0.62 * H - 0.08 * sin(u.x * 8.0 + t * 3.0) * sin(t * 1.3 + u.x * 2.0));
    col += vec3(0.5, 0.82, 1.0) * exp(-wave * 70.0);
    col += vec3(0.35, 0.2, 0.7) * exp(-wave * 9.0) * 0.25;
  } else if (k == 2) {
    // Altitude: deep blue overhead, a sea of cloud below lit from above, far clouds drifting slower than near ones
    vec2 s = u + par * 0.03;
    col = mix(vec3(0.72, 0.86, 1.0), vec3(0.08, 0.3, 0.72), smoothstep(-0.25, 1.0, v));
    col += vec3(1.0, 0.95, 0.85) * exp(-length(s - vec2(-0.45, 0.55 * H)) * 3.0) * 0.55;
    for (int i = 0; i < 3; i++) {
      float fi = float(i);
      vec2 c = (u + par * (0.08 + fi * 0.2)) * vec2(1.1 + fi * 0.7, 1.6 + fi * 0.8) + vec2(t * (0.03 + fi * 0.035) + fi * 7.0, 0.0);
      float top = (-0.1 - fi * 0.3) * H;
      float n1 = fbm(c);
      float body = n1 + (top - u.y) * (1.6 - fi * 0.3);
      float cl = smoothstep(0.42, 0.56, body);
      float lit = smoothstep(0.0, 0.25, fbm(c + vec2(0.0, 0.12)) - n1 + 0.1);
      vec3 cc = mix(vec3(0.62, 0.7, 0.84), vec3(1.0, 0.99, 0.97), lit);
      cc = mix(cc, vec3(0.78, 0.86, 0.96), (1.0 - fi / 2.0) * 0.35);
      col = mix(col, cc, cl);
    }
  } else {
    // Forge: a cavern over a river of lava. Rock walls lit from below, falls of molten light, heat, sparks
    vec2 s = u + par * 0.05;
    col = mix(vec3(0.16, 0.02, 0.01), vec3(0.03, 0.0, 0.01), smoothstep(-1.0, 0.8, v));
    // falls
    for (int i = 0; i < 2; i++) {
      float fx = (float(i) - 0.5) * 0.9 + 0.08;
      vec2 f = u + par * 0.15;
      float w = 0.05 + 0.02 * sin(f.y * 3.0 + float(i));
      float fall = smoothstep(w, 0.0, abs(f.x - fx + 0.03 * sin(f.y * 4.0 + t)));
      float flow = 0.6 + 0.4 * fbm(vec2(f.x * 8.0, f.y * 3.0 + t * 1.6));
      col += vec3(1.0, 0.45, 0.1) * fall * flow * smoothstep(0.9 * H, -0.2 * H, f.y) * 1.1;
    }
    // walls
    vec2 wv = u + par * 0.3;
    float wall = abs(wv.x) - (0.62 + 0.25 * fbm(vec2(wv.y * 1.6, sign(wv.x) * 3.0)));
    vec3 rock = vec3(0.04, 0.012, 0.012) + vec3(0.6, 0.15, 0.03) * smoothstep(0.2 * H, -1.0 * H, wv.y) * 0.5;
    col = mix(col, rock, smoothstep(-0.01, 0.01, wall));
    col += vec3(1.0, 0.4, 0.08) * exp(-abs(wall) * 30.0) * smoothstep(0.4 * H, -0.9 * H, wv.y) * 0.5;
    // the river
    vec2 rv = u + par * 0.4;
    float river = smoothstep(-0.55 * H, -0.62 * H, rv.y + 0.03 * sin(rv.x * 6.0 + t));
    float lava = fbm(vec2(rv.x * 4.0 - t * 0.4, rv.y * 9.0)) * 0.8 + fbm(vec2(rv.x * 9.0 + t * 0.7, rv.y * 14.0)) * 0.5;
    vec3 lc = mix(vec3(0.8, 0.12, 0.02), vec3(1.0, 0.62, 0.15), smoothstep(0.45, 0.8, lava));
    lc = mix(lc, vec3(1.0, 0.92, 0.65), smoothstep(0.85, 1.05, lava));
    col = mix(col, lc, river);
    col += vec3(1.0, 0.35, 0.05) * exp(-abs(rv.y + 0.58 * H) * 5.0) * 0.35;
    // heat and sparks
    float haze = fbm(vec2(s.x * 3.0, s.y * 2.0 - t * 0.5));
    col += vec3(0.5, 0.1, 0.02) * haze * smoothstep(0.5 * H, -0.8 * H, s.y) * 0.4;
    vec2 sp = (u + par * 0.25) * vec2(14.0, 9.0) + vec2(sin(t + u.y * 2.0) * 0.4, -t * 2.6);
    col += vec3(1.0, 0.7, 0.3) * stars(sp, 0.08, t * 4.0) * smoothstep(0.9 * H, -0.6 * H, u.y) * 1.6;
  }
  return col * (0.88 + 0.22 * hov);
}

void main() {
  vec2 px = gl_FragCoord.xy;
  vec2 uv = px / uRes;
  float t = uTime;
  float fl = uFloor;

  // the room: near black, a slow nebula lit by whichever portal is looked at
  vec3 spill = vec3(0.0);
  float hovSum = 0.0;
  for (int i = 0; i < 4; i++) { spill += uAccent[i] * uHover[i]; hovSum += uHover[i]; }
  vec2 n = (px / uRes.y) * 1.6 + uPointer * 0.04;
  float neb = fbm(n + vec2(t * 0.01, -t * 0.006)) * fbm(n * 1.7 - vec2(t * 0.008, 0.0));
  vec3 room = vec3(0.012, 0.012, 0.02);
  room += mix(vec3(0.05, 0.08, 0.16), vec3(0.12, 0.05, 0.18), uv.x) * neb * 0.9;
  room += spill * neb * 0.35;
  room += vec3(0.55, 0.65, 0.9) * stars((px / uRes.y + uPointer * 0.01) * 90.0, 0.05, t) * 0.5 * smoothstep(fl - 20.0, fl + 120.0, px.y);

  // light rising from the far end of the floor
  float horizon = exp(-abs(px.y - fl) / (uRes.y * 0.06));
  room += (vec3(0.1, 0.13, 0.22) + spill * 0.5) * horizon * 0.5;

  // a faint light you carry: it follows the pointer, cool and wide, and picks out the nebula where it passes
  float carry = exp(-length(px - uCursor) / (uRes.y * 0.22));
  room += (vec3(0.05, 0.06, 0.1) + vec3(0.12, 0.1, 0.2) * neb) * carry;

  vec3 col = room * (1.0 - 0.75 * smoothstep(0.0, 0.5, uDive));
  float isFloor = step(px.y, fl);

  // the floor: black glass with a faint grid in perspective that fades into the distance
  if (isFloor > 0.5) {
    float depth = (fl - px.y) / max(fl, 1.0);
    vec2 g = vec2((px.x - uRes.x * 0.5) / (depth * uRes.y + 40.0), 1.0 / (depth + 0.04));
    vec2 gl = abs(fract(g * vec2(6.0, 1.2) + vec2(0.0, -t * 0.05)) - 0.5);
    float grid = smoothstep(0.48, 0.5, max(gl.x, gl.y)) * smoothstep(0.0, 0.25, depth) * (1.0 - depth) * 0.25;
    col = vec3(0.006, 0.007, 0.012) + vec3(0.25, 0.35, 0.6) * grid * (0.15 + carry * 0.6) + spill * grid * 0.25;
  }
  // the hairline where the floor meets the dark
  col += vec3(0.6, 0.7, 1.0) * exp(-abs(px.y - fl) * 0.9) * 0.18;

  // the portals
  for (int i = 0; i < 4; i++) {
    vec4 d = uDoor[i];
    if (d.z < 1.0) continue;
    float hov = uHover[i];
    float diving = (uDiveIdx == float(i)) ? uDive : 0.0;
    float others = (uDiveIdx >= 0.0 && uDiveIdx != float(i)) ? uDive : 0.0;
    vec3 acc = uAccent[i];
    float open = uOpen[i];
    float lift = (1.0 - smoothstep(0.0, 0.35, others)) * open;

    // it stands on the floor; its base is where the reflection starts
    float base = d.y - d.w;
    vec2 q = px - d.xy;
    float sd = sdArch(q, d.z, d.w);

    // light around the opening, more when looked at
    float reach = min(d.z, uRes.y * 0.09) * (0.5 + 0.55 * hov);
    float glow = exp(-max(sd, 0.0) / reach);
    col += acc * glow * (0.12 + 0.35 * hov) * lift;

    // the reflection in the floor: a mirror image of the world, rippled, fading with distance from the base
    if (isFloor > 0.5 && diving < 0.01) {
      float below = base - px.y;
      float ripple = sin(px.y * 0.28 - t * 1.6) * 1.2 + sin(px.y * 0.11 + t) * 1.5;
      vec2 mq = vec2(q.x + ripple, base + below - d.y);
      float msd = sdArch(mq, d.z, d.w);
      float fall = exp(-below / (d.w * 0.45));
      if (msd < d.z * 0.3 && fall > 0.02) {
        float H = d.w / d.z;
        vec3 m = world(i, mq / d.z, H, -uPointer * 0.6, t, hov);
        col = mix(col, m * 0.45, smoothstep(d.z * 0.3, -d.z * 0.3, msd) * fall * 0.7 * lift);
      }
      col += acc * exp(-max(msd, 0.0) / (d.z * 0.3)) * fall * 0.1 * lift;
    }

    // a pool of light on the floor in front of it
    vec2 pool = (px - vec2(d.x, base)) / vec2(d.z * 1.6, d.z * 0.22);
    col += acc * exp(-dot(pool, pool)) * (0.18 + 0.3 * hov) * isFloor * lift;

    // the edge is not a line: it breathes and frays, wisps drifting upward off it, and it settles as you step in
    float breath = 0.5 + 0.5 * sin(t * 0.55 + float(i) * 1.7);
    float soft = d.z * (0.2 + 0.06 * hov + 0.04 * breath) * (1.0 - diving);
    if (open > 0.0 && sd < soft * 2.5 + d.z * 0.35) {
      vec2 eq = q / d.z;
      float sid = float(i) * 7.3;
      float n1 = fbm3(eq * 1.6 + vec2(sid, -t * 0.22)) - 0.5;
      float n2 = fbm3(eq * 4.2 + vec2(t * 0.15, sid - t * 0.45)) - 0.5;
      // the outline itself wanders: the sides sway and the crown leans, slowly, so no two moments hold the same shape
      vec2 warp = vec2(sin(eq.y * 2.1 + t * 0.45 + sid) * 0.6 + sin(eq.y * 4.3 - t * 0.31 + sid * 2.0) * 0.4,
                       sin(eq.x * 1.9 + t * 0.37 - sid) * 0.5) * 0.5;
      float wsd = sdArch(q + warp * d.z * 0.5 * (1.0 - diving), d.z * 0.92, d.w);
      float esd = wsd + (n1 * 0.7 + n2 * 0.35) * d.z * 0.55 * (1.0 - diving);
      // arriving, each opens from a seam of light at its heart outward
      esd += (1.0 - open) * (d.z + d.w) * 1.1;
      // the opening thins toward the floor, so it seems to stand in mist rather than on a sill
      float foot = mix(0.35, 1.0, smoothstep(-1.02, -0.55, q.y / d.w));
      float fill = smoothstep(soft + 1.5, -soft - 1.5, esd) * mix(foot, 1.0, diving) * smoothstep(0.0, 0.4, open);

      // inside: the world, seen through the opening, with depth
      float H = d.w / d.z;
      vec2 u = eq;
      vec2 par = -uPointer * (0.6 + 0.6 * hov);
      // the membrane: the surface swirls slowly around the centre, faster when looked at or entered
      float r = length(q / d.z);
      float swirl = (0.12 + 0.2 * hov + 3.0 * diving) * exp(-r * 0.8);
      vec2 uw = rot(u, swirl * sin(t * 0.6 + float(i)));
      vec3 w = world(i, uw, H, par, t, hov);
      float sheen = fbm(rot(q / d.z, t * 0.15 + float(i)) * 1.8 + t * 0.1);
      w += acc * 0.18 * smoothstep(0.55, 0.8, sheen) * (1.0 - diving);
      // the world fades into the dark toward its edge rather than meeting a frame
      float inner = smoothstep(soft, -d.z * 0.55, esd);
      w *= mix(0.3, 1.0, inner);
      col = mix(col, w, fill * mix(lift, 1.0, diving));

      // a veil of iridescent haze where the world meets the room, broken into strands that drift up
      float ang = atan(q.y, q.x) / TAU;
      vec3 veilc = mix(iris(ang + t * 0.04 + float(i) * 0.25 + n1 * 0.3), acc, 0.55);
      float strands = smoothstep(0.35, 0.8, fbm3(vec2(eq.x * 3.2, eq.y * 1.1 - t * 0.4) + sid));
      float veil = exp(-abs(esd) / (soft * 0.8 + 2.0)) * (0.25 + 0.75 * strands);
      col += veilc * veil * (0.16 + 0.26 * hov + 0.06 * breath) * lift * (1.0 - diving);
      // the moment it opens, the seam flares
      col += veilc * exp(-abs(esd) / (soft + 4.0)) * smoothstep(0.0, 0.35, open) * (1.0 - open) * 1.6;
    }
  }

  // a vignette and grain keep it from looking flat
  vec2 vc = uv - 0.5;
  col *= 1.0 - dot(vc, vc) * 0.55;
  col += (hash(px + fract(t)) - 0.5) * 0.012;

  // the last moment of stepping through goes to black, which is how every site begins
  col *= 1.0 - smoothstep(0.72, 1.0, uDive);

  col = col / (1.0 + col * 0.35);
  col = pow(col, vec3(0.95));
  gl_FragColor = vec4(col * uFade, 1.0);
}
`;
