# jerryqiu.com sites

Monorepo for Jerry Qiu's personal hub (jerryqiu.com), the photography site (photos.), and the music and flying sites, built on one open-source UI package (`@halation/ui`, a placeholder name).

```bash
pnpm install
pnpm dev          # hub :3000, docs :3001, photos :3002
pnpm build && pnpm typecheck && pnpm lint
```

- `apps/web` hub, music, flying. `apps/photos` photography. `apps/docs` UI docs.
- `packages/ui` the UI package. `packages/sites` site registry and theme presets.
- Project plan, status and rules: [docs/project/](docs/project/README.md).

Photographs and writing are (c) Jerry Qiu, all rights reserved. See [LICENSE](LICENSE) for the repository licence.
