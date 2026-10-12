import { Quote } from "@placeholder/ui";
import { EmbedFacade } from "@placeholder/ui";
import { Image } from "@placeholder/ui/media";
import type { ProjectBlockView } from "@jerryqiu/db/queries";
import { RenderMarkdown } from "@/lib/markdown";

/** Renders a project's CMS blocks. Text is Markdown (no raw HTML); images come from the media library by id only. */
export function Blocks({ blocks, title }: { blocks: ProjectBlockView[]; title: string }) {
  return (
    <>
      {blocks.map((b, i) => {
        const key = `${b.type}-${i}`;
        switch (b.type) {
          case "text":
            return <RenderMarkdown key={key} source={b.markdown} />;
          case "image":
            return (
              <figure key={key} style={{ margin: "2rem 0" }}>
                <Image asset={b.asset} alt={b.asset.alt ?? title} sizes="(min-width: 900px) 760px, 92vw" />
                {b.caption ? <figcaption className="adm-note">{b.caption}</figcaption> : null}
              </figure>
            );
          case "gallery":
            return null; // shown as the full-width gallery below the text
          case "quote":
            return (
              <Quote key={key} cite={b.cite}>
                {b.text}
              </Quote>
            );
          case "video":
            return b.provider === "youtube" ? (
              <EmbedFacade key={key} provider="youtube" id={b.id} title={b.title} />
            ) : null;
          case "columns":
            return (
              <div
                key={key}
                style={{ display: "grid", gap: "2rem", gridTemplateColumns: "repeat(auto-fit, minmax(16rem, 1fr))" }}
              >
                <RenderMarkdown source={b.left} />
                <RenderMarkdown source={b.right} />
              </div>
            );
        }
      })}
    </>
  );
}
