import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider, themeScript, useTheme } from "../src";
import { BeforeAfter, Gallery, Image, type ImageAsset } from "../src/media";
import { CountUp, InView, PinnedScene, RevealText, ScrollHighlight, StepSequence } from "../src/motion";
import { mockMedia } from "./setup";

const asset: ImageAsset = {
  width: 1600,
  height: 1000,
  color: "rgb(10,10,10)",
  blur: "data:image/webp;base64,AAAA",
  files: [
    { width: 480, src: "/a-480.webp" },
    { width: 960, src: "/a-960.webp" },
    { width: 1600, src: "/a-1600.webp" },
  ],
};

function ThemeProbe() {
  const { theme, choice, setChoice } = useTheme();
  return (
    <button type="button" onClick={() => setChoice(theme === "dark" ? "light" : "dark")}>{`${choice}:${theme}`}</button>
  );
}

describe("ThemeProvider", () => {
  it("applies the preset, resolves system theme, and persists a manual choice", async () => {
    mockMedia({ "prefers-color-scheme: dark": true });
    const user = userEvent.setup();
    render(
      <ThemeProvider preset="photos">
        <ThemeProbe />
      </ThemeProvider>,
    );
    expect(document.documentElement).toHaveAttribute("data-preset", "photos");
    expect(screen.getByRole("button")).toHaveTextContent("system:dark");
    await user.click(screen.getByRole("button"));
    expect(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(localStorage.getItem("hl-theme")).toBe("light");
  });
  it("the no-flash script embeds the preset and default theme", () => {
    const s = themeScript("music", "dark");
    expect(s).toContain('"music"');
    expect(s).toContain('||"dark"');
    mockMedia();
  });
});

describe("Image", () => {
  it("emits a srcset, intrinsic size (no layout shift) and lazy loading by default", () => {
    render(<Image asset={asset} alt="A test" />);
    const img = screen.getByRole("img", { name: "A test" });
    expect(img.getAttribute("srcset")).toContain("/a-480.webp 480w");
    expect(img).toHaveAttribute("width", "1600");
    expect(img).toHaveAttribute("loading", "lazy");
  });
  it("priority images load eagerly", () => {
    render(<Image asset={asset} alt="Hero" priority />);
    expect(screen.getByRole("img", { name: "Hero" })).toHaveAttribute("loading", "eager");
  });
});

describe("Gallery and Lightbox", () => {
  const imgs = [0, 1, 2].map((n) => ({
    ...asset,
    alt: `Photo ${n + 1}`,
    files: [{ width: 1600, src: `/p${n}.webp` }],
  }));
  it("opens the lightbox on click, navigates with arrow keys and closes with Escape", async () => {
    const user = userEvent.setup();
    render(<Gallery images={imgs} />);
    await user.click(screen.getByRole("button", { name: "Open Photo 1" }));
    const dialog = screen.getByRole("dialog");
    expect(dialog).toHaveTextContent("1 / 3");
    await user.keyboard("{ArrowRight}");
    expect(dialog).toHaveTextContent("2 / 3");
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(dialog).toHaveTextContent("3 / 3");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("BeforeAfter", () => {
  it("exposes the slider and moves the comparison with the keyboard", async () => {
    render(
      <BeforeAfter
        before={<div>before</div>}
        after={<div>after</div>}
        label="Compare"
        beforeLabel="Colour"
        afterLabel="Mono"
      />,
    );
    const slider = screen.getByRole("slider", { name: "Compare" });
    expect(slider).toHaveValue("50");
    fireEvent.change(slider, { target: { value: "70" } });
    expect(slider).toHaveValue("70");
    expect(screen.getByText("before").parentElement).toHaveStyle({ clipPath: "inset(0 30% 0 0)" });
    expect(screen.getByText("Colour")).toBeInTheDocument();
  });
});

describe("Motion components fall back to a complete static state under reduced motion", () => {
  it("InView renders its children plainly", () => {
    mockMedia({ "prefers-reduced-motion": true });
    render(<InView>Hello</InView>);
    expect(screen.getByText("Hello")).toBeVisible();
  });
  it("RevealText keeps the full sentence available to screen readers", () => {
    mockMedia({ "prefers-reduced-motion": true });
    render(<RevealText text="Words rise slowly" as="h2" />);
    expect(screen.getByRole("heading", { name: "Words rise slowly" })).toBeInTheDocument();
  });
  it("CountUp shows its final number immediately", () => {
    mockMedia({ "prefers-reduced-motion": true });
    render(<CountUp to={1234} />);
    expect(screen.getByLabelText("1,234")).toHaveTextContent("1,234");
  });
  it("ScrollHighlight renders all words", () => {
    mockMedia({ "prefers-reduced-motion": true });
    const { container } = render(<ScrollHighlight text="One two three" />);
    expect(container).toHaveTextContent("One two three");
  });
  it("PinnedScene is not pinned and StepSequence lists every step", () => {
    mockMedia({ "prefers-reduced-motion": true });
    const { container } = render(
      <PinnedScene label="Scene" length={4}>
        <StepSequence steps={[{ title: "First" }, { title: "Second", body: "More" }]} />
      </PinnedScene>,
    );
    expect((container.firstChild as HTMLElement).style.height).toBe("");
    expect(screen.getByText("First")).toBeInTheDocument();
    expect(screen.getByText("Second")).toBeInTheDocument();
  });
  it("RevealText hides the split words from screen readers (no double reading)", () => {
    mockMedia();
    const { container } = render(<RevealText text="Hi there" as="p" />);
    expect(container.querySelectorAll('[aria-hidden="true"]').length).toBe(2);
    act(() => {});
  });
});
