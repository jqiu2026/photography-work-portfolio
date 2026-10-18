//#region src/interaction/swipe.ts
/** Pure: the dominant direction of a drag, or null when it was too short or too diagonal. */
function swipeDirection(dx, dy, threshold = 48) {
	const ax = Math.abs(dx);
	const ay = Math.abs(dy);
	if (Math.max(ax, ay) < threshold || Math.abs(ax - ay) < threshold / 3) return null;
	if (ax > ay) return dx < 0 ? "left" : "right";
	return dy < 0 ? "up" : "down";
}
/**
* Reports quick drags on `el` (touch and pen only; a mouse drag is left alone so text and images stay selectable).
* Sets `touch-action: pan-y` so vertical scrolling still works. Returns a cleanup function.
*/
function createSwipe(el, { onSwipe, threshold = 48 }) {
	let start = null;
	const previous = el.style.touchAction;
	el.style.touchAction = "pan-y";
	const down = (e) => {
		if (e.pointerType === "mouse" || !e.isPrimary) return;
		start = {
			x: e.clientX,
			y: e.clientY,
			id: e.pointerId
		};
	};
	const up = (e) => {
		if (!start || e.pointerId !== start.id) return;
		const dir = swipeDirection(e.clientX - start.x, e.clientY - start.y, threshold);
		start = null;
		if (dir) onSwipe(dir);
	};
	const cancel = () => {
		start = null;
	};
	el.addEventListener("pointerdown", down);
	el.addEventListener("pointerup", up);
	el.addEventListener("pointercancel", cancel);
	return () => {
		el.removeEventListener("pointerdown", down);
		el.removeEventListener("pointerup", up);
		el.removeEventListener("pointercancel", cancel);
		el.style.touchAction = previous;
	};
}
//#endregion
export { createSwipe, swipeDirection };

//# sourceMappingURL=swipe.js.map