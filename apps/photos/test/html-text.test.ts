import { describe, expect, it } from "vitest";
import { htmlToText } from "../src/lib/html-text";

describe("htmlToText", () => {
  it("leaves plain text alone", () => {
    expect(htmlToText("Hello **there**")).toBe("Hello **there**");
  });
  it("turns a pasted rules message into paragraphs, bold, italic, links and a list", () => {
    const out = htmlToText(
      '<p><i>Note: lightly edited.</i></p><p><b>Hi, thanks for checking out my photos!</b></p><p>Email <a href="mailto:hello@jerryqiu.com" target="_blank">me</a> or tag @jqiu2026.</p><ul><li>Keep the watermark visible</li><li>Tag me</li></ul><p>Purchasing waives it.&nbsp;</p>',
    );
    expect(out).toContain("*Note: lightly edited.*");
    expect(out).toContain("**Hi, thanks for checking out my photos!**");
    expect(out).toContain("[me](mailto:hello@jerryqiu.com)");
    expect(out).toMatch(/- Keep the watermark visible\n- Tag me/);
    expect(out).not.toContain("<");
    expect(out.split("\n\n").length).toBeGreaterThanOrEqual(4);
  });
  it("drops script and other tags without keeping their markup", () => {
    expect(htmlToText("<p>Hi<script>alert(1)</script></p><img src=x onerror=alert(1)>")).toBe("Hialert(1)");
  });
});
