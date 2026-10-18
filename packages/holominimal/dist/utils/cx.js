//#region src/utils/cx.ts
/** Joins class names, skipping falsy values. */
function cx(...parts) {
	let out = "";
	for (const p of parts) if (p) out = out ? `${out} ${p}` : p;
	return out;
}
/** `data-*` boolean attributes: present (empty string) when true, absent otherwise. */
var flag = (on) => on ? "" : void 0;
//#endregion
export { cx, flag };

//# sourceMappingURL=cx.js.map