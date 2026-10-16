"use client";

import type { GalleryStyle } from "@jerryqiu/db/gallery-security";

type Props = {
  sty: GalleryStyle;
  updSty: <K extends keyof GalleryStyle>(k: K, v: GalleryStyle[K]) => void;
  tracks: { id: string; title: string; artist: string }[];
  onSave: () => void;
  pending: boolean;
};

/**
 * The parts of a gallery's branding beyond type and layout: the cover page and rules note, colours, a banner across the top,
 * the About text and the music playlist. One Save at the bottom; the gallery shows each as soon as it is saved.
 */
export function GalleryBranding({ sty, updSty, tracks, onSave, pending }: Props) {
  const hex = (v: string, fallback: string) => (/^#[0-9a-f]{6}$/i.test(v) ? v : fallback);
  const colour = (k: "primary" | "secondary", label: string) => (
    <label>
      {label}
      <span className="gm-colour">
        <input
          type="color"
          aria-label={`Pick ${label.toLowerCase()}`}
          value={hex(sty[k], "#ffffff")}
          onChange={(e) => updSty(k, e.target.value)}
        />
        <input
          aria-label={`${label} (hex, optional)`}
          placeholder="#cc3322"
          value={sty[k]}
          onChange={(e) => updSty(k, e.target.value)}
        />
      </span>
    </label>
  );
  const toggle = (id: string) =>
    updSty("playlist", sty.playlist.includes(id) ? sty.playlist.filter((x) => x !== id) : [...sty.playlist, id]);
  return (
    <>
      <div className="gm-block">
        <h2>Cover page and rules note</h2>
        <p className="st-note">
          Visitors first see the cover with a View Gallery button. The note below (rules, thanks) appears once per visit
          with a Continue button. Use **bold**, *italic*, [links](https://example.com) and lines starting with "- " for
          a list. Pasted HTML is converted.
        </p>
        <div className="gm-fields">
          <label className="gm-check">
            <input type="checkbox" checked={sty.introPage} onChange={(e) => updSty("introPage", e.target.checked)} />{" "}
            Open with the cover page
          </label>
          <label>
            Note heading
            <input maxLength={60} value={sty.introHeadline} onChange={(e) => updSty("introHeadline", e.target.value)} />
          </label>
          <label className="gm-wide">
            Note (blank = none)
            <textarea
              rows={8}
              maxLength={3000}
              value={sty.introMessage}
              onChange={(e) => updSty("introMessage", e.target.value)}
            />
          </label>
        </div>
      </div>
      <div className="gm-block">
        <h2>Colours</h2>
        <div className="gm-fields">
          {colour("primary", "Primary colour")}
          {colour("secondary", "Link colour")}
        </div>
        <p className="st-note">
          The primary colour is used for buttons and the active tab. Leave blank for the theme's own.
        </p>
      </div>
      <div className="gm-block">
        <h2>Banner</h2>
        <div className="gm-fields">
          <label className="gm-check">
            <input
              type="checkbox"
              checked={sty.bannerEnabled}
              onChange={(e) => updSty("bannerEnabled", e.target.checked)}
            />{" "}
            Show a banner across the top
          </label>
          <label className="gm-wide">
            Banner text
            <input maxLength={120} value={sty.bannerText} onChange={(e) => updSty("bannerText", e.target.value)} />
          </label>
          <label>
            Link (optional, starts with https://)
            <input maxLength={300} value={sty.bannerLink} onChange={(e) => updSty("bannerLink", e.target.value)} />
          </label>
          <label>
            Stops showing after (optional)
            <input type="date" value={sty.bannerExpires} onChange={(e) => updSty("bannerExpires", e.target.value)} />
          </label>
        </div>
      </div>
      <div className="gm-block">
        <h2>About tab</h2>
        <label className="gm-wide">
          A few lines about you or the shoot (your contact details come from Settings, Brand)
          <textarea
            rows={4}
            maxLength={1500}
            value={sty.aboutText}
            onChange={(e) => updSty("aboutText", e.target.value)}
          />
        </label>
      </div>
      <div className="gm-block">
        <h2>Music</h2>
        {tracks.length ? (
          <>
            <p className="st-note">
              Tracks play in order while a visitor looks around. Add tracks under Galleries, Music.
            </p>
            <ul className="st-list">
              {tracks.map((t) => (
                <li key={t.id}>
                  <label className="gm-check">
                    <input type="checkbox" checked={sty.playlist.includes(t.id)} onChange={() => toggle(t.id)} />{" "}
                    {t.title}
                    {t.artist ? <small> · {t.artist}</small> : null}
                  </label>
                </li>
              ))}
            </ul>
            <label className="gm-check">
              <input type="checkbox" checked={sty.autoplay} onChange={(e) => updSty("autoplay", e.target.checked)} />{" "}
              Start playing when the visitor opens the gallery
            </label>
          </>
        ) : (
          <p className="st-note">No tracks yet. Add some under Galleries, Music, then pick them here.</p>
        )}
      </div>
      <button type="button" className="st-btn" disabled={pending} onClick={onSave}>
        Save branding
      </button>
    </>
  );
}
