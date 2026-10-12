import { createAuthKit } from "@jerryqiu/auth/server";

/** Auth for the hub: hosts the Auth.js route and the /admin CMS. See packages/auth for the rules. */
export const kit = createAuthKit();
export const { handlers, auth, signIn, signOut, currentUser, requireUser, requirePageUser, guarded, limitSignIn } = kit;
