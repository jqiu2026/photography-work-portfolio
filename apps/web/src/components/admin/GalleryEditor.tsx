"use client";

import { Button, Input, useToast } from "@halation/ui";
import { ArrowDown, ArrowUp, EyeOff, Star, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addToGallery,
  removeGalleryItem,
  reorderGallery,
  setGalleryCover,
  updateGalleryItem,
} from "@/app/(admin)/admin/galleries/actions";
import { MediaPicker } from "./MediaPicker";
import { Uploader } from "./Uploader";

export type GItem = {
  id: string;
  mediaId: string;
  caption: string;
  alt: string;
  hidden: boolean;
  filename: string;
  needsReview: boolean;
};

/** Images of a gallery: bulk upload, drag to reorder (or use the arrows), caption, alt text, hide, cover. */
export function GalleryEditor({
  galleryId,
  coverId,
  items: initial,
}: { galleryId: string; coverId: string | null; items: GItem[] }) {
  const [items, setItems] = useState(initial);
  const [dragged, setDragged] = useState<string | null>(null);
  const [cover, setCover] = useState(coverId);
  const [, start] = useTransition();
  const toast = useToast();
  const router = useRouter();

  const persistOrder = (next: GItem[]) => {
    setItems(next);
    start(async () => {
      const r = await reorderGallery(
        galleryId,
        next.map((i) => i.id),
      );
      if (!r.ok) toast(r.error ?? "Could not save the order", "danger");
    });
  };
  const move = (i: number, d: number) => {
    const j = i + d;
    if (j < 0 || j >= items.length) return;
    const n = items.slice();
    [n[i], n[j]] = [n[j], n[i]];
    persistOrder(n);
  };
  const patch = (id: string, p: Partial<GItem>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));
  const save = (it: GItem) =>
    start(async () => {
      const r = await updateGalleryItem({ id: it.id, caption: it.caption, alt: it.alt, hidden: it.hidden });
      if (!r.ok) toast(r.error ?? "Could not save", "danger");
    });

  return (
    <div>
      <Uploader
        onDone={async (ids) => {
          await addToGallery(galleryId, ids);
          router.refresh();
        }}
        label="Upload into this gallery"
      />
      <div style={{ margin: "1rem 0" }}>
        <MediaPicker
          label="Or add from the library"
          multiple
          onPick={async (m) => {
            const r = await addToGallery(galleryId, [m.id]);
            toast(r.ok ? (r.message ?? "Added") : (r.error ?? "Failed"));
            router.refresh();
          }}
        />
      </div>
      <p className="adm-note" style={{ margin: "1.5rem 0 0.75rem" }}>
        {items.length} image{items.length === 1 ? "" : "s"}. Drag to reorder, or use the arrows.
      </p>
      <ul className="adm-gitems">
        {items.map((it, i) => (
          <li
            key={it.id}
            draggable
            onDragStart={() => setDragged(it.id)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => {
              if (!dragged || dragged === it.id) return;
              const from = items.findIndex((x) => x.id === dragged);
              const n = items.slice();
              const [m] = n.splice(from, 1);
              n.splice(i, 0, m);
              setDragged(null);
              persistOrder(n);
            }}
            data-hidden={it.hidden || undefined}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`/api/admin/media/${it.mediaId}/file?w=480`} alt={it.alt} draggable={false} />
            <div className="adm-gitems__body">
              <span className="adm-note" style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {i + 1}. {it.filename}
                {it.needsReview ? " · needs review" : ""}
                {cover === it.mediaId ? " · cover" : ""}
              </span>
              <Input
                aria-label={`Caption for ${it.filename}`}
                placeholder="Caption"
                value={it.caption}
                onChange={(e) => patch(it.id, { caption: e.target.value })}
                onBlur={() => save(it)}
              />
              <Input
                aria-label={`Alt text for ${it.filename}`}
                placeholder="Alt text (describe the picture)"
                value={it.alt}
                onChange={(e) => patch(it.id, { alt: e.target.value })}
                onBlur={() => save(it)}
              />
              <div style={{ display: "flex", gap: "0.25rem", flexWrap: "wrap" }}>
                <Button type="button" size="sm" variant="quiet" aria-label="Move earlier" onClick={() => move(i, -1)}>
                  <ArrowUp size={14} />
                </Button>
                <Button type="button" size="sm" variant="quiet" aria-label="Move later" onClick={() => move(i, 1)}>
                  <ArrowDown size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  aria-pressed={it.hidden}
                  aria-label={it.hidden ? "Show in gallery" : "Hide from gallery"}
                  onClick={() => {
                    const n = { ...it, hidden: !it.hidden };
                    patch(it.id, { hidden: n.hidden });
                    save(n);
                  }}
                >
                  <EyeOff size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  aria-label="Use as cover"
                  onClick={() =>
                    start(async () => {
                      const r = await setGalleryCover(galleryId, it.mediaId);
                      if (r.ok) {
                        setCover(it.mediaId);
                        toast("Cover set");
                      } else toast(r.error ?? "Failed", "danger");
                    })
                  }
                >
                  <Star size={14} />
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="quiet"
                  aria-label="Remove from gallery"
                  onClick={() => {
                    if (!window.confirm("Remove this image from the gallery? It stays in the media library.")) return;
                    start(async () => {
                      const r = await removeGalleryItem(it.id);
                      if (r.ok) {
                        setItems((xs) => xs.filter((x) => x.id !== it.id));
                        toast("Removed");
                      } else toast(r.error ?? "Failed", "danger");
                    });
                  }}
                >
                  <Trash2 size={14} />
                </Button>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
