import { circle, createIcon, rect } from "./icon.js";
//#region src/icons/objects.tsx
var GiftIcon = createIcon("GiftIcon", { d: [
	"M4 11h16v9.5H4z",
	"M3.5 7.5h17V11h-17z",
	"M12 7.5v13",
	"M12 7.5C10.5 4 7 4 7 6s2.5 1.5 5 1.5C14.5 7.5 17 8 17 6s-3.5-2-5 1.5"
] });
var TicketIcon = createIcon("TicketIcon", { d: [
	"M3.5 8A1.5 1.5 0 0 1 5 6.5h14A1.5 1.5 0 0 1 20.5 8v2.2a2 2 0 0 0 0 3.6V16a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 16v-2.2a2 2 0 0 0 0-3.6z",
	"M14 7v2",
	"M14 11v2",
	"M14 15v2"
] });
var CreditCardIcon = createIcon("CreditCardIcon", { d: [
	rect(3, 5.5, 18, 13, 2),
	"M3 10h18",
	"M6.5 14.5h3"
] });
var WalletIcon = createIcon("WalletIcon", {
	d: ["M3.5 7a1.5 1.5 0 0 1 1.5-1.5h12v3", "M3.5 7v11.5A1.5 1.5 0 0 0 5 20h14.5a1 1 0 0 0 1-1V9.5a1 1 0 0 0-1-1H5"],
	solid: [circle(16.5, 14.2, 1.2)]
});
var ReceiptIcon = createIcon("ReceiptIcon", { d: [
	"M6 3.5h12v17l-3-2-3 2-3-2-3 2z",
	"M9 8.5h6",
	"M9 12h6"
] });
var ShoppingCartIcon = createIcon("ShoppingCartIcon", {
	d: ["M3.5 4.5H6l2 10.5h9.5l2-7.5H7"],
	solid: [circle(9.5, 19, 1.4), circle(16.5, 19, 1.4)]
});
var ShoppingBagIcon = createIcon("ShoppingBagIcon", { d: ["M5 8h14l-1 12H6z", "M9 8V6.5a3 3 0 0 1 6 0V8"] });
var DollarIcon = createIcon("DollarIcon", { d: [
	"M12 2.5v2.5",
	"M12 19v2.5",
	"M16.5 8c0-1.7-1.9-3-4.5-3S7.5 6.3 7.5 8.3c0 4.5 9 2.6 9 7.3 0 2-2 3.4-4.5 3.4s-4.5-1.3-4.5-3"
] });
var PercentIcon = createIcon("PercentIcon", { d: [
	"M19 5L5 19",
	circle(7.5, 7.5, 2.5),
	circle(16.5, 16.5, 2.5)
] });
var BarChartIcon = createIcon("BarChartIcon", { d: [
	"M4 20.5h16",
	"M7 20.5V12",
	"M12 20.5V5",
	"M17 20.5v-6.5"
] });
var LineChartIcon = createIcon("LineChartIcon", { d: ["M3.5 4v16.5h17", "M7 15l3.5-4 3 2.5 5-6"] });
var PieChartIcon = createIcon("PieChartIcon", { d: ["M12 3.5a8.5 8.5 0 1 0 8.5 8.5H12z", "M15 3.9A8.5 8.5 0 0 1 20.1 9H15z"] });
var TrendingUpIcon = createIcon("TrendingUpIcon", { d: ["M3.5 16.5l6-6 4 4 7-7.5", "M15 7h5.5v5.5"] });
var TrendingDownIcon = createIcon("TrendingDownIcon", { d: ["M3.5 7.5l6 6 4-4 7 7.5", "M15 17h5.5v-5.5"] });
var ActivityIcon = createIcon("ActivityIcon", { d: ["M3 12h4l2.5-7 5 14 2.5-7h4"] });
var DatabaseIcon = createIcon("DatabaseIcon", { d: [
	"M4.5 6c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3-3.4-3-7.5-3-7.5 1.3-7.5 3z",
	"M4.5 6v12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3V6",
	"M4.5 12c0 1.7 3.4 3 7.5 3s7.5-1.3 7.5-3"
] });
var ServerIcon = createIcon("ServerIcon", {
	d: [rect(3.5, 4, 17, 6.5, 1.8), rect(3.5, 13.5, 17, 6.5, 1.8)],
	solid: [circle(7, 7.2, .9), circle(7, 16.8, .9)]
});
var CodeIcon = createIcon("CodeIcon", { d: [
	"M8.5 7L3.5 12l5 5",
	"M15.5 7l5 5-5 5",
	"M13.5 4.5l-3 15"
] });
var TerminalIcon = createIcon("TerminalIcon", { d: [
	rect(3, 4.5, 18, 15, 2),
	"M7 9.5l3 2.5-3 2.5",
	"M12.5 15H17"
] });
var CpuIcon = createIcon("CpuIcon", { d: [
	rect(7, 7, 10, 10, 1.5),
	"M10 3.5V7",
	"M14 3.5V7",
	"M10 17v3.5",
	"M14 17v3.5",
	"M3.5 10H7",
	"M3.5 14H7",
	"M17 10h3.5",
	"M17 14h3.5"
] });
var WifiIcon = createIcon("WifiIcon", {
	d: [
		"M3 9.5a13 13 0 0 1 18 0",
		"M6 13a8.5 8.5 0 0 1 12 0",
		"M9 16.3a4 4 0 0 1 6 0"
	],
	solid: [circle(12, 19.3, 1.2)]
});
var WifiOffIcon = createIcon("WifiOffIcon", {
	d: [
		"M3 9.500a13 13 0 0 1 18 0",
		"M6 13a8.500 8.500 0 0 1 12 0",
		"M9 16.300a4 4 0 0 1 6 0",
		"M4 4l16 16"
	],
	solid: ["M10.8 19.3a1.2 1.2 0 1 0 2.4 0a1.2 1.2 0 1 0 -2.4 0z"]
});
var BatteryIcon = createIcon("BatteryIcon", {
	d: [rect(3, 8, 15.5, 8, 2), "M21 11v2"],
	solid: [rect(5, 10, 9, 4, .8)]
});
var BatteryChargingIcon = createIcon("BatteryChargingIcon", { d: [
	rect(3, 8, 15.5, 8, 2),
	"M21 11v2",
	"M11 9.5l-2.2 3h3L10.5 15.5"
] });
var SmartphoneIcon = createIcon("SmartphoneIcon", { d: [rect(6.5, 2.5, 11, 19, 2.4), "M10.5 18.5h3"] });
var TabletIcon = createIcon("TabletIcon", { d: [rect(4.5, 3, 15, 18, 2.2), "M11 18h2"] });
var MonitorIcon = createIcon("MonitorIcon", { d: [
	rect(3, 4, 18, 12, 2),
	"M8.5 20.5h7",
	"M12 16v4.5"
] });
var LaptopIcon = createIcon("LaptopIcon", { d: ["M5.5 5.5h13a1 1 0 0 1 1 1V15h-15V6.5a1 1 0 0 1 1-1z", "M2.5 18.5l1.2-3.5h16.6l1.2 3.5z"] });
var KeyboardIcon = createIcon("KeyboardIcon", { d: [
	rect(2.5, 6, 19, 12, 2),
	"M6.5 10h.01",
	"M10 10h.01",
	"M14 10h.01",
	"M17.5 10h.01",
	"M7 14h10"
] });
var MouseIcon = createIcon("MouseIcon", { d: [
	rect(6.5, 3, 11, 18, 5.5),
	"M12 3v6",
	"M6.5 9h11"
] });
var HardDriveIcon = createIcon("HardDriveIcon", {
	d: ["M3.5 13.5l2.4-7.4A1.5 1.5 0 0 1 7.3 5h9.4a1.5 1.5 0 0 1 1.4 1.1l2.4 7.4", rect(3.5, 13.5, 17, 6, 2)],
	solid: [circle(7.5, 16.5, .9)]
});
var CommandIcon = createIcon("CommandIcon", { d: [
	"M9 9h6v6H9z",
	"M9 9V6.5A2.5 2.5 0 1 0 6.5 9H9",
	"M15 9h2.5A2.5 2.5 0 1 0 15 6.5V9",
	"M15 15v2.5a2.5 2.5 0 1 0 2.5-2.5H15",
	"M9 15H6.5A2.5 2.5 0 1 0 9 17.5V15"
] });
var AwardIcon = createIcon("AwardIcon", { d: [
	"M6 9a6 6 0 1 0 12 0a6 6 0 1 0 -12 0z",
	"M9.8 9a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0z",
	"M8.2 14.2L7 21.5l5-2.5 5 2.5-1.2-7.3"
] });
var TrophyIcon = createIcon("TrophyIcon", { d: [
	"M8 4.5h8V10a4 4 0 0 1-8 0z",
	"M8 6.5H4.5a2 2 0 0 0 4 4H8",
	"M16 6.5h3.5a2 2 0 0 1-2 4H16",
	"M12 14v4",
	"M8.5 20.5h7"
] });
var PackageIcon = createIcon("PackageIcon", { d: [
	"M12 3l8 4.5v9L12 21l-8-4.5v-9z",
	"M4 7.5l8 4.5 8-4.5",
	"M12 12v9"
] });
var TruckIcon = createIcon("TruckIcon", { d: [
	"M3 6.5h11v11H3z",
	"M14 10h4.5l2.5 3.5v4H14",
	circle(7.5, 18.5, 2),
	circle(17.5, 18.5, 2)
] });
var ScissorsIcon = createIcon("ScissorsIcon", { d: [
	circle(6.5, 6.5, 2.5),
	circle(6.5, 17.5, 2.5),
	"M8.4 8.2L20 19",
	"M8.4 15.8L20 5"
] });
var RulerIcon = createIcon("RulerIcon", { d: [
	"M3.5 16L16 3.5 20.5 8 8 20.5z",
	"M7 12.5l2 2",
	"M10 9.5l2 2",
	"M13 6.5l2 2"
] });
var WrenchIcon = createIcon("WrenchIcon", { d: ["M14.5 5.5a4.5 4.5 0 0 0-5.7 5.7L3.5 16.5a2.1 2.1 0 0 0 3 3l5.3-5.3a4.5 4.5 0 0 0 5.7-5.7l-2.7 2.7-2.6-.6-.6-2.6z"] });
var LightbulbIcon = createIcon("LightbulbIcon", { d: [
	"M12 2.5a6.5 6.5 0 0 0-3.9 11.7c.9.7 1.4 1.5 1.4 2.5v.3h5v-.3c0-1 .5-1.8 1.4-2.5A6.5 6.5 0 0 0 12 2.5z",
	"M9.5 19.8h5",
	"M10.5 22h3",
	"M10.2 10.3l1.8 1.8 1.8-1.8",
	"M12 12.1v4.6"
] });
var TargetIcon = createIcon("TargetIcon", {
	d: [circle(12, 12, 8.5), circle(12, 12, 4.5)],
	solid: [circle(12, 12, 1)]
});
var CrosshairIcon = createIcon("CrosshairIcon", { d: [
	circle(12, 12, 7.5),
	"M12 2.5v5",
	"M12 16.5v5",
	"M2.5 12h5",
	"M16.5 12h5"
] });
var QrCodeIcon = createIcon("QrCodeIcon", {
	d: [
		"M5.5 3.5h3a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-3a2 2 0 0 1 -2 -2v-3a2 2 0 0 1 2 -2z",
		"M15.5 3.5h3a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-3a2 2 0 0 1 -2 -2v-3a2 2 0 0 1 2 -2z",
		"M5.5 13.5h3a2 2 0 0 1 2 2v3a2 2 0 0 1 -2 2h-3a2 2 0 0 1 -2 -2v-3a2 2 0 0 1 2 -2z"
	],
	solid: [
		"M6.5 5.9h1.0000000000000002a0.6 0.6 0 0 1 0.6 0.6v1.0000000000000002a0.6 0.6 0 0 1 -0.6 0.6h-1.0000000000000002a0.6 0.6 0 0 1 -0.6 -0.6v-1.0000000000000002a0.6 0.6 0 0 1 0.6 -0.6z",
		"M16.5 5.9h1.0000000000000002a0.6 0.6 0 0 1 0.6 0.6v1.0000000000000002a0.6 0.6 0 0 1 -0.6 0.6h-1.0000000000000002a0.6 0.6 0 0 1 -0.6 -0.6v-1.0000000000000002a0.6 0.6 0 0 1 0.6 -0.6z",
		"M6.5 15.9h1.0000000000000002a0.6 0.6 0 0 1 0.6 0.6v1.0000000000000002a0.6 0.6 0 0 1 -0.6 0.6h-1.0000000000000002a0.6 0.6 0 0 1 -0.6 -0.6v-1.0000000000000002a0.6 0.6 0 0 1 0.6 -0.6z",
		"M14.3 13.5h1.1999999999999997a0.8 0.8 0 0 1 0.8 0.8v1.1999999999999997a0.8 0.8 0 0 1 -0.8 0.8h-1.1999999999999997a0.8 0.8 0 0 1 -0.8 -0.8v-1.1999999999999997a0.8 0.8 0 0 1 0.8 -0.8z",
		"M18.5 13.5h1.1999999999999997a0.8 0.8 0 0 1 0.8 0.8v1.1999999999999997a0.8 0.8 0 0 1 -0.8 0.8h-1.1999999999999997a0.8 0.8 0 0 1 -0.8 -0.8v-1.1999999999999997a0.8 0.8 0 0 1 0.8 -0.8z",
		"M18.5 17.7h1.1999999999999997a0.8 0.8 0 0 1 0.8 0.8v1.1999999999999997a0.8 0.8 0 0 1 -0.8 0.8h-1.1999999999999997a0.8 0.8 0 0 1 -0.8 -0.8v-1.1999999999999997a0.8 0.8 0 0 1 0.8 -0.8z"
	]
});
var CoffeeIcon = createIcon("CoffeeIcon", { d: [
	"M5 8.5h11v6a5 5 0 0 1-5 5H10a5 5 0 0 1-5-5z",
	"M16 10h1.5a2.5 2.5 0 0 1 0 5H16",
	"M8 3.5v2.5",
	"M11 3.5v2.5",
	"M14 3.5v2.5"
] });
var AnchorIcon = createIcon("AnchorIcon", {
	d: [
		"M9.8 4.8a2.2 2.2 0 1 0 4.4 0a2.2 2.2 0 1 0 -4.4 0z",
		"M12 7v14.500",
		"M8.500 10.500h7",
		"M4 13.500c.5 4.200 3.700 8 8 8s7.500-3.800 8-8"
	],
	solid: ["M1.800 14l2.200-3.800L6.200 14z", "M17.800 14l2.200-3.800L22.200 14z"]
});
var RocketIcon = createIcon("RocketIcon", { d: [
	"M12 2.5c3 2.4 4.5 5.4 4.5 9.2V16h-9v-4.3c0-3.8 1.5-6.8 4.5-9.2z",
	"M10.3 9.5a1.7 1.7 0 1 0 3.4 0a1.7 1.7 0 1 0 -3.4 0z",
	"M7.5 12.5l-3 3v3.5l3-1.5",
	"M16.5 12.5l3 3v3.5l-3-1.5",
	"M10 19c.3 1.6.9 2.5 2 3.3 1.1-.8 1.7-1.7 2-3.3"
] });
var GamepadIcon = createIcon("GamepadIcon", {
	d: [
		"M7 6.5h10a5 5 0 0 1 4.9 4l.9 4.8a3 3 0 0 1-5.2 2.5L15 15.5H9L6.4 17.8a3 3 0 0 1-5.2-2.5l.9-4.8A5 5 0 0 1 7 6.5z",
		"M7.5 9v4",
		"M5.5 11h4"
	],
	solid: ["M14.9 10.2a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0z", "M17.2 12.5a1.1 1.1 0 1 0 2.2 0a1.1 1.1 0 1 0 -2.2 0z"]
});
var BugIcon = createIcon("BugIcon", { d: [
	"M8.5 8.5a3.5 3.5 0 0 1 7 0v1",
	"M7.5 9.5h9v5a4.5 4.5 0 0 1-9 0z",
	"M12 9.5v10",
	"M3.5 12.5h4",
	"M16.5 12.5h4",
	"M4.5 18l3-2",
	"M19.5 18l-3-2",
	"M4.5 7l3 2",
	"M19.5 7l-3 2"
] });
var BoldIcon = createIcon("BoldIcon", { d: ["M7 4.5h6a3.5 3.5 0 0 1 0 7H7z", "M7 11.5h7a3.5 3.5 0 0 1 0 7H7z"] });
var ItalicIcon = createIcon("ItalicIcon", { d: [
	"M10 4.5h8",
	"M6 19.5h8",
	"M15 4.5L9 19.5"
] });
var UnderlineIcon = createIcon("UnderlineIcon", { d: ["M7 4.5v7a5 5 0 0 0 10 0v-7", "M5 20.5h14"] });
var StrikethroughIcon = createIcon("StrikethroughIcon", { d: [
	"M3.5 12h17",
	"M7 6.500V5h10v1.500",
	"M12 5v3.500",
	"M12 15.500V19",
	"M9.500 19h5"
] });
var AlignLeftIcon = createIcon("AlignLeftIcon", { d: [
	"M4 6h16",
	"M4 10.5h10",
	"M4 15h16",
	"M4 19.5h10"
] });
var AlignCenterIcon = createIcon("AlignCenterIcon", { d: [
	"M4 6h16",
	"M7 10.5h10",
	"M4 15h16",
	"M7 19.5h10"
] });
var AlignRightIcon = createIcon("AlignRightIcon", { d: [
	"M4 6h16",
	"M10 10.5h10",
	"M4 15h16",
	"M10 19.5h10"
] });
var ListOrderedIcon = createIcon("ListOrderedIcon", { d: [
	"M10 6h10",
	"M10 12h10",
	"M10 18h10",
	"M4.5 5l1.5-1v4",
	"M4 14.5a1.5 1.5 0 0 1 3 0c0 1-3 2.5-3 3.5h3"
] });
var QuoteIcon = createIcon("QuoteIcon", { d: [
	"M5 17.5V12a4 4 0 0 1 4-4",
	"M5 12h4.5v5.5H5z",
	"M14 17.5V12a4 4 0 0 1 4-4",
	"M14 12h4.5v5.5H14z"
] });
var TypeIcon = createIcon("TypeIcon", { d: [
	"M5 7V5h14v2",
	"M12 5v14",
	"M9 19h6"
] });
var HeadingIcon = createIcon("HeadingIcon", { d: [
	"M6 4.5v15",
	"M18 4.5v15",
	"M6 12h12"
] });
var PilcrowIcon = createIcon("PilcrowIcon", { d: [
	"M13 20.5v-16",
	"M17 4.5v16",
	"M17 4.5h-5.5a4.5 4.5 0 0 0 0 9H13"
] });
var SigmaIcon = createIcon("SigmaIcon", { d: ["M18 5.5H6.5l6 6.5-6 6.5H18"] });
var InfinityIcon = createIcon("InfinityIcon", { d: ["M12 12c-2-2.8-3.7-4.5-6-4.5a4.5 4.5 0 0 0 0 9c2.3 0 4-1.7 6-4.5s3.7-4.5 6-4.5a4.5 4.5 0 0 1 0 9c-2.3 0-4-1.7-6-4.5z"] });
var FingerprintIcon = createIcon("FingerprintIcon", { d: [
	"M4 12.5v-1.5a8 8 0 0 1 16 0v1",
	"M6.5 18v-7a5.5 5.5 0 0 1 11 0v3.5c0 2-.4 3.8-1.2 5.5",
	"M9 20v-9a3 3 0 0 1 6 0v4c0 1.5-.3 3-.9 4.2",
	"M12 11.5v3.5c0 1.5-.2 2.8-.6 4",
	"M20 15c0 2-.3 3.5-.9 5",
	"M4 15c0 1.5.2 2.8.6 4"
] });
var HandIcon = createIcon("HandIcon", { d: [
	"M8 12.5V6a1.5 1.5 0 0 1 3 0v5",
	"M11 11V4.5a1.5 1.5 0 0 1 3 0V11",
	"M14 11V6a1.5 1.5 0 0 1 3 0v6",
	"M17 12v-1a1.5 1.5 0 0 1 3 0v4.5a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.4-1.9L4.5 15.5a1.6 1.6 0 0 1 2.3-2.2L8 14.5"
] });
//#endregion
export { ActivityIcon, AlignCenterIcon, AlignLeftIcon, AlignRightIcon, AnchorIcon, AwardIcon, BarChartIcon, BatteryChargingIcon, BatteryIcon, BoldIcon, BugIcon, CodeIcon, CoffeeIcon, CommandIcon, CpuIcon, CreditCardIcon, CrosshairIcon, DatabaseIcon, DollarIcon, FingerprintIcon, GamepadIcon, GiftIcon, HandIcon, HardDriveIcon, HeadingIcon, InfinityIcon, ItalicIcon, KeyboardIcon, LaptopIcon, LightbulbIcon, LineChartIcon, ListOrderedIcon, MonitorIcon, MouseIcon, PackageIcon, PercentIcon, PieChartIcon, PilcrowIcon, QrCodeIcon, QuoteIcon, ReceiptIcon, RocketIcon, RulerIcon, ScissorsIcon, ServerIcon, ShoppingBagIcon, ShoppingCartIcon, SigmaIcon, SmartphoneIcon, StrikethroughIcon, TabletIcon, TargetIcon, TerminalIcon, TicketIcon, TrendingDownIcon, TrendingUpIcon, TrophyIcon, TruckIcon, TypeIcon, UnderlineIcon, WalletIcon, WifiIcon, WifiOffIcon, WrenchIcon };

//# sourceMappingURL=objects.js.map