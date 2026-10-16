# Google sign-in setup (owner steps)

The admin (`/admin` on jerryqiu.com) and the studio (`/studio` on photos.) sign in with Google, restricted to your Workspace domain. Nothing here has been created for you. Until you do it, local development uses the development-only open sign-in (`DASHBOARD_OPEN_SIGNIN=true`, ignored by production builds).

## 1. Create the OAuth client (Google Cloud console)

1. Open https://console.cloud.google.com and pick (or create) a project in your **jerryqiu.com Workspace organization**.
2. APIs & Services, OAuth consent screen: choose **Internal** (Workspace). Internal apps can only be used by accounts in your domain, which is a second lock on top of our own checks. App name "Jerry Qiu sites", support email yours. Scopes: `openid`, `email`, `profile` only.
3. Credentials, Create credentials, **OAuth client ID**, type **Web application**.
   - Authorized JavaScript origins: `https://jerryqiu.com`, `http://localhost:3000`
   - Authorized redirect URIs: `https://jerryqiu.com/api/auth/callback/google` and `http://localhost:3000/api/auth/callback/google`
   - (Only the hub hosts the callback. Photos redirects sign-in to the hub.)
4. Copy the client id and secret.

## 2. Set environment variables (Vercel project settings, and `.env.local` locally)

| Variable | Value |
|---|---|
| `AUTH_SECRET` | `openssl rand -base64 32`. **Same value in the hub and photos projects.** Required in production: the app refuses to start the admin with a missing or placeholder secret. |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | from step 1 |
| `ALLOWED_EMAIL_DOMAIN` | `jerryqiu.com` (default) |
| `ADMIN_EMAILS` | your own address, e.g. `you@jerryqiu.com`. On first sign-in it becomes the **owner**; others are invited from Admin, Users. |
| `AUTH_COOKIE_DOMAIN` | `.jerryqiu.com` in production, so one sign-in covers every site. Leave empty locally. |

## What is enforced (all server-side, all tested in `packages/auth`)

1. The Google ID token has `email_verified: true`.
2. The ID token's `hd` (hosted domain) claim equals `jerryqiu.com` **and** the email's domain equals it exactly. (`hd` sent in the sign-in URL is only a UI hint; lookalikes such as `jerryqiu.com.evil.com` fail.)
3. The email is on the `users` allow-list and active. First owner comes from `ADMIN_EMAILS`.
4. Every page, Server Action and Route Handler re-checks the session and role against the database, so removing a user takes effect on their next click.
5. Sessions are signed JWT cookies, 14 days, `Secure`, `HttpOnly`, `SameSite=Lax`. Sign-in attempts are rate limited per IP.

## Manual verification script (run after setup)

1. Sign in as your owner account: you land on `/admin`.
2. Admin, Users: invite `friend@jerryqiu.com` as editor. Sign in as them in a private window: allowed; Users page is hidden and `/admin/users` redirects.
3. Try a personal Gmail account: you get "That Google account isn't authorized".
4. Try a `@jerryqiu.com` account that is **not** on the list: same denial.
5. As owner, remove the editor. In their still-open window click any link or save: they are bounced to sign-in (no waiting for the cookie to expire).
6. Visit `https://photo.jerryqiu.com/studio` while signed in to the hub: you are in, no second login. Signed out: you are sent to the hub's sign-in and returned afterwards.
7. Open `/admin` signed out: redirect to `/sign-in?callbackUrl=%2Fadmin`.

## Passkeys / TOTP

Not built (optional in the plan, only if cheap). Google Workspace already offers 2-step verification and passkeys for the account itself: enable "Enforce 2-step verification" in the Workspace admin console for the best protection.
