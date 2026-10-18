import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogTitle, DialogTrigger } from "./dialog.js";
import { jsx } from "react/jsx-runtime";
//#region src/components/drawer.tsx
/** A side sheet: the `Dialog` (native modal, focus trap, Escape) presented as a panel from an edge. */
var Drawer = Dialog;
var DrawerTrigger = DialogTrigger;
var DrawerTitle = DialogTitle;
var DrawerDescription = DialogDescription;
var DrawerFooter = DialogFooter;
var DrawerClose = DialogClose;
function DrawerContent({ side = "right", ...rest }) {
	return /* @__PURE__ */ jsx(DialogContent, {
		...rest,
		position: side
	});
}
//#endregion
export { Drawer, DrawerClose, DrawerContent, DrawerDescription, DrawerFooter, DrawerTitle, DrawerTrigger };

//# sourceMappingURL=drawer.js.map