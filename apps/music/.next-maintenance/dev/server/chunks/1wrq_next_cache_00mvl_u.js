module.exports = [
  "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/cache.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    let cacheExports;
    if (
      ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    );
    else {
      // Keep server requires in this branch so browser builds can DCE them.
      cacheExports = {
        unstable_cache: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/web/spec-extension/unstable-cache.js [app-route] (ecmascript)",
        ).unstable_cache,
        updateTag: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/web/spec-extension/revalidate.js [app-route] (ecmascript)",
        ).updateTag,
        revalidateTag: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/web/spec-extension/revalidate.js [app-route] (ecmascript)",
        ).revalidateTag,
        revalidatePath: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/web/spec-extension/revalidate.js [app-route] (ecmascript)",
        ).revalidatePath,
        refresh: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/web/spec-extension/revalidate.js [app-route] (ecmascript)",
        ).refresh,
        unstable_noStore: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/web/spec-extension/unstable-no-store.js [app-route] (ecmascript)",
        ).unstable_noStore,
        io: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/request/io.js [app-route] (ecmascript)",
        ).io,
        cacheLife: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/use-cache/cache-life.js [app-route] (ecmascript)",
        ).cacheLife,
        cacheTag: __turbopack_context__.r(
          "[project]/node_modules/.pnpm/next@16.3.8_@opentelemetry+api@1.9.1_@playwright+test@1.64.0_@types+node@24.19.2_react-_99abd6775edeaa5d9d2c1ede6a32ee40/node_modules/next/dist/server/use-cache/cache-tag.js [app-route] (ecmascript)",
        ).cacheTag,
      };
    }
    let didWarnCacheLife = false;
    function unstable_cacheLife() {
      if (!didWarnCacheLife) {
        didWarnCacheLife = true;
        const error = new Error(
          "`unstable_cacheLife` was recently stabilized and should be imported as `cacheLife`. The `unstable` prefixed form will be removed in a future version of Next.js.",
        );
        console.error(error);
      }
      return cacheExports.cacheLife.apply(this, arguments);
    }
    let didWarnCacheTag = false;
    function unstable_cacheTag() {
      if (!didWarnCacheTag) {
        didWarnCacheTag = true;
        const error = new Error(
          "`unstable_cacheTag` was recently stabilized and should be imported as `cacheTag`. The `unstable` prefixed form will be removed in a future version of Next.js.",
        );
        console.error(error);
      }
      return cacheExports.cacheTag.apply(this, arguments);
    }
    cacheExports.unstable_cacheLife = unstable_cacheLife;
    cacheExports.unstable_cacheTag = unstable_cacheTag;
    // https://nodejs.org/api/esm.html#commonjs-namespaces
    // When importing CommonJS modules, the module.exports object is provided as the default export
    module.exports = cacheExports;
    // make import { xxx } from 'next/cache' work
    exports.unstable_cache = cacheExports.unstable_cache;
    exports.revalidatePath = cacheExports.revalidatePath;
    exports.revalidateTag = cacheExports.revalidateTag;
    exports.updateTag = cacheExports.updateTag;
    exports.unstable_noStore = cacheExports.unstable_noStore;
    exports.cacheLife = cacheExports.cacheLife;
    exports.unstable_cacheLife = cacheExports.unstable_cacheLife;
    exports.cacheTag = cacheExports.cacheTag;
    exports.unstable_cacheTag = cacheExports.unstable_cacheTag;
    exports.refresh = cacheExports.refresh;
    exports.io = cacheExports.io;
  },
];

//# sourceMappingURL=1wrq_next_cache_00mvl_u.js.map
