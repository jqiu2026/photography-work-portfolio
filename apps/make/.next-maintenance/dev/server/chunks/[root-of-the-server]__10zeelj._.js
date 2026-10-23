module.exports = [
  "[externals]/crypto [external] (crypto, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("crypto", () => require("crypto"));

    module.exports = mod;
  },
  "[externals]/next/dist/build/adapter/setup-node-env.external.js [external] (next/dist/build/adapter/setup-node-env.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/build/adapter/setup-node-env.external.js", () =>
      require("next/dist/build/adapter/setup-node-env.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () =>
      require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/app-render/action-async-storage.external.js [external] (next/dist/server/app-render/action-async-storage.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/app-render/action-async-storage.external.js", () =>
      require("next/dist/server/app-render/action-async-storage.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/app-render/after-task-async-storage.external.js [external] (next/dist/server/app-render/after-task-async-storage.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/app-render/after-task-async-storage.external.js", () =>
      require("next/dist/server/app-render/after-task-async-storage.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/app-render/work-async-storage.external.js [external] (next/dist/server/app-render/work-async-storage.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/app-render/work-async-storage.external.js", () =>
      require("next/dist/server/app-render/work-async-storage.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/app-render/work-unit-async-storage.external.js [external] (next/dist/server/app-render/work-unit-async-storage.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/app-render/work-unit-async-storage.external.js", () =>
      require("next/dist/server/app-render/work-unit-async-storage.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/lib/incremental-cache/memory-cache.external.js [external] (next/dist/server/lib/incremental-cache/memory-cache.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/memory-cache.external.js", () =>
      require("next/dist/server/lib/incremental-cache/memory-cache.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/lib/incremental-cache/shared-cache-controls.external.js [external] (next/dist/server/lib/incremental-cache/shared-cache-controls.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js", () =>
      require("next/dist/server/lib/incremental-cache/shared-cache-controls.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/lib/incremental-cache/tags-manifest.external.js [external] (next/dist/server/lib/incremental-cache/tags-manifest.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/lib/incremental-cache/tags-manifest.external.js", () =>
      require("next/dist/server/lib/incremental-cache/tags-manifest.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/lib/router-utils/instrumentation-globals.external.js [external] (next/dist/server/lib/router-utils/instrumentation-globals.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/lib/router-utils/instrumentation-globals.external.js", () =>
      require("next/dist/server/lib/router-utils/instrumentation-globals.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/next/dist/server/runtime-reacts.external.js [external] (next/dist/server/runtime-reacts.external.js, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("next/dist/server/runtime-reacts.external.js", () =>
      require("next/dist/server/runtime-reacts.external.js"),
    );

    module.exports = mod;
  },
  "[externals]/node:async_hooks [external] (node:async_hooks, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("node:async_hooks", () => require("node:async_hooks"));

    module.exports = mod;
  },
  "[externals]/node:path [external] (node:path, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("node:path", () => require("node:path"));

    module.exports = mod;
  },
  "[externals]/node:stream [external] (node:stream, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

    module.exports = mod;
  },
  "[externals]/path [external] (path, cjs)",
  (__turbopack_context__, module, exports) => {
    var mod = __turbopack_context__.x("path", () => require("path"));

    module.exports = mod;
  },
  "[project]/apps/make/src/proxy.ts [middleware] (ecmascript)",
  (__turbopack_context__) => {
    __turbopack_context__.s(["config", () => config, "proxy", () => proxy]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sites$2f$src$2f$maintenance$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/packages/sites/src/maintenance.ts [middleware] (ecmascript)");
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/server.js [middleware] (ecmascript)",
      );
    /**
     * While maintenance mode is on (see packages/sites/src/maintenance.ts: on by default in a production build, off with
     * MAINTENANCE_MODE=0) every public route answers with the shared "back soon" page. Paths kept open: none beyond the defaults (cron, webhooks, auth, health, revalidate).
     */ const OPEN = [];
    function proxy(request) {
      return (
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sites$2f$src$2f$maintenance$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__[
          "maintenance"
        ])(request, OPEN) ??
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__[
          "NextResponse"
        ].next()
      );
    }
    const config = {
      // Everything except Next's own static files.
      matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
    };
  },
  "[project]/packages/sites/src/maintenance-html.ts [middleware] (ecmascript)",
  (__turbopack_context__) => {
    // Generated by scripts/build-maintenance.mjs from scripts/maintenance-page.mjs. Do not edit; edit the source and rebuild.
    __turbopack_context__.s(["maintenanceHtml", () => maintenanceHtml]);
    const maintenanceHtml =
      '<!doctype html><html lang="en" data-hm-scheme="dark"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Back soon · Jerry Qiu</title><meta name="robots" content="noindex, nofollow"><meta name="color-scheme" content="dark"><style>:root{--hm-bg:#000;--hm-surface:#131316;--hm-control-bg:rgb(255 255 255 / 0.05);--hm-surface-raised:#17171a;--hm-surface-overlay:#101013;--hm-fg:#f2f2f3;--hm-fg-strong:#fff;--hm-fg-soft:#b9b9c0;--hm-muted:#8b8b92;--hm-dim:#85858d;--hm-faint:#55555c;--hm-line:#1c1c1f;--hm-line-strong:#34343a;--hm-line-hover:#50505a;--hm-line-focus:#8b8b92;--hm-line-current:#5a5a62;--hm-line-overlay:#2a2a2f;--hm-scrim:rgb(0 0 0 / 0.6);--hm-on-fg:#000;--hm-cyan:188 100% 68%;--hm-blue:210 90% 68%;--hm-violet:268 95% 72%;--hm-magenta:322 95% 72%;--hm-accent-h:210;--hm-series-1:hsl(210 80% 66%);--hm-series-2:hsl(268 80% 72%);--hm-series-3:hsl(188 80% 62%);--hm-series-4:hsl(322 80% 70%);--hm-series-5:hsl(38 90% 65%);--hm-series-6:hsl(150 55% 55%);--hm-success:hsl(150 55% 55%);--hm-success-text:hsl(150 60% 65%);--hm-warning:hsl(38 90% 65%);--hm-danger:hsl(355 80% 66%);--hm-light:1;--hm-glass-bg:rgb(255 255 255 / 0.05);--hm-glass-edge:inset 0 1px 0 rgb(255 255 255 / 0.1);--hm-glass-blur:16px;--hm-chrome-bg:rgb(0 0 0 / 0.7);--hm-on-photo:#f2f2f3;--hm-nebula:1;--hm-star:255 255 255;--hm-control-edge:inset 0 1px 0 rgb(255 255 255 / 0.03);--hm-glass-saturate:1.6;--hm-font-sans:"Hanken Grotesk",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--hm-font-mono:"Martian Mono",ui-monospace,"SF Mono",Menlo,monospace;--hm-text-2xs:0.7rem;--hm-text-xs:0.75rem;--hm-text-sm:0.85rem;--hm-text-md:0.92rem;--hm-text-base:1rem;--hm-text-lg:1.15rem;--hm-text-xl:1.4rem;--hm-text-2xl:clamp(1.7rem,3vw,2.3rem);--hm-text-3xl:clamp(2.2rem,4.5vw,3.4rem);--hm-text-stat:clamp(1.7rem,2.6vw,2.2rem);--hm-weight-regular:400;--hm-weight-medium:500;--hm-weight-semibold:600;--hm-tracking-tight:-0.01em;--hm-tracking-num:-0.02em;--hm-tracking-eyebrow:0.14em;--hm-tracking-brand:0.22em;--hm-leading-tight:1.1;--hm-leading:1.5;--hm-space-1:0.25rem;--hm-space-2:0.5rem;--hm-space-3:0.75rem;--hm-space-4:1rem;--hm-space-5:1.4rem;--hm-space-6:2rem;--hm-space-7:2.4rem;--hm-space-8:3rem;--hm-space-9:4rem;--hm-gutter:clamp(1.25rem,0.5rem + 3vw,3rem);--hm-content:62rem;--hm-sidebar:clamp(11rem,16vw,14rem);--hm-sidebar-pad:clamp(1.4rem,2.6vw,2.4rem);--hm-target:44px;--hm-control-h:36px;--hm-radius-xs:2px;--hm-radius-sm:6px;--hm-radius-md:8px;--hm-radius-lg:10px;--hm-radius-xl:12px;--hm-radius-pill:999px;--hm-shadow-xs:0 1px 2px rgb(0 0 0 / 0.55);--hm-shadow-sm:0 2px 5px -1px rgb(0 0 0 / 0.6),0 1px 2px rgb(0 0 0 / 0.45);--hm-shadow-md:0 8px 18px -4px rgb(0 0 0 / 0.65),0 2px 5px rgb(0 0 0 / 0.5);--hm-shadow-lg:0 18px 38px -8px rgb(0 0 0 / 0.72),0 6px 12px -2px rgb(0 0 0 / 0.55);--hm-shadow-xl:0 34px 70px -12px rgb(0 0 0 / 0.82),0 12px 24px -4px rgb(0 0 0 / 0.6);--hm-shadow-overlay:0 30px 80px rgb(0 0 0 / 0.6);--hm-ease-glide:cubic-bezier(0.22,1,0.36,1);--hm-ease-pour:cubic-bezier(0.65,0,0.35,1);--hm-ease-curtain:cubic-bezier(0.7,0,0.2,1);--hm-ease-spring-soft:linear(0,0.18 5%,0.58 12%,0.88 20%,1.025 30%,1.04 36%,1.02 46%,0.996 60%,1);--hm-ease-spring:linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1);--hm-ease-out:ease;--hm-dur-instant:0.15s;--hm-dur-fast:0.2s;--hm-dur-base:0.34s;--hm-dur-slow:0.6s;--hm-dur-scene:0.9s;--hm-stagger:40ms;--hm-rise:0.4rem;--hm-rise-lg:1rem;--hm-focus-width:1px;--hm-focus-offset:3px;--hm-z-base:0;--hm-z-raised:1;--hm-z-sidebar:5;--hm-z-toolbar:6;--hm-z-sticky:10;--hm-z-dropdown:30;--hm-z-overlay:50;--hm-z-toast:60;--hm-z-tooltip:70;color-scheme:dark;}:root,.hm-theme{--hm-accent:hsl(var(--hm-accent-h) 70% 68%);--hm-accent-soft:hsl(var(--hm-accent-h) 70% 68% / 0.14);--hm-accent-line:hsl(var(--hm-accent-h) 70% 68% / 0.5);--hm-surface-selected:rgb(255 255 255 / 0.085);--hm-selected-edge:inset 0 1px 0 rgb(255 255 255 / 0.16),inset 0 0 0 1px rgb(255 255 255 / 0.05);--hm-info:hsl(var(--hm-cyan));--hm-iridescence:linear-gradient( 100deg,hsl(var(--hm-cyan) / 0.55),hsl(var(--hm-violet) / 0.35) 40%,hsl(var(--hm-magenta) / 0.5) 70%,hsl(var(--hm-cyan) / 0.4) );--hm-shadow-glow:0 18px 50px -28px hsl(var(--hm-violet) / 0.55);--hm-font-display:var(--hm-font-sans);--hm-focus-color:var(--hm-fg);}@media (prefers-reduced-motion:reduce){:root{--hm-dur-instant:1ms;--hm-dur-fast:1ms;--hm-dur-base:1ms;--hm-dur-slow:1ms;--hm-dur-scene:1ms;--hm-stagger:0ms;--hm-rise:0;--hm-rise-lg:0;}[data-hm-motion="full"]{--hm-dur-instant:0.15s;--hm-dur-fast:0.2s;--hm-dur-base:0.34s;--hm-dur-slow:0.6s;--hm-dur-scene:0.9s;--hm-stagger:40ms;--hm-rise:0.4rem;--hm-rise-lg:1rem;}}[data-hm-motion="reduce"]{--hm-dur-instant:1ms;--hm-dur-fast:1ms;--hm-dur-base:1ms;--hm-dur-slow:1ms;--hm-dur-scene:1ms;--hm-stagger:0ms;--hm-rise:0;--hm-rise-lg:0;}[data-hm-scheme="dark"],[data-hm-scheme="dark"] .hm-theme:not([data-hm-scheme]){--hm-bg:#000;--hm-surface:#131316;--hm-surface-raised:#17171a;--hm-surface-overlay:#101013;--hm-surface-selected:rgb(255 255 255 / 0.085);--hm-selected-edge:inset 0 1px 0 rgb(255 255 255 / 0.16),inset 0 0 0 1px rgb(255 255 255 / 0.05);--hm-fg:#f2f2f3;--hm-fg-strong:#fff;--hm-fg-soft:#b9b9c0;--hm-muted:#8b8b92;--hm-dim:#85858d;--hm-faint:#55555c;--hm-on-fg:#000;--hm-accent:hsl(var(--hm-accent-h) 70% 68%);--hm-accent-soft:hsl(var(--hm-accent-h) 70% 68% / 0.14);--hm-accent-line:hsl(var(--hm-accent-h) 70% 68% / 0.5);}[data-hm-scheme="dark"]{--hm-cyan:188 100% 68%;--hm-blue:210 90% 68%;--hm-violet:268 95% 72%;--hm-magenta:322 95% 72%;--hm-control-bg:rgb(255 255 255 / 0.05);--hm-control-edge:inset 0 1px 0 rgb(255 255 255 / 0.03);--hm-chrome-bg:rgb(0 0 0 / 0.7);--hm-line:#1c1c1f;--hm-line-strong:#34343a;--hm-line-hover:#50505a;--hm-line-focus:#8b8b92;--hm-line-current:#5a5a62;--hm-line-overlay:#2a2a2f;--hm-scrim:rgb(0 0 0 / 0.6);--hm-glass-bg:rgb(255 255 255 / 0.05);--hm-glass-edge:inset 0 1px 0 rgb(255 255 255 / 0.1);--hm-shadow-overlay:0 30px 80px rgb(0 0 0 / 0.6);--hm-nebula:1;color-scheme:dark;}[data-hm-scheme="dusk"],[data-hm-scheme="dusk"] .hm-theme:not([data-hm-scheme]){--hm-bg:hsl(var(--hm-accent-h) 42% 15%);--hm-surface:hsl(var(--hm-accent-h) 38% 19%);--hm-surface-raised:hsl(var(--hm-accent-h) 38% 22%);--hm-surface-overlay:hsl(var(--hm-accent-h) 40% 17%);--hm-surface-selected:hsl(var(--hm-accent-h) 90% 88% / 0.15);--hm-selected-edge:inset 0 1px 0 rgb(255 255 255 / 0.2),inset 0 0 0 1px hsl(var(--hm-accent-h) 90% 88% / 0.1);--hm-fg:hsl(var(--hm-accent-h) 40% 95%);--hm-fg-strong:#fff;--hm-fg-soft:hsl(var(--hm-accent-h) 32% 84%);--hm-muted:hsl(var(--hm-accent-h) 22% 74%);--hm-dim:hsl(var(--hm-accent-h) 18% 66%);--hm-faint:hsl(var(--hm-accent-h) 14% 54%);--hm-on-fg:hsl(var(--hm-accent-h) 45% 12%);--hm-accent:hsl(var(--hm-accent-h) 85% 74%);--hm-accent-soft:hsl(var(--hm-accent-h) 85% 74% / 0.18);--hm-accent-line:hsl(var(--hm-accent-h) 85% 74% / 0.55);}[data-hm-scheme="dusk"]{--hm-cyan:188 100% 68%;--hm-blue:210 90% 68%;--hm-violet:268 95% 72%;--hm-magenta:322 95% 72%;--hm-control-bg:rgb(255 255 255 / 0.07);--hm-control-edge:inset 0 1px 0 rgb(255 255 255 / 0.08);--hm-chrome-bg:rgb(10 14 40 / 0.55);--hm-line:rgb(255 255 255 / 0.1);--hm-line-strong:rgb(255 255 255 / 0.19);--hm-line-hover:rgb(255 255 255 / 0.34);--hm-line-focus:rgb(255 255 255 / 0.6);--hm-line-current:rgb(255 255 255 / 0.45);--hm-line-overlay:rgb(255 255 255 / 0.16);--hm-scrim:rgb(6 8 28 / 0.62);--hm-glass-bg:rgb(255 255 255 / 0.08);--hm-glass-edge:inset 0 1px 0 rgb(255 255 255 / 0.16);--hm-shadow-overlay:0 30px 80px rgb(4 6 24 / 0.55);--hm-nebula:1.9;color-scheme:dark;}[data-hm-scheme="dawn"],[data-hm-scheme="dawn"] .hm-theme:not([data-hm-scheme]){--hm-dawn-h:18;--hm-bg:hsl(var(--hm-dawn-h) 34% 9%);--hm-surface:hsl(var(--hm-dawn-h) 28% 13%);--hm-surface-raised:hsl(var(--hm-dawn-h) 28% 16%);--hm-surface-overlay:hsl(var(--hm-dawn-h) 30% 11%);--hm-surface-selected:rgb(255 226 200 / 0.13);--hm-selected-edge:inset 0 1px 0 rgb(255 236 220 / 0.2),inset 0 0 0 1px rgb(255 226 200 / 0.08);--hm-fg:hsl(30 45% 95%);--hm-fg-strong:#fff;--hm-fg-soft:hsl(28 32% 83%);--hm-muted:hsl(26 20% 72%);--hm-dim:hsl(24 16% 64%);--hm-faint:hsl(22 12% 52%);--hm-on-fg:hsl(var(--hm-dawn-h) 40% 10%);--hm-accent:hsl(28 92% 70%);--hm-accent-soft:hsl(28 92% 70% / 0.17);--hm-accent-line:hsl(28 92% 70% / 0.55);--hm-cyan:38 96% 66%;--hm-blue:22 92% 64%;--hm-violet:345 82% 66%;--hm-magenta:12 88% 64%;}[data-hm-scheme="dawn"]{--hm-control-bg:rgb(255 236 220 / 0.07);--hm-control-edge:inset 0 1px 0 rgb(255 236 220 / 0.09);--hm-chrome-bg:rgb(26 12 8 / 0.58);--hm-line:rgb(255 236 220 / 0.1);--hm-line-strong:rgb(255 236 220 / 0.18);--hm-line-hover:rgb(255 236 220 / 0.33);--hm-line-focus:rgb(255 236 220 / 0.6);--hm-line-current:rgb(255 236 220 / 0.45);--hm-line-overlay:rgb(255 236 220 / 0.15);--hm-scrim:rgb(14 6 4 / 0.64);--hm-glass-bg:rgb(255 236 220 / 0.07);--hm-glass-edge:inset 0 1px 0 rgb(255 236 220 / 0.15);--hm-shadow-overlay:0 30px 80px rgb(10 3 2 / 0.6);--hm-nebula:1.7;color-scheme:dark;}:root{--hm-bg:#000;--hm-surface:#131316;--hm-control-bg:rgb(255 255 255 / 0.05);--hm-surface-raised:#17171a;--hm-surface-overlay:#101013;--hm-fg:#f2f2f3;--hm-fg-strong:#fff;--hm-fg-soft:#b9b9c0;--hm-muted:#8b8b92;--hm-dim:#85858d;--hm-faint:#55555c;--hm-line:#1c1c1f;--hm-line-strong:#34343a;--hm-line-hover:#50505a;--hm-line-focus:#8b8b92;--hm-line-current:#5a5a62;--hm-line-overlay:#2a2a2f;--hm-scrim:rgb(0 0 0 / 0.6);--hm-on-fg:#000;--hm-cyan:188 100% 68%;--hm-blue:210 90% 68%;--hm-violet:268 95% 72%;--hm-magenta:322 95% 72%;--hm-accent-h:210;--hm-series-1:hsl(210 80% 66%);--hm-series-2:hsl(268 80% 72%);--hm-series-3:hsl(188 80% 62%);--hm-series-4:hsl(322 80% 70%);--hm-series-5:hsl(38 90% 65%);--hm-series-6:hsl(150 55% 55%);--hm-success:hsl(150 55% 55%);--hm-success-text:hsl(150 60% 65%);--hm-warning:hsl(38 90% 65%);--hm-danger:hsl(355 80% 66%);--hm-light:1;--hm-glass-bg:rgb(255 255 255 / 0.05);--hm-glass-edge:inset 0 1px 0 rgb(255 255 255 / 0.1);--hm-glass-blur:16px;--hm-chrome-bg:rgb(0 0 0 / 0.7);--hm-on-photo:#f2f2f3;--hm-nebula:1;--hm-star:255 255 255;--hm-control-edge:inset 0 1px 0 rgb(255 255 255 / 0.03);--hm-glass-saturate:1.6;--hm-font-sans:"Hanken Grotesk",ui-sans-serif,system-ui,-apple-system,"Segoe UI",sans-serif;--hm-font-mono:"Martian Mono",ui-monospace,"SF Mono",Menlo,monospace;--hm-text-2xs:0.7rem;--hm-text-xs:0.75rem;--hm-text-sm:0.85rem;--hm-text-md:0.92rem;--hm-text-base:1rem;--hm-text-lg:1.15rem;--hm-text-xl:1.4rem;--hm-text-2xl:clamp(1.7rem,3vw,2.3rem);--hm-text-3xl:clamp(2.2rem,4.5vw,3.4rem);--hm-text-stat:clamp(1.7rem,2.6vw,2.2rem);--hm-weight-regular:400;--hm-weight-medium:500;--hm-weight-semibold:600;--hm-tracking-tight:-0.01em;--hm-tracking-num:-0.02em;--hm-tracking-eyebrow:0.14em;--hm-tracking-brand:0.22em;--hm-leading-tight:1.1;--hm-leading:1.5;--hm-space-1:0.25rem;--hm-space-2:0.5rem;--hm-space-3:0.75rem;--hm-space-4:1rem;--hm-space-5:1.4rem;--hm-space-6:2rem;--hm-space-7:2.4rem;--hm-space-8:3rem;--hm-space-9:4rem;--hm-gutter:clamp(1.25rem,0.5rem + 3vw,3rem);--hm-content:62rem;--hm-sidebar:clamp(11rem,16vw,14rem);--hm-sidebar-pad:clamp(1.4rem,2.6vw,2.4rem);--hm-target:44px;--hm-control-h:36px;--hm-radius-xs:2px;--hm-radius-sm:6px;--hm-radius-md:8px;--hm-radius-lg:10px;--hm-radius-xl:12px;--hm-radius-pill:999px;--hm-shadow-xs:0 1px 2px rgb(0 0 0 / 0.55);--hm-shadow-sm:0 2px 5px -1px rgb(0 0 0 / 0.6),0 1px 2px rgb(0 0 0 / 0.45);--hm-shadow-md:0 8px 18px -4px rgb(0 0 0 / 0.65),0 2px 5px rgb(0 0 0 / 0.5);--hm-shadow-lg:0 18px 38px -8px rgb(0 0 0 / 0.72),0 6px 12px -2px rgb(0 0 0 / 0.55);--hm-shadow-xl:0 34px 70px -12px rgb(0 0 0 / 0.82),0 12px 24px -4px rgb(0 0 0 / 0.6);--hm-shadow-overlay:0 30px 80px rgb(0 0 0 / 0.6);--hm-ease-glide:cubic-bezier(0.22,1,0.36,1);--hm-ease-pour:cubic-bezier(0.65,0,0.35,1);--hm-ease-curtain:cubic-bezier(0.7,0,0.2,1);--hm-ease-spring-soft:linear(0,0.18 5%,0.58 12%,0.88 20%,1.025 30%,1.04 36%,1.02 46%,0.996 60%,1);--hm-ease-spring:linear(0,0.009,0.035 2.1%,0.141,0.281 6.7%,0.723 12.9%,0.938 16.7%,1.017,1.077,1.121,1.149 24.3%,1.159,1.163,1.161,1.154 29.9%,1.129 32.8%,1.051 39.6%,1.017 43.1%,0.991,0.977 51%,0.974 53.8%,0.975 57.1%,0.997 69.8%,1.003 76.9%,1);--hm-ease-out:ease;--hm-dur-instant:0.15s;--hm-dur-fast:0.2s;--hm-dur-base:0.34s;--hm-dur-slow:0.6s;--hm-dur-scene:0.9s;--hm-stagger:40ms;--hm-rise:0.4rem;--hm-rise-lg:1rem;--hm-focus-width:1px;--hm-focus-offset:3px;--hm-z-base:0;--hm-z-raised:1;--hm-z-sidebar:5;--hm-z-toolbar:6;--hm-z-sticky:10;--hm-z-dropdown:30;--hm-z-overlay:50;--hm-z-toast:60;--hm-z-tooltip:70;color-scheme:dark;}:root,.hm-theme{--hm-accent:hsl(var(--hm-accent-h) 70% 68%);--hm-accent-soft:hsl(var(--hm-accent-h) 70% 68% / 0.14);--hm-accent-line:hsl(var(--hm-accent-h) 70% 68% / 0.5);--hm-surface-selected:rgb(255 255 255 / 0.085);--hm-selected-edge:inset 0 1px 0 rgb(255 255 255 / 0.16),inset 0 0 0 1px rgb(255 255 255 / 0.05);--hm-info:hsl(var(--hm-cyan));--hm-iridescence:linear-gradient( 100deg,hsl(var(--hm-cyan) / 0.55),hsl(var(--hm-violet) / 0.35) 40%,hsl(var(--hm-magenta) / 0.5) 70%,hsl(var(--hm-cyan) / 0.4) );--hm-shadow-glow:0 18px 50px -28px hsl(var(--hm-violet) / 0.55);--hm-font-display:var(--hm-font-sans);--hm-focus-color:var(--hm-fg);}@media (prefers-reduced-motion:reduce){:root{--hm-dur-instant:1ms;--hm-dur-fast:1ms;--hm-dur-base:1ms;--hm-dur-slow:1ms;--hm-dur-scene:1ms;--hm-stagger:0ms;--hm-rise:0;--hm-rise-lg:0;}[data-hm-motion="full"]{--hm-dur-instant:0.15s;--hm-dur-fast:0.2s;--hm-dur-base:0.34s;--hm-dur-slow:0.6s;--hm-dur-scene:0.9s;--hm-stagger:40ms;--hm-rise:0.4rem;--hm-rise-lg:1rem;}}[data-hm-motion="reduce"]{--hm-dur-instant:1ms;--hm-dur-fast:1ms;--hm-dur-base:1ms;--hm-dur-slow:1ms;--hm-dur-scene:1ms;--hm-stagger:0ms;--hm-rise:0;--hm-rise-lg:0;}[data-hm-scheme="dark"],[data-hm-scheme="dark"] .hm-theme:not([data-hm-scheme]){--hm-bg:#000;--hm-surface:#131316;--hm-surface-raised:#17171a;--hm-surface-overlay:#101013;--hm-surface-selected:rgb(255 255 255 / 0.085);--hm-selected-edge:inset 0 1px 0 rgb(255 255 255 / 0.16),inset 0 0 0 1px rgb(255 255 255 / 0.05);--hm-fg:#f2f2f3;--hm-fg-strong:#fff;--hm-fg-soft:#b9b9c0;--hm-muted:#8b8b92;--hm-dim:#85858d;--hm-faint:#55555c;--hm-on-fg:#000;--hm-accent:hsl(var(--hm-accent-h) 70% 68%);--hm-accent-soft:hsl(var(--hm-accent-h) 70% 68% / 0.14);--hm-accent-line:hsl(var(--hm-accent-h) 70% 68% / 0.5);}[data-hm-scheme="dark"]{--hm-cyan:188 100% 68%;--hm-blue:210 90% 68%;--hm-violet:268 95% 72%;--hm-magenta:322 95% 72%;--hm-control-bg:rgb(255 255 255 / 0.05);--hm-control-edge:inset 0 1px 0 rgb(255 255 255 / 0.03);--hm-chrome-bg:rgb(0 0 0 / 0.7);--hm-line:#1c1c1f;--hm-line-strong:#34343a;--hm-line-hover:#50505a;--hm-line-focus:#8b8b92;--hm-line-current:#5a5a62;--hm-line-overlay:#2a2a2f;--hm-scrim:rgb(0 0 0 / 0.6);--hm-glass-bg:rgb(255 255 255 / 0.05);--hm-glass-edge:inset 0 1px 0 rgb(255 255 255 / 0.1);--hm-shadow-overlay:0 30px 80px rgb(0 0 0 / 0.6);--hm-nebula:1;color-scheme:dark;}[data-hm-scheme="dusk"],[data-hm-scheme="dusk"] .hm-theme:not([data-hm-scheme]){--hm-bg:hsl(var(--hm-accent-h) 42% 15%);--hm-surface:hsl(var(--hm-accent-h) 38% 19%);--hm-surface-raised:hsl(var(--hm-accent-h) 38% 22%);--hm-surface-overlay:hsl(var(--hm-accent-h) 40% 17%);--hm-surface-selected:hsl(var(--hm-accent-h) 90% 88% / 0.15);--hm-selected-edge:inset 0 1px 0 rgb(255 255 255 / 0.2),inset 0 0 0 1px hsl(var(--hm-accent-h) 90% 88% / 0.1);--hm-fg:hsl(var(--hm-accent-h) 40% 95%);--hm-fg-strong:#fff;--hm-fg-soft:hsl(var(--hm-accent-h) 32% 84%);--hm-muted:hsl(var(--hm-accent-h) 22% 74%);--hm-dim:hsl(var(--hm-accent-h) 18% 66%);--hm-faint:hsl(var(--hm-accent-h) 14% 54%);--hm-on-fg:hsl(var(--hm-accent-h) 45% 12%);--hm-accent:hsl(var(--hm-accent-h) 85% 74%);--hm-accent-soft:hsl(var(--hm-accent-h) 85% 74% / 0.18);--hm-accent-line:hsl(var(--hm-accent-h) 85% 74% / 0.55);}[data-hm-scheme="dusk"]{--hm-cyan:188 100% 68%;--hm-blue:210 90% 68%;--hm-violet:268 95% 72%;--hm-magenta:322 95% 72%;--hm-control-bg:rgb(255 255 255 / 0.07);--hm-control-edge:inset 0 1px 0 rgb(255 255 255 / 0.08);--hm-chrome-bg:rgb(10 14 40 / 0.55);--hm-line:rgb(255 255 255 / 0.1);--hm-line-strong:rgb(255 255 255 / 0.19);--hm-line-hover:rgb(255 255 255 / 0.34);--hm-line-focus:rgb(255 255 255 / 0.6);--hm-line-current:rgb(255 255 255 / 0.45);--hm-line-overlay:rgb(255 255 255 / 0.16);--hm-scrim:rgb(6 8 28 / 0.62);--hm-glass-bg:rgb(255 255 255 / 0.08);--hm-glass-edge:inset 0 1px 0 rgb(255 255 255 / 0.16);--hm-shadow-overlay:0 30px 80px rgb(4 6 24 / 0.55);--hm-nebula:1.9;color-scheme:dark;}[data-hm-scheme="dawn"],[data-hm-scheme="dawn"] .hm-theme:not([data-hm-scheme]){--hm-dawn-h:18;--hm-bg:hsl(var(--hm-dawn-h) 34% 9%);--hm-surface:hsl(var(--hm-dawn-h) 28% 13%);--hm-surface-raised:hsl(var(--hm-dawn-h) 28% 16%);--hm-surface-overlay:hsl(var(--hm-dawn-h) 30% 11%);--hm-surface-selected:rgb(255 226 200 / 0.13);--hm-selected-edge:inset 0 1px 0 rgb(255 236 220 / 0.2),inset 0 0 0 1px rgb(255 226 200 / 0.08);--hm-fg:hsl(30 45% 95%);--hm-fg-strong:#fff;--hm-fg-soft:hsl(28 32% 83%);--hm-muted:hsl(26 20% 72%);--hm-dim:hsl(24 16% 64%);--hm-faint:hsl(22 12% 52%);--hm-on-fg:hsl(var(--hm-dawn-h) 40% 10%);--hm-accent:hsl(28 92% 70%);--hm-accent-soft:hsl(28 92% 70% / 0.17);--hm-accent-line:hsl(28 92% 70% / 0.55);--hm-cyan:38 96% 66%;--hm-blue:22 92% 64%;--hm-violet:345 82% 66%;--hm-magenta:12 88% 64%;}[data-hm-scheme="dawn"]{--hm-control-bg:rgb(255 236 220 / 0.07);--hm-control-edge:inset 0 1px 0 rgb(255 236 220 / 0.09);--hm-chrome-bg:rgb(26 12 8 / 0.58);--hm-line:rgb(255 236 220 / 0.1);--hm-line-strong:rgb(255 236 220 / 0.18);--hm-line-hover:rgb(255 236 220 / 0.33);--hm-line-focus:rgb(255 236 220 / 0.6);--hm-line-current:rgb(255 236 220 / 0.45);--hm-line-overlay:rgb(255 236 220 / 0.15);--hm-scrim:rgb(14 6 4 / 0.64);--hm-glass-bg:rgb(255 236 220 / 0.07);--hm-glass-edge:inset 0 1px 0 rgb(255 236 220 / 0.15);--hm-shadow-overlay:0 30px 80px rgb(10 3 2 / 0.6);--hm-nebula:1.7;color-scheme:dark;}.hm-root{background:var(--hm-bg);color:var(--hm-fg);font-family:var(--hm-font-sans);font-size:var(--hm-text-base);line-height:var(--hm-leading);-webkit-font-smoothing:antialiased;-moz-osx-font-smoothing:grayscale;text-rendering:optimizeLegibility;}.hm-root *,.hm-root *::before,.hm-root *::after{box-sizing:border-box;}.hm-root:where(h1,h2,h3,h4,p,ul,ol,dl,dd,figure){margin:0;}.hm-root:where(h1,h2,h3,h4){font-weight:var(--hm-weight-medium);line-height:var(--hm-leading-tight);}.hm-root:where(a){color:inherit;}.hm-root:where(img,svg,video,canvas){display:block;max-width:100%;}.hm-root:where(button,input,select,textarea){font:inherit;color:inherit;}.hm-root:where(:focus-visible){outline:var(--hm-focus-width) solid var(--hm-focus-color);outline-offset:var(--hm-focus-offset);}.hm-root::selection{background:hsl(var(--hm-accent-h) 70% 68% / 0.35);}[data-hm-motion="reduce"] .hm-enter{animation:none;}[data-hm-motion="reduce"] [data-hm-reveal="pending"]{opacity:1;transform:none;}[data-hm-motion="reduce"] [data-hm-anim],[data-hm-anim][data-hm-motion="reduce"]{animation:none;}[data-hm-motion="reduce"] [data-hm-anim][data-hm-pending]{opacity:1;}[data-hm-motion="reduce"] .hm-marquee-track{animation:none;}.hm-iridescent-text{background:linear-gradient( 100deg,hsl(var(--hm-cyan)),hsl(var(--hm-violet)) 35%,hsl(var(--hm-magenta)) 65%,hsl(var(--hm-cyan)) );background-size:200% 100%;-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent;}.hm-iridescent-text[data-animated]{animation:hm-holo-pan 6s linear infinite;}@media (prefers-reduced-motion:reduce){.hm-holo-border[data-animated]::before,.hm-iridescent-text[data-animated]{animation:none;}}[data-hm-motion="reduce"] .hm-holo-border[data-animated]::before,[data-hm-motion="reduce"] .hm-iridescent-text[data-animated]{animation:none;}@property --hm-px{syntax:"*";inherits:false;}@property --hm-py{syntax:"*";inherits:false;}@property --hm-rx{syntax:"*";inherits:false;}@property --hm-ry{syntax:"*";inherits:false;}[data-hm-motion="reduce"] .hm-surface[data-interactive]:hover,[data-hm-motion="reduce"] .hm-surface[data-interactive]:focus-visible,[data-hm-motion="reduce"] .hm-surface[data-tilt]{transform:none;}[data-hm-motion="reduce"] .hm-sky-nebula,[data-hm-motion="reduce"] .hm-sky-stars,[data-hm-motion="reduce"] .hm-sky-stars[data-depth]{animation:none;translate:none;transition:none;}[data-hm-surface="matte"] .hm-surface:is([data-variant="glass"],[data-variant="holo"]){background:var(--hm-surface-overlay);-webkit-backdrop-filter:none;backdrop-filter:none;box-shadow:none;border-color:var(--hm-line-overlay);}[data-hm-surface="matte"] .hm-surface::before,[data-hm-surface="glass"] .hm-surface::before{display:none;}[data-hm-surface="matte"] .hm-surface[data-selected],[data-hm-surface="glass"] .hm-surface[data-selected]{border-color:var(--hm-line-focus);}[data-hm-surface="matte"] .hm-atmosphere{display:none;}[data-hm-motion="reduce"] .hm-shell[data-entrance]::after{display:none;}[data-hm-motion="reduce"] .hm-shell[data-entrance]>*{animation:none;}.hm-text{margin:0;color:var(--hm-fg);font-size:var(--hm-text-md);line-height:1.55;}.hm-text[data-size="2xs"]{font-size:var(--hm-text-2xs);}.hm-text[data-size="xs"]{font-size:var(--hm-text-xs);}.hm-text[data-size="sm"]{font-size:var(--hm-text-sm);}.hm-text[data-size="md"]{font-size:var(--hm-text-md);}.hm-text[data-size="base"]{font-size:var(--hm-text-base);}.hm-text[data-size="lg"]{font-size:var(--hm-text-lg);}.hm-text[data-size="xl"]{font-size:var(--hm-text-xl);line-height:1.3;}.hm-text[data-size="2xl"]{font-size:var(--hm-text-2xl);line-height:1.15;letter-spacing:var(--hm-tracking-tight);}.hm-text[data-size="3xl"]{font-size:var(--hm-text-3xl);line-height:1.08;letter-spacing:var(--hm-tracking-tight);}.hm-text[data-tone="soft"]{color:var(--hm-fg-soft);}.hm-text[data-tone="muted"]{color:var(--hm-muted);}.hm-text[data-tone="dim"]{color:var(--hm-dim);}.hm-text[data-tone="accent"]{color:var(--hm-accent);}.hm-text[data-tone="success"]{color:var(--hm-success);}.hm-text[data-tone="warning"]{color:var(--hm-warning);}.hm-text[data-tone="danger"]{color:var(--hm-danger);}.hm-text[data-weight="regular"]{font-weight:var(--hm-weight-regular,400);}.hm-text[data-weight="medium"]{font-weight:var(--hm-weight-medium);}.hm-text[data-weight="semibold"]{font-weight:var(--hm-weight-semibold);}.hm-text[data-align="center"]{text-align:center;}.hm-text[data-align="end"]{text-align:end;}.hm-text[data-truncate]{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}.hm-text[data-mono]{font-family:var(--hm-font-mono);}.hm-text[data-eyebrow]{color:var(--hm-dim);font-size:var(--hm-text-xs);letter-spacing:var(--hm-tracking-eyebrow);text-transform:uppercase;}.hm-heading{text-wrap:balance;}[data-hm-motion="reduce"] .hm-datatable tbody>tr,[data-hm-motion="reduce"] .hm-datatable-count,[data-hm-motion="reduce"] .hm-toolbar-main>*,[data-hm-motion="reduce"] .hm-toolbar-end{animation:none;}[data-hm-motion="reduce"] .hm-cursor-ripple::after{animation:none;opacity:0;}.hm-button{display:inline-flex;align-items:center;justify-content:center;gap:0.5rem;min-height:var(--hm-control-h);padding:0 1rem;border:1px solid transparent;border-radius:var(--hm-radius-md);font:inherit;font-size:var(--hm-text-sm);font-weight:var(--hm-weight-medium);line-height:1;white-space:nowrap;text-decoration:none;cursor:pointer;user-select:none;transition:background-color var(--hm-dur-fast) var(--hm-ease-out),border-color var(--hm-dur-fast) var(--hm-ease-out),color var(--hm-dur-fast) var(--hm-ease-out),opacity var(--hm-dur-fast) var(--hm-ease-out),transform var(--hm-dur-base) var(--hm-ease-spring);}.hm-button:active:not(:disabled,[aria-disabled="true"]){transform:translateY(1px) scale(0.97);}.hm-button:focus-visible{outline:var(--hm-focus-width) solid var(--hm-focus-color);outline-offset:var(--hm-focus-offset);}.hm-button[data-shape="pill"]{border-radius:var(--hm-radius-pill);}.hm-button[data-size="sm"]{min-height:32px;padding:0 0.75rem;font-size:0.8rem;}.hm-button[data-size="lg"]{min-height:var(--hm-target);padding:0 1.3rem;font-size:var(--hm-text-md);}.hm-button[data-variant="primary"]{background:var(--hm-fg);color:var(--hm-on-fg);border-color:var(--hm-fg);}.hm-button[data-variant="primary"]:hover{background:var(--hm-fg-strong);}.hm-button[data-variant="secondary"]{background:var(--hm-chrome-bg);border-color:var(--hm-line);color:var(--hm-fg-soft);-webkit-backdrop-filter:blur(8px);backdrop-filter:blur(8px);font-weight:var(--hm-weight-regular);}.hm-button[data-variant="secondary"]:hover{color:var(--hm-fg-strong);border-color:var(--hm-line-hover);}.hm-button[data-variant="ghost"]{background:none;color:var(--hm-muted);padding:0 0.4rem;font-weight:var(--hm-weight-regular);}.hm-button[data-variant="ghost"]:hover{color:var(--hm-fg);text-decoration:underline;text-underline-offset:3px;}.hm-button[data-variant="danger"]{background:none;border-color:var(--hm-line-strong);color:var(--hm-danger);}.hm-button[data-variant="danger"]:hover{border-color:var(--hm-danger);background:color-mix(in srgb,var(--hm-danger) 9%,transparent);}.hm-button:disabled,.hm-button[aria-disabled="true"]{opacity:0.45;cursor:not-allowed;}.hm-button[data-loading]{cursor:progress;opacity:0.8;}@media (pointer:coarse){.hm-button{min-height:var(--hm-target);}}[data-hm-motion="reduce"] .hm-skeleton{animation:none;}html:has(.hm-dialog[open]){overflow:hidden;}@property --_ft{syntax:"<length>";inherits:false;initial-value:0px;}@property --_fb{syntax:"<length>";inherits:false;initial-value:0px;}@property --_fl{syntax:"<length>";inherits:false;initial-value:0px;}@property --_fr{syntax:"<length>";inherits:false;initial-value:0px;}[data-hm-motion="reduce"] .hm-image[data-zoom] .hm-image-img{transform:none;}.hm-pricing-footer>.hm-button{flex:1;}[data-hm-motion="reduce"] .hm-bar{animation:none;}[data-hm-motion="reduce"] .hm-line-reveal,[data-hm-motion="reduce"] .hm-donut-seg{animation:none;}[data-hm-motion="reduce"] .hm-spinner{animation-duration:2.4s;}[data-hm-motion="reduce"] .hm-icon-spin{animation-duration:3s;}[data-hm-motion="reduce"] .hm-progress[data-indeterminate] .hm-progress-fill{animation-duration:6s;}[data-hm-motion="reduce"] .hm-ring[data-indeterminate] svg{animation-duration:4s;}[data-hm-motion="reduce"] .hm-ai-dots circle,[data-hm-motion="reduce"] .hm-ai-bars path,[data-hm-motion="reduce"] .hm-ai-ring .hm-ai-arc,[data-hm-motion="reduce"] .hm-ai-pulse .hm-ai-ripple,[data-hm-motion="reduce"] .hm-ai-orbit .hm-ai-orbit,[data-hm-motion="reduce"] .hm-ai-signal path{animation-duration:3s;}[data-hm-motion="reduce"] .hm-ai-draw[data-shake][data-active],[data-hm-motion="reduce"] .hm-ai-like[data-active],[data-hm-motion="reduce"] .hm-ai-bell[data-ringing] .hm-ai-swing,[data-hm-motion="reduce"] .hm-timeline-item[data-status="current"] .hm-timeline-marker:empty::after{animation:none;}[data-hm-motion="reduce"] .hm-ai-draw[data-active] .hm-ai-ring,[data-hm-motion="reduce"] .hm-ai-draw[data-active] .hm-ai-mark{animation-duration:1ms;animation-delay:0s;}[data-hm-motion="reduce"] .hm-ai,[data-hm-motion="reduce"] .hm-ai *{transition-duration:1ms !important;}[data-hm-motion="reduce"] .hm-shine::after{transition:none;}@keyframes hm-rise{from{opacity:0;transform:translateY(var(--hm-rise));}}@keyframes hm-rise-lg{from{opacity:0;transform:translateY(var(--hm-rise-lg));}}@keyframes hm-spin{to{rotate:360deg;}}@keyframes hm-marquee{to{transform:translateX(-50%);}}@keyframes hm-holo-pan{to{background-position:-200% 0;}}@keyframes hm-ai-draw{from{stroke-dashoffset:1;}to{stroke-dashoffset:0;}}@keyframes hm-cursor-ripple{from{opacity:0.8;scale:0.2;}to{opacity:0;scale:2.2;}}@keyframes hm-line-reveal{from{clip-path:inset(-10% 100% -10% 0);}to{clip-path:inset(-10% 0 -10% 0);}}html{color-scheme:dark;background:var(--hm-bg,#000);height:100%;overflow:hidden}body{margin:0;height:100vh;height:100svh;overflow:hidden}.soon{position:relative;display:grid;place-items:center;height:100vh;height:100svh;box-sizing:border-box;padding:1.5rem var(--hm-gutter,1.25rem);overflow:hidden;background:radial-gradient(60rem 36rem at 12% 8%,hsl(var(--hm-violet) / .26),transparent 70%),radial-gradient(48rem 30rem at 92% 96%,hsl(var(--hm-cyan) / .14),transparent 70%),var(--hm-bg,#000)}.soon-inner{display:grid;justify-items:start;gap:1.1rem;width:min(100%,54rem)}.soon .soon-title{margin:0;font-size:clamp(2.6rem,9vw,6rem);font-weight:400;line-height:.98;letter-spacing:-.04em}.soon-lede{display:grid;gap:.5rem;max-width:30rem;margin:0}.soon-lede p{margin:0}.soon .soon-title .hm-iridescent-text{display:inline-block;padding-right:.08em;background-image:linear-gradient(90deg,#fff 0%,hsl(var(--hm-violet)) 45%,hsl(var(--hm-cyan)) 100%);background-size:100% 100%}.soon-foot{margin-top:1.2rem}</style></head><body><main data-hm-scheme="dark" class="hm-theme hm-root soon" style="--hm-accent-h:268"><div class="soon-inner"><p class="hm-text" data-tone="muted" data-eyebrow="">Jerry Qiu</p><h1 class="hm-text hm-heading soon-title" data-size="3xl" data-weight="medium">Back <span class="hm-iridescent-text">soon.</span></h1><div class="soon-lede"><p class="hm-text" data-size="lg" data-tone="soft">I am rebuilding this site from the ground up.</p><p class="hm-text" data-size="lg" data-tone="soft">The new one is on the way, and I will have it up as soon as it is ready.</p></div><div class="soon-foot"><a href="mailto:info@jerryqiu.com" data-variant="primary" data-size="md" data-shape="rounded" class="hm-button">Inquiries: info@jerryqiu.com</a></div><p class="hm-text" data-size="sm" data-tone="dim">© %YEAR% Jerry Qiu.</p></div></main></body></html>';
  },
  "[project]/packages/sites/src/maintenance.ts [middleware] (ecmascript)",
  (__turbopack_context__) => {
    __turbopack_context__.s([
      "ALWAYS_ALLOWED",
      () => ALWAYS_ALLOWED,
      "RETRY_AFTER",
      () => RETRY_AFTER,
      "maintenance",
      () => maintenance,
      "maintenanceOn",
      () => maintenanceOn,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/server.js [middleware] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sites$2f$src$2f$maintenance$2d$html$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i("[project]/packages/sites/src/maintenance-html.ts [middleware] (ecmascript)");
    /**
     * Maintenance mode for jerryqiu.com. Every app calls `maintenance()` first in its proxy; while the mode is on, every
     * public route answers with the same self-contained "back soon" page (HTTP 503, Retry-After, noindex) and never reaches
     * a layout, a page or the database, so it holds even when the database is not there.
     *
     * The mode: `MAINTENANCE_MODE=1` (or true, on, yes) turns it on; `0` (or false, off, no) turns it off; when the variable is
     * unset it is ON in a production build and OFF in development and tests. So a deployment of this branch shows the page
     * with no setup, and `MAINTENANCE_MODE=0` brings the site back (for example on a preview).
     */ const OFF = new Set(["0", "false", "off", "no"]);
    const ON = new Set(["1", "true", "on", "yes"]);
    function maintenanceOn(env = process.env) {
      const v = (env.MAINTENANCE_MODE ?? "").trim().toLowerCase();
      if (ON.has(v)) return true;
      if (OFF.has(v)) return false;
      return env.NODE_ENV === "production";
    }
    const ALWAYS_ALLOWED = [
      "/api/cron",
      "/api/webhooks",
      "/api/auth",
      "/api/health",
      "/api/revalidate",
      "/.well-known",
    ];
    const RETRY_AFTER = "86400";
    const inside = (path, prefix) => path === prefix || path.startsWith(`${prefix}/`);
    const headers = (type) => ({
      "Content-Type": type,
      "Retry-After": RETRY_AFTER,
      "X-Robots-Tag": "noindex, nofollow",
      "Cache-Control": "no-store, max-age=0",
    });
    function maintenance(request, allow = []) {
      if (!maintenanceOn()) return null;
      const path = request.nextUrl.pathname;
      if ([...ALWAYS_ALLOWED, ...allow].some((p) => inside(path, p))) return null;
      if (path === "/robots.txt")
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__[
          "NextResponse"
        ]("User-agent: *\nDisallow: /\n", {
          status: 200,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      if (path === "/sitemap.xml" || path.startsWith("/sitemap/"))
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__[
          "NextResponse"
        ]("Not found", {
          status: 404,
          headers: {
            "Content-Type": "text/plain",
          },
        });
      if (path === "/api" || path.startsWith("/api/"))
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__[
          "NextResponse"
        ](
          JSON.stringify({
            error: "maintenance",
            message: "This site is down for a rebuild. Back soon.",
          }),
          {
            status: 503,
            headers: headers("application/json"),
          },
        );
      const html =
        __TURBOPACK__imported__module__$5b$project$5d2f$packages$2f$sites$2f$src$2f$maintenance$2d$html$2e$ts__$5b$middleware$5d$__$28$ecmascript$29$__[
          "maintenanceHtml"
        ].replaceAll("%YEAR%", String(new Date().getFullYear()));
      return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$next$40$16$2e$3$2e$8_$40$opentelemetry$2b$api$40$1$2e$9$2e$1_$40$playwright$2b$test$40$1$2e$64$2e$0_$40$types$2b$node$40$24$2e$19$2e$2_react$2d$_99abd6775edeaa5d9d2c1ede6a32ee40$2f$node_modules$2f$next$2f$server$2e$js__$5b$middleware$5d$__$28$ecmascript$29$__[
        "NextResponse"
      ](request.method === "HEAD" ? null : html, {
        status: 503,
        headers: headers("text/html; charset=utf-8"),
      });
    }
  },
];

//# sourceMappingURL=%5Broot-of-the-server%5D__10zeelj._.js.map
