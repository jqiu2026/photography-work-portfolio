import Link from "next/link";

export default function Landing() {
  return (
    <main className="landing">
      <div className="orb o1" aria-hidden="true" />
      <div className="orb o2" aria-hidden="true" />
      <div className="landing-in">
        <p className="l-eyebrow rise" style={{ "--d": "0.1s" } as React.CSSProperties}>
          Jerry Qiu
        </p>
        <h1 className="l-title rise" style={{ "--d": "0.25s" } as React.CSSProperties}>
          <span className="irid shimmer">Folio</span>
        </h1>
        <p className="l-desc rise" style={{ "--d": "0.45s" } as React.CSSProperties}>
          Photography and video from events, stages, sports and the people in them.
        </p>
        <div className="l-actions rise" style={{ "--d": "0.65s" } as React.CSSProperties}>
          <Link href="/photos" className="btn primary">
            View Photos <span aria-hidden="true">&rarr;</span>
          </Link>
          <Link href="/videos" className="btn">
            View Videos <span aria-hidden="true">&rarr;</span>
          </Link>
        </div>
      </div>
      <p className="l-foot">
        <span>&copy; {new Date().getFullYear()} Jerry Qiu</span>
        <span>
          <a className="mail" href="mailto:info@jerryqiu.com">
            info@jerryqiu.com
          </a>
        </span>
      </p>
    </main>
  );
}
