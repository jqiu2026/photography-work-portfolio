/**
 * Photograph protection for the photo site, on Holominimal: the protected image (token-fetched blob, shield, blur-up),
 * the protected gallery and its viewer, and the screenshot guard with its per-page scope. Styles: app/protection.css.
 */
export { type ImageAsset, type ProtectedAsset, ProtectedImage, type ProtectedImageProps } from "./ProtectedImage";
export { ProtectedGallery, type ProtectedGalleryItem, ProtectedViewer } from "./ProtectedGallery";
export { GuardScope, ScreenshotGuard, useGuardClaim, useGuardLevel } from "./ScreenshotGuard";
export {
  detectTrigger,
  devtoolsDocked,
  type GuardEvent,
  type GuardEventKind,
  type GuardLevel,
  type GuardOptions,
  guardCopy,
  type Trigger,
} from "./guard";
export { requestTokens } from "./tokens";
