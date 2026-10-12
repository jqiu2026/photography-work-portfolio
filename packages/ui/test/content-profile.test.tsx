import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Avatar, Breadcrumbs, EmbedFacade, Header, Link, Pagination, SocialLinks, Timeline } from "../src";

const sites = [
  { id: "hub", name: "Jerry Qiu", description: "About me", url: "https://jerryqiu.com" },
  { id: "photos", name: "Photography", description: "Portfolio", url: "https://photos.jerryqiu.com" },
  { id: "music", name: "Music", description: "Listen", url: "https://music.jerryqiu.com" },
];

describe("SocialLinks", () => {
  it("adds rel=me and opens web links safely; mailto stays in the same tab", () => {
    render(
      <SocialLinks
        links={[
          { label: "Instagram", href: "https://ig.example.com", icon: "instagram" },
          { label: "Email", href: "mailto:a@b.co", icon: "email" },
        ]}
      />,
    );
    const ig = screen.getByRole("link", { name: /Instagram/ });
    expect(ig).toHaveAttribute("rel", expect.stringContaining("me"));
    expect(ig).toHaveAttribute("rel", expect.stringContaining("noopener"));
    expect(screen.getByRole("link", { name: /Email/ })).not.toHaveAttribute("target");
  });
  it("icon-only variant keeps an accessible name", () => {
    render(
      <SocialLinks variant="icons" links={[{ label: "YouTube", href: "https://y.example.com", icon: "youtube" }]} />,
    );
    expect(screen.getByRole("link", { name: "YouTube" })).toBeInTheDocument();
  });
});

describe("EmbedFacade", () => {
  it("loads nothing from the provider until the visitor presses play", async () => {
    const user = userEvent.setup();
    const { container } = render(<EmbedFacade provider="youtube" id="abc123" title="A video" />);
    expect(container.querySelector("iframe")).toBeNull();
    await user.click(screen.getByRole("button", { name: /A video/ }));
    const frame = container.querySelector("iframe");
    expect(frame?.getAttribute("src")).toContain("youtube-nocookie.com/embed/abc123");
    expect(frame).toHaveAttribute("title", "A video");
  });
});

describe("Link", () => {
  it("external links get noopener noreferrer", () => {
    render(<Link href="https://example.com">Out</Link>);
    expect(screen.getByRole("link", { name: "Out" })).toHaveAttribute("rel", "noopener noreferrer");
  });
  it("internal links are untouched", () => {
    render(<Link href="/about">About</Link>);
    expect(screen.getByRole("link", { name: "About" })).not.toHaveAttribute("rel");
  });
});

describe("Breadcrumbs, Pagination, Timeline, Avatar", () => {
  it("marks the current breadcrumb", () => {
    render(<Breadcrumbs items={[{ label: "Work", href: "/work" }, { label: "Project" }]} />);
    expect(screen.getByText("Project")).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Work" })).toBeInTheDocument();
  });
  it("Pagination hides itself for one page and links neighbours otherwise", () => {
    const { rerender } = render(<Pagination page={1} pages={1} hrefFor={(p) => `/p/${p}`} />);
    expect(screen.queryByRole("navigation")).toBeNull();
    rerender(<Pagination page={2} pages={3} hrefFor={(p) => `/p/${p}`} />);
    expect(screen.getByRole("link", { name: /Previous/ })).toHaveAttribute("href", "/p/1");
    expect(screen.getByRole("link", { name: /Next/ })).toHaveAttribute("href", "/p/3");
  });
  it("Timeline is an ordered list in the given order", () => {
    render(
      <Timeline
        items={[
          { title: "B", period: "2025" },
          { title: "A", period: "2024" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("B");
    expect(items[1]).toHaveTextContent("A");
  });
  it("Avatar falls back to initials with a label", () => {
    render(<Avatar name="Jerry Qiu" />);
    expect(screen.getByRole("img", { name: "Jerry Qiu" })).toHaveTextContent("JQ");
  });
});
