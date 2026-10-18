import { cx } from "../utils/cx.js";
import { Surface } from "./surface.js";
import { jsx, jsxs } from "react/jsx-runtime";
//#region src/components/pricing.tsx
/** Package/plan cards side by side (a <ul>). */
function PricingGrid({ className, ...rest }) {
	return /* @__PURE__ */ jsx("ul", {
		...rest,
		className: cx("hm-pricing-grid", className)
	});
}
/**
* A package or plan. Outlined by default; featured cards get the iridescent edge rather than a fill, so the grid keeps
* one material.
*/
function PricingCard({ featured, featuredLabel, current, variant = "outlined", as = "li", padding = "lg", className, children, ...rest }) {
	return /* @__PURE__ */ jsxs(Surface, {
		...rest,
		as,
		variant,
		padding,
		selected: featured,
		lit: featured || rest.lit,
		className: cx("hm-pricing-card", className),
		"data-current": current ? "" : void 0,
		children: [featured && featuredLabel ? /* @__PURE__ */ jsx("span", {
			className: "hm-pricing-flag",
			children: featuredLabel
		}) : null, children]
	});
}
function PricingName({ as: As = "h2", className, ...rest }) {
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-pricing-name", className)
	});
}
function PricingTagline({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-pricing-tagline", className)
	});
}
function PricingPrice({ period, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("p", {
		...rest,
		className: cx("hm-pricing-price", className),
		children: [children, period ? /* @__PURE__ */ jsx("small", { children: period }) : null]
	});
}
/** What is included, as label / value rows on hairlines. */
function PricingFeatures({ className, ...rest }) {
	return /* @__PURE__ */ jsx("ul", {
		...rest,
		className: cx("hm-pricing-features", className)
	});
}
function PricingFeature({ value, className, children, ...rest }) {
	return /* @__PURE__ */ jsxs("li", {
		...rest,
		className: cx("hm-pricing-feature", className),
		children: [/* @__PURE__ */ jsx("span", { children }), value !== void 0 ? /* @__PURE__ */ jsx("strong", { children: value }) : null]
	});
}
function PricingFooter({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-pricing-footer", className)
	});
}
//#endregion
export { PricingCard, PricingFeature, PricingFeatures, PricingFooter, PricingGrid, PricingName, PricingPrice, PricingTagline };

//# sourceMappingURL=pricing.js.map