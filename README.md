# jerryqiu.com sites

Monorepo for Jerry Qiu's personal hub (jerryqiu.com), the photography site and photo-business platform (photo.), and the music and flying sites, built on one original UI system, **Halation UI** (`@halation/ui`, name is the owner's default, licence undecided).

```bash
pnpm install
pnpm dev          # hub :3000, docs :3001, photos :3002
pnpm build && pnpm typecheck && pnpm lint
```

- `apps/web` hub (blog), music, flying. `apps/photos` photography (portfolio, video, case studies, booking, studio). `apps/docs` UI docs.
- `packages/ui` Halation UI (stage, Flow motion, index control, tiers). `packages/sites` site registry and shell. `packages/render` Markdown/MDX/blocks. `packages/mocks` labelled local mocks (payments, e-sign, portal, scores, flights; off in production).
- Design: [vision and design](docs/project/00-vision-and-design.md). Older briefs: [archive](docs/project/archive/).
- Project plan, status and rules: [docs/project/](docs/project/README.md).

Photographs and writing are (c) Jerry Qiu, all rights reserved. See [LICENSE](LICENSE) for the repository licence.
