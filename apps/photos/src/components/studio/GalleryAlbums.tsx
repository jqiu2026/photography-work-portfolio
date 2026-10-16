"use client";

import { useState } from "react";
import {
  createAlbumAction,
  deleteAlbumAction,
  sortAlbumsAction,
  updateAlbumAction,
} from "@/app/studio/gallery-actions";

type Album = {
  id: string;
  name: string;
  description: string;
  parentId: string | null;
  locked: boolean;
  hidden: boolean;
  coverMediaId: string | null;
};
type Run = (fn: () => Promise<{ ok: boolean; [k: string]: unknown }>, after?: () => void) => void;

/**
 * Albums for one gallery: add albums and sub-albums, reorder, lock one with its own passcode, hide one from the list, pick a
 * cover, and say what is in it. The photographs themselves are moved into albums from the Photos tab.
 */
export function GalleryAlbums({
  galleryId,
  albums,
  items,
  run,
  pending,
}: {
  galleryId: string;
  albums: Album[];
  items: { mediaId: string; filename: string; albumId: string | null }[];
  run: Run;
  pending: boolean;
}) {
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const tops = albums.filter((a) => !a.parentId);
  const countIn = (id: string) => items.filter((i) => i.albumId === id).length;
  const move = (id: string, dir: -1 | 1) => {
    const ids = tops.map((a) => a.id);
    const at = ids.indexOf(id);
    const to = at + dir;
    if (to < 0 || to >= ids.length) return;
    [ids[at], ids[to]] = [ids[to], ids[at]];
    run(() => sortAlbumsAction({ galleryId, ids }));
  };
  return (
    <>
      <div className="gm-block">
        <h2>Albums</h2>
        <p className="st-note">
          Visitors see "All photos" plus these albums. A sub-album sits inside an album. A locked album stays closed
          until its own passcode is entered. Move photographs into an album from the Photos tab.
        </p>
        <form
          className="gm-inline"
          aria-label="New album"
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            run(
              () => createAlbumAction({ galleryId, name, parentId: parent || undefined }),
              () => setName(""),
            );
          }}
        >
          <input
            aria-label="Album name"
            placeholder="Album name (for example Ceremony)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <select aria-label="Inside" value={parent} onChange={(e) => setParent(e.target.value)}>
            <option value="">Top level</option>
            {tops.map((a) => (
              <option key={a.id} value={a.id}>
                Inside {a.name}
              </option>
            ))}
          </select>
          <button type="submit" className="st-btn" disabled={pending}>
            Add album
          </button>
        </form>
      </div>
      {tops.map((a, n) => (
        <AlbumCard
          key={a.id}
          album={a}
          count={countIn(a.id)}
          galleryId={galleryId}
          run={run}
          pending={pending}
          first={n === 0}
          last={n === tops.length - 1}
          move={move}
          items={items}
        >
          {albums
            .filter((k) => k.parentId === a.id)
            .map((k) => (
              <AlbumCard
                key={k.id}
                album={k}
                count={countIn(k.id)}
                galleryId={galleryId}
                run={run}
                pending={pending}
                sub
                items={items}
              />
            ))}
        </AlbumCard>
      ))}
      {!albums.length ? <p className="st-note">No albums yet. Photographs show under All photos.</p> : null}
    </>
  );
}

function AlbumCard({
  album,
  count,
  galleryId,
  run,
  pending,
  sub,
  first,
  last,
  move,
  children,
  items,
}: {
  album: Album;
  count: number;
  galleryId: string;
  run: Run;
  pending: boolean;
  sub?: boolean;
  first?: boolean;
  last?: boolean;
  move?: (id: string, dir: -1 | 1) => void;
  children?: React.ReactNode;
  items: { mediaId: string; filename: string; albumId: string | null }[];
}) {
  const [name, setName] = useState(album.name);
  const [desc, setDesc] = useState(album.description);
  const [code, setCode] = useState("");
  const mine = items.filter((i) => i.albumId === album.id);
  return (
    <div className="gm-block" data-sub={sub || undefined} style={sub ? { marginLeft: "1.5rem" } : undefined}>
      <h3>
        {sub ? "↳ " : ""}
        {album.name}{" "}
        <small>
          {count} photo{count === 1 ? "" : "s"}
        </small>
        {album.locked ? <em> · locked</em> : null}
        {album.hidden ? <em> · hidden</em> : null}
      </h3>
      <div className="gm-fields">
        <label>
          Name
          <input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="gm-wide">
          Short description (shown above its photographs)
          <input value={desc} maxLength={400} onChange={(e) => setDesc(e.target.value)} />
        </label>
        <label>
          Cover photograph
          <select
            value={album.coverMediaId ?? ""}
            onChange={(e) =>
              run(() => updateAlbumAction({ galleryId, albumId: album.id, coverMediaId: e.target.value || null }))
            }
          >
            <option value="">First photograph</option>
            {mine.map((i) => (
              <option key={i.mediaId} value={i.mediaId}>
                {i.filename}
              </option>
            ))}
          </select>
        </label>
        <label className="gm-check">
          <input
            type="checkbox"
            checked={album.hidden}
            onChange={(e) => run(() => updateAlbumAction({ galleryId, albumId: album.id, hidden: e.target.checked }))}
          />{" "}
          Hide this album from the list (its photographs still show under All photos)
        </label>
      </div>
      <div className="gm-row">
        <button
          type="button"
          className="st-btn"
          disabled={pending}
          onClick={() => run(() => updateAlbumAction({ galleryId, albumId: album.id, name, description: desc }))}
        >
          Save album
        </button>
        {!sub ? (
          <>
            <button
              type="button"
              className="st-btn st-btn--ghost"
              disabled={pending || first}
              onClick={() => move?.(album.id, -1)}
              aria-label={`Move ${album.name} earlier`}
            >
              ↑
            </button>
            <button
              type="button"
              className="st-btn st-btn--ghost"
              disabled={pending || last}
              onClick={() => move?.(album.id, 1)}
              aria-label={`Move ${album.name} later`}
            >
              ↓
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="st-btn st-btn--ghost"
          disabled={pending}
          onClick={() =>
            confirm(`Delete the album "${album.name}"? Its photographs stay in the gallery.`) &&
            run(() => deleteAlbumAction({ galleryId, albumId: album.id }))
          }
        >
          Delete album
        </button>
      </div>
      <form
        className="gm-inline"
        noValidate
        aria-label={`Lock ${album.name}`}
        onSubmit={(e) => {
          e.preventDefault();
          run(
            () => updateAlbumAction({ galleryId, albumId: album.id, passcode: code }),
            () => setCode(""),
          );
        }}
      >
        <input
          aria-label={`Passcode for ${album.name}`}
          placeholder={
            album.locked
              ? "Locked · type a new passcode, or leave blank to unlock"
              : "Lock with a passcode (4+ characters)"
          }
          autoComplete="off"
          value={code}
          onChange={(e) => setCode(e.target.value)}
        />
        <button type="submit" className="st-btn st-btn--ghost" disabled={pending}>
          {album.locked && !code ? "Remove the lock" : "Lock album"}
        </button>
      </form>
      {children}
    </div>
  );
}
