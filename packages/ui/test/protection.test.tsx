import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { guardCopy, ProtectedImage, ScreenshotGuard, detectTrigger } from "../src/media";

const asset = {
  id: "0b7f3d52-6a41-4c8e-9a2b-1f3c5d7e9a01",
  width: 800,
  height: 600,
  files: [{ width: 800, src: "/x.webp" }],
};

describe("detectTrigger: every combination from the plan", () => {
  const cases: [string, Parameters<typeof detectTrigger>[0], string][] = [
    ["PrintScreen", { key: "PrintScreen" }, "screenshot"],
    ["Cmd+Shift+3", { key: "#", code: "Digit3", metaKey: true, shiftKey: true }, "screenshot"],
    ["Cmd+Shift+4", { key: "$", code: "Digit4", metaKey: true, shiftKey: true }, "screenshot"],
    ["Cmd+Shift+5", { key: "%", code: "Digit5", metaKey: true, shiftKey: true }, "screenshot"],
    ["Cmd+Shift+6", { key: "^", code: "Digit6", metaKey: true, shiftKey: true }, "screenshot"],
    ["Win+Shift+S", { key: "S", code: "KeyS", metaKey: true, shiftKey: true }, "screenshot"],
    ["Ctrl+S", { key: "s", code: "KeyS", ctrlKey: true }, "save"],
    ["Cmd+S", { key: "s", code: "KeyS", metaKey: true }, "save"],
    ["Ctrl+P", { key: "p", code: "KeyP", ctrlKey: true }, "print"],
    ["Cmd+P", { key: "p", code: "KeyP", metaKey: true }, "print"],
    ["Ctrl+U", { key: "u", code: "KeyU", ctrlKey: true }, "source"],
    ["Cmd+U", { key: "u", code: "KeyU", metaKey: true }, "source"],
    ["Ctrl+Shift+I", { key: "I", code: "KeyI", ctrlKey: true, shiftKey: true }, "devtools"],
    ["Ctrl+Shift+J", { key: "J", code: "KeyJ", ctrlKey: true, shiftKey: true }, "devtools"],
    ["Ctrl+Shift+C", { key: "C", code: "KeyC", ctrlKey: true, shiftKey: true }, "devtools"],
    ["F12", { key: "F12" }, "devtools"],
    ["Cmd+Opt+I", { key: "i", code: "KeyI", metaKey: true, altKey: true }, "devtools"],
    ["Cmd+Opt+J", { key: "j", code: "KeyJ", metaKey: true, altKey: true }, "devtools"],
    ["Cmd+Opt+C", { key: "c", code: "KeyC", metaKey: true, altKey: true }, "devtools"],
  ];
  for (const [name, ev, kind] of cases)
    it(`${name} is a ${kind} trigger`, () => expect(detectTrigger(ev)?.kind).toBe(kind));

  it("ignores ordinary typing and copy/paste/select-all", () => {
    for (const ev of [
      { key: "a", code: "KeyA" },
      { key: "c", code: "KeyC", ctrlKey: true },
      { key: "v", code: "KeyV", metaKey: true },
      { key: "a", code: "KeyA", metaKey: true },
      { key: "3", code: "Digit3", shiftKey: true },
      { key: "Tab" },
    ])
      expect(detectTrigger(ev)).toBeNull();
  });
});

