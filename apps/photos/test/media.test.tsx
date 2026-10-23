import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { specLines, specSummary, specsFromExif } from "@jerryqiu/db/specs";
import { detectTrigger, devtoolsDocked, ProtectedImage } from "@/components/media";
import { modifierState } from "@/components/media/guard";

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
    ["Cmd+Shift+6", { key: "^", code: "Digit6", metaKey: true, shiftKey: true }, "screenshot"],
    ["Cmd+Ctrl+Shift+4", { key: "$", code: "Digit4", metaKey: true, ctrlKey: true, shiftKey: true }, "screenshot"],
    ["Alt+PrintScreen", { key: "PrintScreen", altKey: true }, "screenshot"],
    ["Win+Alt+R", { key: "r", code: "KeyR", metaKey: true, altKey: true }, "screenshot"],
    ["Ctrl+Shift+K", { key: "K", code: "KeyK", ctrlKey: true, shiftKey: true }, "devtools"],
    ["Cmd+Shift+C", { key: "C", code: "KeyC", metaKey: true, shiftKey: true }, "devtools"],
    ["Cmd+Opt+U", { key: "u", code: "KeyU", metaKey: true, altKey: true }, "source"],
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

  it("modifierState: Shift or Option alone hide, any two together are a combo, Cmd or Ctrl alone are free", () => {
    expect(modifierState({ key: "Shift", shiftKey: true })).toBe("hide");
    expect(modifierState({ key: "Alt", altKey: true })).toBe("hide");
    expect(modifierState({ key: "Meta", metaKey: true })).toBeNull();
    expect(modifierState({ key: "Control", ctrlKey: true })).toBeNull();
    expect(modifierState({ key: "Shift", metaKey: true, shiftKey: true })).toBe("combo");
    expect(modifierState({ key: "Alt", ctrlKey: true, altKey: true })).toBe("combo");
    expect(modifierState({ key: "a" })).toBeNull();
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

describe("photo specs", () => {
  it("keeps only exposure settings: no camera, lens, GPS or resolution ever leaves the metadata", () => {
    const s = specsFromExif({
      Make: "Canon",
      Model: "Canon EOS R6",
      LensModel: "RF70-200mm F2.8",
      FNumber: 2.8,
      ExposureTime: 0.004,
      ISO: 3200,
      FocalLength: 135,
      DateTimeOriginal: "2026-02-14T19:30:00.000Z",
      GPSLatitude: 40.7,
    });
    expect(s).toEqual({ focal: 135, aperture: 2.8, shutter: 0.004, iso: 3200, taken: "2026-02-14" });
    expect(JSON.stringify(s)).not.toMatch(/Canon|EOS|RF70|40\.7/);
    expect(specSummary(s)).toBe("135 mm · f/2.8 · 1/250 s · ISO 3200");
    expect(specLines(s).map((l) => l.label)).toEqual(["Focal length", "Aperture", "Shutter", "ISO", "Taken"]);
  });
  it("no metadata: nothing is shown, and nothing about the image size", () => {
    expect(specsFromExif({})).toBeUndefined();
    expect(specsFromExif({ Make: "Nikon", Model: "Z 6" })).toBeUndefined();
    expect(specsFromExif(null)).toBeUndefined();
    expect(specLines(undefined)).toEqual([]);
  });
});
