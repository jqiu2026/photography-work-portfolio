import type { ProjectBlockView } from "@jerryqiu/db/queries";
import type { PhotoSpecs } from "@jerryqiu/db/specs";

/** What a protected photograph needs on the page: an opaque id, dimensions and a placeholder. Never a file URL. */
export type BareAsset = {
  id: string;
  width: number;
  height: number;
  color?: string;
  blur?: string;
  alt?: string;
  caption?: string;
  specs?: PhotoSpecs;
  files: [];
};

export function bare(a: {
  id?: string;
  width: number;
  height: number;
  color?: string;
  blur?: string;
  alt?: string;
  caption?: string;
  specs?: PhotoSpecs;
}): BareAsset {
  if (!a.id) throw new Error("A photograph without an id cannot be protected");
  return {
    id: a.id,
    width: a.width,
    height: a.height,
    color: a.color,
    blur: a.blur,
    alt: a.alt,
    caption: a.caption,
    specs: a.specs,
    files: [],
  };
}

/** The same blocks with every photograph reduced to a bare asset (the DB views carry image-route URLs). */
export function bareBlocks(blocks: ProjectBlockView[]): ProjectBlockView[] {
  return blocks.map((b) => {
    if (b.type === "image") return { ...b, asset: bare(b.asset) } as ProjectBlockView;
    if (b.type === "gallery") return { ...b, assets: b.assets.map(bare) } as ProjectBlockView;
    return b;
  });
}
