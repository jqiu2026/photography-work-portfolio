import { StageProvider } from "@halation/ui/stage";
import type { ReactNode } from "react";
import { type SiteId, getSite, getSites, sitePath } from "./index";
import { legalPaths, person, socials } from "./profile";
import { ShellIndex } from "./ShellIndex";

/**
 * Chrome for inner pages and simple homes. There is NO navbar anywhere: a quiet text mark, the floating index control,
 * a skip link and a footer. The hub's footer introduces the three worlds; photography, music and flying carry NO
 * reference to any other site, only the one `jerryqiu.com` button (cross-site rule, 12-vision-v2.md; tested in
 * e2e/cross-site.spec.ts).
 */
export function SiteShell({
  children,
  currentId = "hub",
  links,
  quiet = true,
  cinema = false,
}: {
  children: ReactNode;
  currentId?: SiteId;
  links: { label: string; href: string }[];
  quiet?: boolean;
  cinema?: boolean;
}) {
  const hub = getSite("hub");
  const self = getSite(currentId);
  const year = new Date().getFullYear();
  const note = `© ${year} ${person.name}. All photographs and writing are © ${person.name} unless stated.`;
  return (
    <StageProvider world={currentId} quiet={quiet} cinema={cinema}>
      <a className="hl-skip" href="#main">
        Skip to content
      </a>
      <header className="hl-quiet">
        <a href={sitePath(currentId)}>{self.name}</a>
      </header>
      <main id="main">{children}</main>
      <footer className="hl-footer">
        <div className="hl-footer__in">
          {currentId === "hub" ? (
            <>
              <nav aria-label="The three rooms">
                <ul>
                  {getSites()
                    .filter((s) => s.id !== "hub")
                    .map((s) => (
                      <li key={s.id}>
                        <a href={s.url}>{s.name}</a>
                      </li>
                    ))}
                </ul>
              </nav>
              <ul aria-label="Elsewhere">
                {socials.map((s) => (
                  <li key={s.label}>
                    <a href={s.href}>{s.label}</a>
                  </li>
                ))}
              </ul>
              <p className="hl-footer__note">{note}</p>
              <nav aria-label="Legal">
                <ul>
                  {legalPaths.map((l) => (
                    <li key={l.label}>
                      <a href={l.path}>{l.label}</a>
                    </li>
                  ))}
                </ul>
              </nav>
            </>
          ) : (
            <>
              <p className="hl-footer__note">{note}</p>
              <a className="hl-return" href={hub.url} data-return-to-hub>
                jerryqiu.com
              </a>
            </>
          )}
        </div>
      </footer>
      <ShellIndex routes={links} />
    </StageProvider>
  );
}
