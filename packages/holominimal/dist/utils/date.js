//#region src/utils/date.ts
/** Small local-time date helpers for the calendar (no dependency, no time zones: a "day" is a local midnight). */
var startOfDay = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
var addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
/** Adds months, clamping the day (Jan 31 + 1 month is Feb 28/29). */
var addMonths = (d, n) => {
	const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
	const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
	return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last));
};
var startOfMonth = (d) => new Date(d.getFullYear(), d.getMonth(), 1);
var isSameDay = (a, b) => !!a && !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
var isSameMonth = (a, b) => a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
var compareDays = (a, b) => startOfDay(a).getTime() - startOfDay(b).getTime();
/** The weeks of a month as rows of 7 days, padded with the neighboring months' days. */
function monthGrid(month, weekStartsOn = 0) {
	const first = startOfMonth(month);
	const lead = (first.getDay() - weekStartsOn + 7) % 7;
	const start = addDays(first, -lead);
	const last = new Date(month.getFullYear(), month.getMonth() + 1, 0);
	const total = Math.ceil((lead + last.getDate()) / 7) * 7;
	const weeks = [];
	for (let i = 0; i < total; i += 7) weeks.push(Array.from({ length: 7 }, (_, j) => addDays(start, i + j)));
	return weeks;
}
//#endregion
export { addDays, addMonths, compareDays, isSameDay, isSameMonth, monthGrid, startOfDay, startOfMonth };

//# sourceMappingURL=date.js.map