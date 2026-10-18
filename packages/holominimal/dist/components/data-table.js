"use client";
import { cx } from "../utils/cx.js";
import { useProximity } from "../interaction/hooks.js";
import { Checkbox } from "./field.js";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table.js";
import { Pagination } from "./pagination.js";
import { useControllableState } from "../hooks/index.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useEffect, useMemo, useRef, useState } from "react";
//#region src/components/data-table.tsx
var compare = (a, b) => {
	if (a == null && b == null) return 0;
	if (a == null) return 1;
	if (b == null) return -1;
	if (typeof a === "number" && typeof b === "number") return a - b;
	if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
	if (typeof a === "boolean" && typeof b === "boolean") return Number(a) - Number(b);
	return String(a).localeCompare(String(b), void 0, {
		numeric: true,
		sensitivity: "base"
	});
};
/**
* A complete data table from the library's parts: click a header to sort (ascending, descending, off), select rows with
* checkboxes (a header checkbox selects the page), and page through with `Pagination`. Rows, columns and selection are
* plain props; selection can be controlled.
*/
function DataTable({ caption, columns, rows, getRowId, selectable, selected, defaultSelected, onSelectedChange, pageSize, defaultSort, stickyHeader, empty = "Nothing to show.", className }) {
	const [sort, setSort] = useState(defaultSort);
	const [page, setPage] = useState(1);
	const [ids, setIds] = useControllableState({
		value: selected,
		defaultValue: defaultSelected ?? [],
		onChange: onSelectedChange
	});
	const chosen = useMemo(() => new Set(ids), [ids]);
	const sorted = useMemo(() => {
		const col = sort && columns.find((c) => c.id === sort.id);
		if (!col?.accessor) return rows;
		const get = col.accessor;
		const dir = sort?.direction === "descending" ? -1 : 1;
		return [...rows].sort((a, b) => dir * compare(get(a), get(b)));
	}, [
		rows,
		columns,
		sort
	]);
	const pages = pageSize ? Math.max(1, Math.ceil(sorted.length / pageSize)) : 1;
	const current = Math.min(page, pages);
	const visible = pageSize ? sorted.slice((current - 1) * pageSize, current * pageSize) : sorted;
	const visibleIds = visible.map(getRowId);
	const allOnPage = visibleIds.length > 0 && visibleIds.every((id) => chosen.has(id));
	const someOnPage = visibleIds.some((id) => chosen.has(id));
	const tableBox = useRef(null);
	useProximity(tableBox, {
		itemSelector: "tbody > tr",
		axis: "y",
		hit: "self",
		bounded: true,
		reach: 58,
		restBase: 0,
		restSpread: 0,
		peak: 1,
		smoothing: .22
	});
	const headCheck = useRef(null);
	useEffect(() => {
		if (headCheck.current) headCheck.current.indeterminate = someOnPage && !allOnPage;
	}, [someOnPage, allOnPage]);
	const toggleRow = (id) => setIds(chosen.has(id) ? ids.filter((x) => x !== id) : [...ids, id]);
	const togglePage = () => setIds(allOnPage ? ids.filter((id) => !visibleIds.includes(id)) : [.../* @__PURE__ */ new Set([...ids, ...visibleIds])]);
	const cycle = (id) => setSort((s) => s?.id !== id ? {
		id,
		direction: "ascending"
	} : s.direction === "ascending" ? {
		id,
		direction: "descending"
	} : void 0);
	return /* @__PURE__ */ jsxs("div", {
		className: cx("hm-datatable", className),
		ref: tableBox,
		children: [/* @__PURE__ */ jsxs(Table, {
			stickyHeader,
			containerLabel: caption,
			"aria-label": caption,
			"data-proximity": "",
			children: [/* @__PURE__ */ jsx(TableHeader, { children: /* @__PURE__ */ jsxs(TableRow, { children: [selectable ? /* @__PURE__ */ jsx(TableHead, {
				className: "hm-datatable-check",
				children: /* @__PURE__ */ jsx(Checkbox, {
					ref: headCheck,
					label: /* @__PURE__ */ jsx("span", {
						className: "hm-sr-only",
						children: "Select all rows on this page"
					}),
					checked: allOnPage,
					onChange: togglePage
				})
			}) : null, columns.map((c) => /* @__PURE__ */ jsx(TableHead, {
				align: c.numeric ? "end" : "start",
				sort: c.sortable ? sort?.id === c.id ? sort.direction : "none" : void 0,
				onSort: c.sortable && c.accessor ? () => cycle(c.id) : void 0,
				children: c.header
			}, c.id))] }) }), /* @__PURE__ */ jsx(TableBody, { children: visible.length === 0 ? /* @__PURE__ */ jsx(TableRow, { children: /* @__PURE__ */ jsx(TableCell, {
				colSpan: columns.length + (selectable ? 1 : 0),
				className: "hm-datatable-empty",
				children: empty
			}) }) : visible.map((row, index) => {
				const id = getRowId(row);
				return /* @__PURE__ */ jsxs(TableRow, {
					selected: chosen.has(id),
					style: { "--hm-i": index },
					children: [selectable ? /* @__PURE__ */ jsx(TableCell, {
						className: "hm-datatable-check",
						children: /* @__PURE__ */ jsx(Checkbox, {
							label: /* @__PURE__ */ jsx("span", {
								className: "hm-sr-only",
								children: "Select row"
							}),
							checked: chosen.has(id),
							onChange: () => toggleRow(id)
						})
					}) : null, columns.map((c) => /* @__PURE__ */ jsx(TableCell, {
						numeric: c.numeric,
						rowHeader: c.rowHeader,
						children: c.cell ? c.cell(row) : c.accessor?.(row)
					}, c.id))]
				}, id);
			}) }, `${current}-${sort?.id}-${sort?.direction}`)]
		}), pageSize && sorted.length > pageSize ? /* @__PURE__ */ jsxs("div", {
			className: "hm-datatable-foot",
			children: [/* @__PURE__ */ jsxs("span", {
				className: "hm-datatable-count",
				"aria-live": "polite",
				children: [
					(current - 1) * pageSize + 1,
					"–",
					Math.min(current * pageSize, sorted.length),
					" of ",
					sorted.length,
					selectable && ids.length ? `, ${ids.length} selected` : ""
				]
			}), /* @__PURE__ */ jsx(Pagination, {
				page: current,
				pageCount: pages,
				onPageChange: setPage,
				"aria-label": `${caption} pages`
			})]
		}) : selectable && ids.length ? /* @__PURE__ */ jsxs("p", {
			className: "hm-datatable-count",
			"aria-live": "polite",
			children: [ids.length, " selected"]
		}) : null]
	});
}
//#endregion
export { DataTable };

//# sourceMappingURL=data-table.js.map