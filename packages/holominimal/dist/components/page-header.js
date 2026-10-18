import { cx } from "../utils/cx.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/page-header.tsx
/**
* The studio page header: an eyebrow (where you are), an editorial title, one sentence on what the page is for, and the
* page's siblings as quiet tabs. Server-compatible.
*
*   <PageHeader><PageEyebrow>Galleries</PageEyebrow><PageTitle>All galleries</PageTitle>
*     <PageDescription>Client galleries and how they are delivered.</PageDescription>
*     <PageTabs aria-label="Galleries pages"><PageTab href="/g" current>All</PageTab>...</PageTabs></PageHeader>
*/
function PageHeader({ className, ...rest }) {
	return /* @__PURE__ */ jsx("header", {
		...rest,
		className: cx("hm-page-header", className)
	});
}
function PageEyebrow({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-eyebrow", className)
	});
}
function PageTitle({ as: Heading = "h1", className, ...rest }) {
	return /* @__PURE__ */ jsx(Heading, {
		...rest,
		className: cx("hm-page-title", className)
	});
}
function PageDescription({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-page-description", className)
	});
}
/** Actions aligned with the title (a primary button, a menu). */
function PageActions({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-page-actions", className)
	});
}
//#endregion
export { PageActions, PageDescription, PageEyebrow, PageHeader, PageTitle };

//# sourceMappingURL=page-header.js.map