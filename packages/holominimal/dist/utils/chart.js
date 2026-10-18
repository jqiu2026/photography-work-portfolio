//#region src/utils/chart.ts
/**
* An SVG path through the points. `smooth` uses monotone cubic interpolation (the curve never overshoots the data, so
* a flat run stays flat and a peak is never drawn higher than its value).
*/
function chartPath(points, smooth = true) {
	const n = points.length;
	if (n === 0) return "";
	const f = (v) => Number(v.toFixed(2));
	const first = points[0];
	if (n === 1 || !smooth) return points.map(([x, y], i) => `${i ? "L" : "M"}${f(x)} ${f(y)}`).join("");
	const dx = [];
	const slope = [];
	for (let i = 0; i < n - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		dx.push(x1 - x0);
		slope.push(x1 === x0 ? 0 : (y1 - y0) / (x1 - x0));
	}
	const m = [slope[0]];
	for (let i = 1; i < n - 1; i++) {
		const a = slope[i - 1];
		const b = slope[i];
		m.push(a * b <= 0 ? 0 : (a + b) / 2);
	}
	m.push(slope[n - 2]);
	for (let i = 0; i < n - 1; i++) {
		const s = slope[i];
		if (s === 0) {
			m[i] = 0;
			m[i + 1] = 0;
			continue;
		}
		const a = m[i] / s;
		const b = m[i + 1] / s;
		const h = Math.hypot(a, b);
		if (h > 3) {
			const t = 3 / h;
			m[i] = t * a * s;
			m[i + 1] = t * b * s;
		}
	}
	let d = `M${f(first[0])} ${f(first[1])}`;
	for (let i = 0; i < n - 1; i++) {
		const [x0, y0] = points[i];
		const [x1, y1] = points[i + 1];
		const w = dx[i] / 3;
		d += `C${f(x0 + w)} ${f(y0 + w * m[i])} ${f(x1 - w)} ${f(y1 - w * m[i + 1])} ${f(x1)} ${f(y1)}`;
	}
	return d;
}
/** Scales values into a `width` by `height` box (y grows downward), padding the top so the line never touches the edge. */
function scalePoints(values, width, height, pad = 4, floor) {
	const min = floor ?? Math.min(...values, 0);
	const span = Math.max(...values, min + 1) - min || 1;
	return values.map((v, i) => [values.length === 1 ? width / 2 : i / (values.length - 1) * width, pad + (1 - (v - min) / span) * (height - pad * 2)]);
}
/** Arc segments of a donut: each gets its share of 100 (a circle drawn with `pathLength={100}`) and a start offset. */
function donutSegments(values, gap = 0) {
	const total = values.reduce((s, v) => s + Math.max(0, v), 0);
	let at = 0;
	return values.map((v) => {
		const share = total ? Math.max(0, v) / total : 0;
		const length = Math.max(0, share * 100 - (share > 0 && share < 1 ? gap : 0));
		const seg = {
			start: at,
			length,
			share
		};
		at += share * 100;
		return seg;
	});
}
//#endregion
export { chartPath, donutSegments, scalePoints };

//# sourceMappingURL=chart.js.map