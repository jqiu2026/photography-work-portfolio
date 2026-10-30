# folio (folio.jerryqiu.com)

A static site: no build step, no framework. In Vercel set **Root Directory** to `folio`, Framework Preset **Other**,
leave the build command and output directory empty.

- `index.html`: Photos (masonry per category, viewer with arrow keys and swipe)
- `videos/index.html`: Videos; add entries to `assets/videos.js` (a file in this folder, or a YouTube id that loads only on play)
- `assets/protect.js`: no right-click, drag, selection, copy or print. It discourages casual saving only.
- `photos/`: medium quality WebP (900px grid at q60, 1600px viewer at q68), metadata stripped, anonymous names

To change the pictures, run `folio-tools/build.mjs` (see the comment at its top); it rewrites `photos/` and `assets/photos.js`.
