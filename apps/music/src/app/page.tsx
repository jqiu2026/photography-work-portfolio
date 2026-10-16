import { Image } from "@halation/ui/media";
import { Condense, Scene, Settle, StageProvider, Streak } from "@halation/ui/stage";
import { compositions, mocksEnabled } from "@jerryqiu/mocks";
import { getSite, sitePath } from "@jerryqiu/sites";
import { ShellIndex } from "@jerryqiu/sites/index-control";
import Link from "next/link";
import { Empty } from "@/components/interest/Empty";
import "@/components/music/music.css";
import { getImage } from "@/lib/images";
import { getMusicContent } from "@/lib/interests";

export default async function MusicHome() {
  const music = await getMusicContent();
  const img = getImage("gallery", "jry0473");
  const hub = getSite("hub");
  const hasRecordings = music.recordings.length > 0;
  const links = [
    { label: "Home", href: sitePath("music") },
    ...(mocksEnabled()
      ? [
          { label: "Compositions", href: sitePath("music", "/compositions") },
          { label: "Scores", href: sitePath("music", "/scores") },
        ]
      : []),
    ...(hasRecordings ? [{ label: "Listen", href: sitePath("music", "/listen") }] : []),
    { label: "Performances", href: sitePath("music", "/performances") },
    { label: "About", href: sitePath("music", "/about") },
  ];
  return (
    <StageProvider world="music">
      <a className="hl-skip" href="#main">
        Skip to content
      </a>
      <ShellIndex routes={links} />
      <main id="main" className="mu">
        <Scene id="stage" label="Music" as="header" className="mu-stage" param={[0.45, 0.45]}>
          <div className="mu-wrap">
            <p className="hl-eyebrow">Jerry Qiu</p>
            <Streak as="h1" text="Music" className="mu-title" />
            <div className="mu-staff" aria-hidden="true" />
            {music.intro ? (
              <Settle as="p" className="mu-lede" when="load">
                {music.intro}
              </Settle>
            ) : null}
            {/* TODO(owner): rewrite in your voice. */}
            <Settle as="p" className="mu-lede mu-lede--voice" when="load">
              Things I wrote, and sometimes played.
            </Settle>
          </div>
        </Scene>

        <Scene id="room" label="Listening" className="mu-room" param={[0.3, 0.7]}>
          <div className="mu-wrap mu-split">
            <figure className="mu-photo">
              <Image
                asset={img}
                alt="A trombonist performing in a haze of coloured stage light."
                sizes="(min-width: 860px) 40vw, 100vw"
              />
            </figure>
            <div>
              <Condense text="The score and the recording are two different things." className="mu-h2" />
              {hasRecordings ? (
                <>
                  <Settle as="p" className="mu-lede">
                    Pick the one you came for. Recordings load only when you press play.
                  </Settle>
                  <Link href={sitePath("music", "/listen")} className="mu-more">
                    Enter the listening room →
                  </Link>
                </>
              ) : (
                <Empty>This page is being put together. Check back soon.</Empty>
              )}
            </div>
          </div>
        </Scene>

        {mocksEnabled() ? (
          <Scene id="pieces" label="Compositions" className="mu-perf" param={[0.3, 0.55]}>
            <div className="mu-wrap">
              <Condense text="Pieces." className="mu-h2" />
              <ul className="mu-list">
                {compositions.map((c) => (
                  <li key={c.slug}>
                    <Link href={sitePath("music", `/compositions/${c.slug}`)}>{c.title}</Link>
                    <span className="hl-eyebrow">{c.forces}</span>
                  </li>
                ))}
              </ul>
              <Link href={sitePath("music", "/scores")} className="mu-more">
                Scores: preview and buy (mock) →
              </Link>
            </div>
          </Scene>
        ) : null}

        {music.performances.length ? (
          <Scene id="performances" label="Performances" className="mu-perf">
            <div className="mu-wrap">
              <Condense text="Where I've played." className="mu-h2" />
              <ul className="mu-list">
                {music.performances.map((p) => (
                  <li key={`${p.title}-${p.date}`}>
                    <span>{p.title}</span>
                    <span className="hl-eyebrow">{[p.date, p.venue].filter(Boolean).join(" · ")}</span>
                  </li>
                ))}
              </ul>
            </div>
          </Scene>
        ) : null}

        <Scene id="hello" label="Say hello" className="mu-hello">
          <div className="mu-wrap">
            <Condense text="Say hello." className="mu-hello__t" />
            <Settle as="p" className="mu-lede">
              Questions about a piece, a score, a performance? Write.
            </Settle>
          </div>
        </Scene>
      </main>
      <footer className="hl-footer">
        <div className="hl-footer__in">
          <p className="hl-footer__note">
            © {new Date().getFullYear()} Jerry Qiu. All music and writing are © Jerry Qiu unless stated.
          </p>
          <a className="hl-return" href={hub.url} data-return-to-hub>
            jerryqiu.com
          </a>
        </div>
      </footer>
    </StageProvider>
  );
}
