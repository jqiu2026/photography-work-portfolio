import type { Locator } from "@playwright/test";

/**
 * Picks an option in a select, by its visible label. Works for a native <select> and for the Holominimal Select (a
 * combobox button with a listbox popover), so specs do not care which one a screen uses.
 */
export async function choose(control: Locator, label: string | RegExp) {
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
  await control.click();
  const list = control.page().locator(`[id="${await control.getAttribute("aria-controls")}"]`);
  await list.getByRole("option", typeof label === "string" ? { name: label, exact: true } : { name: label }).click();
}
