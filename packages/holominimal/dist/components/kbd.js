import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/kbd.tsx
/** A keyboard key cap: `<Kbd>⌘</Kbd><Kbd>K</Kbd>`. Server-compatible. */
function Kbd({ className, ...rest }) {
	return /* @__PURE__ */ jsx("kbd", {
		...rest,
		className: cx("hm-kbd", className)
	});
}
/** Several keys that are pressed together, joined by a quiet plus. */
function KbdGroup({ className, ...rest }) {
	return /* @__PURE__ */ jsx("span", {
		...rest,
		className: cx("hm-kbd-group", className)
	});
}
//#endregion
export { Kbd, KbdGroup };

//# sourceMappingURL=kbd.js.map