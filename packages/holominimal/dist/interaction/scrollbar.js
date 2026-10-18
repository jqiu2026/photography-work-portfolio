//#region src/interaction/scrollbar.ts
/**
* Overlay scrollbars for a native scroll container. The browser keeps scrolling (wheel, touch, keyboard, find in page);
* this only reads the scroll metrics and writes CSS variables for custom thumbs, and lets a thumb be dragged or its
* track pressed. Writes on `root`: `--_vy`/`--_vh` (vertical thumb offset and size, px), `--_hx`/`--_hw` (horizontal),
* `data-scrollable-y|x`, `data-at-start|end-y|x` (for edge fades) and `data-scrolling` (for a few hundred ms after
* scrolling, to reveal the thumb). Frame-batched, read-then-write. Returns a cleanup function.
*/
function createScrollbars(root, viewport) {
	let raf = 0;
	let idle;
	const MIN = 28;
	const update = () => {
		raf = 0;
		const { scrollTop, scrollLeft, scrollHeight, scrollWidth, clientHeight, clientWidth } = viewport;
		const sy = scrollHeight > clientHeight + 1;
		const sx = scrollWidth > clientWidth + 1;
		const track = (client, scroll, pos) => {
			const size = Math.max(MIN, client / scroll * client);
			const max = scroll - client;
			return {
				size,
				offset: max > 0 ? pos / max * (client - size) : 0
			};
		};
		const v = track(clientHeight, scrollHeight, scrollTop);
		const h = track(clientWidth, scrollWidth, scrollLeft);
		root.toggleAttribute("data-scrollable-y", sy);
		root.toggleAttribute("data-scrollable-x", sx);
		root.toggleAttribute("data-at-start-y", scrollTop <= 1);
		root.toggleAttribute("data-at-end-y", scrollTop + clientHeight >= scrollHeight - 1);
		root.toggleAttribute("data-at-start-x", scrollLeft <= 1);
		root.toggleAttribute("data-at-end-x", scrollLeft + clientWidth >= scrollWidth - 1);
		root.style.setProperty("--_vy", `${v.offset}px`);
		root.style.setProperty("--_vh", `${v.size}px`);
		root.style.setProperty("--_hx", `${h.offset}px`);
		root.style.setProperty("--_hw", `${h.size}px`);
	};
	const schedule = () => {
		if (!raf) raf = requestAnimationFrame(update);
	};
	const onScroll = () => {
		schedule();
		root.setAttribute("data-scrolling", "");
		clearTimeout(idle);
		idle = setTimeout(() => root.removeAttribute("data-scrolling"), 900);
	};
	viewport.addEventListener("scroll", onScroll, { passive: true });
	const ro = typeof ResizeObserver === "function" ? new ResizeObserver(schedule) : null;
	ro?.observe(viewport);
	const content = viewport.firstElementChild;
	if (content) ro?.observe(content);
	const mo = new MutationObserver(schedule);
	mo.observe(viewport, {
		childList: true,
		subtree: true
	});
	update();
	let drag = null;
	const onDown = (e) => {
		const thumb = e.target.closest("[data-scroll-thumb]");
		const bar = e.target.closest("[data-scroll-bar]");
		if (!bar) return;
		const axis = bar.dataset.scrollBar === "x" ? "x" : "y";
		const client = axis === "y" ? viewport.clientHeight : viewport.clientWidth;
		const scroll = axis === "y" ? viewport.scrollHeight : viewport.scrollWidth;
		const size = Math.max(MIN, client / scroll * client);
		if (thumb) {
			drag = {
				axis,
				start: axis === "y" ? e.clientY : e.clientX,
				from: axis === "y" ? viewport.scrollTop : viewport.scrollLeft,
				ratio: (scroll - client) / (client - size)
			};
			thumb.setPointerCapture(e.pointerId);
			root.setAttribute("data-dragging", "");
		} else {
			const r = bar.getBoundingClientRect();
			const target = ((axis === "y" ? e.clientY - r.top : e.clientX - r.left) - size / 2) / (client - size) * (scroll - client);
			viewport.scrollTo({
				[axis === "y" ? "top" : "left"]: target,
				behavior: "smooth"
			});
		}
		e.preventDefault();
	};
	const onMove = (e) => {
		if (!drag) return;
		const delta = ((drag.axis === "y" ? e.clientY : e.clientX) - drag.start) * drag.ratio;
		if (drag.axis === "y") viewport.scrollTop = drag.from + delta;
		else viewport.scrollLeft = drag.from + delta;
	};
	const onUp = () => {
		drag = null;
		root.removeAttribute("data-dragging");
	};
	root.addEventListener("pointerdown", onDown);
	root.addEventListener("pointermove", onMove);
	root.addEventListener("pointerup", onUp);
	root.addEventListener("pointercancel", onUp);
	return () => {
		cancelAnimationFrame(raf);
		clearTimeout(idle);
		ro?.disconnect();
		mo.disconnect();
		viewport.removeEventListener("scroll", onScroll);
		root.removeEventListener("pointerdown", onDown);
		root.removeEventListener("pointermove", onMove);
		root.removeEventListener("pointerup", onUp);
		root.removeEventListener("pointercancel", onUp);
	};
}
//#endregion
export { createScrollbars };

//# sourceMappingURL=scrollbar.js.map