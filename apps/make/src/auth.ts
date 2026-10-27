import { createAuthKit } from "@jerryqiu/auth/server";

/**
 * The music app only READS the shared staff session (same AUTH_SECRET; in production the cookie is scoped to
 * .jerryqiu.com). Signing in happens on the hub (/sign-in), so there is one place for the Google flow and its limits.
 */
export const kit = createAuthKit();
export const { auth, currentUser, requireUser, requirePageUser, guarded } = kit;
