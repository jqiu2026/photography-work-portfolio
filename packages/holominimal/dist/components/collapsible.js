"use client";
import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { jsx } from "react/jsx-runtime";
import { createContext, use, useCallback, useId, useState } from "react";
//#region src/components/collapsible.tsx
var CollapsibleContext = createContext(null);
function useCollapsible(part) {
	const ctx = use(CollapsibleContext);
	if (!ctx) throw new Error(`<${part}> must be inside <Collapsible>`);
	return ctx;
}
/** One region that opens and closes. The content animates its height and stays mounted, so its state is kept. */
function Collapsible({ open: controlled, defaultOpen = false, onOpenChange, className, children, ...rest }) {
	const [uncontrolled, setUncontrolled] = useState(defaultOpen);
	const open = controlled ?? uncontrolled;
	const toggle = useCallback(() => {
		if (controlled === void 0) setUncontrolled(!open);
		onOpenChange?.(!open);
	}, [
		controlled,
		open,
		onOpenChange
	]);
	const contentId = useId();
	return /* @__PURE__ */ jsx(CollapsibleContext, {
		value: {
			open,
			toggle,
			contentId
		},
		children: /* @__PURE__ */ jsx("div", {
			...rest,
			className: cx("hm-collapsible", className),
			"data-state": open ? "open" : "closed",
			children
		})
	});
}
function CollapsibleTrigger({ asChild, onClick, className, ...rest }) {
	const { open, toggle, contentId } = useCollapsible("CollapsibleTrigger");
	return /* @__PURE__ */ jsx(asChild ? Slot : "button", {
		...asChild ? {} : { type: "button" },
		...rest,
		className: cx("hm-collapsible-trigger", className),
		"aria-expanded": open,
		"aria-controls": contentId,
		"data-state": open ? "open" : "closed",
		onClick: (e) => {
			onClick?.(e);
			if (!e.defaultPrevented) toggle();
		}
	});
}
function CollapsibleContent({ className, children, ...rest }) {
	const { open, contentId } = useCollapsible("CollapsibleContent");
	return /* @__PURE__ */ jsx("div", {
		...rest,
		id: contentId,
		className: cx("hm-collapsible-content", className),
		"data-state": open ? "open" : "closed",
		inert: open ? void 0 : true,
		children: /* @__PURE__ */ jsx("div", {
			className: "hm-collapsible-inner",
			children
		})
	});
}
//#endregion
export { Collapsible, CollapsibleContent, CollapsibleTrigger };

//# sourceMappingURL=collapsible.js.map