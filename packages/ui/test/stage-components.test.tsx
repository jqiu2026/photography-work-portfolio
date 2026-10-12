import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { ThemeProvider } from "../src";
import { Condense, IndexControl, Scene, Settle, StageProvider, Streak, Threshold } from "../src/stage";

function page(ui: React.ReactNode) {
  return render(
    <ThemeProvider preset="hub">
      <StageProvider world="hub" quiet>
        {ui}
      </StageProvider>
    </ThemeProvider>,
  );
}

describe("IndexControl", () => {
  it("is a button that opens a titled dialog listing scenes and routes, closes on Escape and returns focus", async () => {
    const user = userEvent.setup();
    page(
      <>
        <IndexControl routes={[{ label: "About", href: "/about" }]} />
        <Scene id="one" label="First scene">
          <p>One</p>
        </Scene>
        <Scene id="two" label="Second scene">
          <p>Two</p>
        </Scene>
      </>,
    );
    const btn = screen.getByRole("button", { name: /open index/i });
    expect(btn).toHaveAttribute("aria-expanded", "false");
    await user.click(btn);
    const dialog = screen.getByRole("dialog", { name: "Index" });
    const scenes = within(dialog).getByRole("navigation", { name: "On this page" });
    expect(within(scenes).getAllByRole("link").map((a) => a.getAttribute("href"))).toEqual(["#one", "#two"]);
    expect(within(dialog).getByRole("link", { name: "About" })).toHaveAttribute("href", "/about");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(btn).toHaveFocus();
  });
  it("never lists links to another site (only what it is given)", async () => {
    const user = userEvent.setup();
    page(<IndexControl routes={[{ label: "Home", href: "/" }]} />);
    await user.click(screen.getByRole("button", { name: /open index/i }));
    const links = screen.getAllByRole("link").map((a) => a.getAttribute("href"));
    expect(links).toEqual(["/"]);
  });
});

describe("Scene", () => {
  it("is a labelled section with an anchor id", () => {
    page(
      <Scene id="rooms" label="Three rooms">
        <h2>Rooms</h2>
      </Scene>,
    );
    const s = screen.getByRole("region", { name: "Three rooms" });
    expect(s).toHaveAttribute("id", "rooms");
  });
  it("pinned scenes keep their content in the DOM", () => {
    page(
      <Scene id="p" label="Pinned" pin={2}>
        <p>Inside</p>
      </Scene>,
    );
    expect(screen.getByText("Inside")).toBeInTheDocument();
  });
});

describe("reveals", () => {
  it("Condense splits by words but keeps real, selectable text", () => {
    page(<Condense text="Three rooms. Knock on any." as="h2" />);
    const h = screen.getByRole("heading", { level: 2 });
    expect(h).toHaveTextContent("Three rooms. Knock on any.");
    expect(h.querySelectorAll(".hl-word").length).toBe(5);
  });
  it("Streak and Settle render their text immediately", () => {
    page(
      <>
        <Streak text="Jerry Qiu." />
        <Settle>Short and specific.</Settle>
      </>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Jerry Qiu.");
    expect(screen.getByText("Short and specific.")).toBeVisible();
  });
});

describe("Threshold", () => {
  it("is a plain link to the destination with its title and enter label", () => {
    page(<Threshold href="https://example.test/" title="Photography" label="Enter photography" accent="red" />);
    const a = screen.getByRole("link", { name: /Photography/ });
    expect(a).toHaveAttribute("href", "https://example.test/");
    expect(a).toHaveTextContent("Enter photography");
  });
});
