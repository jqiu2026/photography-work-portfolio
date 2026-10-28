# jerryqiu.com sites

Monorepo for Jerry Qiu's personal hub (jerryqiu.com), the photography site and photo-business platform (photo.), and the music, flying and make sites, all built on one design system, **Holominimal** (`@holominimal/ui`, in `packages/holominimal`).

```bash
pnpm install
pnpm dev          # hub :3000, docs :3001, photos :3002
pnpm build && pnpm typecheck && pnpm lint
```

- `apps/web` hub (the Nexus, writing, the CMS). `apps/music`, `apps/flying`, `apps/make`. `apps/photos` photography (portfolio, video, case studies, booking, studio). `apps/docs` Holominimal docs.
- `packages/holominimal` Holominimal, the design system. `packages/sites` site registry, contact form and theme script. `packages/render` Markdown/MDX/blocks. `packages/mocks` labelled local mocks (payments, e-sign, portal, scores, flights; off in production).
- Design: [vision and design](docs/project/00-vision-and-design.md). Older briefs: [archive](docs/project/archive/).
- Project plan, status and rules: [docs/project/](docs/project/README.md).

Photographs and writing are (c) Jerry Qiu, all rights reserved. See [LICENSE](LICENSE) for the repository licence.
