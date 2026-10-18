import { circle, createIcon, rect } from "./icon.js";
//#region src/icons/media.tsx
var ImageIcon = createIcon("ImageIcon", { d: [
	rect(3.5, 4.5, 17, 15, 2),
	circle(9, 10, 1.6),
	"M4 17l5-4.5 3.5 3 3-2.5 4.5 4"
] });
var ImagesIcon = createIcon("ImagesIcon", { d: [
	"M7 4.5h12.5A1.5 1.5 0 0 1 21 6v11",
	rect(3, 7.5, 15, 12.5, 2),
	circle(7.8, 12, 1.4),
	"M3.5 18l4.5-4 3 2.5 2.5-2 4 3.5"
] });
var ImagePlusIcon = createIcon("ImagePlusIcon", { d: [
	"M13 19.5H5.5a2 2 0 0 1-2-2v-11a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2V13",
	circle(9, 10, 1.6),
	"M4 17l5-4.5 3.5 3",
	"M18 15.5v6",
	"M15 18.5h6"
] });
var CameraIcon = createIcon("CameraIcon", { d: ["M4.5 7.5h3L9 5h6l1.5 2.5h3a1 1 0 0 1 1 1v9.5a1 1 0 0 1-1 1h-15a1 1 0 0 1-1-1V8.5a1 1 0 0 1 1-1z", circle(12, 13, 3.6)] });
var VideoIcon = createIcon("VideoIcon", { d: [rect(3, 6.5, 13, 11, 2), "M16 10.5l5-3v9l-5-3"] });
var FilmIcon = createIcon("FilmIcon", { d: [
	rect(4, 4, 16, 16, 2),
	"M4 9h4",
	"M16 9h4",
	"M4 15h4",
	"M16 15h4",
	"M8 4v16",
	"M16 4v16"
] });
var MusicIcon = createIcon("MusicIcon", { d: [
	"M9 18V6l11-2v12",
	circle(6.5, 18, 2.5),
	circle(17.5, 16, 2.5)
] });
var MicIcon = createIcon("MicIcon", { d: [
	rect(9, 3.5, 6, 11, 3),
	"M5.5 11.5a6.5 6.5 0 0 0 13 0",
	"M12 18v3",
	"M9 21h6"
] });
var MicOffIcon = createIcon("MicOffIcon", { d: [
	"M9 6.500a3 3 0 0 1 6 0v5a3 3 0 0 1-6 0z",
	"M5.500 11.500a6.500 6.500 0 0 0 13 0",
	"M12 18v3",
	"M9 21h6",
	"M4 4l16 16"
] });
var VolumeIcon = createIcon("VolumeIcon", { d: [
	"M4 9.5h3.5L12 5.5v13l-4.5-4H4z",
	"M15.5 9a4 4 0 0 1 0 6",
	"M18 6.5a7.5 7.5 0 0 1 0 11"
] });
var VolumeLowIcon = createIcon("VolumeLowIcon", { d: ["M4 9.5h3.5L12 5.5v13l-4.5-4H4z", "M15.5 9a4 4 0 0 1 0 6"] });
var VolumeOffIcon = createIcon("VolumeOffIcon", { d: [
	"M4 9.5h3.5L12 5.5v13l-4.5-4H4z",
	"M16 9.5l5 5",
	"M21 9.5l-5 5"
] });
var PlayIcon = createIcon("PlayIcon", { d: ["M8 5l11 7-11 7z"] });
var PauseIcon = createIcon("PauseIcon", { d: [rect(6.5, 5, 3.5, 14, 1), rect(14, 5, 3.5, 14, 1)] });
var StopIcon = createIcon("StopIcon", { d: [rect(6, 6, 12, 12, 2)] });
var SkipNextIcon = createIcon("SkipNextIcon", { d: ["M6 5l9 7-9 7z", "M18 5v14"] });
var SkipPreviousIcon = createIcon("SkipPreviousIcon", { d: ["M18 5l-9 7 9 7z", "M6 5v14"] });
var RewindIcon = createIcon("RewindIcon", { d: ["M11 6l-8 6 8 6z", "M21 6l-8 6 8 6z"] });
var FastForwardIcon = createIcon("FastForwardIcon", { d: ["M13 6l8 6-8 6z", "M3 6l8 6-8 6z"] });
var RepeatIcon = createIcon("RepeatIcon", { d: [
	"M17 3.5l3.5 3.5L17 10.5",
	"M4 12V10a3 3 0 0 1 3-3h13.5",
	"M7 20.5L3.5 17 7 13.5",
	"M20 12v2a3 3 0 0 1-3 3H3.5"
] });
var ShuffleIcon = createIcon("ShuffleIcon", { d: [
	"M3 7h3.500c2.500 0 4 1.500 5.500 4s3 6 5.500 6H21",
	"M3 17h3.500c1.600 0 2.800-.8 3.800-2.200",
	"M13.600 9.200C14.700 7.800 16 7 17.500 7H21",
	"M18 4l3 3-3 3",
	"M18 14l3 3-3 3"
] });
var ApertureIcon = createIcon("ApertureIcon", { d: [
	"M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0z",
	"M15.12 10.2L15.12 13.8L15.12 20.44",
	"M15.12 13.8L12 15.6L6.25 18.92",
	"M12 15.6L8.88 13.8L3.13 10.48",
	"M8.88 13.8L8.88 10.2L8.88 3.56",
	"M8.88 10.2L12 8.4L17.75 5.08",
	"M12 8.4L15.12 10.2L20.87 13.52"
] });
var FocusIcon = createIcon("FocusIcon", { d: [
	"M4 8V5.5A1.5 1.5 0 0 1 5.5 4H8",
	"M16 4h2.5A1.5 1.5 0 0 1 20 5.5V8",
	"M20 16v2.5a1.5 1.5 0 0 1-1.5 1.5H16",
	"M8 20H5.5A1.5 1.5 0 0 1 4 18.5V16",
	circle(12, 12, 2.5)
] });
var FrameIcon = createIcon("FrameIcon", { d: [rect(4, 4, 16, 16, 1.5), rect(7.5, 7.5, 9, 9, .5)] });
var PrinterIcon = createIcon("PrinterIcon", { d: [
	"M7 9V4h10v5",
	"M7 17H5.5A1.5 1.5 0 0 1 4 15.5v-5A1.5 1.5 0 0 1 5.5 9h13a1.5 1.5 0 0 1 1.5 1.5v5a1.5 1.5 0 0 1-1.5 1.5H17",
	"M7 14h10v6.5H7z"
] });
var SlidersVerticalIcon = createIcon("SlidersVerticalIcon", { d: [
	"M5 4v8",
	"M5 16v4",
	"M12 4v2",
	"M12 10v10",
	"M19 4v6",
	"M19 14v6",
	"M3 14a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z",
	"M10 8a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z",
	"M17 12a2 2 0 1 0 4 0a2 2 0 1 0 -4 0z"
] });
var PaletteIcon = createIcon("PaletteIcon", {
	d: ["M12 3.5a8.5 8.5 0 1 0 0 17c1.4 0 2-1 1.5-2.2-.6-1.3.2-2.5 1.6-2.5H17a3.5 3.5 0 0 0 3.5-3.5c0-4.9-4-8.8-8.5-8.8z"],
	solid: [
		circle(7.8, 11.2, 1.1),
		circle(10.2, 7.6, 1.1),
		circle(14.6, 7.6, 1.1)
	]
});
var BrushIcon = createIcon("BrushIcon", { d: ["M14.5 4.5l5 5-8 8-5-5z", "M6.5 12.5C4 15 5 19 3.5 20.5c3 0 6-.5 7-3.5"] });
var WandIcon = createIcon("WandIcon", {
	d: [],
	solid: [
		"M3.45 18.85l9.7-9.7l1.7 1.7-9.7 9.7z",
		"M18 1.5999999999999996C18.968 5.032 18.968 5.032 22.4 6C18.968 6.968 18.968 6.968 18 10.4C17.032 6.968 17.032 6.968 13.6 6C17.032 5.032 17.032 5.032 18 1.5999999999999996z",
		"M6.5 4.1C6.918 5.582 6.918 5.582 8.4 6C6.918 6.418 6.918 6.418 6.5 7.9C6.082 6.418 6.082 6.418 4.6 6C6.082 5.582 6.082 5.582 6.5 4.1z",
		"M19.5 15.2C19.896 16.604 19.896 16.604 21.3 17C19.896 17.396 19.896 17.396 19.5 18.8C19.104 17.396 19.104 17.396 17.7 17C19.104 16.604 19.104 16.604 19.5 15.2z"
	]
});
var LayersIcon = createIcon("LayersIcon", { d: [
	"M12 3.5l9 4.8-9 4.8-9-4.8z",
	"M3 12.5l9 4.8 9-4.8",
	"M3 16.5l9 4.8 9-4.8"
] });
var SunDimIcon = createIcon("SunDimIcon", { d: [
	circle(12, 12, 3),
	"M12 4v1.5",
	"M12 18.5V20",
	"M4 12h1.5",
	"M18.5 12H20",
	"M6.3 6.3l1 1",
	"M16.7 16.7l1 1",
	"M17.7 6.3l-1 1",
	"M7.3 16.7l-1 1"
] });
var ContrastIcon = createIcon("ContrastIcon", {
	d: ["M3.5 12a8.5 8.5 0 1 0 17 0a8.5 8.5 0 1 0 -17 0z"],
	solid: ["M12 3.5a8.5 8.5 0 0 1 0 17z"]
});
var FlashIcon = createIcon("FlashIcon", { d: ["M13.5 3L6 13.5h5.5L10 21l8-11h-5.5z"] });
var HdrIcon = createIcon("HdrIcon", {
	d: [],
	solid: ["M4.9 4.5h14.2a3.4 3.4 0 0 1 3.4 3.4v8.2a3.4 3.4 0 0 1 -3.4 3.4h-14.2a3.4 3.4 0 0 1 -3.4 -3.4v-8.2a3.4 3.4 0 0 1 3.4 -3.4z"],
	cut: [
		"M5 9.2v5.6",
		"M5 12h3",
		"M8 9.2v5.6",
		"M10.6 9.2h1a2.5 2.8 0 0 1 0 5.6h-1z",
		"M16 14.8V9.2h1.7a1.5 1.5 0 0 1 0 3H16",
		"M17.6 12.2l1.7 2.6"
	],
	cutWidth: 1.3
});
var MegaphoneIcon = createIcon("MegaphoneIcon", { d: [
	"M3 10a1.5 1.5 0 0 1 1.5-1.5H8L16.5 4v16L8 15.5H4.5A1.5 1.5 0 0 1 3 14z",
	"M7.5 15.5l1.2 4a1 1 0 0 0 1 .7h1.4a1 1 0 0 0 1-1.3L11 16.7",
	"M19.5 9a4.5 4.5 0 0 1 0 6"
] });
var RadioIcon = createIcon("RadioIcon", { d: [
	circle(12, 12, 2),
	"M8 8a5.7 5.7 0 0 0 0 8",
	"M16 8a5.7 5.7 0 0 1 0 8",
	"M5 5a10 10 0 0 0 0 14",
	"M19 5a10 10 0 0 1 0 14"
] });
var HeadphonesIcon = createIcon("HeadphonesIcon", { d: [
	"M4 15v-3a8 8 0 0 1 16 0v3",
	rect(3.5, 14, 4, 6.5, 1.5),
	rect(16.5, 14, 4, 6.5, 1.5)
] });
var SlideshowIcon = createIcon("SlideshowIcon", { d: [
	rect(3.5, 5, 17, 11, 2),
	"M12 16v3.5",
	"M8 20h8",
	"M10.5 8.8l4 2.2-4 2.2z"
] });
//#endregion
export { ApertureIcon, BrushIcon, CameraIcon, ContrastIcon, FastForwardIcon, FilmIcon, FlashIcon, FocusIcon, FrameIcon, HdrIcon, HeadphonesIcon, ImageIcon, ImagePlusIcon, ImagesIcon, LayersIcon, MegaphoneIcon, MicIcon, MicOffIcon, MusicIcon, PaletteIcon, PauseIcon, PlayIcon, PrinterIcon, RadioIcon, RepeatIcon, RewindIcon, ShuffleIcon, SkipNextIcon, SkipPreviousIcon, SlidersVerticalIcon, SlideshowIcon, StopIcon, SunDimIcon, VideoIcon, VolumeIcon, VolumeLowIcon, VolumeOffIcon, WandIcon };

//# sourceMappingURL=media.js.map