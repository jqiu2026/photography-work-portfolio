import { CodeBlock, Prose } from "@halation/ui";

export const metadata = { title: "Motion guide" };

export default function Page() {
  return (
    <Prose>
      <h1>Motion guide</h1>
      <p>Motion is a layer on top of a complete, static page. Use it for two or three moments per page, never for everything.</p>
      <h2 id="principles">Principles</h2>
      <ul>
        <li>One easing curve (<code>--hl-ease</code>) and one spring, shared durations. Do not invent per-component curves.</li>
        <li>Every motion component renders a complete static state under <code>prefers-reduced-motion</code> (use <code>useCalm()</code> for your own).</li>
        <li>Heavy things are lazy: WebGL (<code>ogl</code>) and image sequences load only near the viewport, and fall back to a poster on Save-Data or slow networks.</li>
        <li>Never put essential information only in an animation.</li>
      </ul>
      <h2 id="scene">A pinned scene</h2>
      <CodeBlock language="tsx" code={`<PinnedScene length={4} label="About me">\n  <ImageSequence frames={frames} alt="" />\n  <StepSequence steps={[{ title: "One" }, { title: "Two" }]} />\n</PinnedScene>`} />
      <h2 id="sequence">Making an image sequence</h2>
      <p>With ffmpeg: <code>ffmpeg -i footage.mp4 -vf "fps=24,scale=1280:-2" -c:v libwebp -quality 60 frame-%03d.webp</code>. Keep it under about 120 frames and 6 MB. Without footage, <code>scripts/make-sequence.mjs</code> builds a placeholder from still photographs (slow zoom and crossfade).</p>
      <h2 id="glitch">The glitch effect</h2>
      <p><code>ShaderHero</code> and <code>Gallery glitch</code> run the same WebGL layer: drifting displacement plus a chromatic split that follows the pointer. It renders nothing (the plain image stays) for reduced motion, Save-Data, low-power devices or when WebGL is unavailable.</p>
    </Prose>
  );
}
