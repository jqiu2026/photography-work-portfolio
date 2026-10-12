import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Accordion, Button, Dialog, Menu, Progress, Tabs, ToastProvider, useToast } from "../src";

describe("Dialog", () => {
  it("opens from its trigger with a titled dialog and closes on Escape", async () => {
    const user = userEvent.setup();
    render(
      <Dialog title="Delete photo" description="This cannot be undone." trigger={<Button>Open</Button>}>
        <p>Body</p>
      </Dialog>,
    );
    expect(screen.queryByRole("dialog")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Open" }));
    const d = screen.getByRole("dialog", { name: "Delete photo" });
    expect(d).toHaveAccessibleDescription("This cannot be undone.");
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).toBeNull();
  });
});

describe("Tabs", () => {
  it("switches panels and supports arrow-key navigation", async () => {
    const user = userEvent.setup();
    render(
      <Tabs
        tabs={[
          { value: "a", label: "One", content: "Panel one" },
          { value: "b", label: "Two", content: "Panel two" },
        ]}
      />,
    );
    expect(screen.getByText("Panel one")).toBeVisible();
    screen.getByRole("tab", { name: "One" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Two" })).toHaveAttribute("aria-selected", "true");
    expect(screen.getByText("Panel two")).toBeVisible();
  });
});

describe("Accordion", () => {
  it("expands one item at a time and reflects state in aria-expanded", async () => {
    const user = userEvent.setup();
    render(
      <Accordion
        items={[
          { value: "1", title: "First", content: "One body" },
          { value: "2", title: "Second", content: "Two body" },
        ]}
      />,
    );
    const first = screen.getByRole("button", { name: "First" });
    expect(first).toHaveAttribute("aria-expanded", "false");
    await user.click(first);
    expect(first).toHaveAttribute("aria-expanded", "true");
    await user.click(screen.getByRole("button", { name: "Second" }));
    expect(first).toHaveAttribute("aria-expanded", "false");
  });
});

describe("Menu", () => {
  it("opens with the keyboard and fires onSelect", async () => {
    const user = userEvent.setup();
    let picked = "";
    render(
      <Menu
        trigger={<Button>Actions</Button>}
        items={[
          {
            label: "Edit",
            onSelect: () => {
              picked = "edit";
            },
          },
        ]}
      />,
    );
    screen.getByRole("button", { name: "Actions" }).focus();
    await user.keyboard("{Enter}");
    await user.click(await screen.findByRole("menuitem", { name: "Edit" }));
    expect(picked).toBe("edit");
  });
});

describe("Toast and Progress", () => {
  function Demo() {
    const toast = useToast();
    return <Button onClick={() => toast("Saved")}>Go</Button>;
  }
  it("announces toasts in a polite live region", async () => {
    const user = userEvent.setup();
    render(
      <ToastProvider>
        <Demo />
      </ToastProvider>,
    );
    await user.click(screen.getByRole("button", { name: "Go" }));
    const region = screen.getByRole("status");
    expect(region).toHaveAttribute("aria-live", "polite");
    expect(within(region).getByText("Saved")).toBeInTheDocument();
  });
  it("Progress clamps and exposes its value", () => {
    render(<Progress value={140} label="Upload" />);
    expect(screen.getByRole("progressbar", { name: "Upload" })).toHaveAttribute("aria-valuenow", "100");
  });
});