describe("ScreenshotGuard", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("strict: a trigger hides media, shows an honest dialog, and restores after 3 seconds", () => {
    render(
      <ScreenshotGuard level="strict">
        <p>page</p>
      </ScreenshotGuard>,
    );
    expect(document.documentElement).toHaveAttribute("data-guard", "strict");
    fireEvent.keyDown(window, { key: "PrintScreen" });
    expect(document.documentElement).toHaveClass("hl-guard-hide");
    const dialog = screen.getByRole("alertdialog", { name: guardCopy.title });
    expect(dialog).toHaveTextContent("not a lock");
    act(() => {
      vi.advanceTimersByTime(3100);
    });
    expect(screen.queryByRole("alertdialog")).toBeNull();
    expect(document.documentElement).not.toHaveClass("hl-guard-hide");
  });

  it("strict: the dialog can be dismissed with the button and with Escape", () => {
    render(
      <ScreenshotGuard level="strict">
        <p>page</p>
      </ScreenshotGuard>,
    );
    fireEvent.keyDown(window, { key: "F12" });
    fireEvent.click(screen.getByRole("button", { name: guardCopy.action }));
    expect(screen.queryByRole("alertdialog")).toBeNull();
    fireEvent.keyDown(window, { key: "s", code: "KeyS", ctrlKey: true });
    fireEvent.keyDown(screen.getByRole("alertdialog"), { key: "Escape" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("strict: Ctrl+S and Ctrl+P are cancelled; PrintScreen keyup clears the clipboard", () => {
    const write = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", { configurable: true, value: { writeText: write } });
    render(
      <ScreenshotGuard level="strict">
        <p>page</p>
      </ScreenshotGuard>,
    );
    const ev = new KeyboardEvent("keydown", { key: "s", code: "KeyS", ctrlKey: true, cancelable: true });
    window.dispatchEvent(ev);
    expect(ev.defaultPrevented).toBe(true);
    fireEvent.keyUp(window, { key: "PrintScreen" });
    expect(write).toHaveBeenCalledWith("");
  });

  it("strict: media is hidden while the window loses focus and comes back on return", () => {
    render(
      <ScreenshotGuard level="strict">
        <p>page</p>
      </ScreenshotGuard>,
    );
    fireEvent.blur(window);
    expect(document.documentElement).toHaveClass("hl-guard-hide");
    fireEvent.focus(window);
    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(document.documentElement).not.toHaveClass("hl-guard-hide");
  });

  it("light: blocks the context menu on images but never shows a dialog; other pages keep theirs", () => {
    render(
      <ScreenshotGuard level="light">
        <span className="hl-img">
          <img alt="a" src="/a.webp" />
        </span>
        <input aria-label="field" />
      </ScreenshotGuard>,
    );
    const onImage = fireEvent.contextMenu(screen.getByAltText("a"));
    expect(onImage).toBe(false); // preventDefault was called
    expect(fireEvent.contextMenu(screen.getByLabelText("field"))).toBe(true);
    fireEvent.keyDown(window, { key: "PrintScreen" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });

  it("off: does nothing at all", () => {
    render(
      <ScreenshotGuard level="off">
        <span className="hl-img">
          <img alt="a" src="/a.webp" />
        </span>
      </ScreenshotGuard>,
    );
    expect(document.documentElement).not.toHaveAttribute("data-guard");
    expect(fireEvent.contextMenu(screen.getByAltText("a"))).toBe(true);
  });

  it("removes its listeners and attribute on unmount", () => {
    const { unmount } = render(
      <ScreenshotGuard level="strict">
        <p>page</p>
      </ScreenshotGuard>,
    );
    unmount();
    expect(document.documentElement).not.toHaveAttribute("data-guard");
    fireEvent.keyDown(window, { key: "PrintScreen" });
    expect(screen.queryByRole("alertdialog")).toBeNull();
  });
});

describe("ProtectedImage", () => {
  it("strict: the server HTML has only an opaque id, no file URL, and keeps alt text for assistive tech", () => {
    const { container } = render(
      <ScreenshotGuard level="strict">
        <ProtectedImage
          asset={asset}
          alt="A trombonist on stage"
          tokens={{ 480: "tok", 960: "tok", 1600: "tok", 2400: "tok" }}
        />
      </ScreenshotGuard>,
    );
    const html = container.innerHTML;
    expect(html).toContain(asset.id);
    expect(html).not.toContain("/api/img");
    expect(html).not.toContain(".webp");
    expect(html).not.toContain("<img");
    expect(screen.getByText("A trombonist on stage")).toBeInTheDocument();
    expect(container.querySelector("[data-protected='strict']")).not.toBeNull();
  });

  it("light/off without tokens: a normal image with alt text", () => {
    render(<ProtectedImage asset={asset} alt="Street at night" level="light" />);
    expect(screen.getByAltText("Street at night")).toBeInTheDocument();
  });
});

describe("ProtectedImage on the photo site (no tokens in the HTML)", () => {
  const bare = { id: "0b7f3d52-6a41-4c8e-9a2b-1f3c5d7e9a01", width: 800, height: 600, files: [] };
  it("renders only an opaque id and a placeholder before anything is fetched, and turns the guard to strict", async () => {
    const { resetTokenBroker } = await import("../src/media/tokenBroker");
    resetTokenBroker();
    const fetchMock = vi.fn(async (url: string) => {
      if (String(url).endsWith("/api/img/token"))
        return new Response(
          JSON.stringify({ tokensById: { [bare.id]: { 480: "t480", 960: "t960", 1600: "t1", 2400: "t2" } } }),
        );
      return new Response(new Blob([new Uint8Array([1, 2, 3])], { type: "image/webp" }));
    });
    vi.stubGlobal("fetch", fetchMock);
    vi.stubGlobal("URL", Object.assign(URL, { createObjectURL: () => "blob:test", revokeObjectURL: () => {} }));
    const { container } = render(
      <ScreenshotGuard level="off">
        <ProtectedImage asset={bare} alt="A test photograph" priority />
      </ScreenshotGuard>,
    );
    expect(container.querySelector("[data-pid]")).toHaveAttribute("data-pid", bare.id);
    expect(container.innerHTML).not.toMatch(/\.(webp|avif|jpe?g)|\/api\/img\/[0-9a-f-]{36}\?/);
    expect(document.documentElement).toHaveAttribute("data-guard", "strict");
    await vi.waitFor(() => expect(container.querySelector("img")).toHaveAttribute("src", "blob:test"));
    const urls = fetchMock.mock.calls.map((c) => String(c[0]));
    expect(urls[0]).toBe("/api/img/token");
    expect(urls[1]).toMatch(new RegExp(`^/api/img/${bare.id}\\?w=\\d+&t=t\\d+$`));
    vi.unstubAllGlobals();
  });
});
