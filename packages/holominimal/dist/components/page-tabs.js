"use client";
import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { useIndicator } from "../interaction/hooks.js";
import { jsx } from "react/jsx-runtime";
import { useRef } from "react";
//#region src/components/page-tabs.tsx
/**
* Sibling pages as text tabs. These are links (navigation), not an ARIA tablist; see Tabs for panels. The underline
* slides to the current page when it changes (as long as the tabs stay mounted across navigation, as they do in a shared
* layout), and it is placed without sliding on first paint.
*/
function PageTabs({ className, ...rest }) {
	const ref = useRef(null);
	useIndicator(ref, {
		item: ".hm-page-tab",
		active: ".hm-page-tab[aria-current=\"page\"]"
	});
	return /* @__PURE__ */ jsx("nav", {
		...rest,
		ref,
		className: cx("hm-page-tabs", className)
	});
}
function PageTab({ current, asChild, className, ...rest }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		...rest,
		className: cx("hm-page-tab", className),
		"aria-current": current ? "page" : void 0
	});
}
//#endregion
export { PageTab, PageTabs };

//# sourceMappingURL=page-tabs.js.map