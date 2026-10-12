# Owner guide

How to run your sites day to day. Everything here happens in the browser at **jerryqiu.com/admin** (the same sign-in works for the photography, music and flying sites).

## Signing in

1. Go to `jerryqiu.com/admin`. You are sent to the sign-in page; press **Sign in with Google** and choose your `@jerryqiu.com` account.
2. Only `@jerryqiu.com` Google accounts that are on the **Users** list can get in. Anyone else sees "access denied", even with a valid Google account.
3. Sessions last up to 14 days. If you remove someone in **Users**, their access ends on their next click.
4. First-time setup (Google credentials) is in `docs/google-oauth-setup.md`. Until that exists, local development uses a clearly labelled dev-only sign-in that is switched off in production.

## The site selector

At the top of the sidebar, pick **Hub**, **Photography**, **Music** or **Flying**. The menu then shows only what belongs to that site. Press **Cmd-K** (Ctrl-K) to jump to any section by typing.

## Common jobs

- **Write a post:** Hub, Posts, Add post. Write in Markdown (toolbar and live preview). Add a summary, choose Published, press Publish. It is live within seconds. Choose Scheduled to publish later. Version history lets you restore an earlier draft. Changing a post's URL adds a redirect automatically.
- **Add a video to a post:** put `[[youtube VIDEOID]]` on its own line. Nothing from YouTube loads until a visitor presses play.
- **Publish a project (case study):** Photography, Projects. Projects live on the photography site (photos.jerryqiu.com/work); the old jerryqiu.com/work links redirect there. Build the page from blocks (text, image, gallery, quote, video, two columns), add credits, choose Published.
- **Upload a gallery:** Photography, Galleries, Add gallery, then drop photos into "Upload into this gallery". Drag to reorder (or use the arrows), write alt text, hide a photo, pick the cover. Large files upload straight to storage with a progress bar.
- **Change image protection:** per gallery ("Image protection") and as the site default in Pages & settings. *Off* does nothing, *Light* stops right-click and drag, *Strict* also reacts to screenshot and save shortcuts, hides the photos while the window is out of focus and in print, and keeps the image address out of the page. This is a deterrent: it cannot stop a phone camera or an operating-system screenshot. A visible watermark can be added in Pages & settings.
- **Edit your profile, links and timeline:** Hub, Profile & links, and Timeline.
- **Add a recording or a flight:** Music or Flying. A flying entry cannot go public until you tick the three safety checks (no live location, tail numbers decided on purpose, nobody identifiable without permission).
- **Read messages:** Inbox. Messages from the contact and booking forms arrive here (and by email once Resend is set up). Mark them replied, add private notes, or use *Reply by email*. To delete everything stored about one person, use "Delete someone's contact data" at the bottom of the Inbox.
- **Change site text, navigation, maintenance mode, legal pages:** Pages & settings (owner only). Maintenance mode shows visitors a short notice; the admin keeps working. Legal pages stay as the built-in drafts until you publish your own text. Have a lawyer read them.
- **Fix a mistake:** Trash holds deleted items for 30 days; press Restore. Redirects lets you send an old address to a new one. The Audit log shows who changed what.
- **Back up:** Pages & settings, "Download a full export" gives a zip of everything as JSON and Markdown. In a terminal, `pnpm db:backup` writes the same to `~/jerryqiu-backups`. The zip contains visitors' messages, so keep it private.

## The studio and ShootProof

`photos.jerryqiu.com/studio` is the owner-only studio. The ShootProof bridge lets you show an event from ShootProof for 24 hours. It is off until you have an API client ID; the steps are on that page and in `docs/shootproof-bridge.md`. Client galleries, contracts, invoices and payments are Phase 3 and are not built yet.

## Things that need your accounts (nothing is set up for you)

See `docs/project/DEPLOYMENT.md` for the full checklist: Vercel projects and domains, Neon database, storage (Cloudflare R2), Google sign-in, Resend email, the shared secrets, and DNS. Open questions with their current defaults are in `docs/project/QUESTIONS.md`.
