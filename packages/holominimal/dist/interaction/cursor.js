import { hasFinePointer, prefersReducedMotion } from "../utils/motion.js";
//#region src/interaction/cursor.ts
var INTERACTIVE = "a[href], button, [role=\"button\"], [role=\"tab\"], [role=\"menuitem\"], [role=\"option\"], summary, label, select, input:is([type=\"checkbox\"], [type=\"radio\"], [type=\"range\"], [type=\"submit\"], [type=\"button\"], [type=\"file\"]), [data-hm-cursor=\"link\"]";
var TEXTUAL = "textarea, input:not([type]), input:is([type=\"text\"], [type=\"search\"], [type=\"email\"], [type=\"password\"], [type=\"number\"], [type=\"url\"], [type=\"tel\"]), [contenteditable=\"\"], [contenteditable=\"true\"], [data-hm-cursor=\"text\"]";
/** Through a run of points as a smooth curve: quadratic segments that end at the midpoints, so there are no corners. */
function curve(pts, back = false) {
	const p = back ? [...pts].reverse() : pts;
	let d = "";
	for (let i = 1; i < p.length - 1; i++) {
		const a = p[i];
		const n = p[i + 1];
		d += `Q${a[0]} ${a[1]} ${((Number(a[0]) + Number(n[0])) / 2).toFixed(1)} ${((Number(a[1]) + Number(n[1])) / 2).toFixed(1)}`;
	}
	const last = p[p.length - 1];
	return `${d}L${last[0]} ${last[1]}`;
}
/** A solid ribbon along the points, as wide as the cursor at the head and tapering to nothing as the points age. */
function ribbon(pts, now, size, life) {
	if (pts.length < 3) return "";
	const left = [];
	const right = [];
	pts.forEach((p, i) => {
		const a = pts[Math.max(0, i - 2)];
		const b = pts[Math.min(pts.length - 1, i + 2)];
		const dx = b.x - a.x;
		const dy = b.y - a.y;
		const len = Math.hypot(dx, dy) || 1;
		const half = size / 2 * Math.max(0, 1 - (now - p.t) / life) ** 1.4;
		const nx = -dy / len * half;
		const ny = dx / len * half;
		left.push([(p.x + nx).toFixed(1), (p.y + ny).toFixed(1)]);
		right.push([(p.x - nx).toFixed(1), (p.y - ny).toFixed(1)]);
	});
	const l0 = left[0];
	const r0 = right[right.length - 1];
	return `M${l0[0]} ${l0[1]}${curve(left)}L${r0[0]} ${r0[1]}${curve(right, true)}Z`;
}
var ease = (dt, tau) => tau <= 0 ? 1 : 1 - Math.exp(-dt / tau);
/**
* A custom cursor as a framework-free engine. The markup is yours (the `Cursor` component renders one): `root` holds
* parts marked `data-part="dot" | "ring" | "icon" | "spot" | "trail" | "label"`, and the engine only moves them. The
* dot follows the pointer with a short exponential ease; the ring, icon, spotlight and trail follow with longer ones,
* so the cursor glides instead of jumping, and never drifts out of time with the pointer (frame-rate independent).
*
* Behavior: it reads what is under the pointer and sets `data-state` on `root` (`default`, `link`, `text`, `hidden`),
* `data-pressed` while a button is down and `data-visible` while the pointer is in the scope. Elements can ask for
* things with attributes: `data-hm-cursor="none | link | text"` and `data-hm-cursor-label="View"` (a label next to the
* cursor). With `morph` the ring takes the shape of the interactive element under it; `magnetic` pulls it toward the
* element's center; `rotate` turns the icon's tip toward the direction of travel (see `iconPoints`). Fine pointers only; reduced motion removes
* the easing and ripples (the cursor still shows).
*/
function createCursor(root, options = {}) {
	const { scope = null, smoothing = 60, ringSmoothing = 170, magnetic = 0, morph = false, rotate = false, iconPoints = 0, hideNative = true, ripple = false, rippleSize = 80, onStateChange } = options;
	let state = "default";
	if (!hasFinePointer()) return {
		destroy() {},
		state: () => state
	};
	const part = (name) => root.querySelector(`[data-part="${name}"]`);
	const dot = part("dot");
	const ring = part("ring");
	const icon = part("icon");
	const spot = part("spot");
	const label = part("label");
	const trail = part("trail");
	const trailPath = trail?.querySelector("path") ?? null;
	const history = [];
	const TRAIL_MS = Number(trail?.dataset.ms) || 420;
	const cssPx = (name, fallback) => Number.parseFloat(getComputedStyle(root).getPropertyValue(name)) || fallback;
	const host = scope ?? document.documentElement;
	const eventTarget = scope ?? window;
	const reduced = () => prefersReducedMotion(host);
	let px = 0;
	let py = 0;
	const dotP = {
		x: 0,
		y: 0
	};
	const ringP = {
		x: 0,
		y: 0
	};
	const spotP = {
		x: 0,
		y: 0
	};
	const iconP = {
		x: 0,
		y: 0
	};
	let face = 0;
	let ctl = false;
	let cw = 0;
	let ch = 0;
	let cr = 0;
	let cm = 0;
	let vx = 0;
	let vy = 0;
	let fx = 0;
	let fy = 0;
	let heading = -Math.PI / 2;
	let press = 1;
	let pressTarget = 1;
	let hover = null;
	let seen = false;
	let raf = 0;
	let last = 0;
	const place = (el, p, extra = "") => {
		if (el) el.style.translate = `${+p.x.toFixed(2)}px ${+p.y.toFixed(2)}px`;
		if (el && extra !== void 0) el.style.rotate = extra;
	};
	const setState = (next) => {
		if (next === state) return;
		state = next;
		root.dataset.state = next;
		onStateChange?.(next);
	};
	let under = null;
	const classify = (target) => {
		under = target;
		const custom = target?.closest("[data-hm-cursor]")?.getAttribute("data-hm-cursor");
		const interactive = target?.closest(INTERACTIVE) ?? null;
		const disabled = interactive?.matches(":disabled, [aria-disabled='true']");
		hover = interactive && !disabled ? interactive : null;
		if (custom === "none") setState("hidden");
		else if (target?.closest(TEXTUAL)) setState("text");
		else if (hover) setState("link");
		else setState("default");
		const text = target?.closest("[data-hm-cursor-label]")?.getAttribute("data-hm-cursor-label") ?? "";
		if (label && label.textContent !== text) label.textContent = text;
		root.toggleAttribute("data-label", text !== "");
	};
	const frame = (now) => {
		raf = 0;
		if (!last) {
			fx = px;
			fy = py;
		}
		const dt = Math.min(64, last ? now - last : 16);
		last = now;
		const still = reduced();
		const kd = still ? 1 : ease(dt, hover && state === "link" && morph ? Math.min(smoothing, 45) : ctl ? Math.max(smoothing, 90) : smoothing);
		const kr = still ? 1 : ease(dt, !!hover && state === "link" && morph ? Math.min(ringSmoothing, 60) : ctl ? Math.max(ringSmoothing, 90) : ringSmoothing);
		vx += ((px - fx) * (16 / dt) - vx) * .35;
		vy += ((py - fy) * (16 / dt) - vy) * .35;
		fx = px;
		fy = py;
		const speed = Math.hypot(vx, vy);
		let rx = px;
		let ry = py;
		let box = null;
		if (hover && state === "link" && (magnetic > 0 || morph)) {
			box = hover.getBoundingClientRect();
			const cx = box.left + box.width / 2;
			const cy = box.top + box.height / 2;
			const pull = morph ? 1 : magnetic;
			rx = px + (cx - px) * pull;
			ry = py + (cy - py) * pull;
		}
		const chase = (p, tx, ty, k) => {
			p.x += (tx - p.x) * k;
			p.y += (ty - p.y) * k;
			if (Math.abs(tx - p.x) < .05) p.x = tx;
			if (Math.abs(ty - p.y) < .05) p.y = ty;
		};
		chase(dotP, ring ? px : rx, ring ? py : ry, kd);
		chase(ringP, rx, ry, kr);
		chase(spotP, px, py, ease(dt, ringSmoothing * 1.7));
		chase(iconP, px, py, icon ? kd : 1);
		if (speed > 1.5) {
			let d = Math.atan2(vy, vx) - heading;
			while (d > Math.PI) d -= 2 * Math.PI;
			while (d < -Math.PI) d += 2 * Math.PI;
			heading += d * (still ? 1 : ease(dt, 90));
		}
		press += (pressTarget - press) * (still ? 1 : ease(dt, 70));
		const angle = "0deg";
		const lead = ring ?? dot;
		const wantMorph = !!(box && morph);
		const squeeze = 1 - (1 - press) * (1 - cm);
		if (dot) {
			place(dot, dotP, angle);
			dot.style.scale = `${squeeze}`;
		}
		if (ring) {
			place(ring, ringP, angle);
			ring.style.scale = `${squeeze}`;
		}
		if (lead && (wantMorph || ctl)) {
			const base = lead === ring ? cssPx("--hm-cursor-ring", 38) : cssPx("--hm-cursor-dot", 8);
			if (wantMorph && !ctl) {
				ctl = true;
				cw = lead.offsetWidth;
				ch = lead.offsetHeight;
				cr = Number.parseFloat(getComputedStyle(lead).borderTopLeftRadius) || Math.min(cw, ch) / 2;
				cm = 0;
			}
			if (ctl) {
				const k = lead === ring ? kr : kd;
				const pad = 8;
				const tw = wantMorph && box ? box.width + pad : base;
				const th = wantMorph && box ? box.height + pad : base;
				const want = wantMorph && hover ? Number.parseFloat(getComputedStyle(hover).borderTopLeftRadius) || 0 : base / 2;
				const tr = Math.min(want + (wantMorph ? pad / 2 : 0), Math.min(tw, th) / 2);
				cw += (tw - cw) * k;
				ch += (th - ch) * k;
				cr += (tr - cr) * k;
				cm += ((wantMorph ? 1 : 0) - cm) * k;
				if (!wantMorph && Math.abs(cw - base) < .4 && Math.abs(ch - base) < .4 && cm < .02) {
					cm = 0;
					ctl = false;
					lead.style.removeProperty("width");
					lead.style.removeProperty("height");
					lead.style.removeProperty("margin");
					lead.style.removeProperty("border-radius");
					lead.style.removeProperty("--m");
				} else {
					lead.style.width = `${cw.toFixed(2)}px`;
					lead.style.height = `${ch.toFixed(2)}px`;
					lead.style.margin = `${(-ch / 2).toFixed(2)}px 0 0 ${(-cw / 2).toFixed(2)}px`;
					lead.style.borderRadius = `${cr.toFixed(2)}px`;
					lead.style.setProperty("--m", cm.toFixed(3));
				}
			}
		}
		root.toggleAttribute("data-morph", ctl);
		if (icon) {
			const variant = state !== "default" && icon.querySelector(`[data-for="${state}"]`);
			face += ((variant ? 0 : 1) - face) * (still ? 1 : ease(dt, 140));
			let turn = heading * 180 / Math.PI + 90 - iconPoints;
			turn = ((turn + 180) % 360 + 360) % 360 - 180;
			place(icon, iconP, rotate && !still ? `${(turn * face).toFixed(2)}deg` : "0deg");
			icon.style.scale = `${press}`;
		}
		place(spot, spotP);
		if (trail && trailPath) {
			const at = icon ? iconP : dotP;
			const head = history[history.length - 1];
			if (!head || Math.hypot(head.x - at.x, head.y - at.y) > .4) history.push({
				x: at.x,
				y: at.y,
				t: now
			});
			while (history.length && now - (history[0]?.t ?? now) > TRAIL_MS) history.shift();
			const size = Number(trail.dataset.w) || cssPx("--hm-cursor-dot", 8);
			trailPath.setAttribute("d", ribbon(history, now, size, TRAIL_MS));
		}
		if (Math.abs((ring ? px : rx) - dotP.x) + Math.abs((ring ? py : ry) - dotP.y) + Math.abs(rx - ringP.x) + Math.abs(ry - ringP.y) + Math.abs(px - spotP.x) + Math.abs(py - spotP.y) + Math.abs(press - pressTarget) + (history.length > 1 ? 1 : 0) + Math.abs(face - (state !== "default" && icon?.querySelector(`[data-for="${state}"]`) ? 0 : 1)) + (box || ctl ? 1 : 0) > .15) raf = requestAnimationFrame(frame);
		else {
			last = 0;
			vx = 0;
			vy = 0;
		}
	};
	const kick = () => {
		if (!raf) raf = requestAnimationFrame(frame);
	};
	const snapAll = () => {
		for (const p of [
			dotP,
			ringP,
			spotP,
			iconP
		]) {
			p.x = px;
			p.y = py;
		}
	};
	const onMove = (e) => {
		const pe = e;
		if (pe.pointerType !== "mouse" && pe.pointerType !== "pen") return;
		px = pe.clientX;
		py = pe.clientY;
		if (!seen) {
			seen = true;
			snapAll();
		}
		root.setAttribute("data-visible", "");
		if (pe.target instanceof Element && pe.target !== under) classify(pe.target);
		kick();
	};
	let recheck = 0;
	const reclassify = () => {
		if (recheck || !seen) return;
		recheck = requestAnimationFrame(() => {
			recheck = 0;
			const el = document.elementFromPoint(px, py);
			if (el && (!scope || scope.contains(el))) classify(el);
			kick();
		});
	};
	const onOver = (e) => classify(e.target);
	const onDown = (e) => {
		if (e.pointerType === "touch") return;
		pressTarget = .78;
		root.setAttribute("data-pressed", "");
		if (ripple && !reduced()) {
			const r = document.createElement("span");
			r.className = "hm-cursor-ripple";
			r.style.translate = `${px}px ${py}px`;
			r.style.setProperty("--rs", `${rippleSize / 2.2}px`);
			r.addEventListener("animationend", () => r.remove(), { once: true });
			root.append(r);
		}
		kick();
	};
	const onUp = () => {
		pressTarget = 1;
		root.removeAttribute("data-pressed");
		kick();
	};
	const onLeave = () => {
		root.removeAttribute("data-visible");
		seen = false;
	};
	root.dataset.state = state;
	host.setAttribute("data-hm-cursor-active", "");
	if (!hideNative) host.removeAttribute("data-hm-cursor-active");
	eventTarget.addEventListener("pointermove", onMove, { passive: true });
	eventTarget.addEventListener("pointerover", onOver, { passive: true });
	eventTarget.addEventListener("pointerdown", onDown, { passive: true });
	window.addEventListener("pointerup", onUp, { passive: true });
	window.addEventListener("scroll", reclassify, {
		passive: true,
		capture: true
	});
	(scope ?? document.documentElement).addEventListener("pointerleave", onLeave);
	return {
		state: () => state,
		destroy() {
			eventTarget.removeEventListener("pointermove", onMove);
			eventTarget.removeEventListener("pointerover", onOver);
			eventTarget.removeEventListener("pointerdown", onDown);
			window.removeEventListener("pointerup", onUp);
			window.removeEventListener("scroll", reclassify, { capture: true });
			cancelAnimationFrame(recheck);
			(scope ?? document.documentElement).removeEventListener("pointerleave", onLeave);
			host.removeAttribute("data-hm-cursor-active");
			cancelAnimationFrame(raf);
		}
	};
}
//#endregion
export { createCursor };

//# sourceMappingURL=cursor.js.map