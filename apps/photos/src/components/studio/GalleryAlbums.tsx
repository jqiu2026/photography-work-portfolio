"use client";

import {
  ArrowDownIcon,
  ArrowUpIcon,
  Badge,
  Button,
  Checkbox,
  CornerDownRightIcon,
  Field,
  Input,
  Select,
  SettingsSection,
  Text,
} from "@holominimal/ui";

import { useConfirm } from "./StudioFrame";

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
      <SettingsSection title="Albums" className="gm-block">
        <Text size="sm" tone="muted">
          Visitors see "All photos" plus these albums. A sub-album sits inside an album. A locked album stays closed
          until its own passcode is entered. Move photographs into an album from the Photos tab.
        </Text>
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
          <Input
            aria-label="Album name"
            placeholder="Album name (for example Ceremony)"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Select aria-label="Inside" value={parent} onValueChange={(v) => setParent(v)}>
            <option value="">Top level</option>
            {tops.map((a) => (
              <option key={a.id} value={a.id}>
                Inside {a.name}
              </option>
            ))}
          </Select>
          <Button type="submit" disabled={pending}>
            Add album
          </Button>
        </form>
      </SettingsSection>
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
      {!albums.length ? (
        <Text size="sm" tone="muted">
          No albums yet. Photographs show under All photos.
        </Text>
      ) : null}
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
  const [ask, confirmEl] = useConfirm();
  const mine = items.filter((i) => i.albumId === album.id);
  return (
    <SettingsSection
      level={3}
      className="gm-block gm-album"
      data-sub={sub || undefined}
      title={
        <>
          {sub ? <CornerDownRightIcon size={14} /> : null} {album.name}{" "}
          <Badge tone="muted">
            {count} photo{count === 1 ? "" : "s"}
          </Badge>
          {album.locked ? <Badge tone="warning">locked</Badge> : null}
          {album.hidden ? <Badge tone="muted">hidden</Badge> : null}
        </>
      }
    >
      <div className="gm-fields">
        <Field label="Name">
          <Input value={name} maxLength={60} onChange={(e) => setName(e.target.value)} />
        </Field>
        <Field label="Short description (shown above its photographs)" className="gm-wide">
          <Input value={desc} maxLength={400} onChange={(e) => setDesc(e.target.value)} />
        </Field>
        <Field label="Cover photograph">
          <Select
            value={album.coverMediaId ?? ""}
            onValueChange={(v) =>
              run(() => updateAlbumAction({ galleryId, albumId: album.id, coverMediaId: v || null }))
            }
          >
            <option value="">First photograph</option>
            {mine.map((i) => (
              <option key={i.mediaId} value={i.mediaId}>
                {i.filename}
              </option>
            ))}
          </Select>
        </Field>
        <Checkbox
          checked={album.hidden}
          onChange={(e) => run(() => updateAlbumAction({ galleryId, albumId: album.id, hidden: e.target.checked }))}
          label="Hide this album from the list (its photographs still show under All photos)"
        />
      </div>
      <div className="gm-row">
        <Button
          disabled={pending}
          onClick={() => run(() => updateAlbumAction({ galleryId, albumId: album.id, name, description: desc }))}
        >
          Save album
        </Button>
        {!sub ? (
          <>
            <Button
              variant="secondary"
              disabled={pending || first}
              onClick={() => move?.(album.id, -1)}
              aria-label={`Move ${album.name} earlier`}
            >
              <ArrowUpIcon />
            </Button>
            <Button
              variant="secondary"
              disabled={pending || last}
              onClick={() => move?.(album.id, 1)}
              aria-label={`Move ${album.name} later`}
            >
              <ArrowDownIcon />
            </Button>
          </>
        ) : null}
        <Button
          variant="danger"
          disabled={pending}
          onClick={async () =>
            (await ask({
              title: `Delete the album "${album.name}"?`,
              body: "Its photographs stay in the gallery, outside any album.",
              action: "Delete album",
            })) && run(() => deleteAlbumAction({ galleryId, albumId: album.id }))
          }
        >
          Delete album
        </Button>
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
        <Input
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
        <Button type="submit" variant="secondary" disabled={pending}>
          {album.locked && !code ? "Remove the lock" : "Lock album"}
        </Button>
      </form>
      {children}
      {confirmEl}
    </SettingsSection>
  );
}
