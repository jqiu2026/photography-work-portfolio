import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { detectTrigger, devtoolsDocked, ProtectedImage } from "@/components/media";

describe("detectTrigger", () => {
  const cases: [string, Parameters<typeof detectTrigger>[0], string][] = [
    ["PrintScreen", { key: "PrintScreen" }, "screenshot"],
    ["Cmd+Shift+3", { key: "#", code: "Digit3", metaKey: true, shiftKey: true }, "screenshot"],
    ["Cmd+Shift+4", { key: "$", code: "Digit4", metaKey: true, shiftKey: true }, "screenshot"],
    ["Cmd+Shift+5", { key: "%", code: "Digit5", metaKey: true, shiftKey: true }, "screenshot"],
    ["Win+Shift+S", { key: "S", code: "KeyS", metaKey: true, shiftKey: true }, "screenshot"],
    ["Firefox Ctrl+Shift+S", { key: "S", code: "KeyS", ctrlKey: true, shiftKey: true }, "screenshot"],
    ["Ctrl+S", { key: "s", code: "KeyS", ctrlKey: true }, "save"],
    ["Cmd+P", { key: "p", code: "KeyP", metaKey: true }, "print"],
    ["Ctrl+U", { key: "u", code: "KeyU", ctrlKey: true }, "source"],
    ["F12", { key: "F12" }, "devtools"],
    ["Cmd+Opt+I", { key: "i", code: "KeyI", metaKey: true, altKey: true }, "devtools"],
  ];
  for (const [name, ev, kind] of cases)
    it(`${name} is a ${kind} trigger`, () => expect(detectTrigger(ev)?.kind).toBe(kind));

  it("ignores ordinary typing and copy/paste/select-all", () => {
    for (const ev of [
      { key: "a", code: "KeyA" },
      { key: "c", code: "KeyC", ctrlKey: true },
      { key: "v", code: "KeyV", metaKey: true },
      { key: "a", code: "KeyA", metaKey: true },
      { key: "Tab" },
    ])
      expect(detectTrigger(ev)).toBeNull();
  });

  it("devtoolsDocked looks for a large gap between the outer and inner window", () => {
    expect(devtoolsDocked({ outerWidth: 1400, innerWidth: 1390, outerHeight: 900, innerHeight: 820 })).toBe(false);
    expect(devtoolsDocked({ outerWidth: 1400, innerWidth: 900, outerHeight: 900, innerHeight: 820 })).toBe(true);
  });
});

describe("ProtectedImage", () => {
  const id = "0b7f3d52-6a41-4c8e-9a2b-1f3c5d7e9a01";

  it("strict: the server HTML has only an opaque id and a placeholder, never a file URL, and keeps the alt text", () => {
    const html = renderToString(
      <ProtectedImage asset={{ id, width: 800, height: 600, blur: "data:image/webp;base64,AA" }} alt="A stage" />,
    );
    expect(html).toContain(`data-pid="${id}"`);
    expect(html).toContain('data-protected="strict"');
    expect(html).toContain("A stage");
    expect(html).not.toContain("<img");
    expect(html).not.toMatch(/\/api\/img\/|\.webp"/);
  });

  it("without an id: a plain responsive image with alt text under the shield", () => {
    const html = renderToString(
      <ProtectedImage asset={{ width: 800, height: 600, files: [{ width: 800, src: "/x.webp" }] }} alt="A plane" />,
    );
    expect(html).toContain('data-protected="plain"');
    expect(html).toContain('alt="A plane"');
    expect(html).toContain("pm-shield");
  });
});
