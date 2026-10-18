import { circle, createIcon, rect } from "./icon.js";
//#region src/icons/communication.tsx
var UserIcon = createIcon("UserIcon", { d: [circle(12, 8, 3.8), "M4.5 20.5a7.5 7.5 0 0 1 15 0"] });
var UsersIcon = createIcon("UsersIcon", { d: [
	circle(9, 8.5, 3.3),
	"M2.8 19.5a6.2 6.2 0 0 1 12.4 0",
	"M15.5 5.5a3.3 3.3 0 0 1 0 6.2",
	"M17 14a6 6 0 0 1 4.2 5.5"
] });
var UserPlusIcon = createIcon("UserPlusIcon", { d: [
	circle(10, 8, 3.6),
	"M3.5 20a6.5 6.5 0 0 1 13 0",
	"M19 8v6",
	"M16 11h6"
] });
var UserCheckIcon = createIcon("UserCheckIcon", { d: [
	circle(10, 8, 3.6),
	"M3.5 20a6.5 6.5 0 0 1 13 0",
	"M16 11.5l2 2 3.5-4"
] });
var UserCircleIcon = createIcon("UserCircleIcon", { d: [
	circle(12, 12, 9),
	circle(12, 10, 3),
	"M6 18.5a7 7 0 0 1 12 0"
] });
var MailIcon = createIcon("MailIcon", { d: [rect(3, 5.5, 18, 13, 2), "M3.5 7l8.5 6 8.5-6"] });
var PhoneIcon = createIcon("PhoneIcon", { d: ["M5.5 4h3l1.8 4.5-2 1.3a10 10 0 0 0 4.9 4.9l1.3-2 4.5 1.8v3a2 2 0 0 1-2 2A14.5 14.5 0 0 1 3.5 6a2 2 0 0 1 2-2z"] });
var MessageSquareIcon = createIcon("MessageSquareIcon", { d: ["M4.5 5h15a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H10l-4.5 3.5V17h-1a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1z"] });
var MessageCircleIcon = createIcon("MessageCircleIcon", { d: ["M12 3.5a8.5 8.5 0 1 1-4 16l-4.5 1 1-4.2A8.5 8.5 0 0 1 12 3.5z"] });
var SendIcon = createIcon("SendIcon", { d: ["M20.5 3.5L10 14", "M20.5 3.5l-6.5 17-4-6.5-6.5-4z"] });
var InboxIcon = createIcon("InboxIcon", { d: ["M3.5 13l2.5-8h12l2.5 8v5.5a1.5 1.5 0 0 1-1.5 1.5h-14a1.5 1.5 0 0 1-1.5-1.5z", "M3.5 13h5l1 2.5h5l1-2.5h5"] });
var ArchiveIcon = createIcon("ArchiveIcon", { d: [
	rect(3.5, 4, 17, 4.5, 1.2),
	"M5 8.5V18a1.5 1.5 0 0 0 1.5 1.5h11A1.5 1.5 0 0 0 19 18V8.5",
	"M10 12.5h4"
] });
var FolderIcon = createIcon("FolderIcon", { d: ["M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z"] });
var FolderOpenIcon = createIcon("FolderOpenIcon", { d: ["M3.5 18.5V6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h7A1.5 1.5 0 0 1 19.5 9v1.5", "M3.5 18.5l2.6-7.2a1.5 1.5 0 0 1 1.4-.8h13.2a1 1 0 0 1 .95 1.3L19.5 18a1.5 1.5 0 0 1-1.4 1H5a1.5 1.5 0 0 1-1.5-.5z"] });
var FolderPlusIcon = createIcon("FolderPlusIcon", { d: [
	"M3.5 6.5A1.5 1.5 0 0 1 5 5h4l2 2.5h8a1.5 1.5 0 0 1 1.5 1.5v9a1.5 1.5 0 0 1-1.5 1.5H5A1.5 1.5 0 0 1 3.5 18z",
	"M12 11.5v5",
	"M9.5 14h5"
] });
var FileIcon = createIcon("FileIcon", { d: ["M6.5 3.5h7L19 9v10.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z", "M13.5 3.5V9H19"] });
var FileTextIcon = createIcon("FileTextIcon", { d: [
	"M6.5 3.5h7L19 9v10.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z",
	"M13.5 3.5V9H19",
	"M8.5 13h7",
	"M8.5 16.5h7",
	"M8.5 9.5H11"
] });
var FilePlusIcon = createIcon("FilePlusIcon", { d: [
	"M6.5 3.5h7L19 9v10.5a1 1 0 0 1-1 1H6.5a1 1 0 0 1-1-1V4.5a1 1 0 0 1 1-1z",
	"M13.5 3.5V9H19",
	"M12 12.5v5",
	"M9.5 15h5"
] });
var PaperclipIcon = createIcon("PaperclipIcon", { d: ["M20 11l-8 8a5 5 0 0 1-7-7l8.5-8.5a3.3 3.3 0 0 1 4.7 4.7L9.5 16.5a1.7 1.7 0 0 1-2.4-2.4L15 6.2"] });
var MapIcon = createIcon("MapIcon", { d: [
	"M3.5 6.5l5.5-2.5 6 2.5 5.5-2.5v13l-5.5 2.5-6-2.5-5.5 2.5z",
	"M9 4v13",
	"M15 6.5v13"
] });
var MapPinIcon = createIcon("MapPinIcon", { d: ["M12 21s6.5-6 6.5-11a6.5 6.5 0 0 0-13 0c0 5 6.5 11 6.5 11z", circle(12, 10, 2.4)] });
var GlobeIcon = createIcon("GlobeIcon", { d: [
	circle(12, 12, 8.5),
	"M3.5 12h17",
	"M12 3.5c2.5 2.4 3.8 5.3 3.8 8.5s-1.3 6.1-3.8 8.5c-2.5-2.4-3.8-5.3-3.8-8.5S9.5 5.9 12 3.5z"
] });
var CompassIcon = createIcon("CompassIcon", { d: [circle(12, 12, 8.5), "M15.5 8.5l-2 5-5 2 2-5z"] });
var NavigationIcon = createIcon("NavigationIcon", { d: ["M12 3.5l7 16.5-7-3.5L5 20z"] });
var HomeHeartIcon = createIcon("HomeHeartIcon", { d: [
	"M4 11l8-7 8 7",
	"M6 9.5V19.5h12V9.5",
	"M12 16s-2.5-1.5-2.5-3.2a1.4 1.4 0 0 1 2.5-.8 1.4 1.4 0 0 1 2.5.8c0 1.7-2.5 3.2-2.5 3.2z"
] });
var BuildingIcon = createIcon("BuildingIcon", { d: [
	"M5.5 20.5V4.5a1 1 0 0 1 1-1h7a1 1 0 0 1 1 1v16",
	"M14.5 9.5h3a1 1 0 0 1 1 1v10",
	"M3.5 20.5h17",
	"M9 8h2",
	"M9 12h2",
	"M9 16h2"
] });
var StoreIcon = createIcon("StoreIcon", { d: [
	"M4 9.5l1.5-5h13l1.5 5",
	"M4 9.5a2.5 2.5 0 0 0 5 0 2.5 2.5 0 0 0 6 0 2.5 2.5 0 0 0 5 0",
	"M5.5 12v8.5h13V12",
	"M10 20.5v-5h4v5"
] });
var BriefcaseIcon = createIcon("BriefcaseIcon", { d: [
	rect(3, 7.5, 18, 12, 2),
	"M9 7.5V6a1.5 1.5 0 0 1 1.5-1.5h3A1.5 1.5 0 0 1 15 6v1.5",
	"M3 13h18"
] });
var BookIcon = createIcon("BookIcon", { d: ["M4.5 5.5a2 2 0 0 1 2-2H19.5V17H6.5a2 2 0 0 0-2 2z", "M4.5 19a2 2 0 0 0 2 2H19.5V17"] });
var BookOpenIcon = createIcon("BookOpenIcon", { d: ["M12 6.5C10.5 5 8 4.5 4 4.5V18c4 0 6.5.5 8 2 1.5-1.5 4-2 8-2V4.5c-4 0-6.5.5-8 2z", "M12 6.5V20"] });
var NewspaperIcon = createIcon("NewspaperIcon", { d: [
	"M5.5 4.5h12a1 1 0 0 1 1 1V19a1.5 1.5 0 0 1-1.5 1.5H6A2.5 2.5 0 0 1 3.5 18V7h2z",
	"M18.5 8.5H21V18a2.5 2.5 0 0 1-2.5 2.5",
	"M8 8.5h7",
	"M8 12h7",
	"M8 15.5h4"
] });
var LifeBuoyIcon = createIcon("LifeBuoyIcon", { d: [
	circle(12, 12, 8.5),
	circle(12, 12, 3.5),
	"M6 6l3.5 3.5",
	"M18 6l-3.5 3.5",
	"M18 18l-3.5-3.5",
	"M6 18l3.5-3.5"
] });
//#endregion
export { ArchiveIcon, BookIcon, BookOpenIcon, BriefcaseIcon, BuildingIcon, CompassIcon, FileIcon, FilePlusIcon, FileTextIcon, FolderIcon, FolderOpenIcon, FolderPlusIcon, GlobeIcon, HomeHeartIcon, InboxIcon, LifeBuoyIcon, MailIcon, MapIcon, MapPinIcon, MessageCircleIcon, MessageSquareIcon, NavigationIcon, NewspaperIcon, PaperclipIcon, PhoneIcon, SendIcon, StoreIcon, UserCheckIcon, UserCircleIcon, UserIcon, UserPlusIcon, UsersIcon };

//# sourceMappingURL=communication.js.map