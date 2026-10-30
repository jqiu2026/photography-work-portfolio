# folio (folio.jerryqiu.com)

A small standalone Next.js app (its own `package.json` and `package-lock.json`, not part of the pnpm workspace).
In Vercel: **Root Directory** `folio`, Framework Preset **Next.js**, default build and install commands.

- `app/page.tsx`: Photos (masonry per category, viewer with arrow keys and swipe)
- `app/videos/page.tsx`: Videos: playlist cards (each opens its own page, `app/videos/[slug]`, that plays the whole playlist in the site) and single videos (open in a viewer on the page). Everything plays in YouTube's embedded player; nothing is requested from YouTube until play is pressed (thumbnails are saved in `public/video-thumbs`). To change the list, edit `folio-tools/videos.mjs` and run it.
- `components/Protect.tsx`: no right-click, drag, selection, copy or print. It discourages casual saving only.
- `public/photos/`: medium quality WebP (900px grid at q60, 1600px viewer at q68), metadata stripped, anonymous names;
  served as they are (no image optimization)

Run: `cd folio && npm install && npm run dev`.

To change the pictures, run `folio-tools/build.mjs` (see the comment at its top); it rewrites `public/photos` and `lib/photos-data.ts`.
