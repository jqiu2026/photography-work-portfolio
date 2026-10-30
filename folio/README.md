# folio (folio.jerryqiu.com)

A small standalone Next.js app (its own `package.json` and `package-lock.json`, not part of the pnpm workspace).
In Vercel: **Root Directory** `folio`, Framework Preset **Next.js**, default build and install commands.

- `app/page.tsx`: Photos (masonry per category, viewer with arrow keys and swipe)
- `app/videos/page.tsx`: Videos; add entries to `lib/videos.ts` (a file in `public/videos`, or a YouTube id that loads only on play)
- `components/Protect.tsx`: no right-click, drag, selection, copy or print. It discourages casual saving only.
- `public/photos/`: medium quality WebP (900px grid at q60, 1600px viewer at q68), metadata stripped, anonymous names;
  served as they are (no image optimization)

Run: `cd folio && npm install && npm run dev`.

To change the pictures, run `folio-tools/build.mjs` (see the comment at its top); it rewrites `public/photos` and `lib/photos-data.ts`.
