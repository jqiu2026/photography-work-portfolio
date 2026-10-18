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
