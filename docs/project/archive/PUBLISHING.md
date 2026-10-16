# Publishing the UI package (owner steps; Claude never does these)

> **2026-10-12:** the package is being rebuilt as **Halation UI** (default name, Q33; prefix `hl`, `--hl-*`). It is meant to be **sold**, so read [SELLING.md](SELLING.md) first (licence model, legal, selling channel). The commands below stay valid with the new name; the package path is still `packages/ui` unless R2 moves it. The licence is undecided (Q32): do not publish under MIT unless you choose that.

Nothing here has been done. The package is prepared so publishing is a few commands.

## Before you publish
1. Choose the real name (see [07](07-naming-brainstorm.md)) and run `node scripts/rename.mjs --package @yourscope/name --brand YourBrand --prefix xx`, then `pnpm install`. Verify with `scripts/test-rename.sh` (works on a scratch copy).
2. Replace the `TODO(owner)` placeholders: copyright holder in `packages/ui/LICENSE` and `package.json` (`author`, `repository`, `homepage`, `bugs`), conduct and security contacts.
3. Make sure the repository you publish from has no personal photographs in its history. The UI package itself contains none (docs demos use generated gradients). If the monorepo is private/personal, publish the package from a clean public repo (or `git subtree split` of `packages/ui`).
4. Run `node scripts/licenses.mjs` (fails on copyleft) and `scripts/test-example.sh` (packs the package and builds the Vite example from the tarball).

## Release
```bash
pnpm changeset              # describe the change, pick the bump
pnpm changeset version      # updates packages/ui/package.json and CHANGELOG.md
pnpm --filter @halation/ui build
cd packages/ui && pnpm pack --dry-run        # check only dist, README, LICENSE, package.json are included
pnpm publish --access public                 # needs `npm login` (2FA); this is the step that goes public
```
`prepack` rebuilds `dist`, and `publishConfig` swaps the source exports for the `dist` exports in the published manifest.

## After
Tag the release in git, publish the docs site (`apps/docs`, a separate Vercel project: see [DEPLOYMENT.md](DEPLOYMENT.md)), and update the README badges.
