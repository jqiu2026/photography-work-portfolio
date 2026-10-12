import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { RenderMarkdown } from "../src/lib/markdown";

const html = (md: string) => renderToStaticMarkup(<RenderMarkdown source={md} />);

describe("RenderMarkdown (CMS content is data, never code)", () => {
  it("renders headings, emphasis, lists and tables", () => {
    const out = html("## Title\n\nSome *emphasis* and **bold**.\n\n- one\n- two\n\n| a | b |\n|---|---|\n| 1 | 2 |");
    expect(out).toContain("<h2");
    expect(out).toContain("<em>emphasis</em>");
    expect(out).toContain("<li>one</li>");
    expect(out).toContain("<table");
  });
  it("never emits raw HTML or scripts", () => {
    const out = html(
      '<script>alert(1)</script>\n\n<img src=x onerror=alert(1)>\n\n<iframe src="https://evil.example"></iframe>\n\nplain',
    );
    expect(out).not.toContain("<script");
    expect(out).not.toContain("onerror");
    expect(out).not.toContain("<iframe");
    expect(out).toContain("plain");
  });
  it("drops dangerous link schemes but keeps normal links", () => {
    const out = html(
      "[bad](javascript:alert(1)) [data](data:text/html;base64,AAAA) [ok](https://example.com) [local](/about) [mail](mailto:a@b.co)",
    );
    expect(out).not.toContain("javascript:");
    expect(out).not.toContain("data:text");
    expect(out).toContain('href="https://example.com"');
    expect(out).toContain('rel="noopener noreferrer"');
    expect(out).toContain('href="/about"');
    expect(out).toContain('href="mailto:a@b.co"');
  });
  it("only allows https or site-relative images", () => {
    expect(html("![x](javascript:alert(1))")).not.toContain("<img");
    expect(html("![x](http://insecure.example/a.png)")).not.toContain("<img");
    expect(html("![alt text](https://example.com/a.png)")).toContain('alt="alt text"');
    expect(html("![](/img/abc?w=960)")).toContain('src="/img/abc?w=960"');
  });
  it("turns the youtube shortcode into click-to-load facades (no iframe, no request)", () => {
    const one = html("[[youtube dQw4w9WgXcQ]]");
    expect(one).not.toContain("<iframe");
    expect(one).toContain("Loads youtube when you press play");
    const grid = html("[[youtube aaaaaaaaaaa bbbbbbbbbbb cccccccccccc]]");
    expect((grid.match(/Loads youtube/g) ?? []).length).toBe(3);
  });
  it("rejects malformed shortcodes instead of passing them through as markup", () => {
    for (const bad of [
      "[[youtube <b>x</b>]]",
      "[[youtube a]]",
      '[[youtube "; alert(1)]]',
      "[[youtube a b c d e f g h]]",
    ])
      expect(html(bad)).not.toContain("Loads youtube");
  });
});
