import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type MdxTeam = { name: string; role: string; avatar: string; instagram: string };
export type MdxMetadata = {
  title: string;
  subtitle?: string;
  publishedAt: string;
  summary: string;
  image?: string;
  images: string[];
  video?: string;
  tag?: string;
  team: MdxTeam[];
  link?: string;
  protected?: boolean;
};

/** Reads the `.mdx` files in `<cwd>/<...customPath>` (front matter + body). A missing folder gives an empty list. */
export function readMdxDir(customPath: string[]) {
  const dir = path.join(process.cwd(), ...customPath);
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((file) => path.extname(file) === ".mdx")
    .map((file) => {
      const { data, content } = matter(fs.readFileSync(path.join(dir, file), "utf-8"));
      const metadata: MdxMetadata = {
        title: data.title || "",
        subtitle: data.subtitle || "",
        publishedAt: data.publishedAt,
        summary: data.summary || "",
        image: data.image || "",
        images: data.images || [],
        video: data.video || "",
        tag: data.tag || undefined,
        team: data.team || [],
        link: data.link || "",
        protected: data.protected === true,
      };
      return { metadata, slug: path.basename(file, path.extname(file)), content };
    });
}
