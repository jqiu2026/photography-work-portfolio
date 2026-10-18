//#region src/interaction/indicator.ts
/**
* A sliding indicator for a row (or column) of items, for tabs and segmented controls. It measures the active item and
* writes `--_ix`, `--_iy`, `--_iw`, `--_ih` (px, relative to the container) so CSS can transition a pseudo-element
* between items. `data-indicator` is set only after the first measurement has been laid out, so the indicator
* appears in place instead of sliding in from the corner. It follows resizes and selection changes and never sets
* React state. Returns a cleanup function.
*/
function createIndicator(container, { item, active }) {
	let raf = 0;
	let ready = false;
	const measure = () => {
		raf = 0;
		const el = container.querySelector(active);
		if (!el) {
			container.removeAttribute("data-indicator");
			ready = false;
			return;
		}
		container.style.setProperty("--_ix", `${el.offsetLeft}px`);
		container.style.setProperty("--_iy", `${el.offsetTop}px`);
		container.style.setProperty("--_iw", `${el.offsetWidth}px`);
		container.style.setProperty("--_ih", `${el.offsetHeight}px`);
		if (!ready) {
			ready = true;
			requestAnimationFrame(() => container.setAttribute("data-indicator", ""));
		}
	};
	const schedule = () => {
		if (!raf) raf = requestAnimationFrame(measure);
	};
	measure();
	const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
	ro?.observe(container);
	for (const el of container.querySelectorAll(item)) ro?.observe(el);
	const mo = new MutationObserver(schedule);
	mo.observe(container, {
		attributes: true,
		attributeFilter: [
			"aria-selected",
			"aria-pressed",
			"aria-current",
			"data-current"
		],
		subtree: true,
		childList: true
	});
	addEventListener("resize", schedule);
	document.fonts?.ready.then(schedule);
	return () => {
		cancelAnimationFrame(raf);
		ro?.disconnect();
		mo.disconnect();
		removeEventListener("resize", schedule);
		container.removeAttribute("data-indicator");
	};
}
//#endregion
export { createIndicator };

//# sourceMappingURL=indicator.js.map