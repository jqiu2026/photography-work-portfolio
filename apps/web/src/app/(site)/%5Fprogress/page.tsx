import { readFile } from "node:fs/promises";
import path from "node:path";
import { getSites } from "@jerryqiu/sites";
import { notFound } from "next/navigation";
import { AutoRefresh } from "@/dev/AutoRefresh";
import { MotionGallery } from "@/dev/MotionGallery";
import { ComponentGallery } from "@/dev/ComponentGallery";
import { Markdown } from "@/dev/markdown";
import "@halation/ui/styles.css";

export const dynamic = "force-dynamic";
export const metadata = { title: "Progress (dev)", robots: { index: false } };

export default async function ProgressPage() {
  if (process.env.NODE_ENV === "production") notFound();
  const file = path.resolve(process.cwd(), "../../docs/project/PROGRESS.md");
  const source = await readFile(file, "utf8").catch(() => "PROGRESS.md not found");
  const sites = getSites();
  const manifest = JSON.parse(await readFile(path.resolve(process.cwd(), "public/opt/gallery/manifest.json"), "utf8"));
  return (
    <main style={{ width: "100%", maxWidth: 1100, padding: "2rem 0 6rem", lineHeight: 1.55 }}>
      <AutoRefresh />
      <p style={{ opacity: 0.6, fontSize: 13, letterSpacing: "0.08em", textTransform: "uppercase" }}>
        Dev only · refreshes every 4s
      </p>
      <nav aria-label="Sites" style={{ display: "flex", gap: 16, flexWrap: "wrap", margin: "1rem 0 2rem" }}>
        {sites.map((s) => (
          <a key={s.id} href={s.url} style={{ textDecoration: "underline" }}>
            {s.name}
          </a>
        ))}
        <a href="http://localhost:3001" style={{ textDecoration: "underline" }}>
          UI docs
        </a>
        <a href="/_design" style={{ textDecoration: "underline" }}>
          Design directions
        </a>
      </nav>
      <article className="dev-md" style={{ maxWidth: 820 }}>
        <Markdown source={source} />
      </article>
      <h2 style={{ fontSize: "1.25rem", margin: "3rem 0 1rem" }}>Component gallery</h2>
      <ComponentGallery />
      <h2 style={{ fontSize: "1.25rem", margin: "3rem 0 1rem" }}>Motion and media</h2>
      <MotionGallery manifest={manifest} />
      <style>{`
        .dev-md h1{font-size:2rem;margin:0 0 .5rem}
        .dev-md h2{font-size:1.25rem;margin:2.2rem 0 .6rem;padding-top:1rem;border-top:1px solid rgba(128,128,128,.25)}
        .dev-md ul{list-style:none;padding:0;margin:.4rem 0}
        .dev-md li{padding:.15rem 0}
        .dev-md li[data-check=done]{opacity:.55}
        .dev-md code{font-size:.9em;background:rgba(128,128,128,.15);padding:.05em .35em;border-radius:4px}
        .dev-md a{text-decoration:underline}
      `}</style>
    </main>
  );
}
