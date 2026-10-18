import { cx } from "../utils/cx.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/shell.tsx
/** Page frame: sidebar, toolbar, and a main stage that clears the sidebar. Server-compatible. */
function AppShell({ sidebar, toolbar, toolbarLabel = "Page tools", backdrop, sidebarSide = "left", entrance = "none", mainId = "main", className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		className: cx("hm-shell", className),
		"data-entrance": entrance === "none" ? void 0 : entrance,
		"data-sidebar": sidebarSide === "right" ? "right" : void 0,
		children: [
			/* @__PURE__ */ jsx("a", {
				className: "hm-skip",
				href: `#${mainId}`,
				children: "Skip to content"
			}),
			backdrop,
			sidebar,
			toolbar ? /* @__PURE__ */ jsx("div", {
				className: "hm-shell-toolbar",
				role: "region",
				"aria-label": toolbarLabel,
				children: toolbar
			}) : null,
			/* @__PURE__ */ jsx("main", {
				id: mainId,
				className: "hm-shell-stage",
				children
			})
		]
	});
}
/** The page column inside the stage: the studio's measured width and vertical rhythm. */
function Page({ width = "content", className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-page", className),
		"data-width": width
	});
}
/**
* A deep-space backdrop with a deliberate composition: a violet-to-cyan nebula on the diagonal, a calm center, and
* two star layers. It drifts very slowly and shifts a few pixels against the pointer (fed by `LightField`), and holds
* still under reduced motion. Server-compatible.
*/
function Atmosphere({ className, ...rest }) {
	return /* @__PURE__ */ jsxs("div", {
		"aria-hidden": "true",
		...rest,
		className: cx("hm-atmosphere", className),
		children: [
			/* @__PURE__ */ jsx("span", { className: "hm-sky-nebula" }),
			/* @__PURE__ */ jsx("span", {
				className: "hm-sky-stars",
				"data-depth": "far"
			}),
			/* @__PURE__ */ jsx("span", {
				className: "hm-sky-stars",
				"data-depth": "near"
			})
		]
	});
}
//#endregion
export { AppShell, Atmosphere, Page };

//# sourceMappingURL=shell.js.map