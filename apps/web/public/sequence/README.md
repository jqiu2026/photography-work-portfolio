# Image sequences

`hero/` is a **placeholder** sequence generated from portfolio stills by `scripts/make-sequence.mjs` (slow zoom + crossfade, 96 frames, 1280x720 WebP, about 2 MB). It is used by the hub home pinned scene via `ImageSequence`.

## Swap in real footage (TODO(owner): supply a video)

With ffmpeg installed (`brew install ffmpeg`):

```bash
mkdir -p apps/web/public/sequence/hero
ffmpeg -i footage.mp4 -vf "fps=24,scale=1280:-2" -c:v libwebp -quality 60 apps/web/public/sequence/hero/frame-%03d.webp
```

Then update `count` in `hero/manifest.json` (or run `ls hero | wc -l`) and the `frames` length in `apps/web/src/content/home.ts`. Keep it under about 120 frames and 6 MB total; the component loads frames progressively and shows only a poster on Save-Data, slow connections and reduced motion.

## Regenerate the placeholder

```bash
node scripts/make-sequence.mjs apps/web/public/sequence/hero 96 1280 720 60 <still1> <still2> <still3> <still4>
```
