import { cx } from "../utils/cx.js";
import { Slot } from "../utils/slot.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/gallery.tsx
/** A responsive grid of gallery cards (a <ul>; give it an aria-label). */
function GalleryGrid({ className, ...rest }) {
	return /* @__PURE__ */ jsx("ul", {
		...rest,
		className: cx("hm-gallery-grid", className)
	});
}
/** One grid cell; staggers in on mount. */
function GalleryItem({ index = 0, className, style, ...rest }) {
	return /* @__PURE__ */ jsx("li", {
		...rest,
		className: cx("hm-gallery-item hm-enter", className),
		style: {
			"--hm-i": Math.min(index, 12),
			...style
		}
	});
}
/** The whole card is one link: cover, title, meta. The cover zooms slowly and the title underlines on hover. */
function GalleryCard({ asChild, className, ...rest }) {
	return /* @__PURE__ */ jsx(asChild ? Slot : "a", {
		...rest,
		className: cx("hm-gallery-card", className)
	});
}
function GalleryCover({ ratio, badge, empty, className, style, children, ...rest }) {
	return /* @__PURE__ */ jsxs("span", {
		...rest,
		className: cx("hm-gallery-cover", className),
		style: {
			...ratio ? { aspectRatio: ratio } : null,
			...style
		},
		children: [children ?? /* @__PURE__ */ jsx("span", {
			className: "hm-gallery-empty",
			children: empty
		}), badge ? /* @__PURE__ */ jsx("span", {
			className: "hm-gallery-badge",
			children: badge
		}) : null]
	});
}
function GalleryTitle({ className, ...rest }) {
	return /* @__PURE__ */ jsx("strong", {
		...rest,
		className: cx("hm-gallery-title", className)
	});
}
function GalleryMeta({ className, ...rest }) {
	return /* @__PURE__ */ jsx("small", {
		...rest,
		className: cx("hm-gallery-meta", className)
	});
}
//#endregion
export { GalleryCard, GalleryCover, GalleryGrid, GalleryItem, GalleryMeta, GalleryTitle };

//# sourceMappingURL=gallery.js.map