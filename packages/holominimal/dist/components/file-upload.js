"use client";
import { cx } from "../utils/cx.js";
import { CloseIcon, UploadIcon } from "../icons/interface.js";
import { Progress } from "./progress.js";
import { jsx, jsxs } from "react/jsx-runtime";
import { useId, useRef, useState } from "react";
//#region src/components/file-upload.tsx
var matches = (file, accept) => {
	if (!accept) return true;
	return accept.split(",").map((a) => a.trim().toLowerCase()).filter(Boolean).some((a) => a.startsWith(".") ? file.name.toLowerCase().endsWith(a) : a.endsWith("/*") ? file.type.toLowerCase().startsWith(a.slice(0, -1)) : file.type.toLowerCase() === a);
};
/**
* A drop target and file picker in one: drag files over it (it responds), or activate it with the keyboard to open the
* file dialog. Files are validated against `accept`, `maxSize` and `maxFiles`; the rest are reported to `onReject`.
*/
function FileDropzone({ onFiles, onReject, accept, multiple = true, maxSize, maxFiles, disabled, label = "Drop files here, or browse", description, name, className, ...rest }) {
	const [dragging, setDragging] = useState(false);
	const input = useRef(null);
	const depth = useRef(0);
	const descId = useId();
	const take = (list) => {
		const files = Array.from(list);
		const ok = [];
		const bad = [];
		for (const file of multiple ? files : files.slice(0, 1)) if (!matches(file, accept)) bad.push({
			file,
			reason: "type"
		});
		else if (maxSize !== void 0 && file.size > maxSize) bad.push({
			file,
			reason: "size"
		});
		else if (maxFiles !== void 0 && ok.length >= maxFiles) bad.push({
			file,
			reason: "count"
		});
		else ok.push(file);
		if (ok.length) onFiles(ok);
		if (bad.length) onReject?.(bad);
	};
	const over = (e) => {
		if (disabled) return;
		e.preventDefault();
	};
	return /* @__PURE__ */ jsxs("div", {
		...rest,
		className: cx("hm-dropzone", className),
		"data-dragging": dragging ? "" : void 0,
		"data-disabled": disabled ? "" : void 0,
		onDragEnter: (e) => {
			if (disabled) return;
			e.preventDefault();
			depth.current++;
			setDragging(true);
		},
		onDragOver: over,
		onDragLeave: () => {
			depth.current = Math.max(0, depth.current - 1);
			if (!depth.current) setDragging(false);
		},
		onDrop: (e) => {
			if (disabled) return;
			e.preventDefault();
			depth.current = 0;
			setDragging(false);
			take(e.dataTransfer.files);
		},
		children: [/* @__PURE__ */ jsxs("button", {
			type: "button",
			className: "hm-dropzone-button",
			disabled,
			"aria-describedby": description ? descId : void 0,
			onClick: () => input.current?.click(),
			children: [
				/* @__PURE__ */ jsx(UploadIcon, {
					className: "hm-dropzone-icon",
					size: 26
				}),
				/* @__PURE__ */ jsx("span", {
					className: "hm-dropzone-label",
					children: label
				}),
				description ? /* @__PURE__ */ jsx("span", {
					id: descId,
					className: "hm-dropzone-description",
					children: description
				}) : null
			]
		}), /* @__PURE__ */ jsx("input", {
			ref: input,
			type: "file",
			name,
			accept,
			multiple,
			disabled,
			tabIndex: -1,
			"aria-hidden": "true",
			className: "hm-sr-only",
			onChange: (e) => {
				if (e.target.files) take(e.target.files);
				e.target.value = "";
			}
		})]
	});
}
var bytes = (n) => n < 1024 ? `${n} B` : n < 1048576 ? `${(n / 1024).toFixed(1)} KB` : `${(n / 1048576).toFixed(1)} MB`;
/** One row of an upload list: name, size, a progress bar while it uploads, and a remove button. */
function FileItem({ name, size, progress, status = "ready", error, onRemove, className, ...rest }) {
	return /* @__PURE__ */ jsxs("li", {
		...rest,
		className: cx("hm-file-item", className),
		"data-status": status,
		children: [
			/* @__PURE__ */ jsxs("span", {
				className: "hm-file-meta",
				children: [/* @__PURE__ */ jsx("span", {
					className: "hm-file-name",
					children: name
				}), /* @__PURE__ */ jsx("span", {
					className: "hm-file-size",
					children: error ?? (size !== void 0 ? bytes(size) : null)
				})]
			}),
			status === "uploading" && progress !== void 0 ? /* @__PURE__ */ jsx(Progress, {
				"aria-label": `Uploading ${name}`,
				value: progress,
				size: "sm"
			}) : null,
			onRemove ? /* @__PURE__ */ jsx("button", {
				type: "button",
				className: "hm-file-remove",
				"aria-label": `Remove ${name}`,
				onClick: onRemove,
				children: /* @__PURE__ */ jsx(CloseIcon, {
					size: 12,
					strokeWidth: 1.7
				})
			}) : null
		]
	});
}
//#endregion
export { FileDropzone, FileItem };

//# sourceMappingURL=file-upload.js.map