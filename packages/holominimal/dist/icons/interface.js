import { circle, createIcon, rect } from "./icon.js";
//#region src/icons/interface.tsx
var MenuIcon = createIcon("MenuIcon", { d: [
	"M4 7h16",
	"M4 12h16",
	"M4 17h16"
] });
var CloseIcon = createIcon("CloseIcon", { d: ["M6 6l12 12", "M18 6L6 18"] });
var PlusIcon = createIcon("PlusIcon", { d: ["M12 5v14", "M5 12h14"] });
var MinusIcon = createIcon("MinusIcon", { d: ["M5 12h14"] });
var CheckIcon = createIcon("CheckIcon", { d: ["M5 12.5l4.5 4.5L19 7.5"] });
var ChevronUpIcon = createIcon("ChevronUpIcon", { d: ["M6 14.5l6-6 6 6"] });
var ChevronDownIcon = createIcon("ChevronDownIcon", { d: ["M6 9.5l6 6 6-6"] });
var ChevronLeftIcon = createIcon("ChevronLeftIcon", { d: ["M14.5 6l-6 6 6 6"] });
var ChevronRightIcon = createIcon("ChevronRightIcon", { d: ["M9.5 6l6 6-6 6"] });
var ChevronsUpDownIcon = createIcon("ChevronsUpDownIcon", { d: ["M8 9.5l4-4 4 4", "M8 14.5l4 4 4-4"] });
var ChevronsLeftIcon = createIcon("ChevronsLeftIcon", { d: ["M11 7l-5 5 5 5", "M18 7l-5 5 5 5"] });
var ChevronsRightIcon = createIcon("ChevronsRightIcon", { d: ["M13 7l5 5-5 5", "M6 7l5 5-5 5"] });
var ArrowUpIcon = createIcon("ArrowUpIcon", { d: ["M12 19V5", "M6 11l6-6 6 6"] });
var ArrowDownIcon = createIcon("ArrowDownIcon", { d: ["M12 5v14", "M6 13l6 6 6-6"] });
var ArrowLeftIcon = createIcon("ArrowLeftIcon", { d: ["M19 12H5", "M11 6l-6 6 6 6"] });
var ArrowRightIcon = createIcon("ArrowRightIcon", { d: ["M5 12h14", "M13 6l6 6-6 6"] });
var ArrowUpRightIcon = createIcon("ArrowUpRightIcon", { d: ["M7 17L17 7", "M8 7h9v9"] });
var ArrowUpLeftIcon = createIcon("ArrowUpLeftIcon", { d: ["M17 17L7 7", "M16 7H7v9"] });
var ArrowDownRightIcon = createIcon("ArrowDownRightIcon", { d: ["M7 7l10 10", "M17 8v9H8"] });
var ArrowDownLeftIcon = createIcon("ArrowDownLeftIcon", { d: ["M17 7L7 17", "M7 8v9h9"] });
var ArrowLeftRightIcon = createIcon("ArrowLeftRightIcon", { d: [
	"M4 8h16",
	"M16 4l4 4-4 4",
	"M20 16H4",
	"M8 12l-4 4 4 4"
] });
var ArrowsUpDownIcon = createIcon("ArrowsUpDownIcon", { d: [
	"M8 5v14",
	"M4.5 15.5L8 19l3.5-3.5",
	"M16 19V5",
	"M12.5 8.5L16 5l3.5 3.5"
] });
var CornerDownRightIcon = createIcon("CornerDownRightIcon", { d: ["M5 5v6a3 3 0 0 0 3 3h11", "M15 10l4 4-4 4"] });
var ExternalLinkIcon = createIcon("ExternalLinkIcon", { d: [
	"M14 5h5v5",
	"M19 5l-8 8",
	"M17 14v4a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 5 18V9a1.5 1.5 0 0 1 1.5-1.5H10"
] });
var SearchIcon = createIcon("SearchIcon", { d: [circle(10.5, 10.5, 6), "M15 15l5 5"] });
var ZoomInIcon = createIcon("ZoomInIcon", { d: [
	circle(10.5, 10.5, 6.5),
	"M15.5 15.5l5 5",
	"M10.5 8v5",
	"M8 10.5h5"
] });
var ZoomOutIcon = createIcon("ZoomOutIcon", { d: [
	circle(10.5, 10.5, 6.5),
	"M15.5 15.5l5 5",
	"M8 10.5h5"
] });
var FilterIcon = createIcon("FilterIcon", { d: ["M4 5h16l-6 7.5V19l-4-2v-4.5z"] });
var SlidersIcon = createIcon("SlidersIcon", { d: [
	"M4 8h9",
	"M17 8h3",
	"M4 16h3",
	"M11 16h9",
	circle(15, 8, 2),
	circle(9, 16, 2)
] });
var SortIcon = createIcon("SortIcon", { d: [
	"M8 5v14",
	"M4.5 15.5L8 19l3.5-3.5",
	"M16 19V5",
	"M12.5 8.5L16 5l3.5 3.5"
] });
var SettingsIcon = createIcon("SettingsIcon", { d: ["M10.23 4.92L10.53 2.72L13.47 2.72L13.77 4.92L15.76 5.74L17.53 4.4L19.6 6.47L18.26 8.24L19.08 10.23L21.28 10.53L21.28 13.47L19.08 13.77L18.26 15.76L19.6 17.53L17.53 19.6L15.76 18.26L13.77 19.08L13.47 21.28L10.53 21.28L10.23 19.08L8.24 18.26L6.47 19.6L4.4 17.53L5.74 15.76L4.92 13.77L2.72 13.47L2.72 10.53L4.92 10.23L5.74 8.24L4.4 6.47L6.47 4.4L8.24 5.74z", "M8.9 12a3.1 3.1 0 1 0 6.2 0a3.1 3.1 0 1 0 -6.2 0z"] });
var MoreHorizontalIcon = createIcon("MoreHorizontalIcon", {
	d: [],
	solid: [
		circle(5, 12, 1.5),
		circle(12, 12, 1.5),
		circle(19, 12, 1.5)
	]
});
var MoreVerticalIcon = createIcon("MoreVerticalIcon", {
	d: [],
	solid: [
		circle(12, 5, 1.5),
		circle(12, 12, 1.5),
		circle(12, 19, 1.5)
	]
});
var GripIcon = createIcon("GripIcon", {
	d: [],
	solid: [
		circle(9, 6, 1.3),
		circle(15, 6, 1.3),
		circle(9, 12, 1.3),
		circle(15, 12, 1.3),
		circle(9, 18, 1.3),
		circle(15, 18, 1.3)
	]
});
var HomeIcon = createIcon("HomeIcon", { d: ["M4 11l8-7 8 7", "M6 9.5V19.5h4v-5h4v5h4V9.5"] });
var GridIcon = createIcon("GridIcon", { d: [
	rect(4, 4, 6.5, 6.5, 1.5),
	rect(13.5, 4, 6.5, 6.5, 1.5),
	rect(4, 13.5, 6.5, 6.5, 1.5),
	rect(13.5, 13.5, 6.5, 6.5, 1.5)
] });
var ListIcon = createIcon("ListIcon", {
	d: [
		"M9 7h11",
		"M9 12h11",
		"M9 17h11"
	],
	solid: [
		circle(4.8, 7, 1.2),
		circle(4.8, 12, 1.2),
		circle(4.8, 17, 1.2)
	]
});
var ColumnsIcon = createIcon("ColumnsIcon", { d: [rect(3.5, 4.5, 17, 15, 2), "M10 4.5v15"] });
var PanelLeftIcon = createIcon("PanelLeftIcon", { d: [rect(3.5, 4.5, 17, 15, 2), "M9.5 4.5v15"] });
var PanelRightIcon = createIcon("PanelRightIcon", { d: [rect(3.5, 4.5, 17, 15, 2), "M14.5 4.5v15"] });
var PanelBottomIcon = createIcon("PanelBottomIcon", { d: [rect(3.5, 4.5, 17, 15, 2), "M3.5 14.5h17"] });
var LayoutDashboardIcon = createIcon("LayoutDashboardIcon", { d: [
	rect(3.5, 3.5, 7.5, 9, 1.5),
	rect(13, 3.5, 7.5, 5, 1.5),
	rect(13, 11.5, 7.5, 9, 1.5),
	rect(3.5, 15.5, 7.5, 5, 1.5)
] });
var MaximizeIcon = createIcon("MaximizeIcon", { d: [
	"M4 9V4h5",
	"M20 9V4h-5",
	"M4 15v5h5",
	"M20 15v5h-5"
] });
var MinimizeIcon = createIcon("MinimizeIcon", { d: [
	"M9 4v5H4",
	"M15 4v5h5",
	"M9 20v-5H4",
	"M15 20v-5h5"
] });
var ExpandIcon = createIcon("ExpandIcon", { d: [
	"M14 4h6v6",
	"M20 4l-7 7",
	"M10 20H4v-6",
	"M4 20l7-7"
] });
var CropIcon = createIcon("CropIcon", { d: ["M7 3.5v13.5h13.5", "M3.5 7H17v13.5"] });
var MoveIcon = createIcon("MoveIcon", { d: [
	"M12 3v18",
	"M3 12h18",
	"M9 6l3-3 3 3",
	"M9 18l3 3 3-3",
	"M6 9l-3 3 3 3",
	"M18 9l3 3-3 3"
] });
var PointerIcon = createIcon("PointerIcon", { d: ["M5.5 4l13.5 6-5.6 2L11 18.5z", "M13.5 13.5l4.5 5"] });
var PowerIcon = createIcon("PowerIcon", { d: ["M12 3.5v8", "M7 6.5a7.5 7.5 0 1 0 10 0"] });
var RefreshIcon = createIcon("RefreshIcon", { d: [
	"M19.5 12a7.5 7.5 0 0 1-13.2 4.9",
	"M4.5 12a7.5 7.5 0 0 1 13.2-4.9",
	"M18 3.5v4h-4",
	"M6 20.5v-4h4"
] });
var RotateCwIcon = createIcon("RotateCwIcon", { d: ["M19.5 12a7.5 7.5 0 1 1-2.2-5.3", "M19.5 4.5v4h-4"] });
var RotateCcwIcon = createIcon("RotateCcwIcon", { d: ["M4.5 12a7.5 7.5 0 1 0 2.2-5.3", "M4.5 4.5v4h4"] });
var UndoIcon = createIcon("UndoIcon", { d: ["M9 7L4.5 11.5 9 16", "M4.5 11.5H15a4.5 4.5 0 0 1 0 9h-3"] });
var RedoIcon = createIcon("RedoIcon", { d: ["M15 7l4.5 4.5L15 16", "M19.5 11.5H9a4.5 4.5 0 0 0 0 9h3"] });
var LoaderIcon = createIcon("LoaderIcon", {
	faint: [circle(12, 12, 8.5)],
	d: ["M12 3.5a8.5 8.5 0 0 1 8.5 8.5"]
});
var ToggleLeftIcon = createIcon("ToggleLeftIcon", { d: [rect(2.5, 7, 19, 10, 5), circle(8, 12, 2.8)] });
var ToggleRightIcon = createIcon("ToggleRightIcon", { d: [rect(2.5, 7, 19, 10, 5), circle(16, 12, 2.8)] });
var SquareIcon = createIcon("SquareIcon", { d: [rect(4, 4, 16, 16, 3)] });
var CheckSquareIcon = createIcon("CheckSquareIcon", { d: [rect(4, 4, 16, 16, 3), "M8.5 12.2l2.5 2.5 4.5-5"] });
var CircleIcon = createIcon("CircleIcon", { d: [circle(12, 12, 8.5)] });
var CheckCircleIcon = createIcon("CheckCircleIcon", { d: [circle(12, 12, 8.5), "M8.5 12.5l2.5 2.5 4.5-5"] });
var XCircleIcon = createIcon("XCircleIcon", { d: [
	circle(12, 12, 8.5),
	"M9 9l6 6",
	"M15 9l-6 6"
] });
var PlusCircleIcon = createIcon("PlusCircleIcon", { d: [
	circle(12, 12, 8.5),
	"M12 8v8",
	"M8 12h8"
] });
var MinusCircleIcon = createIcon("MinusCircleIcon", { d: [circle(12, 12, 8.5), "M8 12h8"] });
var InfoIcon = createIcon("InfoIcon", {
	d: [circle(12, 12, 8.5), "M12 11v5.5"],
	solid: [circle(12, 7.9, 1.1)]
});
var HelpIcon = createIcon("HelpIcon", {
	d: [circle(12, 12, 8.5), "M9.5 9.6a2.5 2.5 0 1 1 3.6 2.2c-.7.4-1.1.9-1.1 1.8"],
	solid: [circle(12, 16.8, 1.1)]
});
var AlertTriangleIcon = createIcon("AlertTriangleIcon", {
	d: ["M12 4l9 15.5H3z", "M12 10v4.5"],
	solid: [circle(12, 17.2, 1.1)]
});
var AlertCircleIcon = createIcon("AlertCircleIcon", {
	d: [circle(12, 12, 8.5), "M12 7.5v5"],
	solid: [circle(12, 16.2, 1.1)]
});
var BanIcon = createIcon("BanIcon", { d: [circle(12, 12, 8.5), "M6 6l12 12"] });
var LinkIcon = createIcon("LinkIcon", { d: ["M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1", "M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"] });
var UnlinkIcon = createIcon("UnlinkIcon", { d: [
	"M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1",
	"M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1",
	"M4 4l3 3",
	"M17 17l3 3"
] });
var CopyIcon = createIcon("CopyIcon", { d: [rect(8.5, 8.5, 11, 11, 2), "M15.5 8.5V6.5a2 2 0 0 0-2-2h-7a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h2"] });
var ClipboardIcon = createIcon("ClipboardIcon", { d: [rect(5.5, 5, 13, 15.5, 2), rect(9, 3, 6, 4, 1.2)] });
var DownloadIcon = createIcon("DownloadIcon", { d: [
	"M12 4v11",
	"M7 10.5l5 5 5-5",
	"M5 19.5h14"
] });
var UploadIcon = createIcon("UploadIcon", { d: [
	"M12 15V4",
	"M7 8.5l5-5 5 5",
	"M5 19.5h14"
] });
var ShareIcon = createIcon("ShareIcon", { d: [
	"M12 15V4",
	"M8 7.5l4-4 4 4",
	"M6 12v6.5A1.5 1.5 0 0 0 7.5 20h9a1.5 1.5 0 0 0 1.5-1.5V12"
] });
var TrashIcon = createIcon("TrashIcon", { d: [
	"M4.5 7h15",
	"M9.5 7V4.5h5V7",
	"M6.5 7l.8 12a1.5 1.5 0 0 0 1.5 1.4h6.4a1.5 1.5 0 0 0 1.5-1.4L17.5 7",
	"M10 11v6",
	"M14 11v6"
] });
var EditIcon = createIcon("EditIcon", { d: ["M4 20l1-4L16.5 4.5a2.1 2.1 0 0 1 3 3L8 19z", "M14.5 6.5l3 3"] });
var SaveIcon = createIcon("SaveIcon", { d: [
	"M6 4h10.5L20 7.5V18a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
	"M8 4v5h7V4",
	"M8 20v-6h8v6"
] });
var EyeIcon = createIcon("EyeIcon", { d: ["M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z", circle(12, 12, 3)] });
var EyeOffIcon = createIcon("EyeOffIcon", { d: [
	"M10.6 5.6A9 9 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-2.6 3.4",
	"M6.5 7.5A15.7 15.7 0 0 0 2.5 12S6 18.5 12 18.5a9 9 0 0 0 4-1",
	"M9.9 9.9a3 3 0 0 0 4.2 4.2",
	"M4 4l16 16"
] });
var LockIcon = createIcon("LockIcon", {
	d: [rect(5, 10.5, 14, 10, 2), "M8 10.5V8a4 4 0 0 1 8 0v2.5"],
	solid: [circle(12, 15.5, 1.2)]
});
var UnlockIcon = createIcon("UnlockIcon", {
	d: [rect(5, 10.5, 14, 10, 2), "M8 10.5V8a4 4 0 0 1 7.5-1.9"],
	solid: [circle(12, 15.5, 1.2)]
});
var KeyIcon = createIcon("KeyIcon", { d: [
	circle(8, 15, 4),
	"M11 12l8.5-8.5",
	"M16 7l2.5 2.5",
	"M13.5 9.5L16 12"
] });
var ShieldIcon = createIcon("ShieldIcon", { d: ["M12 3.5l7 2.5v5.5c0 4.3-2.9 7.7-7 9-4.1-1.3-7-4.7-7-9V6z"] });
var ShieldCheckIcon = createIcon("ShieldCheckIcon", { d: ["M12 3.5l7 2.5v5.5c0 4.3-2.9 7.7-7 9-4.1-1.3-7-4.7-7-9V6z", "M9 12l2.2 2.2L15 10"] });
var BellIcon = createIcon("BellIcon", { d: ["M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2h-15z", "M10 20.5a2 2 0 0 0 4 0"] });
var BellOffIcon = createIcon("BellOffIcon", { d: [
	"M8.2 5.2A6 6 0 0 1 18 11v4",
	"M6 11v5.5l-1.5 2H16",
	"M10 20.5a2 2 0 0 0 4 0",
	"M4 4l16 16"
] });
var BookmarkIcon = createIcon("BookmarkIcon", { d: ["M6.5 4h11v16.5L12 16.5 6.5 20.5z"] });
var StarIcon = createIcon("StarIcon", { d: ["M12 3.8l2.5 5.2 5.7.8-4.1 4 1 5.7L12 16.8l-5.1 2.7 1-5.7-4.1-4 5.7-.8z"] });
var HeartIcon = createIcon("HeartIcon", { d: ["M12 20s-7.5-4.6-7.5-10A4.3 4.3 0 0 1 12 7.4 4.3 4.3 0 0 1 19.5 10c0 5.4-7.5 10-7.5 10z"] });
var ThumbsUpIcon = createIcon("ThumbsUpIcon", { d: ["M8 11v9H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z", "M8 11l3.5-7a2.2 2.2 0 0 1 2.3 2.7L13 9.5h5.3a2 2 0 0 1 2 2.4l-1.3 6.6a2 2 0 0 1-2 1.5H8"] });
var ThumbsDownIcon = createIcon("ThumbsDownIcon", {
	d: ["M8 11v9H5a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1z", "M8 11l3.5-7a2.2 2.2 0 0 1 2.3 2.7L13 9.5h5.3a2 2 0 0 1 2 2.4l-1.3 6.6a2 2 0 0 1-2 1.5H8"],
	flipY: true
});
var FlagIcon = createIcon("FlagIcon", { d: ["M5.5 21V4", "M5.5 4.5h12l-2.5 4 2.5 4h-12"] });
var PinIcon = createIcon("PinIcon", { d: ["M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z", circle(12, 10, 2.4)] });
var TagIcon = createIcon("TagIcon", {
	d: ["M3.5 12.5V4.5a1 1 0 0 1 1-1h8l8 8a1.5 1.5 0 0 1 0 2.1l-6.9 6.9a1.5 1.5 0 0 1-2.1 0z"],
	solid: [circle(8, 8, 1.3)]
});
var HashIcon = createIcon("HashIcon", { d: [
	"M9 4L7.5 20",
	"M16.5 4L15 20",
	"M4.5 9h15.5",
	"M4 15h15.5"
] });
var AtSignIcon = createIcon("AtSignIcon", { d: [circle(12, 12, 3.5), "M15.5 12v1.5a2.5 2.5 0 0 0 5 0V12a8.5 8.5 0 1 0-3.4 6.8"] });
var CalendarIcon = createIcon("CalendarIcon", { d: [
	rect(3.5, 5, 17, 15.5, 2),
	"M3.5 10h17",
	"M8 3v4",
	"M16 3v4"
] });
var ClockIcon = createIcon("ClockIcon", { d: [circle(12, 12, 8.5), "M12 7.5V12l3 2"] });
var HistoryIcon = createIcon("HistoryIcon", { d: [
	"M3.5 12a8.5 8.5 0 1 0 2.5-6",
	"M3.5 4.5V9H8",
	"M12 7.5V12l3 2"
] });
var TimerIcon = createIcon("TimerIcon", { d: [
	circle(12, 13.5, 7.5),
	"M12 13.5V9.5",
	"M9.5 3h5",
	"M12 3v3"
] });
var HourglassIcon = createIcon("HourglassIcon", { d: [
	"M6.5 3.5h11",
	"M6.5 20.5h11",
	"M7.5 3.5c0 4 4.5 5 4.5 8.5s-4.5 4.5-4.5 8.5",
	"M16.5 3.5c0 4-4.5 5-4.5 8.5s4.5 4.5 4.5 8.5"
] });
var SunIcon = createIcon("SunIcon", { d: [
	circle(12, 12, 4),
	"M12 3v2",
	"M12 19v2",
	"M3 12h2",
	"M19 12h2",
	"M5.6 5.6L7 7",
	"M17 17l1.4 1.4",
	"M18.4 5.6L17 7",
	"M7 17l-1.4 1.4"
] });
var MoonIcon = createIcon("MoonIcon", { d: ["M20 14.5A8.5 8.5 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"] });
var SunriseIcon = createIcon("SunriseIcon", { d: [
	"M6.5 17a5.5 5.5 0 0 1 11 0",
	"M12 6v3",
	"M4 13l1.5 1",
	"M20 13l-1.5 1",
	"M2.5 17h19",
	"M8 21h8",
	"M9.5 8l2.5-2.5L14.5 8"
] });
var SunsetIcon = createIcon("SunsetIcon", { d: [
	"M6.5 17a5.5 5.5 0 0 1 11 0",
	"M12 6v3",
	"M4 13l1.5 1",
	"M20 13l-1.5 1",
	"M2.5 17h19",
	"M8 21h8",
	"M9.5 5.5L12 8l2.5-2.5"
] });
var SparklesIcon = createIcon("SparklesIcon", { d: [
	"M12 4l1.8 4.7L18.5 10.5l-4.7 1.8L12 17l-1.8-4.7L5.5 10.5l4.7-1.8z",
	"M18.5 4v3",
	"M17 5.5h3",
	"M5.5 17v3",
	"M4 18.5h3"
] });
var ZapIcon = createIcon("ZapIcon", { d: ["M13 3.5L5.5 13.5H12l-1 7 7.5-10H12z"] });
var FlameIcon = createIcon("FlameIcon", { d: ["M12 3.5c1 3 4.5 5 4.5 9.5a4.5 4.5 0 0 1-9 0c0-2 1-3 2-4 .3 1.2 1 1.8 1.8 2 .2-2.6-.3-5.3.7-7.5z"] });
var DropletIcon = createIcon("DropletIcon", { d: ["M12 3.5s6 6.2 6 10.5a6 6 0 0 1-12 0c0-4.3 6-10.5 6-10.5z"] });
var LeafIcon = createIcon("LeafIcon", { d: ["M5 19c0-8 5-14 15-14 0 10-6 15-14 15", "M5 19c2-4 5-7 9-9"] });
var CloudIcon = createIcon("CloudIcon", { d: ["M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9z"] });
var CloudUploadIcon = createIcon("CloudUploadIcon", { d: [
	"M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9",
	"M12 20v-7",
	"M9 15.5l3-3 3 3"
] });
var CloudDownloadIcon = createIcon("CloudDownloadIcon", { d: [
	"M7 18.5a4.5 4.5 0 0 1-.6-8.96A6 6 0 0 1 18 9.5a4.5 4.5 0 0 1-.5 9",
	"M12 12v8",
	"M9 17.5l3 3 3-3"
] });
var LogInIcon = createIcon("LogInIcon", { d: [
	"M14 4.5h4.5A1.5 1.5 0 0 1 20 6v12a1.5 1.5 0 0 1-1.5 1.5H14",
	"M10 8l4 4-4 4",
	"M14 12H4"
] });
var LogOutIcon = createIcon("LogOutIcon", { d: [
	"M10 4.5H5.5A1.5 1.5 0 0 0 4 6v12a1.5 1.5 0 0 0 1.5 1.5H10",
	"M16 8l4 4-4 4",
	"M20 12H10"
] });
var SmileIcon = createIcon("SmileIcon", {
	d: [circle(12, 12, 8.5), "M8.5 14a4.2 4.2 0 0 0 7 0"],
	solid: [circle(9.2, 10, 1), circle(14.8, 10, 1)]
});
var MehIcon = createIcon("MehIcon", {
	d: [circle(12, 12, 8.5), "M8.5 15h7"],
	solid: [circle(9.2, 10, 1), circle(14.8, 10, 1)]
});
var FrownIcon = createIcon("FrownIcon", {
	d: [circle(12, 12, 8.5), "M8.5 16a4.2 4.2 0 0 1 7 0"],
	solid: [circle(9.2, 10, 1), circle(14.8, 10, 1)]
});
//#endregion
export { AlertCircleIcon, AlertTriangleIcon, ArrowDownIcon, ArrowDownLeftIcon, ArrowDownRightIcon, ArrowLeftIcon, ArrowLeftRightIcon, ArrowRightIcon, ArrowUpIcon, ArrowUpLeftIcon, ArrowUpRightIcon, ArrowsUpDownIcon, AtSignIcon, BanIcon, BellIcon, BellOffIcon, BookmarkIcon, CalendarIcon, CheckCircleIcon, CheckIcon, CheckSquareIcon, ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon, ChevronUpIcon, ChevronsLeftIcon, ChevronsRightIcon, ChevronsUpDownIcon, CircleIcon, ClipboardIcon, ClockIcon, CloseIcon, CloudDownloadIcon, CloudIcon, CloudUploadIcon, ColumnsIcon, CopyIcon, CornerDownRightIcon, CropIcon, DownloadIcon, DropletIcon, EditIcon, ExpandIcon, ExternalLinkIcon, EyeIcon, EyeOffIcon, FilterIcon, FlagIcon, FlameIcon, FrownIcon, GridIcon, GripIcon, HashIcon, HeartIcon, HelpIcon, HistoryIcon, HomeIcon, HourglassIcon, InfoIcon, KeyIcon, LayoutDashboardIcon, LeafIcon, LinkIcon, ListIcon, LoaderIcon, LockIcon, LogInIcon, LogOutIcon, MaximizeIcon, MehIcon, MenuIcon, MinimizeIcon, MinusCircleIcon, MinusIcon, MoonIcon, MoreHorizontalIcon, MoreVerticalIcon, MoveIcon, PanelBottomIcon, PanelLeftIcon, PanelRightIcon, PinIcon, PlusCircleIcon, PlusIcon, PointerIcon, PowerIcon, RedoIcon, RefreshIcon, RotateCcwIcon, RotateCwIcon, SaveIcon, SearchIcon, SettingsIcon, ShareIcon, ShieldCheckIcon, ShieldIcon, SlidersIcon, SmileIcon, SortIcon, SparklesIcon, SquareIcon, StarIcon, SunIcon, SunriseIcon, SunsetIcon, TagIcon, ThumbsDownIcon, ThumbsUpIcon, TimerIcon, ToggleLeftIcon, ToggleRightIcon, TrashIcon, UndoIcon, UnlinkIcon, UnlockIcon, UploadIcon, XCircleIcon, ZapIcon, ZoomInIcon, ZoomOutIcon };

//# sourceMappingURL=interface.js.map