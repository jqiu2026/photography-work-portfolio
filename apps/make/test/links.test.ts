import { describe, expect, it } from "vitest";
import { linksToText, parseLinks } from "../src/lib/links";

describe("link lines", () => {
  it("parses label, address and kind, one per line", () => {
    expect(parseLinks("Demo | https://a.example/x | demo\n\nSource | https://github.com/x/y | source")).toEqual([
      { label: "Demo", url: "https://a.example/x", kind: "demo" },
      { label: "Source", url: "https://github.com/x/y", kind: "source" },
    ]);
  });
  it("an unknown kind becomes other and a missing one too", () => {
    expect(parseLinks("A | https://a.example | weird")[0].kind).toBe("other");
    expect(parseLinks("A | https://a.example")[0].kind).toBe("other");
  });
  it("round-trips", () => {
    const l = [{ label: "Demo", url: "https://a.example/x", kind: "demo" }];
    expect(parseLinks(linksToText(l))).toEqual(l);
  });
});
