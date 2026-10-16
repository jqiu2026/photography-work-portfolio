import { Image } from "@halation/ui/media";
import { Condense, Scene, Settle, StageProvider, Streak } from "@halation/ui/stage";
import { mocksEnabled } from "@jerryqiu/mocks";
import { getSite, sitePath } from "@jerryqiu/sites";
import { ShellIndex } from "@jerryqiu/sites/index-control";
import Link from "next/link";
import { Altimeter } from "@/components/flying/Altimeter";
import "@/components/flying/flying.css";
import { getImage } from "@/lib/images";
import { getFlyingContent } from "@/lib/interests";

export default async function FlyingHome() {
  const flying = await getFlyingContent();
  const cockpit = getImage("blogs", "day-one-cover");
  const hub = getSite("hub");
  const links = [
    { label: "Home", href: sitePath("flying") },
    { label: "Log", href: sitePath("flying", "/log") },
    ...(mocksEnabled() ? [{ label: "Map", href: sitePath("flying", "/map") }] : []),
    { label: "Aircraft", href: sitePath("flying", "/aircraft") },
    { label: "About", href: sitePath("flying", "/about") },
  ];
  return (
    <StageProvider world="flying">
      <a className="hl-skip" href="#main">
        Skip to content
      </a>
      <ShellIndex routes={links} />
      <Altimeter />
      <main id="main" className="fl">
        <Scene id="ground" label="Ground" as="header" className="fl-ground" param={[0, 0.1]}>
          <div className="fl-wrap">
            <p className="hl-eyebrow">Jerry Qiu</p>
            <Streak as="h1" text="Flying" className="fl-title" />
            {/* TODO(owner): rewrite in your voice. */}
            <Settle as="p" className="fl-lede" when="load">
              I'm learning to read the sky.
            </Settle>
            <p className="fl-cue" aria-hidden>
              Climb
            </p>
          </div>
        </Scene>

        <Scene id="climb" label="Climb" className="fl-climb" param={[0.1, 0.4]}>
          <div className="fl-wrap fl-split">
            <figure className="fl-photo">
              <Image
                asset={cockpit}
                alt="The view from a small airplane's cockpit over green countryside and clouds, a pilot in headphones in the foreground."
                sizes="(min-width: 860px) 46vw, 100vw"
              />
            </figure>
            <div>
              <Condense text="Where I've started." className="fl-h2" />
              {flying.story ? (
                <Settle as="p" className="fl-lede">
                  {flying.story}
                </Settle>
              ) : null}
              <ul className="fl-facts">
                {flying.certificates.map((c) => (
                  <li key={c.title}>
                    <strong>{c.title}</strong>
                    <span>{c.note}</span>
                  </li>
                ))}
                <li>
                  <strong>{flying.club.name}</strong>
                  <span>
                    {flying.club.note} <a href={flying.club.href}>@stuyaviators</a>
                  </span>
                </li>
              </ul>
            </div>
          </div>
        </Scene>

        <Scene id="log" label="Log" className="fl-log" param={[0.4, 0.7]}>
          <div className="fl-wrap">
            <Condense text="The log." className="fl-h2" />
            {flying.log.length ? (
              <ul className="fl-strips">
                {flying.log.map((e) => (
                  <li key={`${e.title}-${e.date}`}>
                    <span className="hl-eyebrow">{e.date}</span>
                    <span>{e.title}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <Settle as="p" className="fl-lede">
                Nothing logged yet. Entries appear here once I've published them.
              </Settle>
            )}
            <Link href={sitePath("flying", "/log")} className="fl-more">
              Open the log →
            </Link>
          </div>
        </Scene>

        <Scene id="altitude" label="Say hello" className="fl-hello" param={[0.7, 1.0]}>
          <div className="fl-wrap">
            <Condense text="Say hello." className="fl-hello__t" />
            <Settle as="p" className="fl-note">
              {flying.disclaimer}
            </Settle>
          </div>
        </Scene>
      </main>
      <footer className="hl-footer">
        <div className="hl-footer__in">
          <p className="hl-footer__note">
            © {new Date().getFullYear()} Jerry Qiu. All photographs and writing are © Jerry Qiu unless stated.
          </p>
          <a className="hl-return" href={hub.url} data-return-to-hub>
            jerryqiu.com
          </a>
        </div>
      </footer>
    </StageProvider>
  );
}
