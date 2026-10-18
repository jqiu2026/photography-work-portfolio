//#region src/interaction/floating.ts
var opposite = {
	top: "bottom",
	bottom: "top",
	left: "right",
	right: "left"
};
function place(anchor, size, side, align, offset) {
	const vertical = side === "top" || side === "bottom";
	const crossStart = vertical ? anchor.x : anchor.y;
	const crossAnchor = vertical ? anchor.width : anchor.height;
	const crossSize = vertical ? size.width : size.height;
	const cross = align === "start" ? crossStart : align === "end" ? crossStart + crossAnchor - crossSize : crossStart + (crossAnchor - crossSize) / 2;
	if (vertical) return {
		x: cross,
		y: side === "top" ? anchor.y - size.height - offset : anchor.y + anchor.height + offset
	};
	return {
		x: side === "left" ? anchor.x - size.width - offset : anchor.x + anchor.width + offset,
		y: cross
	};
}
/** Pure placement: flips to the opposite side when the preferred one overflows, then keeps the box in the viewport. */
function computePosition(anchor, size, viewport, { side = "bottom", align = "start", offset = 6, padding = 8 } = {}) {
	const overflow = (s) => {
		const p = place(anchor, size, s, align, offset);
		if (s === "top" || s === "bottom") return Math.max(padding - p.y, p.y + size.height - (viewport.height - padding), 0);
		return Math.max(padding - p.x, p.x + size.width - (viewport.width - padding), 0);
	};
	let used = side;
	if (overflow(side) > 0 && overflow(opposite[side]) < overflow(side)) used = opposite[side];
	const p = place(anchor, size, used, align, offset);
	const maxX = Math.max(padding, viewport.width - size.width - padding);
	const maxY = Math.max(padding, viewport.height - size.height - padding);
	return {
		x: Math.min(Math.max(p.x, padding), maxX),
		y: Math.min(Math.max(p.y, padding), maxY),
		side: used
	};
}
/**
* Positions `floating` (a `popover="manual"` element, so it lives in the top layer) against `anchor`, and keeps it
* there through scroll, resize and size changes. Writes `left`/`top`, `data-side` and `--hm-anchor-width`; never React
* state. Returns a cleanup that hides the element.
*/
function attachFloating(anchor, floating, options = {}) {
	if (typeof floating.showPopover === "function" && !floating.matches(":popover-open")) floating.showPopover();
	let frame = 0;
	const update = () => {
		frame = 0;
		const a = anchor.getBoundingClientRect();
		const size = {
			width: floating.offsetWidth,
			height: floating.offsetHeight
		};
		const vp = {
			width: document.documentElement.clientWidth,
			height: document.documentElement.clientHeight
		};
		const { x, y, side } = computePosition({
			x: a.left,
			y: a.top,
			width: a.width,
			height: a.height
		}, size, vp, options);
		floating.style.left = `${Math.round(x)}px`;
		floating.style.top = `${Math.round(y)}px`;
		floating.style.setProperty("--hm-anchor-width", `${Math.round(a.width)}px`);
		floating.dataset.side = side;
	};
	const schedule = () => {
		if (!frame) frame = requestAnimationFrame(update);
	};
	update();
	addEventListener("scroll", schedule, {
		capture: true,
		passive: true
	});
	addEventListener("resize", schedule);
	const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
	ro?.observe(floating);
	ro?.observe(anchor);
	return () => {
		if (frame) cancelAnimationFrame(frame);
		removeEventListener("scroll", schedule, { capture: true });
		removeEventListener("resize", schedule);
		ro?.disconnect();
		if (typeof floating.hidePopover === "function" && floating.matches(":popover-open")) floating.hidePopover();
	};
}
//#endregion
export { attachFloating, computePosition };

//# sourceMappingURL=floating.js.map