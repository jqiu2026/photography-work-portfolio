import type { Locator } from "@playwright/test";

/**
 * Picks an option in a select, by its visible label. Works for a native <select> and for the Holominimal Select (a
 * combobox button with a listbox popover), so specs do not care which one a screen uses.
 */
export async function choose(target: Locator, label: string | RegExp) {
  // a Holominimal Select's label also names its listbox, so keep only the control itself
  const control = target.and(target.page().locator("select, [role=combobox]")).first();
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    if (typeof label === "string") await control.selectOption({ label });
    else {
      const value = await control.evaluate(
        (el, src) => [...(el as HTMLSelectElement).options].find((o) => new RegExp(src).test(o.text))?.value ?? "",
        label.source,
      );
      await control.selectOption(value);
    }
    return;
  }
  // Holominimal Select: open it, then move with the arrow keys to the option and press Enter (as a keyboard user
  // would); this also reaches options scrolled out of a long list
  await control.click();
  const list = control.page().locator(`[id="${await control.getAttribute("aria-controls")}"]`);
  const option = list.getByRole("option", typeof label === "string" ? { name: label, exact: true } : { name: label });
  const id = await option.first().getAttribute("id");
  if (!id) throw new Error(`choose: no option ${String(label)}`);
  const count = await list.getByRole("option").count();
  for (let i = 0; i <= count && (await control.getAttribute("aria-activedescendant")) !== id; i++)
    await control.press("ArrowDown");
  await control.press("Enter");
}

/**
 * Picks a day ("YYYY-MM-DD") in a Holominimal DatePicker: opens it, pages to the month, and presses the day (every day
 * button is named with its full date).
 */
export async function pickDate(target: Locator, iso: string) {
  const [y, m, d] = iso.split("-").map(Number) as [number, number, number];
  const date = new Date(y, m - 1, d);
  const page = target.page();
  await target.click();
  const popover = page.locator(".hm-calendar").last();
  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(date);
  for (let i = 0; i < 60 && !((await popover.locator(".hm-calendar-title").textContent()) ?? "").includes(title); i++) {
    const now = (await popover.locator(".hm-calendar-title").textContent()) ?? "";
    const shown = new Date(`${now} 1`);
    await popover
      .getByRole("button", { name: shown < new Date(y, m - 1, 1) ? "Next month" : "Previous month" })
      .click();
  }
  const full = new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(date);
  await popover.getByRole("button", { name: full }).click();
}

/** Sets a "day and time" field (a DatePicker beside a time Select with a slot every half hour); rounds down to the slot. */
export async function pickDateTime(page: import("@playwright/test").Page, label: string, when: Date) {
  const pad = (n: number) => String(n).padStart(2, "0");
  await pickDate(page.getByLabel(label), `${when.getFullYear()}-${pad(when.getMonth() + 1)}-${pad(when.getDate())}`);
  const h = when.getHours();
  const m = when.getMinutes() < 30 ? "00" : "30";
  await choose(page.getByLabel("Time", { exact: true }), `${h % 12 || 12}:${m} ${h < 12 ? "AM" : "PM"}`);
}
