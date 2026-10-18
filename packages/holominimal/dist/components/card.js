import { cx } from "../utils/cx.js";
import { Surface } from "./surface.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/card.tsx
/**
* A titled block of content. Defaults to the studio's flat `section` material (a hairline above, no box); pass
* `variant="outlined" | "elevated" | "glass" | "holo"` for a contained card.
*
*   <Card aria-labelledby="up"><CardHeader><CardTitle id="up">Upcoming</CardTitle><a href="/cal">Calendar</a></CardHeader>
*     <CardContent>...</CardContent></Card>
*/
function Card({ as = "section", className, ...rest }) {
	return /* @__PURE__ */ jsx(Surface, {
		as,
		...rest,
		className: cx("hm-card", className)
	});
}
/** Title row: the title on the left, a quiet link or meta on the right. */
function CardHeader({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-card-header", className)
	});
}
function CardTitle({ as: As = "h2", className, ...rest }) {
	return /* @__PURE__ */ jsx(As, {
		...rest,
		className: cx("hm-card-title", className)
	});
}
function CardDescription({ className, ...rest }) {
	return /* @__PURE__ */ jsx("p", {
		...rest,
		className: cx("hm-card-description", className)
	});
}
function CardContent({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-card-content", className)
	});
}
function CardFooter({ className, ...rest }) {
	return /* @__PURE__ */ jsx("div", {
		...rest,
		className: cx("hm-card-footer", className)
	});
}
//#endregion
export { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle };

//# sourceMappingURL=card.js.map