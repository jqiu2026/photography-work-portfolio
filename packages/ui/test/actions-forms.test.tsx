import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Button, Checkbox, Field, IconButton, Input, Select, Switch, Textarea } from "../src";

describe("Button", () => {
  it("is a real button that does not submit forms by default", () => {
    render(<Button>Save</Button>);
    const b = screen.getByRole("button", { name: "Save" });
    expect(b).toHaveAttribute("type", "button");
  });
  it("renders a link that looks like a button when given `as` and href", () => {
    render(
      <Button as="a" href="/x">
        Go
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Go" })).toHaveAttribute("href", "/x");
  });
  it("loading disables the button and announces busy", () => {
    render(<Button loading>Send</Button>);
    const b = screen.getByRole("button", { name: "Send" });
    expect(b).toBeDisabled();
    expect(b).toHaveAttribute("aria-busy", "true");
  });
  it("IconButton exposes its label as the accessible name", () => {
    render(
      <IconButton label="Open menu">
        <svg />
      </IconButton>,
    );
    expect(screen.getByRole("button", { name: "Open menu" })).toBeInTheDocument();
  });
});

describe("Field", () => {
  it("associates label, hint and error with the control", () => {
    render(
      <Field label="Email" hint="We reply by email." error="Please enter a valid email.">
        <Input />
      </Field>,
    );
    const input = screen.getByLabelText("Email");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const described = input.getAttribute("aria-describedby") ?? "";
    expect(described.split(" ")).toHaveLength(2);
    expect(screen.getByText("We reply by email.").id).toBeTruthy();
    expect(screen.getByRole("alert")).toHaveTextContent("Please enter a valid email.");
  });
  it("works for textarea and select too", () => {
    render(
      <>
        <Field label="Message">
          <Textarea />
        </Field>
        <Field label="Topic">
          <Select>
            <option>A</option>
          </Select>
        </Field>
      </>,
    );
    expect(screen.getByLabelText("Message").tagName).toBe("TEXTAREA");
    expect(screen.getByLabelText("Topic").tagName).toBe("SELECT");
  });
  it("marks required fields visibly but hides the asterisk from screen readers", () => {
    render(
      <Field label="Name" required>
        <Input />
      </Field>,
    );
    expect(screen.getByText("*")).toHaveAttribute("aria-hidden", "true");
  });
});

describe("Checkbox and Switch", () => {
  it("toggle with keyboard and mouse", async () => {
    const user = userEvent.setup();
    render(
      <>
        <Checkbox label="Copy me" />
        <Switch label="Notify" />
      </>,
    );
    const cb = screen.getByRole("checkbox", { name: "Copy me" });
    await user.click(cb);
    expect(cb).toBeChecked();
    const sw = screen.getByRole("switch", { name: "Notify" });
    sw.focus();
    await user.keyboard(" ");
    expect(sw).toBeChecked();
  });
});
