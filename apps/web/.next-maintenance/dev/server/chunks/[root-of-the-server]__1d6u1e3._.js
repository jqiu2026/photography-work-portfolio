module.exports = [
  "[externals]/pg [external] (pg, esm_import, [project]/node_modules/.pnpm/pg@8.23.1/node_modules/pg)",
  (__turbopack_context__) => {
    return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => {
      try {
        var mod = await __turbopack_context__.y("pg-ad45e98bb7b7a165");

        __turbopack_context__.n(mod);
        __turbopack_async_result__();
      } catch (e) {
        __turbopack_async_result__(e);
      }
    }, true);
  },
  "[project]/node_modules/.pnpm/@vercel+blob@2.8.1/node_modules/@vercel/blob/dist/chunk-GPSPCQKX.js [app-route] (ecmascript)",
  (__turbopack_context__) => {
    __turbopack_context__.s([
      "BlobAccessError",
      () => BlobAccessError,
      "BlobClientTokenExpiredError",
      () => BlobClientTokenExpiredError,
      "BlobContentTypeNotAllowedError",
      () => BlobContentTypeNotAllowedError,
      "BlobError",
      () => BlobError,
      "BlobFileTooLargeError",
      () => BlobFileTooLargeError,
      "BlobNotFoundError",
      () => BlobNotFoundError,
      "BlobPathnameMismatchError",
      () => BlobPathnameMismatchError,
      "BlobPreconditionFailedError",
      () => BlobPreconditionFailedError,
      "BlobRequestAbortedError",
      () => BlobRequestAbortedError,
      "BlobServiceNotAvailable",
      () => BlobServiceNotAvailable,
      "BlobServiceRateLimited",
      () => BlobServiceRateLimited,
      "BlobStoreNotFoundError",
      () => BlobStoreNotFoundError,
      "BlobStoreSuspendedError",
      () => BlobStoreSuspendedError,
      "BlobUnknownError",
      () => BlobUnknownError,
      "MAXIMUM_PATHNAME_LENGTH",
      () => MAXIMUM_PATHNAME_LENGTH,
      "addOptimizeImageParams",
      () => addOptimizeImageParams,
      "constructBlobUrl",
      () => constructBlobUrl,
      "createCompleteMultipartUploadMethod",
      () => createCompleteMultipartUploadMethod,
      "createCreateMultipartUploadMethod",
      () => createCreateMultipartUploadMethod,
      "createCreateMultipartUploaderMethod",
      () => createCreateMultipartUploaderMethod,
      "createFolder",
      () => createFolder,
      "createPutHeaders",
      () => createPutHeaders,
      "createPutMethod",
      () => createPutMethod,
      "createPutOptions",
      () => createPutOptions,
      "createUploadPartMethod",
      () => createUploadPartMethod,
      "disallowedPathnameCharacters",
      () => disallowedPathnameCharacters,
      "getDownloadUrl",
      () => getDownloadUrl,
      "getReadWriteBlobTokenFromOptionsOrEnv",
      () => getReadWriteBlobTokenFromOptionsOrEnv,
      "isAllowedBlobUrl",
      () => isAllowedBlobUrl,
      "isPlainObject",
      () => isPlainObject,
      "isUrl",
      () => isUrl,
      "issueSignedToken",
      () => issueSignedToken,
      "parseStoreIdFromDelegationToken",
      () => parseStoreIdFromDelegationToken,
      "parseStoreIdFromPresignedUrl",
      () => parseStoreIdFromPresignedUrl,
      "parseStoreIdFromReadWriteToken",
      () => parseStoreIdFromReadWriteToken,
      "presign",
      () => presign,
      "presignUrl",
      () => presignUrl,
      "requestApi",
      () => requestApi,
      "resolveBlobAuth",
      () => resolveBlobAuth,
      "validateOptimizeImageSourceContentType",
      () => validateOptimizeImageSourceContentType,
    ]);
    // src/helpers.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$is$2d$node$2d$process$40$1$2e$2$2e$0$2f$node_modules$2f$is$2d$node$2d$process$2f$lib$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/is-node-process@1.2.0/node_modules/is-node-process/lib/index.mjs [app-route] (ecmascript)",
      );
    // src/multipart/helpers.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$is$2d$buffer$40$2$2e$0$2e$5$2f$node_modules$2f$is$2d$buffer$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/is-buffer@2.0.5/node_modules/is-buffer/index.js [app-route] (ecmascript)",
      );
    var __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__ =
      __turbopack_context__.i("[externals]/stream [external] (stream, cjs)");
    // src/vercel-oidc-token.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$oidc$40$3$2e$8$2e$10$2f$node_modules$2f40$vercel$2f$oidc$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/index.js [app-route] (ecmascript)",
      );
    // src/api.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$async$2d$retry$40$1$2e$3$2e$3$2f$node_modules$2f$async$2d$retry$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/async-retry@1.3.3/node_modules/async-retry/lib/index.js [app-route] (ecmascript)",
      );
    // src/fetch.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$undici$40$6$2e$29$2e$0$2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/undici@6.29.0/node_modules/undici/index.js [app-route] (ecmascript)",
      );
    // src/multipart/upload.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$throttleit$40$2$2e$1$2e$0$2f$node_modules$2f$throttleit$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/throttleit@2.1.0/node_modules/throttleit/index.js [app-route] (ecmascript)",
      );
    var supportsNewBlobFromArrayBuffer = new Promise((resolve) => {
      try {
        const helloAsArrayBuffer = new Uint8Array([104, 101, 108, 108, 111]);
        const blob = new Blob([helloAsArrayBuffer]);
        blob
          .text()
          .then((text) => {
            resolve(text === "hello");
          })
          .catch(() => {
            resolve(false);
          });
      } catch {
        resolve(false);
      }
    });
    async function toReadableStream(value) {
      if (value instanceof ReadableStream) {
        return value;
      }
      if (value instanceof Blob) {
        return value.stream();
      }
      if (isNodeJsReadableStream(value)) {
        return __TURBOPACK__imported__module__$5b$externals$5d2f$stream__$5b$external$5d$__$28$stream$2c$__cjs$29$__[
          "Readable"
        ].toWeb(value);
      }
      let streamValue;
      if (value instanceof ArrayBuffer) {
        streamValue = new Uint8Array(value);
      } else if (isNodeJsBuffer(value)) {
        streamValue = value;
      } else {
        streamValue = stringToUint8Array(value);
      }
      if (await supportsNewBlobFromArrayBuffer) {
        return new Blob([streamValue]).stream();
      }
      return new ReadableStream({
        start(controller) {
          controller.enqueue(streamValue);
          controller.close();
        },
      });
    }
    function isNodeJsReadableStream(value) {
      return (
        typeof value === "object" &&
        typeof value.pipe === "function" &&
        value.readable &&
        typeof value._read === "function" && // @ts-expect-error _readableState does exists on Readable
        typeof value._readableState === "object"
      );
    }
    function stringToUint8Array(s) {
      const enc = new TextEncoder();
      return enc.encode(s);
    }
    function isNodeJsBuffer(value) {
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$is$2d$buffer$40$2$2e$0$2e$5$2f$node_modules$2f$is$2d$buffer$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "default"
      ])(value);
    }
    async function getVercelOidcToken() {
      try {
        const token = (
          await (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$oidc$40$3$2e$8$2e$10$2f$node_modules$2f40$vercel$2f$oidc$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "getVercelOidcToken"
          ])()
        ).trim();
        return token === "" ? void 0 : token;
      } catch {
        return void 0;
      }
    }
    // src/bytes.ts
    var parseRegExp = /^((-|\+)?(\d+(?:\.\d+)?)) *(kb|mb|gb|tb|pb)$/i;
    var map = {
      b: 1,
      kb: 1 << 10,
      mb: 1 << 20,
      gb: 1 << 30,
      tb: 1024 ** 4,
      pb: 1024 ** 5,
    };
    function bytes(val) {
      if (typeof val === "number" && !Number.isNaN(val)) {
        return val;
      }
      if (typeof val !== "string") {
        return null;
      }
      const results = parseRegExp.exec(val);
      let floatValue;
      let unit = "b";
      if (!results) {
        floatValue = parseInt(val, 10);
      } else {
        const [, res, , , unitMatch] = results;
        if (!res) {
          return null;
        }
        floatValue = parseFloat(res);
        if (unitMatch) {
          unit = unitMatch.toLowerCase();
        }
      }
      if (Number.isNaN(floatValue)) {
        return null;
      }
      return Math.floor(map[unit] * floatValue);
    }
    // src/helpers.ts
    var defaultVercelBlobApiUrl = "https://vercel.com/api/blob";
    function readEnv(name) {
      try {
        const value = process.env[name];
        return typeof value === "string" && value.trim() !== "" ? value.trim() : void 0;
      } catch {
        return void 0;
      }
    }
    function parseStoreIdFromReadWriteToken(token) {
      const [, , , storeId = ""] = token.split("_");
      return storeId;
    }
    function base64UrlDecodeDelegationSegment(segment) {
      let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
      const padding = 4 - (base64.length % 4);
      if (padding !== 4) {
        base64 += "=".repeat(padding);
      }
      if (typeof atob === "function") {
        return atob(base64);
      }
      if (typeof Buffer !== "undefined") {
        return Buffer.from(base64, "base64").toString("utf8");
      }
      throw new BlobError("Cannot decode base64: no atob or Buffer available.");
    }
    function parseStoreIdFromDelegationToken(delegationToken) {
      const dot = delegationToken.indexOf(".");
      if (dot < 0) {
        throw new BlobError("Invalid delegation token format.");
      }
      const payloadSeg = delegationToken.slice(0, dot);
      let parsed;
      try {
        parsed = JSON.parse(base64UrlDecodeDelegationSegment(payloadSeg));
      } catch {
        throw new BlobError("Invalid delegation token payload.");
      }
      if (!parsed.storeId || typeof parsed.storeId !== "string") {
        throw new BlobError("Delegation token payload is missing `storeId`.");
      }
      return normalizeStoreId(parsed.storeId);
    }
    function parseStoreIdFromPresignedUrl(presignedUrlPayload) {
      const delegation = presignedUrlPayload.delegationToken;
      return parseStoreIdFromDelegationToken(delegation);
    }
    function normalizeStoreId(storeId) {
      return storeId.startsWith("store_") ? storeId.slice("store_".length) : storeId;
    }
    async function resolveBlobAuth(options) {
      var _a3, _b2;
      if (options == null ? void 0 : options.presignedUrlPayload) {
        const storeId = parseStoreIdFromDelegationToken(options.presignedUrlPayload.delegationToken);
        return {
          kind: "presigned",
          storeId,
        };
      }
      if (options == null ? void 0 : options.token) {
        const storeId = parseStoreIdFromReadWriteToken(options.token);
        return {
          kind: "readWrite",
          token: options.token,
          storeId,
        };
      }
      const manualOidcToken = (_a3 = options == null ? void 0 : options.oidcToken) == null ? void 0 : _a3.trim();
      const oidcToken = manualOidcToken || (await getVercelOidcToken());
      if (oidcToken) {
        const manualStoreId = (_b2 = options == null ? void 0 : options.storeId) == null ? void 0 : _b2.trim();
        if (manualStoreId) {
          return {
            kind: "oidc",
            token: oidcToken,
            storeId: normalizeStoreId(manualStoreId),
          };
        }
        const blobStoreId = readEnv("BLOB_STORE_ID");
        if (blobStoreId) {
          return {
            kind: "oidc",
            token: oidcToken,
            storeId: normalizeStoreId(blobStoreId),
          };
        }
        if (manualOidcToken) {
          throw new BlobError(
            "oidcToken was passed, but no storeId was found. Pass a `storeId` option or set `BLOB_STORE_ID` to use OIDC auth",
          );
        }
      }
      const readWrite = readEnv("BLOB_READ_WRITE_TOKEN");
      if (readWrite) {
        const storeId = parseStoreIdFromReadWriteToken(readWrite);
        return {
          kind: "readWrite",
          token: readWrite,
          storeId,
        };
      }
      throw new BlobError(
        "No blob credentials found. Pass a `token` option, set `BLOB_READ_WRITE_TOKEN`, or use `oidcToken` (or `VERCEL_OIDC_TOKEN`) with `storeId` or `BLOB_STORE_ID`.",
      );
    }
    function getReadWriteBlobTokenFromOptionsOrEnv(options) {
      if (options == null ? void 0 : options.token) {
        return options.token;
      }
      const readWrite = readEnv("BLOB_READ_WRITE_TOKEN");
      if (readWrite) {
        return readWrite;
      }
      throw new BlobError(
        "No read-write token found. Either configure the `BLOB_READ_WRITE_TOKEN` environment variable, or pass a `token` option to your calls.",
      );
    }
    var BlobError = class extends Error {
      constructor(message) {
        super(`Vercel Blob: ${message}`);
      }
    };
    function getDownloadUrl(blobUrl) {
      const url = new URL(blobUrl);
      url.searchParams.set("download", "1");
      return url.toString();
    }
    function isPlainObject(value) {
      if (typeof value !== "object" || value === null) {
        return false;
      }
      const prototype = Object.getPrototypeOf(value);
      return (
        (prototype === null || prototype === Object.prototype || Object.getPrototypeOf(prototype) === null) &&
        !(Symbol.toStringTag in value) &&
        !(Symbol.iterator in value)
      );
    }
    var disallowedPathnameCharacters = ["//"];
    var supportsRequestStreams = (() => {
      if (
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$is$2d$node$2d$process$40$1$2e$2$2e$0$2f$node_modules$2f$is$2d$node$2d$process$2f$lib$2f$index$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "isNodeProcess"
        ])()
      ) {
        return true;
      }
      const apiUrl = getApiUrl();
      if (apiUrl.startsWith("http://localhost")) {
        return false;
      }
      let duplexAccessed = false;
      const hasContentType = new Request(getApiUrl(), {
        body: new ReadableStream(),
        method: "POST",
        // @ts-expect-error -- TypeScript doesn't yet have duplex but it's in the spec: https://github.com/microsoft/TypeScript-DOM-lib-generator/pull/1729
        get duplex() {
          duplexAccessed = true;
          return "half";
        },
      }).headers.has("Content-Type");
      return duplexAccessed && !hasContentType;
    })();
    function getApiUrlOverride() {
      try {
        return process.env.VERCEL_BLOB_API_URL || process.env.NEXT_PUBLIC_VERCEL_BLOB_API_URL || null;
      } catch {
        return null;
      }
    }
    function getApiUrl(pathname = "") {
      var _a3;
      return `${((_a3 = getApiUrlOverride())) != null ? _a3 : defaultVercelBlobApiUrl}${pathname}`;
    }
    var TEXT_ENCODER = typeof TextEncoder === "function" ? new TextEncoder() : null;
    function computeBodyLength(body) {
      if (!body) {
        return 0;
      }
      if (typeof body === "string") {
        if (TEXT_ENCODER) {
          return TEXT_ENCODER.encode(body).byteLength;
        }
        return new Blob([body]).size;
      }
      if ("byteLength" in body && typeof body.byteLength === "number") {
        return body.byteLength;
      }
      if ("size" in body && typeof body.size === "number") {
        return body.size;
      }
      return 0;
    }
    var createChunkTransformStream = (chunkSize, onProgress) => {
      let buffer = new Uint8Array(0);
      return new TransformStream({
        transform(chunk, controller) {
          const newBuffer = new Uint8Array(buffer.length + chunk.byteLength);
          newBuffer.set(buffer);
          newBuffer.set(new Uint8Array(chunk), buffer.length);
          buffer = newBuffer;
          while (buffer.length >= chunkSize) {
            const newChunk = buffer.slice(0, chunkSize);
            controller.enqueue(newChunk);
            onProgress == null ? void 0 : onProgress(newChunk.byteLength);
            buffer = buffer.slice(chunkSize);
          }
        },
        flush(controller) {
          if (buffer.length > 0) {
            controller.enqueue(buffer);
            onProgress == null ? void 0 : onProgress(buffer.byteLength);
          }
        },
      });
    };
    function isReadableStream(value) {
      return (
        globalThis.ReadableStream && // TODO: Can be removed once Node.js 16 is no more required internally
        value instanceof ReadableStream
      );
    }
    function isStream(value) {
      if (isReadableStream(value)) {
        return true;
      }
      if (isNodeJsReadableStream(value)) {
        return true;
      }
      return false;
    }
    var addPresignedParams = (url, presignedUrlPayload) => {
      const urlObj = new URL(url);
      for (const [key, value] of Object.entries(presignedUrlPayload.params)) {
        urlObj.searchParams.set(key, value);
      }
      urlObj.searchParams.set("vercel-blob-delegation", presignedUrlPayload.delegationToken);
      urlObj.searchParams.set("vercel-blob-signature", presignedUrlPayload.signature);
      return urlObj.toString();
    };
    function isUrl(urlOrPathname) {
      return urlOrPathname.startsWith("http://") || urlOrPathname.startsWith("https://");
    }
    function isAllowedBlobUrl(url) {
      if (url.hostname.endsWith(".blob.vercel-storage.com")) {
        return true;
      }
      const apiUrlOverride = getApiUrlOverride();
      if (!apiUrlOverride) {
        return false;
      }
      try {
        return new URL(apiUrlOverride).origin === url.origin;
      } catch {
        return false;
      }
    }
    function constructBlobUrl(storeId, pathname, access) {
      return `https://${storeId}.${access}.blob.vercel-storage.com/${pathname}`;
    }
    // src/debug.ts
    var debugIsActive = false;
    var _a, _b;
    try {
      if (
        ((_a = process.env.DEBUG) == null ? void 0 : _a.includes("blob")) ||
        ((_b = process.env.NEXT_PUBLIC_DEBUG) == null ? void 0 : _b.includes("blob"))
      ) {
        debugIsActive = true;
      }
    } catch {}
    function debug(message, ...args) {
      if (debugIsActive) {
        console.debug(`vercel-blob: ${message}`, ...args);
      }
    }
    // src/dom-exception.ts
    var _a2;
    var DOMException2 =
      (_a2 = globalThis.DOMException) != null
        ? _a2
        : (() => {
            try {
              atob("~");
            } catch (err) {
              return Object.getPrototypeOf(err).constructor;
            }
          })();
    // src/is-network-error.ts
    var objectToString = Object.prototype.toString;
    var isError = (value) => objectToString.call(value) === "[object Error]";
    var errorMessages = /* @__PURE__ */ new Set([
      "network error",
      // Chrome
      "Failed to fetch",
      // Chrome
      "NetworkError when attempting to fetch resource.",
      // Firefox
      "The Internet connection appears to be offline.",
      // Safari 16
      "Load failed",
      // Safari 17+
      "Network request failed",
      // `cross-fetch`
      "fetch failed",
      // Undici (Node.js)
      "terminated",
    ]);
    function isNetworkError(error) {
      const isValid = error && isError(error) && error.name === "TypeError" && typeof error.message === "string";
      if (!isValid) {
        return false;
      }
      if (error.message === "Load failed") {
        return error.stack === void 0;
      }
      return errorMessages.has(error.message);
    }
    var hasFetch =
      typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$undici$40$6$2e$29$2e$0$2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "fetch"
      ] === "function";
    var hasFetchWithUploadProgress = hasFetch && supportsRequestStreams;
    var CHUNK_SIZE = 64 * 1024;
    var blobFetch = async ({ input, init, onUploadProgress }) => {
      debug("using fetch");
      let body;
      if (init.body) {
        if (onUploadProgress) {
          const stream = await toReadableStream(init.body);
          let loaded = 0;
          const chunkTransformStream = createChunkTransformStream(CHUNK_SIZE, (newLoaded) => {
            loaded += newLoaded;
            onUploadProgress(loaded);
          });
          body = stream.pipeThrough(chunkTransformStream);
        } else {
          body = init.body;
        }
      }
      const duplex = supportsRequestStreams && body && isStream(body) ? "half" : void 0;
      return (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$undici$40$6$2e$29$2e$0$2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "fetch"
      ])(
        input, // @ts-expect-error -- Blob and Nodejs Blob are triggering type errors, fine with it
        {
          ...init,
          ...(init.body
            ? {
                body,
              }
            : {}),
          duplex,
        },
      );
    };
    // src/xhr.ts
    var hasXhr = typeof XMLHttpRequest !== "undefined";
    var blobXhr = async ({ input, init, onUploadProgress }) => {
      debug("using xhr");
      let body = null;
      if (init.body) {
        if (isReadableStream(init.body)) {
          body = await new Response(init.body).blob();
        } else {
          body = init.body;
        }
      }
      return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open(init.method || "GET", input.toString(), true);
        if (onUploadProgress) {
          xhr.upload.addEventListener("progress", (event) => {
            if (event.lengthComputable) {
              onUploadProgress(event.loaded);
            }
          });
        }
        xhr.onload = () => {
          var _a3;
          if ((_a3 = init.signal) == null ? void 0 : _a3.aborted) {
            reject(new DOMException("The user aborted the request.", "AbortError"));
            return;
          }
          const headers = new Headers();
          const rawHeaders = xhr
            .getAllResponseHeaders()
            .trim()
            .split(/[\r\n]+/);
          rawHeaders.forEach((line) => {
            const parts = line.split(": ");
            const key = parts.shift();
            const value = parts.join(": ");
            if (key) headers.set(key.toLowerCase(), value);
          });
          const response = new Response(xhr.response, {
            status: xhr.status,
            statusText: xhr.statusText,
            headers,
          });
          resolve(response);
        };
        xhr.onerror = () => {
          reject(new TypeError("Network request failed"));
        };
        xhr.ontimeout = () => {
          reject(new TypeError("Network request timed out"));
        };
        xhr.onabort = () => {
          reject(new DOMException("The user aborted a request.", "AbortError"));
        };
        if (init.headers) {
          const headers = new Headers(init.headers);
          headers.forEach((value, key) => {
            xhr.setRequestHeader(key, value);
          });
        }
        if (init.signal) {
          init.signal.addEventListener("abort", () => {
            xhr.abort();
          });
          if (init.signal.aborted) {
            xhr.abort();
            return;
          }
        }
        xhr.send(body);
      });
    };
    // src/request.ts
    var blobRequest = async ({ input, init, onUploadProgress }) => {
      if (onUploadProgress) {
        if (hasFetchWithUploadProgress) {
          return blobFetch({
            input,
            init,
            onUploadProgress,
          });
        }
        if (hasXhr) {
          return blobXhr({
            input,
            init,
            onUploadProgress,
          });
        }
      }
      if (hasFetch) {
        return blobFetch({
          input,
          init,
        });
      }
      if (hasXhr) {
        return blobXhr({
          input,
          init,
        });
      }
      throw new Error("No request implementation available");
    };
    // src/api.ts
    var MAXIMUM_PATHNAME_LENGTH = 950;
    var BlobAccessError = class extends BlobError {
      constructor() {
        super("Access denied, please provide a valid token for this resource.");
      }
    };
    var BlobOidcEnvironmentNotAllowedError = class extends BlobError {
      constructor(message) {
        super(message != null ? message : "OIDC is enabled for this project, but not for this token's environment.");
      }
    };
    var BlobContentTypeNotAllowedError = class extends BlobError {
      constructor(message) {
        super(`Content type mismatch, ${message}.`);
      }
    };
    var BlobPathnameMismatchError = class extends BlobError {
      constructor(message) {
        super(
          `Pathname mismatch, ${message}. Check the pathname used in upload() or put() matches the one from the client token.`,
        );
      }
    };
    var BlobClientTokenExpiredError = class extends BlobError {
      constructor() {
        super("Client token has expired.");
      }
    };
    var BlobFileTooLargeError = class extends BlobError {
      constructor(message) {
        super(`File is too large, ${message}.`);
      }
    };
    var BlobStoreNotFoundError = class extends BlobError {
      constructor() {
        super("This store does not exist.");
      }
    };
    var BlobStoreSuspendedError = class extends BlobError {
      constructor() {
        super("This store has been suspended.");
      }
    };
    var BlobUnknownError = class extends BlobError {
      constructor() {
        super("Unknown error, please visit https://vercel.com/help.");
      }
    };
    var BlobNotFoundError = class extends BlobError {
      constructor() {
        super("The requested blob does not exist");
      }
    };
    var BlobServiceNotAvailable = class extends BlobError {
      constructor() {
        super("The blob service is currently not available. Please try again.");
      }
    };
    var BlobServiceRateLimited = class extends BlobError {
      constructor(seconds) {
        super(
          `Too many requests please lower the number of concurrent requests ${seconds ? ` - try again in ${seconds} seconds` : ""}.`,
        );
        this.retryAfter = seconds != null ? seconds : 0;
      }
    };
    var BlobRequestAbortedError = class extends BlobError {
      constructor() {
        super("The request was aborted.");
      }
    };
    var BlobPreconditionFailedError = class extends BlobError {
      constructor() {
        super("Precondition failed: ETag mismatch.");
      }
    };
    var BLOB_API_VERSION = 12;
    function getApiVersion() {
      let versionOverride = null;
      try {
        versionOverride =
          process.env.VERCEL_BLOB_API_VERSION_OVERRIDE || process.env.NEXT_PUBLIC_VERCEL_BLOB_API_VERSION_OVERRIDE;
      } catch {}
      return `${versionOverride != null ? versionOverride : BLOB_API_VERSION}`;
    }
    function getRetries() {
      try {
        const retries = process.env.VERCEL_BLOB_RETRIES || "10";
        return parseInt(retries, 10);
      } catch {
        return 10;
      }
    }
    function createBlobServiceRateLimited(response) {
      const retryAfter = response.headers.get("retry-after");
      return new BlobServiceRateLimited(retryAfter ? parseInt(retryAfter, 10) : void 0);
    }
    async function getBlobError(response) {
      var _a3, _b2, _c;
      let code;
      let message;
      try {
        const data = await response.json();
        code = (_b2 = (_a3 = data.error) == null ? void 0 : _a3.code) != null ? _b2 : "unknown_error";
        message = (_c = data.error) == null ? void 0 : _c.message;
      } catch {
        code = "unknown_error";
      }
      if ((message == null ? void 0 : message.includes("contentType")) && message.includes("is not allowed")) {
        code = "content_type_not_allowed";
      }
      if (
        (message == null ? void 0 : message.includes('"pathname"')) &&
        message.includes("does not match the token payload")
      ) {
        code = "client_token_pathname_mismatch";
      }
      if (message === "Token expired") {
        code = "client_token_expired";
      }
      if (message == null ? void 0 : message.includes("the file length cannot be greater than")) {
        code = "file_too_large";
      }
      if (
        (message == null ? void 0 : message.startsWith("OIDC is enabled for this project, but not for the")) &&
        message.includes("environment.")
      ) {
        code = "oidc_environment_not_allowed";
      }
      let error;
      switch (code) {
        case "store_suspended":
          error = new BlobStoreSuspendedError();
          break;
        case "forbidden":
          error = new BlobAccessError();
          break;
        case "oidc_environment_not_allowed":
          error = new BlobOidcEnvironmentNotAllowedError(message);
          break;
        case "content_type_not_allowed":
          error = new BlobContentTypeNotAllowedError(message);
          break;
        case "client_token_pathname_mismatch":
          error = new BlobPathnameMismatchError(message);
          break;
        case "client_token_expired":
          error = new BlobClientTokenExpiredError();
          break;
        case "file_too_large":
          error = new BlobFileTooLargeError(message);
          break;
        case "not_found":
          error = new BlobNotFoundError();
          break;
        case "client_token_not_allowed":
          error = new BlobError(
            message != null
              ? message
              : "This operation is not available when using a client token. Use a read\u2013write or OIDC token on the server.",
          );
          break;
        case "store_not_found":
          error = new BlobStoreNotFoundError();
          break;
        case "bad_request":
          error = new BlobError(message != null ? message : "Bad request");
          break;
        case "service_unavailable":
          error = new BlobServiceNotAvailable();
          break;
        case "rate_limited":
          error = createBlobServiceRateLimited(response);
          break;
        case "precondition_failed":
          error = new BlobPreconditionFailedError();
          break;
        case "unknown_error":
        case "not_allowed":
        default:
          error = new BlobUnknownError();
          break;
      }
      return {
        code,
        error,
      };
    }
    async function requestApi(pathname, init, commandOptions) {
      const apiVersion = getApiVersion();
      const auth = await resolveBlobAuth(commandOptions);
      const bearerToken = auth.kind === "presigned" ? void 0 : auth.token;
      const extraHeaders = getProxyThroughAlternativeApiHeaderFromEnv();
      let requestInput = getApiUrl(pathname);
      if (commandOptions == null ? void 0 : commandOptions.presignedUrlPayload) {
        requestInput = addPresignedParams(requestInput, commandOptions.presignedUrlPayload);
      }
      const requestId = `${auth.storeId}:${Date.now()}:${Math.random().toString(16).slice(2)}`;
      let retryCount = 0;
      let bodyLength = 0;
      let totalLoaded = 0;
      const sendBodyLength =
        (commandOptions == null ? void 0 : commandOptions.onUploadProgress) || shouldUseXContentLength();
      if (
        init.body && // 1. For upload progress we always need to know the total size of the body
        // 2. In development we need the header for put() to work correctly when passing a stream
        sendBodyLength
      ) {
        bodyLength = computeBodyLength(init.body);
      }
      if (commandOptions == null ? void 0 : commandOptions.onUploadProgress) {
        commandOptions.onUploadProgress({
          loaded: 0,
          total: bodyLength,
          percentage: 0,
        });
      }
      const apiResponse = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$async$2d$retry$40$1$2e$3$2e$3$2f$node_modules$2f$async$2d$retry$2f$lib$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "default"
      ])(
        async (bail) => {
          let res;
          try {
            res = await blobRequest({
              input: requestInput,
              init: {
                ...init,
                headers: {
                  "x-api-blob-request-id": requestId,
                  // Store ID is not encoded in OIDC token, so pass it separately as a header
                  "x-vercel-blob-store-id": auth.storeId,
                  "x-api-blob-request-attempt": String(retryCount),
                  "x-api-version": apiVersion,
                  ...(sendBodyLength
                    ? {
                        "x-content-length": String(bodyLength),
                      }
                    : {}),
                  ...(bearerToken !== void 0
                    ? {
                        authorization: `Bearer ${bearerToken}`,
                      }
                    : {}),
                  ...extraHeaders,
                  ...init.headers,
                },
              },
              onUploadProgress: (commandOptions == null ? void 0 : commandOptions.onUploadProgress)
                ? (loaded) => {
                    var _a3;
                    const total = bodyLength !== 0 ? bodyLength : loaded;
                    totalLoaded = loaded;
                    const percentage = bodyLength > 0 ? Number(((loaded / total) * 100).toFixed(2)) : 0;
                    if (percentage === 100 && bodyLength > 0) {
                      return;
                    }
                    (_a3 = commandOptions.onUploadProgress) == null
                      ? void 0
                      : _a3.call(commandOptions, {
                          loaded,
                          // When passing a stream to put(), we have no way to know the total size of the body.
                          // Instead of defining total as total?: number we decided to set the total to the currently
                          // loaded number. This is not inaccurate and way more practical for DX.
                          // Passing down a stream to put() is very rare
                          total,
                          percentage,
                        });
                  }
                : void 0,
            });
          } catch (error2) {
            if (error2 instanceof DOMException2 && error2.name === "AbortError") {
              bail(new BlobRequestAbortedError());
              return;
            }
            if (isNetworkError(error2)) {
              throw error2;
            }
            if (error2 instanceof TypeError) {
              bail(error2);
              return;
            }
            throw error2;
          }
          if (res.ok) {
            return res;
          }
          const { code, error } = await getBlobError(res);
          if (code === "unknown_error" || code === "service_unavailable" || code === "internal_server_error") {
            throw error;
          }
          bail(error);
        },
        {
          retries: getRetries(),
          onRetry: (error) => {
            if (error instanceof Error) {
              debug(`retrying API request to ${pathname}`, error.message);
            }
            retryCount = retryCount + 1;
          },
        },
      );
      if (!apiResponse) {
        throw new BlobUnknownError();
      }
      if (commandOptions == null ? void 0 : commandOptions.onUploadProgress) {
        commandOptions.onUploadProgress({
          loaded: totalLoaded,
          total: totalLoaded,
          percentage: 100,
        });
      }
      return await apiResponse.json();
    }
    function getProxyThroughAlternativeApiHeaderFromEnv() {
      const extraHeaders = {};
      try {
        if (
          "VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API" in process.env &&
          process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API !== void 0
        ) {
          extraHeaders["x-proxy-through-alternative-api"] = process.env.VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API;
        } else if (
          "NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API" in process.env &&
          process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API !== void 0
        ) {
          extraHeaders["x-proxy-through-alternative-api"] =
            process.env.NEXT_PUBLIC_VERCEL_BLOB_PROXY_THROUGH_ALTERNATIVE_API;
        }
      } catch {}
      return extraHeaders;
    }
    function shouldUseXContentLength() {
      try {
        return process.env.VERCEL_BLOB_USE_X_CONTENT_LENGTH === "1";
      } catch {
        return false;
      }
    }
    // src/put-helpers.ts
    var optimizeImageFormatToMimeType = {
      jpeg: "image/jpeg",
      png: "image/png",
      webp: "image/webp",
      avif: "image/avif",
    };
    function validateOptimizeImageOptions(optimizeImage) {
      if (typeof optimizeImage !== "object" || optimizeImage === null) {
        throw new BlobError("optimizeImage must be an object, see usage");
      }
      const { width, quality, format } = optimizeImage;
      if (!Number.isInteger(width) || width < 1 || width > 8192) {
        throw new BlobError("optimizeImage.width must be an integer between 1 and 8192");
      }
      if (quality !== void 0 && (!Number.isInteger(quality) || quality < 1 || quality > 100)) {
        throw new BlobError("optimizeImage.quality must be an integer between 1 and 100");
      }
      if (format !== void 0 && !(format in optimizeImageFormatToMimeType)) {
        throw new BlobError(
          `optimizeImage.format must be one of: ${Object.keys(optimizeImageFormatToMimeType).join(", ")}`,
        );
      }
    }
    function validateOptimizeImageSourceContentType(contentType) {
      if (contentType && contentType !== "application/octet-stream" && !contentType.startsWith("image/")) {
        throw new BlobError(`optimizeImage requires an image body, but the content type is "${contentType}"`);
      }
    }
    function addOptimizeImageParams(params, optimizeImage) {
      var _a3;
      validateOptimizeImageOptions(optimizeImage);
      params.set("width", String(optimizeImage.width));
      params.set("quality", String((_a3 = optimizeImage.quality) != null ? _a3 : 75));
      if (optimizeImage.format) {
        params.set("format", optimizeImageFormatToMimeType[optimizeImage.format]);
      }
    }
    var putOptionHeaderMap = {
      cacheControlMaxAge: "x-cache-control-max-age",
      addRandomSuffix: "x-add-random-suffix",
      allowOverwrite: "x-allow-overwrite",
      contentType: "x-content-type",
      access: "x-vercel-blob-access",
      ifMatch: "x-if-match",
    };
    function createPutHeaders(allowedOptions, options) {
      const headers = {};
      headers[putOptionHeaderMap.access] = options.access;
      if (allowedOptions.includes("contentType") && options.contentType) {
        headers[putOptionHeaderMap.contentType] = options.contentType;
      }
      if (allowedOptions.includes("addRandomSuffix") && options.addRandomSuffix !== void 0) {
        headers[putOptionHeaderMap.addRandomSuffix] = options.addRandomSuffix ? "1" : "0";
      }
      if (allowedOptions.includes("ifMatch") && options.ifMatch) {
        if (options.allowOverwrite === false) {
          throw new BlobError(
            "ifMatch and allowOverwrite: false are contradictory. ifMatch is used for conditional overwrites, which requires allowOverwrite to be true.",
          );
        }
        headers[putOptionHeaderMap.ifMatch] = options.ifMatch;
        if (allowedOptions.includes("allowOverwrite") && options.allowOverwrite === void 0) {
          headers[putOptionHeaderMap.allowOverwrite] = "1";
        }
      }
      if (allowedOptions.includes("allowOverwrite") && options.allowOverwrite !== void 0) {
        headers[putOptionHeaderMap.allowOverwrite] = options.allowOverwrite ? "1" : "0";
      }
      if (allowedOptions.includes("cacheControlMaxAge") && options.cacheControlMaxAge !== void 0) {
        headers[putOptionHeaderMap.cacheControlMaxAge] = options.cacheControlMaxAge.toString();
      }
      return headers;
    }
    async function createPutOptions({ pathname, options, extraChecks, getToken }) {
      if (!pathname) {
        throw new BlobError("pathname is required");
      }
      if (pathname.length > MAXIMUM_PATHNAME_LENGTH) {
        throw new BlobError(`pathname is too long, maximum length is ${MAXIMUM_PATHNAME_LENGTH}`);
      }
      for (const invalidCharacter of disallowedPathnameCharacters) {
        if (pathname.includes(invalidCharacter)) {
          throw new BlobError(`pathname cannot contain "${invalidCharacter}", please encode it if needed`);
        }
      }
      if (!options) {
        throw new BlobError("missing options, see usage");
      }
      if (options.access !== "public" && options.access !== "private") {
        throw new BlobError('access must be "private" or "public", see https://vercel.com/docs/vercel-blob');
      }
      if (extraChecks) {
        extraChecks(options);
      }
      if (getToken) {
        options.token = await getToken(pathname, options);
      }
      return options;
    }
    // src/multipart/complete.ts
    function createCompleteMultipartUploadMethod({ allowedOptions, getToken, extraChecks }) {
      return async (pathname, parts, optionsInput) => {
        const options = await createPutOptions({
          pathname,
          options: optionsInput,
          extraChecks,
          getToken,
        });
        const headers = createPutHeaders(allowedOptions, options);
        return completeMultipartUpload({
          uploadId: options.uploadId,
          key: options.key,
          pathname,
          headers,
          options,
          parts,
        });
      };
    }
    async function completeMultipartUpload({ uploadId, key, pathname, parts, headers, options }) {
      const params = new URLSearchParams({
        pathname,
      });
      try {
        const response = await requestApi(
          `/mpu?${params.toString()}`,
          {
            method: "POST",
            headers: {
              ...headers,
              "content-type": "application/json",
              "x-mpu-action": "complete",
              "x-mpu-upload-id": uploadId,
              // key can be any utf8 character so we need to encode it as HTTP headers can only be us-ascii
              // https://www.rfc-editor.org/rfc/rfc7230#swection-3.2.4
              "x-mpu-key": encodeURIComponent(key),
            },
            body: JSON.stringify(parts),
            signal: options.abortSignal,
          },
          options,
        );
        debug("mpu: complete", response);
        return response;
      } catch (error) {
        if (error instanceof TypeError && (error.message === "Failed to fetch" || error.message === "fetch failed")) {
          throw new BlobServiceNotAvailable();
        } else {
          throw error;
        }
      }
    }
    // src/multipart/create.ts
    function createCreateMultipartUploadMethod({ allowedOptions, getToken, extraChecks }) {
      return async (pathname, optionsInput) => {
        const options = await createPutOptions({
          pathname,
          options: optionsInput,
          extraChecks,
          getToken,
        });
        const headers = createPutHeaders(allowedOptions, options);
        const createMultipartUploadResponse = await createMultipartUpload(pathname, headers, options);
        return {
          key: createMultipartUploadResponse.key,
          uploadId: createMultipartUploadResponse.uploadId,
        };
      };
    }
    async function createMultipartUpload(pathname, headers, options) {
      debug("mpu: create", "pathname:", pathname);
      const params = new URLSearchParams({
        pathname,
      });
      try {
        const response = await requestApi(
          `/mpu?${params.toString()}`,
          {
            method: "POST",
            headers: {
              ...headers,
              "x-mpu-action": "create",
            },
            signal: options.abortSignal,
          },
          options,
        );
        debug("mpu: create", response);
        return response;
      } catch (error) {
        if (error instanceof TypeError && (error.message === "Failed to fetch" || error.message === "fetch failed")) {
          throw new BlobServiceNotAvailable();
        }
        throw error;
      }
    }
    function createUploadPartMethod({ allowedOptions, getToken, extraChecks }) {
      return async (pathname, body, optionsInput) => {
        const options = await createPutOptions({
          pathname,
          options: optionsInput,
          extraChecks,
          getToken,
        });
        const headers = createPutHeaders(allowedOptions, options);
        if (isPlainObject(body)) {
          throw new BlobError(
            "Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.",
          );
        }
        const result = await uploadPart({
          uploadId: options.uploadId,
          key: options.key,
          pathname,
          part: {
            blob: body,
            partNumber: options.partNumber,
          },
          headers,
          options,
        });
        return {
          etag: result.etag,
          partNumber: options.partNumber,
        };
      };
    }
    async function uploadPart({
      uploadId,
      key,
      pathname,
      headers,
      options,
      internalAbortController = new AbortController(),
      part,
    }) {
      var _a3, _b2, _c;
      const params = new URLSearchParams({
        pathname,
      });
      const responsePromise = requestApi(
        `/mpu?${params.toString()}`,
        {
          signal: internalAbortController.signal,
          method: "POST",
          headers: {
            ...headers,
            "x-mpu-action": "upload",
            "x-mpu-key": encodeURIComponent(key),
            "x-mpu-upload-id": uploadId,
            "x-mpu-part-number": part.partNumber.toString(),
          },
          // weird things between undici types and native fetch types
          body: part.blob,
        },
        options,
      );
      function handleAbort() {
        internalAbortController.abort();
      }
      if ((_a3 = options.abortSignal) == null ? void 0 : _a3.aborted) {
        handleAbort();
      } else {
        (_b2 = options.abortSignal) == null ? void 0 : _b2.addEventListener("abort", handleAbort);
      }
      const response = await responsePromise;
      (_c = options.abortSignal) == null ? void 0 : _c.removeEventListener("abort", handleAbort);
      return response;
    }
    var maxConcurrentUploads = ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : 8;
    var partSizeInBytes = 8 * 1024 * 1024;
    var maxBytesInMemory = maxConcurrentUploads * partSizeInBytes * 2;
    function uploadAllParts({ uploadId, key, pathname, stream, headers, options, totalToLoad }) {
      debug("mpu: upload init", "key:", key);
      const internalAbortController = new AbortController();
      return new Promise((resolve, reject) => {
        const partsToUpload = [];
        const completedParts = [];
        const reader = stream.getReader();
        let activeUploads = 0;
        let reading = false;
        let currentPartNumber = 1;
        let rejected = false;
        let currentBytesInMemory = 0;
        let doneReading = false;
        let bytesSent = 0;
        let arrayBuffers = [];
        let currentPartBytesRead = 0;
        let onUploadProgress;
        const totalLoadedPerPartNumber = {};
        if (options.onUploadProgress) {
          onUploadProgress = (0,
          __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$throttleit$40$2$2e$1$2e$0$2f$node_modules$2f$throttleit$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "default"
          ])(() => {
            var _a3;
            const loaded = Object.values(totalLoadedPerPartNumber).reduce((acc, cur) => {
              return acc + cur;
            }, 0);
            const total = totalToLoad || loaded;
            const percentage = totalToLoad > 0 ? Number(((loaded / totalToLoad || loaded) * 100).toFixed(2)) : 0;
            (_a3 = options.onUploadProgress) == null
              ? void 0
              : _a3.call(options, {
                  loaded,
                  total,
                  percentage,
                });
          }, 150);
        }
        read().catch(cancel);
        async function read() {
          debug(
            "mpu: upload read start",
            "activeUploads:",
            activeUploads,
            "currentBytesInMemory:",
            `${bytes(currentBytesInMemory)}/${bytes(maxBytesInMemory)}`,
            "bytesSent:",
            bytes(bytesSent),
          );
          reading = true;
          while (currentBytesInMemory < maxBytesInMemory && !rejected) {
            try {
              const { value, done } = await reader.read();
              if (done) {
                doneReading = true;
                debug("mpu: upload read consumed the whole stream");
                if (arrayBuffers.length > 0) {
                  partsToUpload.push({
                    partNumber: currentPartNumber++,
                    blob: new Blob(arrayBuffers, {
                      type: "application/octet-stream",
                    }),
                  });
                  sendParts();
                } else if (activeUploads === 0) {
                  reader.releaseLock();
                  resolve(completedParts);
                }
                reading = false;
                return;
              }
              currentBytesInMemory += value.byteLength;
              let valueOffset = 0;
              while (valueOffset < value.byteLength) {
                const remainingPartSize = partSizeInBytes - currentPartBytesRead;
                const endOffset = Math.min(valueOffset + remainingPartSize, value.byteLength);
                const chunk = value.slice(valueOffset, endOffset);
                arrayBuffers.push(chunk);
                currentPartBytesRead += chunk.byteLength;
                valueOffset = endOffset;
                if (currentPartBytesRead === partSizeInBytes) {
                  partsToUpload.push({
                    partNumber: currentPartNumber++,
                    blob: new Blob(arrayBuffers, {
                      type: "application/octet-stream",
                    }),
                  });
                  arrayBuffers = [];
                  currentPartBytesRead = 0;
                  sendParts();
                }
              }
            } catch (error) {
              cancel(error);
            }
          }
          debug(
            "mpu: upload read end",
            "activeUploads:",
            activeUploads,
            "currentBytesInMemory:",
            `${bytes(currentBytesInMemory)}/${bytes(maxBytesInMemory)}`,
            "bytesSent:",
            bytes(bytesSent),
          );
          reading = false;
        }
        async function sendPart(part) {
          activeUploads++;
          debug(
            "mpu: upload send part start",
            "partNumber:",
            part.partNumber,
            "size:",
            part.blob.size,
            "activeUploads:",
            activeUploads,
            "currentBytesInMemory:",
            `${bytes(currentBytesInMemory)}/${bytes(maxBytesInMemory)}`,
            "bytesSent:",
            bytes(bytesSent),
          );
          try {
            const uploadProgressForPart = options.onUploadProgress
              ? (event) => {
                  totalLoadedPerPartNumber[part.partNumber] = event.loaded;
                  if (onUploadProgress) {
                    onUploadProgress();
                  }
                }
              : void 0;
            const completedPart = await uploadPart({
              uploadId,
              key,
              pathname,
              headers,
              options: {
                ...options,
                onUploadProgress: uploadProgressForPart,
              },
              internalAbortController,
              part,
            });
            debug(
              "mpu: upload send part end",
              "partNumber:",
              part.partNumber,
              "activeUploads",
              activeUploads,
              "currentBytesInMemory:",
              `${bytes(currentBytesInMemory)}/${bytes(maxBytesInMemory)}`,
              "bytesSent:",
              bytes(bytesSent),
            );
            if (rejected) {
              return;
            }
            completedParts.push({
              partNumber: part.partNumber,
              etag: completedPart.etag,
            });
            currentBytesInMemory -= part.blob.size;
            activeUploads--;
            bytesSent += part.blob.size;
            if (partsToUpload.length > 0) {
              sendParts();
            }
            if (doneReading) {
              if (activeUploads === 0) {
                reader.releaseLock();
                resolve(completedParts);
              }
              return;
            }
            if (!reading) {
              read().catch(cancel);
            }
          } catch (error) {
            cancel(error);
          }
        }
        function sendParts() {
          if (rejected) {
            return;
          }
          debug("send parts", "activeUploads", activeUploads, "partsToUpload", partsToUpload.length);
          while (activeUploads < maxConcurrentUploads && partsToUpload.length > 0) {
            const partToSend = partsToUpload.shift();
            if (partToSend) {
              void sendPart(partToSend);
            }
          }
        }
        function cancel(error) {
          if (rejected) {
            return;
          }
          rejected = true;
          internalAbortController.abort();
          reader.releaseLock();
          if (error instanceof TypeError && (error.message === "Failed to fetch" || error.message === "fetch failed")) {
            reject(new BlobServiceNotAvailable());
          } else {
            reject(error);
          }
        }
      });
    }
    // src/multipart/create-uploader.ts
    function createCreateMultipartUploaderMethod({ allowedOptions, getToken, extraChecks }) {
      return async (pathname, optionsInput) => {
        const options = await createPutOptions({
          pathname,
          options: optionsInput,
          extraChecks,
          getToken,
        });
        const headers = createPutHeaders(allowedOptions, options);
        const createMultipartUploadResponse = await createMultipartUpload(pathname, headers, options);
        return {
          key: createMultipartUploadResponse.key,
          uploadId: createMultipartUploadResponse.uploadId,
          async uploadPart(partNumber, body) {
            if (isPlainObject(body)) {
              throw new BlobError(
                "Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.",
              );
            }
            const result = await uploadPart({
              uploadId: createMultipartUploadResponse.uploadId,
              key: createMultipartUploadResponse.key,
              pathname,
              part: {
                partNumber,
                blob: body,
              },
              headers,
              options,
            });
            return {
              etag: result.etag,
              partNumber,
            };
          },
          async complete(parts) {
            return completeMultipartUpload({
              uploadId: createMultipartUploadResponse.uploadId,
              key: createMultipartUploadResponse.key,
              pathname,
              parts,
              headers,
              options,
            });
          },
        };
      };
    }
    // src/multipart/uncontrolled.ts
    async function uncontrolledMultipartUpload(pathname, body, headers, options) {
      debug("mpu: init", "pathname:", pathname, "headers:", headers);
      const optionsWithoutOnUploadProgress = {
        ...options,
        onUploadProgress: void 0,
      };
      if (
        options.maximumSizeInBytes !== void 0 &&
        !isStream(body) &&
        computeBodyLength(body) > options.maximumSizeInBytes
      ) {
        throw new BlobError(
          `Body size of ${computeBodyLength(body)} bytes exceeds the maximum allowed size of ${options.maximumSizeInBytes} bytes`,
        );
      }
      const createMultipartUploadResponse = await createMultipartUpload(
        pathname,
        headers,
        optionsWithoutOnUploadProgress,
      );
      const totalToLoad = computeBodyLength(body);
      const stream = await toReadableStream(body);
      const parts = await uploadAllParts({
        uploadId: createMultipartUploadResponse.uploadId,
        key: createMultipartUploadResponse.key,
        pathname,
        // @ts-expect-error ReadableStream<ArrayBuffer | Uint8Array> is compatible at runtime
        stream,
        headers,
        options,
        totalToLoad,
      });
      const blob = await completeMultipartUpload({
        uploadId: createMultipartUploadResponse.uploadId,
        key: createMultipartUploadResponse.key,
        pathname,
        parts,
        headers,
        options: optionsWithoutOnUploadProgress,
      });
      return blob;
    }
    // src/put.ts
    function createPutMethod({ allowedOptions, getToken, getPresignedUrlPayload, extraChecks }) {
      return async function put(pathname, body, optionsInput) {
        var _a3;
        if (!body) {
          throw new BlobError("body is required");
        }
        if (isPlainObject(body)) {
          throw new BlobError(
            "Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.",
          );
        }
        const options = await createPutOptions({
          pathname,
          options: optionsInput,
          extraChecks,
          getToken,
        });
        const presignedUrlPayload = await (getPresignedUrlPayload == null
          ? void 0
          : getPresignedUrlPayload(pathname, options));
        const optionsWithPresignedUrlPayload = {
          ...options,
          presignedUrlPayload,
        };
        const headers = createPutHeaders(allowedOptions, options);
        if (options.optimizeImage) {
          if (options.multipart === true) {
            throw new BlobError("optimizeImage cannot be combined with multipart uploads");
          }
          validateOptimizeImageSourceContentType(
            (_a3 = options.contentType) != null
              ? _a3
              : typeof Blob !== "undefined" && body instanceof Blob
                ? body.type
                : void 0,
          );
          const params2 = new URLSearchParams({
            pathname,
          });
          addOptimizeImageParams(params2, options.optimizeImage);
          const response2 = await requestApi(
            `/put-optimized?${params2.toString()}`,
            {
              method: "POST",
              body,
              headers,
              signal: options.abortSignal,
            },
            optionsWithPresignedUrlPayload,
          );
          return {
            url: response2.url,
            downloadUrl: response2.downloadUrl,
            pathname: response2.pathname,
            contentType: response2.contentType,
            contentDisposition: response2.contentDisposition,
            etag: response2.etag,
          };
        }
        if (options.multipart === true) {
          return uncontrolledMultipartUpload(pathname, body, headers, optionsWithPresignedUrlPayload);
        }
        const onUploadProgress = options.onUploadProgress
          ? (0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$throttleit$40$2$2e$1$2e$0$2f$node_modules$2f$throttleit$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
              "default"
            ])(options.onUploadProgress, 100)
          : void 0;
        const params = new URLSearchParams({
          pathname,
        });
        const response = await requestApi(
          `/?${params.toString()}`,
          {
            method: "PUT",
            body,
            headers,
            signal: options.abortSignal,
          },
          {
            ...optionsWithPresignedUrlPayload,
            onUploadProgress,
          },
        );
        return {
          url: response.url,
          downloadUrl: response.downloadUrl,
          pathname: response.pathname,
          contentType: response.contentType,
          contentDisposition: response.contentDisposition,
          etag: response.etag,
        };
      };
    }
    // src/presign-query-params.ts
    var BLOB_PRESIGN_QUERY_VALID_UNTIL = "vercel-blob-valid-until";
    var BLOB_PRESIGN_QUERY_MAXIMUM_SIZE = "vercel-blob-maximum-size-in-bytes";
    var BLOB_PRESIGN_QUERY_ALLOWED_CONTENT_TYPES = "vercel-blob-allowed-content-types";
    var BLOB_PRESIGN_QUERY_ADD_RANDOM_SUFFIX = "vercel-blob-add-random-suffix";
    var BLOB_PRESIGN_QUERY_ALLOW_OVERWRITE = "vercel-blob-allow-overwrite";
    var BLOB_PRESIGN_QUERY_CACHE_CONTROL_MAX_AGE = "vercel-blob-cache-control-max-age";
    var BLOB_PRESIGN_QUERY_IF_MATCH = "vercel-blob-if-match";
    var BLOB_PRESIGN_QUERY_CALLBACK_URL = "vercel-blob-callback-url";
    var BLOB_PRESIGN_QUERY_CALLBACK_TOKEN_PAYLOAD = "vercel-blob-callback-token-payload";
    var PRESIGN_CANONICAL_QUERY_KEYS = [
      BLOB_PRESIGN_QUERY_ADD_RANDOM_SUFFIX,
      BLOB_PRESIGN_QUERY_ALLOW_OVERWRITE,
      BLOB_PRESIGN_QUERY_ALLOWED_CONTENT_TYPES,
      BLOB_PRESIGN_QUERY_CACHE_CONTROL_MAX_AGE,
      BLOB_PRESIGN_QUERY_CALLBACK_TOKEN_PAYLOAD,
      BLOB_PRESIGN_QUERY_CALLBACK_URL,
      BLOB_PRESIGN_QUERY_IF_MATCH,
      BLOB_PRESIGN_QUERY_MAXIMUM_SIZE,
      BLOB_PRESIGN_QUERY_VALID_UNTIL,
    ];
    var MAX_PRESIGN_CALLBACK_URL_CHARS = 4096;
    var MAX_PRESIGN_CALLBACK_TOKEN_PAYLOAD_CHARS = 8192;
    function contentTypeAllowedByList(contentType, allowed) {
      const [type] = contentType.split("/");
      const wildcard = `${type}/*`;
      return allowed.includes(contentType) || (type ? allowed.includes(wildcard) : false);
    }
    function assertAllowedContentTypesSubset(optionsTypes, delegationTypes, label) {
      if (!(optionsTypes == null ? void 0 : optionsTypes.length)) {
        return;
      }
      if (!(delegationTypes == null ? void 0 : delegationTypes.length)) {
        return;
      }
      for (const ct of optionsTypes) {
        if (!contentTypeAllowedByList(ct, delegationTypes)) {
          throw new Error(`${label}: allowedContentTypes entry "${ct}" is not permitted by the delegation token.`);
        }
      }
    }
    function assertNumberSubset(name, optionVal, delegationVal, label, mode) {
      if (optionVal === void 0) {
        return;
      }
      if (delegationVal === void 0) {
        return;
      }
      if (mode === "lte" && optionVal > delegationVal) {
        throw new Error(`${label}: ${name} must be \u2264 delegation (${String(delegationVal)}).`);
      }
    }
    function isPlausibleAbsoluteUrl(s) {
      if (typeof URL !== "undefined" && typeof URL.canParse === "function") {
        return URL.canParse(s);
      }
      try {
        new URL(s);
        return true;
      } catch {
        return false;
      }
    }
    function validatePresignUrlOnUploadCompletedWire(opt, label) {
      if (!opt) {
        return;
      }
      if (typeof opt.callbackUrl !== "string" || opt.callbackUrl.length === 0) {
        throw new Error(`${label}: onUploadCompleted.callbackUrl must be a non-empty string.`);
      }
      if (opt.callbackUrl.length > MAX_PRESIGN_CALLBACK_URL_CHARS) {
        throw new Error(`${label}: onUploadCompleted.callbackUrl is too long.`);
      }
      if (!isPlausibleAbsoluteUrl(opt.callbackUrl)) {
        throw new Error(`${label}: onUploadCompleted.callbackUrl must be a valid URL.`);
      }
      if (opt.tokenPayload !== void 0 && opt.tokenPayload !== null) {
        if (typeof opt.tokenPayload !== "string") {
          throw new Error(`${label}: onUploadCompleted.tokenPayload must be a string.`);
        }
        if (opt.tokenPayload.length > MAX_PRESIGN_CALLBACK_TOKEN_PAYLOAD_CHARS) {
          throw new Error(`${label}: onUploadCompleted.tokenPayload is too long.`);
        }
      }
    }
    var MAX_PRESIGN_CACHE_CONTROL_MAX_AGE_SECONDS = 365 * 24 * 60 * 60;
    var MAX_PRESIGN_IF_MATCH_LENGTH = 256;
    var IF_MATCH_CONTROL_CHARS_RE = /[\x00-\x1f\x7f]/;
    function validateUrlOnlyPresignUploadOptions(urlOptions, label) {
      if (urlOptions.cacheControlMaxAge !== void 0) {
        const n = urlOptions.cacheControlMaxAge;
        if (!Number.isInteger(n) || n < 0 || n > MAX_PRESIGN_CACHE_CONTROL_MAX_AGE_SECONDS) {
          throw new Error(
            `${label}: cacheControlMaxAge must be an integer between 0 and ${MAX_PRESIGN_CACHE_CONTROL_MAX_AGE_SECONDS}.`,
          );
        }
      }
      if (urlOptions.ifMatch !== void 0) {
        const im = urlOptions.ifMatch;
        if (typeof im !== "string" || im.length === 0) {
          throw new Error(`${label}: ifMatch must be a non-empty string.`);
        }
        if (im.length > MAX_PRESIGN_IF_MATCH_LENGTH) {
          throw new Error(`${label}: ifMatch is too long.`);
        }
        if (IF_MATCH_CONTROL_CHARS_RE.test(im)) {
          throw new Error(`${label}: ifMatch contains disallowed control characters.`);
        }
      }
    }
    function sortedContentTypesCsv(types) {
      return [...types].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0)).join(",");
    }
    function resolvePresignUrlValidUntilMs(args) {
      const { delegationValidUntil, urlOptions, nowMs } = args;
      let t;
      if ((urlOptions == null ? void 0 : urlOptions.validUntil) !== void 0) {
        if (typeof urlOptions.validUntil !== "number" || !Number.isFinite(urlOptions.validUntil)) {
          throw new Error("presignUrl: validUntil must be a finite number (ms).");
        }
        t = Math.trunc(urlOptions.validUntil);
      } else {
        t = Math.trunc(delegationValidUntil);
      }
      if (Number.isFinite(delegationValidUntil)) {
        t = Math.min(t, Math.trunc(delegationValidUntil));
      }
      if (t <= nowMs) {
        throw new Error(
          "presignUrl: resolved URL expiry is not after the current time; issue a new delegation token or pass a later validUntil.",
        );
      }
      return t;
    }
    function buildPresignCanonicalQueryEntries(args) {
      const { operation, delegation, urlOptions, nowMs } = args;
      const label = "presignUrl";
      const resolvedUntil = resolvePresignUrlValidUntilMs({
        delegationValidUntil: delegation.validUntil,
        urlOptions,
        nowMs,
      });
      const delegUntil = Math.trunc(delegation.validUntil);
      const entries = [];
      if (resolvedUntil < delegUntil) {
        entries.push([BLOB_PRESIGN_QUERY_VALID_UNTIL, String(resolvedUntil)]);
      }
      if (operation === "delete") {
        if ((urlOptions == null ? void 0 : urlOptions.ifMatch) !== void 0) {
          entries.push([BLOB_PRESIGN_QUERY_IF_MATCH, urlOptions.ifMatch]);
        }
        return entries;
      }
      if (operation !== "put" || !urlOptions) {
        return entries;
      }
      assertAllowedContentTypesSubset(urlOptions.allowedContentTypes, delegation.allowedContentTypes, label);
      assertNumberSubset(
        "maximumSizeInBytes",
        urlOptions.maximumSizeInBytes,
        delegation.maximumSizeInBytes,
        label,
        "lte",
      );
      validateUrlOnlyPresignUploadOptions(urlOptions, label);
      validatePresignUrlOnUploadCompletedWire(urlOptions.onUploadCompleted, label);
      if (urlOptions.allowedContentTypes !== void 0) {
        const csv = sortedContentTypesCsv(urlOptions.allowedContentTypes);
        if (csv.length > 16384) {
          throw new Error(`${label}: allowedContentTypes query value is too long.`);
        }
        entries.push([BLOB_PRESIGN_QUERY_ALLOWED_CONTENT_TYPES, csv]);
      }
      if (urlOptions.maximumSizeInBytes !== void 0) {
        entries.push([BLOB_PRESIGN_QUERY_MAXIMUM_SIZE, String(Math.trunc(urlOptions.maximumSizeInBytes))]);
      }
      if (urlOptions.addRandomSuffix !== void 0) {
        entries.push([BLOB_PRESIGN_QUERY_ADD_RANDOM_SUFFIX, urlOptions.addRandomSuffix ? "true" : "false"]);
      }
      if (urlOptions.allowOverwrite !== void 0) {
        entries.push([BLOB_PRESIGN_QUERY_ALLOW_OVERWRITE, urlOptions.allowOverwrite ? "true" : "false"]);
      }
      if (urlOptions.cacheControlMaxAge !== void 0) {
        entries.push([BLOB_PRESIGN_QUERY_CACHE_CONTROL_MAX_AGE, String(Math.trunc(urlOptions.cacheControlMaxAge))]);
      }
      if (urlOptions.ifMatch !== void 0) {
        entries.push([BLOB_PRESIGN_QUERY_IF_MATCH, urlOptions.ifMatch]);
      }
      if (urlOptions.onUploadCompleted !== void 0) {
        const { callbackUrl, tokenPayload } = urlOptions.onUploadCompleted;
        if (callbackUrl.length > MAX_PRESIGN_CALLBACK_URL_CHARS) {
          throw new Error(`${label}: onUploadCompleted.callbackUrl is too long.`);
        }
        entries.push([BLOB_PRESIGN_QUERY_CALLBACK_URL, callbackUrl]);
        if (tokenPayload !== void 0 && tokenPayload !== null && tokenPayload !== "") {
          if (tokenPayload.length > MAX_PRESIGN_CALLBACK_TOKEN_PAYLOAD_CHARS) {
            throw new Error(`${label}: onUploadCompleted.tokenPayload is too long.`);
          }
          entries.push([BLOB_PRESIGN_QUERY_CALLBACK_TOKEN_PAYLOAD, tokenPayload]);
        }
      }
      return entries;
    }
    // src/signed-token.ts
    function assertIssueSignedTokenValidUntilOption(validUntil) {
      const now = Date.now();
      if (typeof validUntil !== "number" || !Number.isInteger(validUntil) || !Number.isFinite(validUntil)) {
        throw new BlobError("`issueSignedToken`: validUntil must be an integer milliseconds timestamp.");
      }
      if (validUntil <= now) {
        throw new BlobError("`issueSignedToken`: validUntil must be in the future.");
      }
    }
    async function issueSignedToken(options) {
      if (!options) {
        throw new BlobError("`issueSignedToken` requires an options object");
      }
      const body = {};
      if (options.pathname !== void 0) {
        body.pathname = options.pathname;
      }
      if (options.operations !== void 0) {
        if (options.operations.length === 0) {
          throw new BlobError("`operations` must be a non-empty array if provided");
        }
        body.operations = dedupeOps(options.operations);
      }
      if (options.validUntil !== void 0) {
        assertIssueSignedTokenValidUntilOption(options.validUntil);
        body.validUntil = options.validUntil;
      }
      if (options.maximumSizeInBytes !== void 0) {
        body.maximumSizeInBytes = options.maximumSizeInBytes;
      }
      if (options.allowedContentTypes !== void 0) {
        body.allowedContentTypes = options.allowedContentTypes;
      }
      return requestApi(
        "/signed-token",
        {
          method: "POST",
          headers: {
            "content-type": "application/json",
          },
          body: JSON.stringify(body),
          signal: options.abortSignal,
        },
        options,
      );
    }
    function dedupeOps(operations) {
      return Array.from(new Set(operations));
    }
    function base64UrlDecodeToString(segment) {
      let base64 = segment.replace(/-/g, "+").replace(/_/g, "/");
      const padding = 4 - (base64.length % 4);
      if (padding !== 4) {
        base64 += "=".repeat(padding);
      }
      if (typeof atob === "function") {
        return atob(base64);
      }
      if (typeof Buffer !== "undefined") {
        return Buffer.from(base64, "base64").toString("utf8");
      }
      throw new BlobError("Cannot decode base64: no atob or Buffer available.");
    }
    function tryDecodePayload(delegationToken) {
      const dot = delegationToken.indexOf(".");
      if (dot < 0) {
        return null;
      }
      const payloadSeg = delegationToken.slice(0, dot);
      try {
        return JSON.parse(base64UrlDecodeToString(payloadSeg));
      } catch {
        return null;
      }
    }
    function uint8ToBase64(bytes2) {
      if (typeof Buffer !== "undefined") {
        return Buffer.from(bytes2.buffer, bytes2.byteOffset, bytes2.byteLength).toString("base64");
      }
      let s = "";
      for (let i = 0; i < bytes2.length; i++) {
        s += String.fromCharCode(bytes2[i]);
      }
      return btoa(s);
    }
    async function hmacSha256Base64Url(key, data) {
      var _a3;
      if (!((_a3 = globalThis.crypto) == null ? void 0 : _a3.subtle)) {
        throw new BlobError("HMAC is not available: expected globalThis.crypto.subtle (Node 20+ or a modern browser).");
      }
      const enc = new TextEncoder();
      const cryptoKey = await globalThis.crypto.subtle.importKey(
        "raw",
        enc.encode(key),
        {
          name: "HMAC",
          hash: "SHA-256",
        },
        false,
        ["sign"],
      );
      const buf = await globalThis.crypto.subtle.sign("HMAC", cryptoKey, enc.encode(data));
      return toBase64Url(uint8ToBase64(new Uint8Array(buf)));
    }
    function toBase64Url(base64) {
      return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    }
    async function presign(signedToken, options) {
      var _a3, _b2, _c, _d;
      if (
        !(signedToken == null ? void 0 : signedToken.clientSigningToken) ||
        !(signedToken == null ? void 0 : signedToken.delegationToken)
      ) {
        throw new BlobError("`clientSigningToken` and `delegationToken` from `issueSignedToken` are required.");
      }
      const scope = tryDecodePayload(signedToken.delegationToken);
      if (!scope) {
        throw new BlobError("Invalid or unreadable `delegationToken` payload.");
      }
      const p = scope.pathname;
      if (p && p !== "*") {
        if (options.pathname !== p) {
          throw new BlobError(
            `Blob path does not match the signed token scope; expected \`${p}\`, got \`${options.pathname}\`.`,
          );
        }
      }
      if (Number.isFinite(scope.validUntil) && Date.now() > scope.validUntil) {
        throw new BlobError("The signed delegation has expired; issue a new token first.");
      }
      if (options.operation === "get" && !((_a3 = scope.operations) == null ? void 0 : _a3.includes("get"))) {
        throw new BlobError(
          'The delegation token is not valid for `GET` requests. Include `"get"` in `operations` when calling `issueSignedToken`.',
        );
      }
      if (options.operation === "head" && !((_b2 = scope.operations) == null ? void 0 : _b2.includes("head"))) {
        throw new BlobError(
          'The delegation token is not valid for `HEAD` requests. Include `"head"` in `operations` when calling `issueSignedToken`.',
        );
      }
      if (options.operation === "put" && !((_c = scope.operations) == null ? void 0 : _c.includes("put"))) {
        throw new BlobError(
          'The delegation token is not valid for presigned write requests. Include `"put"` in `operations` when calling `issueSignedToken`.',
        );
      }
      if (options.operation === "delete" && !((_d = scope.operations) == null ? void 0 : _d.includes("delete"))) {
        throw new BlobError(
          'The delegation token is not valid for presigned delete requests. Include `"delete"` in `operations` when calling `issueSignedToken`.',
        );
      }
      const delegationForOptions = {
        validUntil: scope.validUntil,
        maximumSizeInBytes: scope.maximumSizeInBytes,
        allowedContentTypes: scope.allowedContentTypes,
      };
      let presignEntries;
      try {
        presignEntries = buildPresignCanonicalQueryEntries({
          operation: options.operation,
          delegation: delegationForOptions,
          urlOptions: options,
          nowMs: Date.now(),
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        throw new BlobError(msg);
      }
      const canonical = canonicalString(options.pathname, presignEntries, options.operation);
      const signature = await hmacSha256Base64Url(signedToken.clientSigningToken, canonical);
      return {
        delegationToken: signedToken.delegationToken,
        signature,
        params: Object.fromEntries(presignEntries),
      };
    }
    function buildPresignedGetUrl(pathnameOrUrl, presignedUrlPayload, options) {
      const storeId = parseStoreIdFromDelegationToken(presignedUrlPayload.delegationToken);
      let blobUrl = isUrl(pathnameOrUrl) ? pathnameOrUrl : constructBlobUrl(storeId, pathnameOrUrl, options.access);
      if (options.useCache === false && options.access === "private") {
        const url = new URL(blobUrl);
        url.searchParams.set("cache", "0");
        blobUrl = url.toString();
      }
      return addPresignedParams(blobUrl, presignedUrlPayload);
    }
    function buildPresignedPutUrl(pathname, presignedUrlPayload) {
      const params = new URLSearchParams({
        pathname,
      });
      const apiUrl = getApiUrl(`/?${params.toString()}`);
      return addPresignedParams(apiUrl, presignedUrlPayload);
    }
    function buildPresignedDeleteUrl(pathname, presignedUrlPayload) {
      const params = new URLSearchParams({
        pathname,
      });
      const apiUrl = getApiUrl(`/?${params.toString()}`);
      return addPresignedParams(apiUrl, presignedUrlPayload);
    }
    async function presignUrl(signedToken, options) {
      const payload = await presign(signedToken, options);
      if (options.operation === "get" || options.operation === "head") {
        return {
          presignedUrl: buildPresignedGetUrl(options.pathname, payload, options),
        };
      }
      if (options.operation === "put") {
        return {
          presignedUrl: buildPresignedPutUrl(options.pathname, payload),
        };
      }
      if (options.operation === "delete") {
        return {
          presignedUrl: buildPresignedDeleteUrl(options.pathname, payload),
        };
      }
      throw new BlobError(`Unknown operation`);
    }
    function canonicalString(pathname, presignEntries, operation) {
      var _a3;
      const lines = [`operation=${operation}`, `pathname=${pathname}`];
      for (const k of PRESIGN_CANONICAL_QUERY_KEYS) {
        const v = (_a3 = presignEntries.find(([key]) => key === k)) == null ? void 0 : _a3[1];
        if (v) {
          lines.push(`${k}=${v}`);
        }
      }
      lines.sort((a, b) => compareUtf8(a, b));
      return lines.join("\n");
    }
    var utf8Encoder = new TextEncoder();
    function compareUtf8(a, b) {
      const ab = utf8Encoder.encode(a);
      const bb = utf8Encoder.encode(b);
      const n = Math.min(ab.length, bb.length);
      for (let i = 0; i < n; i++) {
        const d = ab[i] - bb[i];
        if (d !== 0) {
          return d;
        }
      }
      return ab.length - bb.length;
    }
    // src/create-folder.ts
    async function createFolder(
      pathname,
      options = {
        access: "public",
      },
    ) {
      var _a3;
      const access = (_a3 = options.access) != null ? _a3 : "public";
      const folderPathname = pathname.endsWith("/") ? pathname : `${pathname}/`;
      const headers = {};
      headers[putOptionHeaderMap.access] = access;
      headers[putOptionHeaderMap.addRandomSuffix] = "0";
      const params = new URLSearchParams({
        pathname: folderPathname,
      });
      const response = await requestApi(
        `/?${params.toString()}`,
        {
          method: "PUT",
          headers,
          signal: options.abortSignal,
        },
        options,
      );
      return {
        url: response.url,
        pathname: response.pathname,
      };
    }
    /*!
     * bytes
     * Copyright(c) 2012-2014 TJ Holowaychuk
     * Copyright(c) 2015 Jed Watson
     * MIT Licensed
     */
  },
  "[project]/node_modules/.pnpm/@vercel+blob@2.8.1/node_modules/@vercel/blob/dist/index.js [app-route] (ecmascript) <locals>",
  (__turbopack_context__) => {
    __turbopack_context__.s([
      "completeMultipartUpload",
      () => completeMultipartUpload,
      "copy",
      () => copy,
      "createMultipartUpload",
      () => createMultipartUpload,
      "createMultipartUploader",
      () => createMultipartUploader,
      "del",
      () => del,
      "get",
      () => get,
      "head",
      () => head,
      "list",
      () => list,
      "put",
      () => put,
      "putFromUrl",
      () => putFromUrl,
      "putImage",
      () => putImage,
      "rename",
      () => rename,
      "uploadPart",
      () => uploadPart,
    ]);
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/@vercel+blob@2.8.1/node_modules/@vercel/blob/dist/chunk-GPSPCQKX.js [app-route] (ecmascript)",
      );
    // src/get.ts
    var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$undici$40$6$2e$29$2e$0$2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ =
      __turbopack_context__.i(
        "[project]/node_modules/.pnpm/undici@6.29.0/node_modules/undici/index.js [app-route] (ecmascript)",
      );
    // src/del.ts
    async function del(urlOrPathname, options) {
      const urls = Array.isArray(urlOrPathname) ? urlOrPathname : [urlOrPathname];
      if ((options == null ? void 0 : options.ifMatch) && urls.length > 1) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("ifMatch can only be used when deleting a single URL.");
      }
      const headers = {
        "content-type": "application/json",
      };
      if (options == null ? void 0 : options.ifMatch) {
        headers["x-if-match"] = options.ifMatch;
      }
      await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        "/delete",
        {
          method: "POST",
          headers,
          body: JSON.stringify({
            urls,
          }),
          signal: options == null ? void 0 : options.abortSignal,
        },
        options,
      );
    }
    // src/head.ts
    async function head(urlOrPathname, options) {
      const searchParams = new URLSearchParams({
        url: urlOrPathname,
      });
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        `?${searchParams.toString()}`, // HEAD can't have body as a response, so we use GET
        {
          method: "GET",
          signal: options == null ? void 0 : options.abortSignal,
        },
        options,
      );
      return {
        url: response.url,
        downloadUrl: response.downloadUrl,
        pathname: response.pathname,
        size: response.size,
        contentType: response.contentType,
        contentDisposition: response.contentDisposition,
        cacheControl: response.cacheControl,
        uploadedAt: new Date(response.uploadedAt),
        etag: response.etag,
      };
    }
    function extractPathnameFromUrl(url) {
      try {
        const parsedUrl = new URL(url);
        return parsedUrl.pathname.slice(1);
      } catch {
        return url;
      }
    }
    async function get(urlOrPathname, options) {
      if (!urlOrPathname) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("url or pathname is required");
      }
      if (!options) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("missing options, see usage");
      }
      if (options.access !== "public" && options.access !== "private") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]('access must be "private" or "public", see https://vercel.com/docs/vercel-blob');
      }
      const auth = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "resolveBlobAuth"
      ])(options);
      if (auth.kind === "presigned") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("Presigned URLs are not supported for the get method");
      }
      let blobUrl;
      let pathname;
      const access = options.access;
      if (
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "isUrl"
        ])(urlOrPathname)
      ) {
        blobUrl = urlOrPathname;
        pathname = extractPathnameFromUrl(urlOrPathname);
        try {
          if (
            !(0,
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
              "isAllowedBlobUrl"
            ])(new URL(blobUrl))
          ) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
              "BlobError"
            ](
              "Invalid URL: the URL does not point to a Vercel Blob store. Use a pathname instead, see https://vercel.com/docs/vercel-blob",
            );
          }
        } catch (error) {
          if (
            error instanceof
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
              "BlobError"
            ]
          )
            throw error;
          throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "BlobError"
          ]("Invalid URL: unable to parse the provided URL");
        }
      } else {
        if (!auth.storeId) {
          throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "BlobError"
          ]("Invalid token: unable to extract store ID");
        }
        pathname = urlOrPathname;
        blobUrl = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "constructBlobUrl"
        ])(auth.storeId, pathname, access);
      }
      const requestHeaders = {
        ...(options.ifNoneMatch
          ? {
              "If-None-Match": options.ifNoneMatch,
            }
          : {}),
        authorization: `Bearer ${auth.token}`,
        ...options.headers,
      };
      let fetchUrl = blobUrl;
      if (options.useCache === false && access === "private") {
        const url = new URL(blobUrl);
        url.searchParams.set("cache", "0");
        fetchUrl = url.toString();
      }
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f$undici$40$6$2e$29$2e$0$2f$node_modules$2f$undici$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "fetch"
      ])(fetchUrl, {
        method: "GET",
        headers: requestHeaders,
        signal: options.abortSignal,
      });
      if (response.status === 304) {
        const downloadUrlObj = new URL(blobUrl);
        downloadUrlObj.searchParams.set("download", "1");
        const lastModified2 = response.headers.get("last-modified");
        return {
          statusCode: 304,
          stream: null,
          headers: response.headers,
          blob: {
            url: blobUrl,
            downloadUrl: downloadUrlObj.toString(),
            pathname,
            contentType: null,
            contentDisposition: response.headers.get("content-disposition") || "",
            cacheControl: response.headers.get("cache-control") || "",
            size: null,
            uploadedAt: lastModified2 ? new Date(lastModified2) : /* @__PURE__ */ new Date(),
            etag: response.headers.get("etag") || "",
          },
        };
      }
      if (response.status === 404) {
        return null;
      }
      if (!response.ok) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ](`Failed to fetch blob: ${response.status} ${response.statusText}`);
      }
      const stream = response.body;
      if (!stream) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("Response body is null");
      }
      const contentLength = response.headers.get("content-length");
      const lastModified = response.headers.get("last-modified");
      const downloadUrl = new URL(blobUrl);
      downloadUrl.searchParams.set("download", "1");
      return {
        statusCode: 200,
        stream,
        headers: response.headers,
        blob: {
          url: blobUrl,
          downloadUrl: downloadUrl.toString(),
          pathname,
          contentType: response.headers.get("content-type") || "application/octet-stream",
          contentDisposition: response.headers.get("content-disposition") || "",
          cacheControl: response.headers.get("cache-control") || "",
          size: contentLength ? parseInt(contentLength, 10) : 0,
          uploadedAt: lastModified ? new Date(lastModified) : /* @__PURE__ */ new Date(),
          etag: response.headers.get("etag") || "",
        },
      };
    }
    // src/list.ts
    async function list(options) {
      var _a;
      const searchParams = new URLSearchParams();
      if (options == null ? void 0 : options.limit) {
        searchParams.set("limit", options.limit.toString());
      }
      if (options == null ? void 0 : options.prefix) {
        searchParams.set("prefix", options.prefix);
      }
      if (options == null ? void 0 : options.cursor) {
        searchParams.set("cursor", options.cursor);
      }
      if (options == null ? void 0 : options.mode) {
        searchParams.set("mode", options.mode);
      }
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        `?${searchParams.toString()}`,
        {
          method: "GET",
          signal: options == null ? void 0 : options.abortSignal,
        },
        options,
      );
      if ((options == null ? void 0 : options.mode) === "folded") {
        return {
          folders: (_a = response.folders) != null ? _a : [],
          cursor: response.cursor,
          hasMore: response.hasMore,
          blobs: response.blobs.map(mapBlobResult),
        };
      }
      return {
        cursor: response.cursor,
        hasMore: response.hasMore,
        blobs: response.blobs.map(mapBlobResult),
      };
    }
    function mapBlobResult(blobResult) {
      return {
        url: blobResult.url,
        downloadUrl: blobResult.downloadUrl,
        pathname: blobResult.pathname,
        size: blobResult.size,
        uploadedAt: new Date(blobResult.uploadedAt),
        etag: blobResult.etag,
      };
    }
    // src/copy.ts
    async function copy(fromUrlOrPathname, toPathname, options) {
      if (!options) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("missing options, see usage");
      }
      if (options.access !== "public" && options.access !== "private") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]('access must be "private" or "public", see https://vercel.com/docs/vercel-blob');
      }
      if (
        toPathname.length >
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "MAXIMUM_PATHNAME_LENGTH"
        ]
      ) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ](
          `pathname is too long, maximum length is ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAXIMUM_PATHNAME_LENGTH"]}`,
        );
      }
      for (const invalidCharacter of __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "disallowedPathnameCharacters"
      ]) {
        if (toPathname.includes(invalidCharacter)) {
          throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "BlobError"
          ](`pathname cannot contain "${invalidCharacter}", please encode it if needed`);
        }
      }
      const headers = {};
      headers["x-vercel-blob-access"] = options.access;
      if (options.addRandomSuffix !== void 0) {
        headers["x-add-random-suffix"] = options.addRandomSuffix ? "1" : "0";
      }
      if (options.allowOverwrite !== void 0) {
        headers["x-allow-overwrite"] = options.allowOverwrite ? "1" : "0";
      }
      if (options.contentType) {
        headers["x-content-type"] = options.contentType;
      }
      if (options.cacheControlMaxAge !== void 0) {
        headers["x-cache-control-max-age"] = options.cacheControlMaxAge.toString();
      }
      if (options.ifMatch) {
        headers["x-if-match"] = options.ifMatch;
      }
      const params = new URLSearchParams({
        pathname: toPathname,
        fromUrl: fromUrlOrPathname,
      });
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        `?${params.toString()}`,
        {
          method: "PUT",
          headers,
          signal: options.abortSignal,
        },
        options,
      );
      return {
        url: response.url,
        downloadUrl: response.downloadUrl,
        pathname: response.pathname,
        contentType: response.contentType,
        contentDisposition: response.contentDisposition,
        etag: response.etag,
      };
    }
    // src/rename.ts
    async function rename(fromUrlOrPathname, toPathname, options) {
      if (!options) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("missing options, see usage");
      }
      if (options.access !== "public" && options.access !== "private") {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]('access must be "private" or "public", see https://vercel.com/docs/vercel-blob');
      }
      if (
        toPathname.length >
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "MAXIMUM_PATHNAME_LENGTH"
        ]
      ) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ](
          `pathname is too long, maximum length is ${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAXIMUM_PATHNAME_LENGTH"]}`,
        );
      }
      for (const invalidCharacter of __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "disallowedPathnameCharacters"
      ]) {
        if (toPathname.includes(invalidCharacter)) {
          throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "BlobError"
          ](`pathname cannot contain "${invalidCharacter}", please encode it if needed`);
        }
      }
      const headers = {};
      headers["x-vercel-blob-access"] = options.access;
      if (options.addRandomSuffix !== void 0) {
        headers["x-add-random-suffix"] = options.addRandomSuffix ? "1" : "0";
      }
      if (options.allowOverwrite !== void 0) {
        headers["x-allow-overwrite"] = options.allowOverwrite ? "1" : "0";
      }
      if (options.contentType) {
        headers["x-content-type"] = options.contentType;
      }
      if (options.cacheControlMaxAge !== void 0) {
        headers["x-cache-control-max-age"] = options.cacheControlMaxAge.toString();
      }
      if (options.ifMatch) {
        headers["x-if-match"] = options.ifMatch;
      }
      const params = new URLSearchParams({
        pathname: toPathname,
        fromUrl: fromUrlOrPathname,
      });
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        `/rename?${params.toString()}`,
        {
          method: "POST",
          headers,
          signal: options.abortSignal,
        },
        options,
      );
      return {
        url: response.url,
        downloadUrl: response.downloadUrl,
        pathname: response.pathname,
        contentType: response.contentType,
        contentDisposition: response.contentDisposition,
        etag: response.etag,
      };
    }
    // src/put-image.ts
    function toPutBlobResult(response) {
      return {
        url: response.url,
        downloadUrl: response.downloadUrl,
        pathname: response.pathname,
        contentType: response.contentType,
        contentDisposition: response.contentDisposition,
        etag: response.etag,
      };
    }
    async function putImage(pathname, bodyOrUrl, options) {
      if (!(options == null ? void 0 : options.optimizeImage)) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("optimizeImage is required, see usage");
      }
      const { optimizeImage } = options;
      if (bodyOrUrl instanceof URL) {
        if (bodyOrUrl.protocol !== "http:" && bodyOrUrl.protocol !== "https:") {
          throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
            "BlobError"
          ]("the source URL must use the http(s) protocol");
        }
        const putOptions2 = await (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "createPutOptions"
        ])({
          pathname,
          options,
        });
        const headers2 = (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "createPutHeaders"
        ])(["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "ifMatch"], putOptions2);
        const params2 = new URLSearchParams({
          pathname,
          url: bodyOrUrl.toString(),
        });
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "addOptimizeImageParams"
        ])(params2, optimizeImage);
        const response2 = await (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "requestApi"
        ])(
          `/put-from-url?${params2.toString()}`,
          {
            method: "POST",
            headers: headers2,
            signal: putOptions2.abortSignal,
          },
          putOptions2,
        );
        return toPutBlobResult(response2);
      }
      if (!bodyOrUrl) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("body is required");
      }
      if (
        (0,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "isPlainObject"
        ])(bodyOrUrl)
      ) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ](
          "Body must be a string, buffer or stream. You sent a plain JavaScript object, double check what you're trying to upload.",
        );
      }
      const putOptions = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "createPutOptions"
      ])({
        pathname,
        options,
      });
      const headers = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "createPutHeaders"
      ])(["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "ifMatch"], putOptions);
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "validateOptimizeImageSourceContentType"
      ])(typeof Blob !== "undefined" && bodyOrUrl instanceof Blob ? bodyOrUrl.type : void 0);
      const params = new URLSearchParams({
        pathname,
      });
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "addOptimizeImageParams"
      ])(params, optimizeImage);
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        `/put-optimized?${params.toString()}`,
        {
          method: "POST",
          body: bodyOrUrl,
          headers,
          signal: putOptions.abortSignal,
        },
        putOptions,
      );
      return toPutBlobResult(response);
    }
    // src/put-from-url.ts
    async function putFromUrl(pathname, url, options) {
      const putOptions = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "createPutOptions"
      ])({
        pathname,
        options,
      });
      if (!url) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("url is required");
      }
      if (!putOptions.optimizeImage) {
        throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
          "BlobError"
        ]("optimizeImage is required, see usage");
      }
      const headers = (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "createPutHeaders"
      ])(["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "ifMatch"], putOptions);
      const params = new URLSearchParams({
        pathname,
        url,
      });
      (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "addOptimizeImageParams"
      ])(params, putOptions.optimizeImage);
      const response = await (0,
      __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
        "requestApi"
      ])(
        `/put-from-url?${params.toString()}`,
        {
          method: "POST",
          headers,
          signal: putOptions.abortSignal,
        },
        putOptions,
      );
      return {
        url: response.url,
        downloadUrl: response.downloadUrl,
        pathname: response.pathname,
        contentType: response.contentType,
        contentDisposition: response.contentDisposition,
        etag: response.etag,
      };
    }
    // src/index.ts
    var put = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
      "createPutMethod"
    ])({
      allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "contentType", "ifMatch"],
    });
    var createMultipartUpload = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
      "createCreateMultipartUploadMethod"
    ])({
      allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "contentType", "ifMatch"],
    });
    var createMultipartUploader = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
      "createCreateMultipartUploaderMethod"
    ])({
      allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "contentType", "ifMatch"],
    });
    var uploadPart = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
      "createUploadPartMethod"
    ])({
      allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "contentType"],
    });
    var completeMultipartUpload = (0,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f2e$pnpm$2f40$vercel$2b$blob$40$2$2e$8$2e$1$2f$node_modules$2f40$vercel$2f$blob$2f$dist$2f$chunk$2d$GPSPCQKX$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__[
      "createCompleteMultipartUploadMethod"
    ])({
      allowedOptions: ["cacheControlMaxAge", "addRandomSuffix", "allowOverwrite", "contentType"],
    });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/envpath.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var envpath_exports = {};
    __export(envpath_exports, {
      getEnvPath: () => getEnvPath,
      prependPathEntries: () => prependPathEntries,
      setEnvPath: () => setEnvPath,
      splitPath: () => splitPath,
    });
    module.exports = __toCommonJS(envpath_exports);
    var import_node_path = __toESM(__turbopack_context__.r("[externals]/node:path [external] (node:path, cjs)"));
    function prependPathEntries(pathValue, directories) {
      const pathParts = pathValue.split(import_node_path.default.delimiter).filter(Boolean);
      const prepended = [];
      for (const directory of directories) {
        if (!pathParts.includes(directory) && !prepended.includes(directory)) {
          prepended.push(directory);
        }
      }
      if (prepended.length === 0) {
        return pathValue;
      }
      return pathValue === "" || pathValue === import_node_path.default.delimiter
        ? `${prepended.join(import_node_path.default.delimiter)}${pathValue}`
        : [...prepended, pathValue].join(import_node_path.default.delimiter);
    }
    function splitPath(pathValue) {
      return pathValue.split(import_node_path.default.delimiter).filter(Boolean);
    }
    function getEnvPath(env = process.env) {
      if (("TURBOPACK compile-time truthy", 1)) {
        return env.PATH ?? "";
      }
      //TURBOPACK unreachable
      const pathKeys = undefined;
      let index;
    }
    function setEnvPath(env = process.env, pathValue) {
      if (("TURBOPACK compile-time truthy", 1)) {
        return {
          ...env,
          PATH: pathValue,
        };
      }
      //TURBOPACK unreachable
      const normalizedEnv = undefined;
      const key = undefined;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        getEnvPath,
        prependPathEntries,
        setEnvPath,
        splitPath,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errors.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var errors_exports = {};
    __export(errors_exports, {
      VercelCliError: () => VercelCliError,
      assertValidCwd: () => assertValidCwd,
      getCliNotFoundMessage: () => getCliNotFoundMessage,
      toVercelCliError: () => toVercelCliError,
    });
    module.exports = __toCommonJS(errors_exports);
    var import_promises = __turbopack_context__.r("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
    class VercelCliError extends Error {
      constructor(options) {
        super(options.message);
        this.name = "VercelCliError";
        this.code = options.code;
        this.invocation = options.invocation;
        this.stdout = options.stdout;
        this.stderr = options.stderr;
        this.exitCode = options.exitCode;
        if (options.cause !== void 0) {
          this.cause = options.cause;
        }
      }
    }
    function getCliNotFoundMessage(diagnostics) {
      const details = [];
      const { localBinSearch } = diagnostics;
      if (localBinSearch.stopReason === "project-root-marker") {
        details.push(
          `Local bin lookup stopped at ${JSON.stringify(localBinSearch.stoppedAt)} (${JSON.stringify(localBinSearch.markerPath)}).`,
        );
      } else if (localBinSearch.stopReason === "filesystem-root") {
        details.push(
          `No project root marker was found from ${JSON.stringify(localBinSearch.searchRoot)}; local bin lookup reached the filesystem root.`,
        );
      }
      for (const skippedNodeModules of localBinSearch.skippedNodeModules) {
        details.push(`Skipped ${JSON.stringify(skippedNodeModules.directory)}: ${skippedNodeModules.reason}.`);
      }
      for (const skippedLocalBin of diagnostics.skippedLocalBins) {
        details.push(`Skipped ${JSON.stringify(skippedLocalBin.candidate)}: ${skippedLocalBin.reason}.`);
      }
      if (details.length === 0) {
        return "Unable to find a usable Vercel CLI installation.";
      }
      return ["Unable to find a usable Vercel CLI installation.", ...details].join("\n");
    }
    async function assertValidCwd(cwd) {
      try {
        if (!(await (0, import_promises.stat)(cwd)).isDirectory()) {
          throw new Error("not a directory");
        }
      } catch {
        throw new VercelCliError({
          code: "VERCEL_CLI_INVALID_CWD",
          message: `Working directory ${JSON.stringify(cwd)} does not exist or is not a directory.`,
        });
      }
    }
    function toVercelCliError(invocation, error) {
      if (typeof error === "object" && error !== null) {
        const execaError = error;
        if (execaError.code === "ENOENT") {
          return new VercelCliError({
            code: "VERCEL_CLI_NOT_FOUND",
            message: `Unable to find Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            cause: error,
          });
        }
        if (execaError.code === "EACCES" || execaError.code === "EPERM") {
          return new VercelCliError({
            code: "VERCEL_CLI_PERMISSION_DENIED",
            message: `Permission denied while executing Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            cause: error,
          });
        }
        if (execaError.timedOut) {
          return new VercelCliError({
            code: "VERCEL_CLI_TIMED_OUT",
            message: `Timed out while executing Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            cause: error,
          });
        }
        if (execaError.isCanceled) {
          return new VercelCliError({
            code: "VERCEL_CLI_CANCELED",
            message: `Canceled while executing Vercel CLI command ${JSON.stringify(invocation.command)}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            cause: error,
          });
        }
        if (execaError.signal) {
          return new VercelCliError({
            code: "VERCEL_CLI_SIGNALED",
            message: `Vercel CLI command ${JSON.stringify(invocation.command)} exited due to signal ${execaError.signal}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            cause: error,
          });
        }
        if (typeof execaError.exitCode === "number") {
          return new VercelCliError({
            code: "VERCEL_CLI_ERRORED",
            message:
              execaError.shortMessage ??
              execaError.message ??
              `Vercel CLI command ${JSON.stringify(invocation.command)} exited with code ${execaError.exitCode}.`,
            invocation,
            stdout: execaError.stdout,
            stderr: execaError.stderr,
            exitCode: execaError.exitCode,
            cause: error,
          });
        }
      }
      return new VercelCliError({
        code: "VERCEL_CLI_EXEC_FAILED",
        message: `Could not execute Vercel CLI command ${JSON.stringify(invocation.command)}.`,
        invocation,
        cause: error,
      });
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        VercelCliError,
        assertValidCwd,
        getCliNotFoundMessage,
        toVercelCliError,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errutils.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var errutils_exports = {};
    __export(errutils_exports, {
      getErrorMessage: () => getErrorMessage,
      isMissingPathError: () => isMissingPathError,
    });
    module.exports = __toCommonJS(errutils_exports);
    function getErrorMessage(error) {
      if (error instanceof Error) {
        return error.message;
      }
      return String(error);
    }
    function isMissingPathError(error) {
      return (
        typeof error === "object" &&
        error !== null &&
        "code" in error &&
        (error.code === "ENOENT" || error.code === "ENOTDIR")
      );
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        getErrorMessage,
        isMissingPathError,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/exec.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var exec_exports = {};
    __export(exec_exports, {
      execVercelCli: () => execVercelCli,
    });
    module.exports = __toCommonJS(exec_exports);
    var import_node_path = __toESM(__turbopack_context__.r("[externals]/node:path [external] (node:path, cjs)"));
    var import_execa = __toESM(
      __turbopack_context__.r(
        "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/index.js [app-route] (ecmascript)",
      ),
    );
    var import_envpath = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/envpath.js [app-route] (ecmascript)",
    );
    var import_errors = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errors.js [app-route] (ecmascript)",
    );
    var import_lookup = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/lookup.js [app-route] (ecmascript)",
    );
    async function execVercelCli(args, options = {}) {
      const cwd = import_node_path.default.resolve(options.cwd ?? process.cwd());
      await (0, import_errors.assertValidCwd)(cwd);
      const env = mergeExecEnv(options.env);
      const pathValue = (0, import_envpath.getEnvPath)(env);
      try {
        return await execResolvedVercelCli(args, options, cwd, env, pathValue);
      } catch (error) {
        if (error instanceof import_errors.VercelCliError && error.code === "VERCEL_CLI_NOT_FOUND") {
          (0, import_lookup.clearCachedCliInvocation)(cwd, pathValue);
          return await execResolvedVercelCli(args, options, cwd, env, pathValue);
        }
        throw error;
      }
    }
    async function execResolvedVercelCli(args, options, cwd, env, pathValue) {
      const invocation = await resolveInvocationOrThrow(cwd, pathValue);
      try {
        const execaOptions = {
          input: options.input,
          stdio: options.stdio,
          stdin: options.stdin,
          stdout: options.stdout,
          stderr: options.stderr,
          timeout: options.timeout,
          cwd,
          env: await prependLocalBinsToEnvPath(cwd, env),
          windowsHide: true,
        };
        if (options.signal) {
          execaOptions.signal = options.signal;
        }
        const { stdout, stderr } = await (0, import_execa.default)(
          invocation.command,
          [...invocation.commandArgs, ...args],
          execaOptions,
        );
        return {
          stdout,
          stderr,
          invocation,
        };
      } catch (error) {
        throw (0, import_errors.toVercelCliError)(invocation, error);
      }
    }
    async function resolveInvocationOrThrow(cwd, pathValue) {
      const resolution = await (0, import_lookup.resolveCachedCliInvocation)(cwd, pathValue);
      if (!resolution.found) {
        throw new import_errors.VercelCliError({
          code: "VERCEL_CLI_NOT_FOUND",
          message: (0, import_errors.getCliNotFoundMessage)(resolution.diagnostics),
        });
      }
      return (0, import_lookup.toVercelCliInvocation)(resolution);
    }
    function mergeExecEnv(env) {
      if (!env) {
        return process.env;
      }
      return {
        ...process.env,
        ...env,
      };
    }
    async function prependLocalBinsToEnvPath(cwd, env = process.env) {
      const localPath = await prependLocalBinsToPath(cwd, (0, import_envpath.getEnvPath)(env));
      return (0, import_envpath.setEnvPath)(
        env,
        (0, import_envpath.prependPathEntries)(localPath, [import_node_path.default.dirname(process.execPath)]),
      );
    }
    async function prependLocalBinsToPath(cwd, pathValue = "") {
      return (0, import_envpath.prependPathEntries)(
        pathValue,
        (await (0, import_lookup.getLocalBinSearch)(cwd)).directories,
      );
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        execVercelCli,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/fsutils.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var fsutils_exports = {};
    __export(fsutils_exports, {
      getCanonicalPath: () => getCanonicalPath,
      getCommandBase: () => getCommandBase,
      getDirectoriesBetween: () => getDirectoriesBetween,
      isNodeScript: () => isNodeScript,
      isSubpath: () => isSubpath,
      statIfExists: () => statIfExists,
    });
    module.exports = __toCommonJS(fsutils_exports);
    var import_promises = __turbopack_context__.r("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
    var import_node_path = __toESM(__turbopack_context__.r("[externals]/node:path [external] (node:path, cjs)"));
    var import_errutils = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errutils.js [app-route] (ecmascript)",
    );
    async function getCanonicalPath(filePath) {
      try {
        return await (0, import_promises.realpath)(filePath);
      } catch {
        return filePath;
      }
    }
    function getDirectoriesBetween(parent, child) {
      const directories = [];
      let current = import_node_path.default.resolve(child);
      const resolvedParent = import_node_path.default.resolve(parent);
      while (true) {
        directories.push(current);
        if (current === resolvedParent) {
          return directories.reverse();
        }
        const next = import_node_path.default.dirname(current);
        if (next === current) {
          return [];
        }
        current = next;
      }
    }
    async function statIfExists(filePath) {
      try {
        return {
          stats: await (0, import_promises.stat)(filePath),
        };
      } catch (error) {
        if ((0, import_errutils.isMissingPathError)(error)) {
          return {
            missing: true,
          };
        }
        return {
          reason: `could not inspect: ${(0, import_errutils.getErrorMessage)(error)}`,
        };
      }
    }
    function isNodeScript(filePath) {
      return [".js", ".cjs", ".mjs"].includes(import_node_path.default.extname(filePath));
    }
    function isSubpath(parent, child) {
      const relativePath = import_node_path.default.relative(parent, child);
      return (
        relativePath === "" ||
        (relativePath !== "" && !relativePath.startsWith("..") && !import_node_path.default.isAbsolute(relativePath))
      );
    }
    function getCommandBase(command) {
      const extension = import_node_path.default.extname(command).toLowerCase();
      if (
        process.platform === "win32" &&
        [".cmd", ".exe"].includes(extension) //TURBOPACK unreachable
      );
      return import_node_path.default.basename(command);
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        getCanonicalPath,
        getCommandBase,
        getDirectoriesBetween,
        isNodeScript,
        isSubpath,
        statIfExists,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var src_exports = {};
    __export(src_exports, {
      VercelCliError: () => import_errors.VercelCliError,
      clearVercelCliLookupCache: () => import_lookup.clearVercelCliLookupCache,
      execVercelCli: () => import_exec.execVercelCli,
      findVercelCli: () => import_lookup.findVercelCli,
    });
    module.exports = __toCommonJS(src_exports);
    var import_errors = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errors.js [app-route] (ecmascript)",
    );
    var import_exec = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/exec.js [app-route] (ecmascript)",
    );
    var import_lookup = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/lookup.js [app-route] (ecmascript)",
    );
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        VercelCliError,
        clearVercelCliLookupCache,
        execVercelCli,
        findVercelCli,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/lookup.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var lookup_exports = {};
    __export(lookup_exports, {
      clearCachedCliInvocation: () => clearCachedCliInvocation,
      clearVercelCliLookupCache: () => clearVercelCliLookupCache,
      findVercelCli: () => findVercelCli,
      getLocalBinSearch: () => getLocalBinSearch,
      resolveCachedCliInvocation: () => resolveCachedCliInvocation,
      toVercelCliInvocation: () => toVercelCliInvocation,
    });
    module.exports = __toCommonJS(lookup_exports);
    var import_promises = __turbopack_context__.r("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
    var import_node_path = __toESM(__turbopack_context__.r("[externals]/node:path [external] (node:path, cjs)"));
    var import_envpath = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/envpath.js [app-route] (ecmascript)",
    );
    var import_errutils = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errutils.js [app-route] (ecmascript)",
    );
    var import_fsutils = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/fsutils.js [app-route] (ecmascript)",
    );
    var import_safety = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/safety.js [app-route] (ecmascript)",
    );
    const cliInvocationCache = /* @__PURE__ */ new Map();
    async function findVercelCli(options = {}) {
      const cwd = import_node_path.default.resolve(options.cwd ?? process.cwd());
      const pathValue = options.path ?? (0, import_envpath.getEnvPath)(process.env);
      const resolution = await resolveCachedCliInvocation(cwd, pathValue);
      return resolution.found ? toVercelCliInvocation(resolution) : null;
    }
    function resolveCachedCliInvocation(cwd, pathValue) {
      const cacheKey = getCliInvocationCacheKey(cwd, pathValue);
      if (cliInvocationCache.has(cacheKey)) {
        return cliInvocationCache.get(cacheKey);
      }
      const resolution = resolveCliInvocation(cwd, pathValue).catch((error) => {
        cliInvocationCache.delete(cacheKey);
        throw error;
      });
      cliInvocationCache.set(cacheKey, resolution);
      return resolution;
    }
    function toVercelCliInvocation(resolution) {
      return {
        command: resolution.command,
        commandArgs: resolution.commandArgs,
        source: resolution.source,
      };
    }
    function clearVercelCliLookupCache() {
      cliInvocationCache.clear();
    }
    function clearCachedCliInvocation(cwd, pathValue) {
      cliInvocationCache.delete(getCliInvocationCacheKey(cwd, pathValue));
    }
    async function resolveCliInvocation(cwd, pathValue) {
      const localBinSearch = await getLocalBinSearch(cwd);
      const diagnostics = {
        localBinSearch: localBinSearch.diagnostics,
        skippedLocalBins: [],
      };
      const resolvedPath = (0, import_envpath.prependPathEntries)(pathValue, localBinSearch.directories);
      for (const command of getVercelCommandNames()) {
        const resolvedCommand = await findCommandInPath(command, resolvedPath, cwd, localBinSearch, diagnostics);
        if (!resolvedCommand) {
          continue;
        }
        if ((0, import_fsutils.isNodeScript)(resolvedCommand.realPath)) {
          return {
            found: true,
            command: process.execPath,
            commandArgs: [resolvedCommand.realPath],
            source: resolvedCommand.source,
            diagnostics,
          };
        }
        return {
          found: true,
          command: resolvedCommand.realPath,
          commandArgs: [],
          source: resolvedCommand.source,
          diagnostics,
        };
      }
      return {
        found: false,
        diagnostics,
      };
    }
    async function findCommandInPath(command, pathValue, cwd, localBinSearch, diagnostics) {
      for (const directory of (0, import_envpath.splitPath)(pathValue)) {
        const candidate = getPathCommandCandidate(directory, command, cwd);
        try {
          const canAccess = await canAccessCommandCandidate(candidate, localBinSearch, diagnostics);
          if (canAccess) {
            const resolvedCommand = await resolveCommandCandidate(command, candidate, localBinSearch, diagnostics);
            if (resolvedCommand) {
              return resolvedCommand;
            }
          }
        } catch {}
      }
      return null;
    }
    function getPathCommandCandidate(directory, command, cwd) {
      const candidateDirectory = import_node_path.default.isAbsolute(directory)
        ? directory
        : import_node_path.default.resolve(cwd, directory);
      return import_node_path.default.join(candidateDirectory, command);
    }
    async function canAccessCommandCandidate(candidate, localBinSearch, diagnostics) {
      try {
        await (0, import_promises.access)(
          candidate,
          ("TURBOPACK compile-time falsy", 0)
            ? "TURBOPACK unreachable"
            : import_promises.constants.F_OK | import_promises.constants.X_OK,
        );
        return true;
      } catch (error) {
        if (!(0, import_errutils.isMissingPathError)(error)) {
          await recordInaccessibleLocalBinCandidate(candidate, error, localBinSearch, diagnostics);
        }
        return false;
      }
    }
    async function recordInaccessibleLocalBinCandidate(candidate, error, localBinSearch, diagnostics) {
      const localBinCandidate = await classifyPathLocalBinCandidate(candidate, localBinSearch.directories);
      if (!localBinCandidate) {
        return;
      }
      recordSkippedLocalBin(
        diagnostics,
        candidate,
        "reason" in localBinCandidate
          ? localBinCandidate.reason
          : `local bin is not accessible: ${(0, import_errutils.getErrorMessage)(error)}`,
      );
    }
    async function resolveCommandCandidate(command, candidate, localBinSearch, diagnostics) {
      if (!(await (0, import_promises.stat)(candidate)).isFile()) {
        return null;
      }
      const realPath = await (0, import_promises.realpath)(candidate);
      const localBinCandidate = await classifyPathLocalBinCandidate(candidate, localBinSearch.directories);
      if (!localBinCandidate) {
        return {
          realPath,
          source: "path",
        };
      }
      if ("reason" in localBinCandidate) {
        recordSkippedLocalBin(diagnostics, candidate, localBinCandidate.reason);
        return null;
      }
      const localPackageBinResult = await getLocalVercelPackageBin(command, localBinCandidate.directory);
      if ("reason" in localPackageBinResult) {
        recordSkippedLocalBin(diagnostics, candidate, localPackageBinResult.reason);
        return null;
      }
      return {
        realPath: localPackageBinResult.binPath,
        source: "local-bin",
      };
    }
    function recordSkippedLocalBin(diagnostics, candidate, reason) {
      diagnostics.skippedLocalBins.push({
        candidate,
        reason,
      });
    }
    function getVercelCommandNames() {
      const commandBases = ["vercel"];
      if (("TURBOPACK compile-time truthy", 1)) {
        return commandBases;
      }
      //TURBOPACK unreachable
      const extensions = undefined;
    }
    async function getLocalBinSearch(cwd) {
      const searchRoot = await (0, import_fsutils.getCanonicalPath)(import_node_path.default.resolve(cwd));
      const ancestorSearch = await getAncestorDirectorySearch(searchRoot);
      const skippedNodeModules = [];
      const directories = [];
      for (const directory of ancestorSearch.directories) {
        const nodeModulesDirectory = import_node_path.default.join(directory, "node_modules");
        const parentDirectories =
          ancestorSearch.stopReason === "project-root-marker"
            ? (0, import_fsutils.getDirectoriesBetween)(ancestorSearch.stoppedAt, directory)
            : (0, import_fsutils.getDirectoriesBetween)(directory, searchRoot);
        const skippedReason = await (0, import_safety.getSkippedNodeModulesReason)(
          nodeModulesDirectory,
          parentDirectories,
        );
        if (skippedReason) {
          skippedNodeModules.push({
            directory: nodeModulesDirectory,
            reason: skippedReason,
          });
          continue;
        }
        directories.push(import_node_path.default.join(nodeModulesDirectory, ".bin"));
      }
      return {
        directories,
        diagnostics: {
          searchRoot,
          stoppedAt: ancestorSearch.stoppedAt,
          stopReason: ancestorSearch.stopReason,
          markerPath: ancestorSearch.markerPath,
          skippedNodeModules,
        },
      };
    }
    async function getAncestorDirectorySearch(cwd) {
      const directories = [];
      let current = import_node_path.default.resolve(cwd);
      while (true) {
        directories.push(current);
        const marker = await getProjectRootMarker(current);
        if (marker) {
          return {
            directories,
            stoppedAt: current,
            stopReason: "project-root-marker",
            markerPath: marker.path,
          };
        }
        const parent = import_node_path.default.dirname(current);
        if (parent === current) {
          return {
            directories,
            stoppedAt: current,
            stopReason: "filesystem-root",
          };
        }
        current = parent;
      }
    }
    async function getProjectRootMarker(directory) {
      const gitPath = import_node_path.default.join(directory, ".git");
      try {
        await (0, import_promises.stat)(gitPath);
        return {
          path: gitPath,
        };
      } catch {}
      return null;
    }
    async function getLocalBinDirectory(filePath, localBinDirectories) {
      const resolvedFilePath = import_node_path.default.resolve(filePath);
      let canonicalFilePath = resolvedFilePath;
      try {
        canonicalFilePath = import_node_path.default.join(
          await (0, import_promises.realpath)(import_node_path.default.dirname(resolvedFilePath)),
          import_node_path.default.basename(resolvedFilePath),
        );
      } catch {}
      for (let localBinDirectory of localBinDirectories) {
        try {
          localBinDirectory = await (0, import_promises.realpath)(localBinDirectory);
        } catch {}
        if (canonicalFilePath.startsWith(`${localBinDirectory}${import_node_path.default.sep}`)) {
          return localBinDirectory;
        }
      }
      return null;
    }
    async function getNodeModulesBinDirectory(filePath) {
      const candidateDirectory = import_node_path.default.resolve(import_node_path.default.dirname(filePath));
      const directories = [candidateDirectory];
      try {
        const canonicalDirectory = await (0, import_promises.realpath)(candidateDirectory);
        if (!directories.includes(canonicalDirectory)) {
          directories.push(canonicalDirectory);
        }
      } catch {}
      for (const directory of directories) {
        if (
          import_node_path.default.basename(directory) === ".bin" &&
          import_node_path.default.basename(import_node_path.default.dirname(directory)) === "node_modules"
        ) {
          return directory;
        }
      }
      return null;
    }
    async function classifyPathLocalBinCandidate(filePath, localBinDirectories) {
      const localBinDirectory = await getLocalBinDirectory(filePath, localBinDirectories);
      if (localBinDirectory) {
        return {
          directory: localBinDirectory,
        };
      }
      const nodeModulesBinDirectory = await getNodeModulesBinDirectory(filePath);
      if (!nodeModulesBinDirectory) {
        return null;
      }
      const nodeModulesDirectory = import_node_path.default.dirname(nodeModulesBinDirectory);
      const skippedReason = await (0, import_safety.getSkippedNodeModulesReason)(nodeModulesDirectory);
      if (skippedReason) {
        return {
          reason: `local node_modules is ${skippedReason}`,
        };
      }
      return {
        reason: "local bin is outside project lookup boundary",
      };
    }
    async function getLocalVercelPackageBin(command, localBinDirectory) {
      const commandBase = (0, import_fsutils.getCommandBase)(command);
      const nodeModulesDirectory = import_node_path.default.dirname(localBinDirectory);
      if (commandBase !== "vercel" || import_node_path.default.basename(nodeModulesDirectory) !== "node_modules") {
        return {
          reason: "not a local vercel bin",
        };
      }
      try {
        const localPackage = await getLocalVercelPackage(nodeModulesDirectory);
        if ("reason" in localPackage) {
          return localPackage;
        }
        const packageJsonResult = await readLocalVercelPackageJson(localPackage.realPackageDirectory);
        if ("reason" in packageJsonResult) {
          return packageJsonResult;
        }
        localPackage.packageJson = packageJsonResult.packageJson;
        return await getDeclaredLocalVercelPackageBin(localPackage, commandBase);
      } catch (error) {
        return {
          reason: `could not validate local vercel package: ${(0, import_errutils.getErrorMessage)(error)}`,
        };
      }
    }
    async function getLocalVercelPackage(nodeModulesDirectory) {
      const packageDirectory = import_node_path.default.join(nodeModulesDirectory, "vercel");
      const realNodeModulesDirectory = await (0, import_promises.realpath)(nodeModulesDirectory);
      const realPackageDirectory = await (0, import_promises.realpath)(packageDirectory);
      if (!(0, import_fsutils.isSubpath)(realNodeModulesDirectory, realPackageDirectory)) {
        return {
          reason: "local vercel package resolves outside local node_modules",
        };
      }
      const unsafePackageDirectoryReason = await (0, import_safety.getUnsafePackageDirectoryReason)(
        realNodeModulesDirectory,
        realPackageDirectory,
      );
      if (unsafePackageDirectoryReason) {
        return {
          reason: `local vercel package is unsafe: ${unsafePackageDirectoryReason}`,
        };
      }
      return {
        realNodeModulesDirectory,
        realPackageDirectory,
        packageJson: {},
      };
    }
    async function readLocalVercelPackageJson(realPackageDirectory) {
      const packageJsonPath = import_node_path.default.join(realPackageDirectory, "package.json");
      const realPackageJsonPath = await (0, import_promises.realpath)(packageJsonPath);
      if (!(0, import_fsutils.isSubpath)(realPackageDirectory, realPackageJsonPath)) {
        return {
          reason: "local vercel package.json resolves outside package",
        };
      }
      const unsafePackageJsonReason = await (0, import_safety.getUnsafePackageFileReason)(
        realPackageDirectory,
        realPackageJsonPath,
      );
      if (unsafePackageJsonReason) {
        return {
          reason: `local vercel package.json is unsafe: ${unsafePackageJsonReason}`,
        };
      }
      const packageJson = JSON.parse(await (0, import_promises.readFile)(realPackageJsonPath, "utf8"));
      if (packageJson.name !== "vercel") {
        return {
          reason: 'local vercel package.json does not have name "vercel"',
        };
      }
      return {
        packageJson,
      };
    }
    async function getDeclaredLocalVercelPackageBin(localPackage, commandBase) {
      const { packageJson, realNodeModulesDirectory, realPackageDirectory } = localPackage;
      const binTarget = getPackageBinTarget(packageJson, commandBase);
      if (!binTarget) {
        return {
          reason: "local vercel package does not declare bin.vercel",
        };
      }
      const declaredBinPath = import_node_path.default.resolve(realPackageDirectory, binTarget);
      const realDeclaredBinPath = await (0, import_promises.realpath)(declaredBinPath);
      if (!(0, import_fsutils.isSubpath)(realPackageDirectory, realDeclaredBinPath)) {
        return {
          reason: "local vercel package bin resolves outside package",
        };
      }
      const unsafePackageBinReason = await (0, import_safety.getUnsafePackageBinReason)(
        realNodeModulesDirectory,
        realPackageDirectory,
        realDeclaredBinPath,
      );
      if (unsafePackageBinReason) {
        return {
          reason: `local vercel package bin is unsafe: ${unsafePackageBinReason}`,
        };
      }
      if (process.platform !== "win32" && !(0, import_fsutils.isNodeScript)(realDeclaredBinPath)) {
        try {
          await (0, import_promises.access)(
            realDeclaredBinPath,
            import_promises.constants.F_OK | import_promises.constants.X_OK,
          );
        } catch (error) {
          return {
            reason: `local vercel package bin is not executable: ${(0, import_errutils.getErrorMessage)(error)}`,
          };
        }
      }
      return {
        binPath: realDeclaredBinPath,
      };
    }
    function getPackageBinTarget(packageJson, command) {
      const bin = packageJson.bin;
      if (typeof bin === "string") {
        return command === "vercel" ? bin : null;
      }
      if (bin && typeof bin === "object") {
        const target = bin[command];
        if (typeof target === "string") {
          return target;
        }
      }
      return null;
    }
    function getCliInvocationCacheKey(cwd, pathValue) {
      return `${cwd}\0${pathValue}`;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        clearCachedCliInvocation,
        clearVercelCliLookupCache,
        findVercelCli,
        getLocalBinSearch,
        resolveCachedCliInvocation,
        toVercelCliInvocation,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/safety.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var safety_exports = {};
    __export(safety_exports, {
      getSkippedNodeModulesReason: () => getSkippedNodeModulesReason,
      getUnsafeDirectoryReason: () => getUnsafeDirectoryReason,
      getUnsafePackageBinReason: () => getUnsafePackageBinReason,
      getUnsafePackageDirectoryReason: () => getUnsafePackageDirectoryReason,
      getUnsafePackageFileReason: () => getUnsafePackageFileReason,
      getUnsafeStatsReason: () => getUnsafeStatsReason,
    });
    module.exports = __toCommonJS(safety_exports);
    var import_promises = __turbopack_context__.r("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
    var import_node_path = __toESM(__turbopack_context__.r("[externals]/node:path [external] (node:path, cjs)"));
    var import_errutils = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/errutils.js [app-route] (ecmascript)",
    );
    var import_fsutils = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/fsutils.js [app-route] (ecmascript)",
    );
    async function getSkippedNodeModulesReason(nodeModulesDirectory, parentDirectories) {
      const parentDirectory = import_node_path.default.dirname(nodeModulesDirectory);
      parentDirectories ??= [parentDirectory];
      for (const directory of parentDirectories) {
        let unsafeParentReason;
        try {
          unsafeParentReason = await getUnsafeDirectoryReason(directory);
        } catch (error) {
          unsafeParentReason = `could not inspect: ${(0, import_errutils.getErrorMessage)(error)}`;
        }
        if (unsafeParentReason) {
          return `${directory} is ${unsafeParentReason}`;
        }
      }
      const result = await (0, import_fsutils.statIfExists)(nodeModulesDirectory);
      if ("missing" in result) {
        return null;
      }
      if ("reason" in result) {
        return result.reason;
      }
      if (!result.stats.isDirectory()) {
        return "not a directory";
      }
      const unsafeNodeModulesReason = getUnsafeStatsReason(result.stats);
      if (unsafeNodeModulesReason) {
        return unsafeNodeModulesReason;
      }
      return await getSkippedLocalBinDirectoryReason(import_node_path.default.join(nodeModulesDirectory, ".bin"));
    }
    async function getSkippedLocalBinDirectoryReason(localBinDirectory) {
      const result = await (0, import_fsutils.statIfExists)(localBinDirectory);
      if ("missing" in result) {
        return null;
      }
      if ("reason" in result) {
        return `${localBinDirectory} ${result.reason}`;
      }
      if (!result.stats.isDirectory()) {
        return `${localBinDirectory} is not a directory`;
      }
      const unsafeLocalBinReason = getUnsafeStatsReason(result.stats);
      return unsafeLocalBinReason ? `${localBinDirectory} is ${unsafeLocalBinReason}` : null;
    }
    async function getUnsafePackageBinReason(nodeModulesDirectory, packageDirectory, binPath) {
      const unsafePackageDirectoryReason = await getUnsafePackageDirectoryReason(
        nodeModulesDirectory,
        packageDirectory,
      );
      if (unsafePackageDirectoryReason) {
        return unsafePackageDirectoryReason;
      }
      return await getUnsafePackageFileReason(packageDirectory, binPath);
    }
    async function getUnsafePackageDirectoryReason(nodeModulesDirectory, packageDirectory) {
      const directoriesToCheck = (0, import_fsutils.getDirectoriesBetween)(nodeModulesDirectory, packageDirectory);
      if (directoriesToCheck.length === 0) {
        return `${packageDirectory} resolves outside local node_modules`;
      }
      for (const directory of directoriesToCheck) {
        const reason = await getUnsafeDirectoryReason(directory);
        if (reason) {
          return `${directory} is ${reason}`;
        }
      }
      return null;
    }
    async function getUnsafePackageFileReason(packageDirectory, filePath) {
      const directoriesToCheck = (0, import_fsutils.getDirectoriesBetween)(
        packageDirectory,
        import_node_path.default.dirname(filePath),
      );
      if (directoriesToCheck.length === 0) {
        return `${filePath} resolves outside package`;
      }
      for (const directory of directoriesToCheck) {
        const reason2 = await getUnsafeDirectoryReason(directory);
        if (reason2) {
          return `${directory} is ${reason2}`;
        }
      }
      const reason = await getUnsafeFileReason(filePath);
      return reason ? `${filePath} is ${reason}` : null;
    }
    async function getUnsafeDirectoryReason(directory) {
      const stats = await (0, import_promises.stat)(directory);
      if (!stats.isDirectory()) {
        return "not a directory";
      }
      return getUnsafeStatsReason(stats);
    }
    async function getUnsafeFileReason(filePath) {
      const stats = await (0, import_promises.stat)(filePath);
      if (!stats.isFile()) {
        return "not a file";
      }
      return getUnsafeStatsReason(stats);
    }
    function getUnsafeStatsReason(stats) {
      const getuid = process.geteuid ?? process.getuid;
      if (typeof getuid !== "function") {
        return null;
      }
      const uid = getuid();
      if ((stats.mode & 18) !== 0) {
        if ((stats.mode & 2) !== 0) {
          return "world-writable";
        }
        return "group-writable";
      }
      if (stats.uid !== uid) {
        return `owned by uid ${stats.uid}, current uid is ${uid}`;
      }
      return null;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        getSkippedNodeModulesReason,
        getUnsafeDirectoryReason,
        getUnsafePackageBinReason,
        getUnsafePackageDirectoryReason,
        getUnsafePackageFileReason,
        getUnsafeStatsReason,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/auth-errors.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var auth_errors_exports = {};
    __export(auth_errors_exports, {
      AccessTokenMissingError: () => AccessTokenMissingError,
      RefreshAccessTokenFailedError: () => RefreshAccessTokenFailedError,
    });
    module.exports = __toCommonJS(auth_errors_exports);
    class AccessTokenMissingError extends Error {
      constructor() {
        super("No authentication found. Please log in with the Vercel CLI (vercel login).");
        this.name = "AccessTokenMissingError";
      }
    }
    class RefreshAccessTokenFailedError extends Error {
      constructor(cause) {
        super("Failed to refresh authentication token.");
        this.name = "RefreshAccessTokenFailedError";
        if (cause !== void 0) {
          this.cause = cause;
        }
      }
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        AccessTokenMissingError,
        RefreshAccessTokenFailedError,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/exchange-vercel-oidc-token.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var exchange_vercel_oidc_token_exports = {};
    __export(exchange_vercel_oidc_token_exports, {
      exchangeVercelOidcToken: () => exchangeVercelOidcToken,
    });
    module.exports = __toCommonJS(exchange_vercel_oidc_token_exports);
    var import_version = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/version.js [app-route] (ecmascript)",
    );
    class TokenCache {
      constructor(maxEntries) {
        this.maxEntries = maxEntries;
        this.entries = /* @__PURE__ */ new Map();
      }
      /**
       * Returns a cached token for the key when present and unexpired, refreshing
       * its recency for LRU eviction. Expired entries are removed on access.
       */ get(key) {
        const entry = this.entries.get(key);
        if (entry === void 0) {
          return void 0;
        }
        if (entry.expiresAt <= Date.now()) {
          this.entries.delete(key);
          return void 0;
        }
        this.entries.delete(key);
        this.entries.set(key, entry);
        return entry.token;
      }
      /**
       * Stores a token under the key and evicts the least-recently-used entries
       * once the cache exceeds its size limit.
       */ set({ key, token, expiresAt }) {
        this.entries.delete(key);
        this.entries.set(key, {
          token,
          expiresAt,
        });
        while (this.entries.size > this.maxEntries) {
          const oldest = this.entries.keys().next().value;
          if (oldest === void 0) {
            break;
          }
          this.entries.delete(oldest);
        }
      }
    }
    const MAX_CACHE_ENTRIES = 1e3;
    const tokenCache = new TokenCache(MAX_CACHE_ENTRIES);
    async function getCacheKey(options) {
      const input = JSON.stringify([options.token, options.audience, options.jti]);
      const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
      return Array.from(new Uint8Array(digest))
        .map((byte) => byte.toString(16).padStart(2, "0"))
        .join("");
    }
    async function exchangeVercelOidcToken(options) {
      const cacheKey = await getCacheKey(options);
      if (!options.skipCache) {
        const cached = tokenCache.get(cacheKey);
        if (cached !== void 0) {
          return cached;
        }
      }
      const response = await fetch("https://oidc.vercel.com/~token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          "User-Agent": `@vercel/oidc@${import_version.version}`,
        },
        body: JSON.stringify({
          token: options.token,
          aud: options.audience,
          ...(options.jti
            ? {
                jti: options.jti,
              }
            : void 0),
        }),
      });
      if (!response.ok) {
        throw new Error(`Failed to exchange token: ${await readErrorMessage(response)}`);
      }
      let data;
      try {
        data = await response.json();
      } catch (_error) {
        throw new Error("Failed to exchange token: response was not valid JSON");
      }
      if (!data || typeof data !== "object" || !("token" in data) || typeof data.token !== "string") {
        throw new Error("Failed to exchange token: response did not contain a token");
      }
      const { token } = data;
      const expiry = "expiry" in data && typeof data.expiry === "number" ? data.expiry : void 0;
      if (expiry !== void 0) {
        const expiresAt = expiry * 1e3;
        if (expiresAt > Date.now()) {
          tokenCache.set({
            key: cacheKey,
            token,
            expiresAt,
          });
        }
      }
      return token;
    }
    async function readErrorMessage(response) {
      try {
        const data = await response.json();
        if (data && typeof data === "object" && "error" in data && typeof data.error === "string") {
          return data.error;
        }
      } catch (_error) {}
      return response.statusText || `HTTP ${response.status}`;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        exchangeVercelOidcToken,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-context.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var get_context_exports = {};
    __export(get_context_exports, {
      SYMBOL_FOR_REQ_CONTEXT: () => SYMBOL_FOR_REQ_CONTEXT,
      getContext: () => getContext,
    });
    module.exports = __toCommonJS(get_context_exports);
    const SYMBOL_FOR_REQ_CONTEXT = Symbol.for("@vercel/request-context");
    function getContext() {
      const fromSymbol = globalThis;
      return fromSymbol[SYMBOL_FOR_REQ_CONTEXT]?.get?.() ?? {};
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        SYMBOL_FOR_REQ_CONTEXT,
        getContext,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-vercel-oidc-token-sync.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var get_vercel_oidc_token_sync_exports = {};
    __export(get_vercel_oidc_token_sync_exports, {
      getVercelOidcTokenSync: () => getVercelOidcTokenSync,
    });
    module.exports = __toCommonJS(get_vercel_oidc_token_sync_exports);
    var import_get_context = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-context.js [app-route] (ecmascript)",
    );
    function getVercelOidcTokenSync() {
      const token =
        (0, import_get_context.getContext)().headers?.["x-vercel-oidc-token"] ?? process.env.VERCEL_OIDC_TOKEN;
      if (!token) {
        throw new Error(`The 'x-vercel-oidc-token' header is missing from the request.`);
      }
      return token;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        getVercelOidcTokenSync,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-vercel-oidc-token-with-refresh.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var get_vercel_oidc_token_with_refresh_exports = {};
    __export(get_vercel_oidc_token_with_refresh_exports, {
      getVercelOidcToken: () => getVercelOidcToken,
    });
    module.exports = __toCommonJS(get_vercel_oidc_token_with_refresh_exports);
    var import_exchange_vercel_oidc_token = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/exchange-vercel-oidc-token.js [app-route] (ecmascript)",
    );
    var import_get_vercel_oidc_token_sync = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-vercel-oidc-token-sync.js [app-route] (ecmascript)",
    );
    var import_token_error = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-error.js [app-route] (ecmascript)",
    );
    async function getVercelOidcToken(options) {
      let token = "";
      let err;
      try {
        token = (0, import_get_vercel_oidc_token_sync.getVercelOidcTokenSync)();
      } catch (error) {
        err = error;
      }
      try {
        const [{ getTokenPayload, isExpired }, { refreshToken }] = await Promise.all([
          await __turbopack_context__.A(
            "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-util.js [app-route] (ecmascript, async loader)",
          ),
          await __turbopack_context__.A(
            "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token.js [app-route] (ecmascript, async loader)",
          ),
        ]);
        if (!token || isExpired(getTokenPayload(token), options?.expirationBufferMs)) {
          await refreshToken(options);
          token = (0, import_get_vercel_oidc_token_sync.getVercelOidcTokenSync)();
        }
      } catch (error) {
        let message = err instanceof Error ? err.message : "";
        if (error instanceof Error) {
          message = `${message}
${error.message}`;
        }
        if (message) {
          throw new import_token_error.VercelOidcTokenError(message);
        }
        throw error;
      }
      if (options?.audience) {
        token = await (0, import_exchange_vercel_oidc_token.exchangeVercelOidcToken)({
          token,
          audience: options.audience,
          jti: options.jti,
          skipCache: options.skipCache,
        });
      }
      return token;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        getVercelOidcToken,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var src_exports = {};
    __export(src_exports, {
      AccessTokenMissingError: () => import_auth_errors.AccessTokenMissingError,
      RefreshAccessTokenFailedError: () => import_auth_errors.RefreshAccessTokenFailedError,
      exchangeVercelOidcToken: () => import_exchange_vercel_oidc_token.exchangeVercelOidcToken,
      getContext: () => import_get_context.getContext,
      getVercelOidcToken: () => import_get_vercel_oidc_token_with_refresh.getVercelOidcToken,
      getVercelOidcTokenSync: () => import_get_vercel_oidc_token_sync.getVercelOidcTokenSync,
      getVercelToken: () => import_token_util.getVercelToken,
      verifyVercelOidcToken: () => import_verify_vercel_oidc_token.verifyVercelOidcToken,
    });
    module.exports = __toCommonJS(src_exports);
    var import_get_vercel_oidc_token_with_refresh = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-vercel-oidc-token-with-refresh.js [app-route] (ecmascript)",
    );
    var import_get_vercel_oidc_token_sync = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-vercel-oidc-token-sync.js [app-route] (ecmascript)",
    );
    var import_get_context = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/get-context.js [app-route] (ecmascript)",
    );
    var import_verify_vercel_oidc_token = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/verify-vercel-oidc-token.js [app-route] (ecmascript)",
    );
    var import_auth_errors = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/auth-errors.js [app-route] (ecmascript)",
    );
    var import_exchange_vercel_oidc_token = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/exchange-vercel-oidc-token.js [app-route] (ecmascript)",
    );
    var import_token_util = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-util.js [app-route] (ecmascript)",
    );
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        AccessTokenMissingError,
        RefreshAccessTokenFailedError,
        exchangeVercelOidcToken,
        getContext,
        getVercelOidcToken,
        getVercelOidcTokenSync,
        getVercelToken,
        verifyVercelOidcToken,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/oauth.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var oauth_exports = {};
    __export(oauth_exports, {
      processTokenResponse: () => processTokenResponse,
      refreshTokenRequest: () => refreshTokenRequest,
    });
    module.exports = __toCommonJS(oauth_exports);
    var import_os = __turbopack_context__.r("[externals]/os [external] (os, cjs)");
    const VERCEL_ISSUER = "https://vercel.com";
    const VERCEL_CLI_CLIENT_ID = "cl_HYyOPBNtFMfHhaUn9L4QPfTZz6TP47bp";
    const userAgent = `@vercel/oidc node-${process.version} ${(0, import_os.platform)()} (${(0, import_os.arch)()}) ${(0, import_os.hostname)()}`;
    let _tokenEndpoint = null;
    async function getTokenEndpoint() {
      if (_tokenEndpoint) {
        return _tokenEndpoint;
      }
      const discoveryUrl = `${VERCEL_ISSUER}/.well-known/openid-configuration`;
      const response = await fetch(discoveryUrl, {
        headers: {
          "user-agent": userAgent,
        },
      });
      if (!response.ok) {
        throw new Error("Failed to discover OAuth endpoints");
      }
      const metadata = await response.json();
      if (!metadata || typeof metadata.token_endpoint !== "string") {
        throw new Error("Invalid OAuth discovery response");
      }
      const endpoint = metadata.token_endpoint;
      _tokenEndpoint = endpoint;
      return endpoint;
    }
    async function refreshTokenRequest(options) {
      const tokenEndpoint = await getTokenEndpoint();
      return await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "user-agent": userAgent,
        },
        body: new URLSearchParams({
          client_id: VERCEL_CLI_CLIENT_ID,
          grant_type: "refresh_token",
          ...options,
        }),
      });
    }
    async function processTokenResponse(response) {
      const json = await response.json();
      if (!response.ok) {
        const errorMsg =
          typeof json === "object" && json && "error" in json ? String(json.error) : "Token refresh failed";
        return [new Error(errorMsg)];
      }
      if (typeof json !== "object" || json === null) {
        return [new Error("Invalid token response")];
      }
      if (typeof json.access_token !== "string") {
        return [new Error("Missing access_token in response")];
      }
      if (json.token_type !== "Bearer") {
        return [new Error("Invalid token_type in response")];
      }
      if (typeof json.expires_in !== "number") {
        return [new Error("Missing expires_in in response")];
      }
      return [null, json];
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        processTokenResponse,
        refreshTokenRequest,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-error.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var token_error_exports = {};
    __export(token_error_exports, {
      VercelOidcTokenError: () => VercelOidcTokenError,
    });
    module.exports = __toCommonJS(token_error_exports);
    class VercelOidcTokenError extends Error {
      constructor(message, cause) {
        super(message);
        this.name = "VercelOidcTokenError";
        this.cause = cause;
      }
      toString() {
        if (this.cause) {
          return `${this.name}: ${this.message}: ${this.cause}`;
        }
        return `${this.name}: ${this.message}`;
      }
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        VercelOidcTokenError,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-io.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var token_io_exports = {};
    __export(token_io_exports, {
      findRootDir: () => findRootDir,
      getUserDataDir: () => getUserDataDir,
    });
    module.exports = __toCommonJS(token_io_exports);
    var import_path = __toESM(__turbopack_context__.r("[externals]/path [external] (path, cjs)"));
    var import_fs = __toESM(__turbopack_context__.r("[externals]/fs [external] (fs, cjs)"));
    var import_os = __toESM(__turbopack_context__.r("[externals]/os [external] (os, cjs)"));
    var import_token_error = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-error.js [app-route] (ecmascript)",
    );
    function findRootDir() {
      try {
        let dir = process.cwd();
        while (dir !== import_path.default.dirname(dir)) {
          const pkgPath = import_path.default.join(dir, ".vercel");
          if (import_fs.default.existsSync(pkgPath)) {
            return dir;
          }
          dir = import_path.default.dirname(dir);
        }
      } catch (_e) {
        throw new import_token_error.VercelOidcTokenError("Token refresh only supported in node server environments");
      }
      return null;
    }
    function getUserDataDir() {
      if (process.env.XDG_DATA_HOME) {
        return process.env.XDG_DATA_HOME;
      }
      switch (import_os.default.platform()) {
        case "darwin":
          return import_path.default.join(import_os.default.homedir(), "Library/Application Support");
        case "linux":
          return import_path.default.join(import_os.default.homedir(), ".local/share");
        case "win32":
          if (process.env.LOCALAPPDATA) {
            return process.env.LOCALAPPDATA;
          }
          return null;
        default:
          return null;
      }
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        findRootDir,
        getUserDataDir,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-util.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __create = Object.create;
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __getProtoOf = Object.getPrototypeOf;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toESM = (mod, isNodeMode, target) => (
      (target = mod != null ? __create(__getProtoOf(mod)) : {}),
      __copyProps(
        // If the importer is in node compatibility mode or this is not an ESM
        // file that has been converted to a CommonJS file using a Babel-
        // compatible transform (i.e. "__esModule" has not been set), then set
        // "default" to the CommonJS "module.exports" for node compatibility.
        isNodeMode || !mod || !mod.__esModule
          ? __defProp(target, "default", {
              value: mod,
              enumerable: true,
            })
          : target,
        mod,
      )
    );
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var token_util_exports = {};
    __export(token_util_exports, {
      assertVercelOidcTokenResponse: () => assertVercelOidcTokenResponse,
      findProjectInfo: () => findProjectInfo,
      getTokenPayload: () => getTokenPayload,
      getVercelOidcToken: () => getVercelOidcToken,
      getVercelOidcTokenFromCli: () => getVercelOidcTokenFromCli,
      getVercelToken: () => getVercelToken,
      isExpired: () => isExpired,
      loadToken: () => loadToken,
      saveToken: () => saveToken,
    });
    module.exports = __toCommonJS(token_util_exports);
    var path = __toESM(__turbopack_context__.r("[externals]/path [external] (path, cjs)"));
    var fs = __toESM(__turbopack_context__.r("[externals]/fs [external] (fs, cjs)"));
    var import_cli_exec = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-exec@1.0.1/node_modules/@vercel/cli-exec/dist/index.js [app-route] (ecmascript)",
    );
    var import_cli_config = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+cli-config@0.3.1/node_modules/@vercel/cli-config/dist/index.js [app-route] (ecmascript)",
    );
    var import_token_error = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-error.js [app-route] (ecmascript)",
    );
    var import_token_io = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/token-io.js [app-route] (ecmascript)",
    );
    var import_oauth = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/oauth.js [app-route] (ecmascript)",
    );
    var import_auth_errors = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/auth-errors.js [app-route] (ecmascript)",
    );
    async function getVercelToken(options) {
      const configDir = (0, import_cli_config.getGlobalPathConfig)();
      const authConfig = (0, import_cli_config.tryReadAuthConfig)(configDir);
      if (!authConfig || (!authConfig.token && !authConfig.refreshToken)) {
        throw new import_auth_errors.AccessTokenMissingError();
      }
      if (isValidAccessToken(authConfig, options?.expirationBufferMs)) {
        return authConfig.token;
      }
      if (!authConfig.refreshToken) {
        (0, import_cli_config.writeAuthConfig)(configDir, {});
        throw new import_auth_errors.RefreshAccessTokenFailedError("No refresh token available");
      }
      try {
        const tokenResponse = await (0, import_oauth.refreshTokenRequest)({
          refresh_token: authConfig.refreshToken,
        });
        const [tokensError, tokens] = await (0, import_oauth.processTokenResponse)(tokenResponse);
        if (tokensError || !tokens) {
          (0, import_cli_config.writeAuthConfig)(configDir, {});
          throw new import_auth_errors.RefreshAccessTokenFailedError(tokensError);
        }
        const updatedConfig = {
          token: tokens.access_token,
          expiresAt: Math.floor(Date.now() / 1e3) + tokens.expires_in,
          refreshToken: tokens.refresh_token,
        };
        (0, import_cli_config.writeAuthConfig)(configDir, updatedConfig);
        return updatedConfig.token;
      } catch (error) {
        (0, import_cli_config.writeAuthConfig)(configDir, {});
        if (
          error instanceof import_auth_errors.AccessTokenMissingError ||
          error instanceof import_auth_errors.RefreshAccessTokenFailedError
        ) {
          throw error;
        }
        throw new import_auth_errors.RefreshAccessTokenFailedError(error);
      }
    }
    function isValidAccessToken(authConfig, expirationBufferMs = 0) {
      if (!authConfig.token) return false;
      if (typeof authConfig.expiresAt !== "number") return true;
      const nowInSeconds = Math.floor(Date.now() / 1e3);
      const bufferInSeconds = expirationBufferMs / 1e3;
      return authConfig.expiresAt >= nowInSeconds + bufferInSeconds;
    }
    async function getVercelOidcTokenFromCli(projectId, teamId) {
      const args = ["project", "token", projectId, "--format=json"];
      if (teamId) {
        args.push("--scope", teamId);
      }
      try {
        const { stdout } = await (0, import_cli_exec.execVercelCli)(args);
        let parsedOutput;
        if (typeof stdout !== "string") {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: `vercel project token` did not return stdout",
          );
        }
        try {
          parsedOutput = JSON.parse(stdout);
        } catch {
          throw new import_token_error.VercelOidcTokenError(
            "Failed to refresh OIDC token: `vercel project token` returned invalid JSON: " + stdout,
          );
        }
        assertVercelOidcTokenResponse(parsedOutput);
        return parsedOutput;
      } catch (error) {
        if (error instanceof import_token_error.VercelOidcTokenError) {
          throw error;
        }
        let message = error instanceof Error ? error.message : "";
        const stderr = error instanceof import_cli_exec.VercelCliError ? error.stderr?.trim() : void 0;
        if (stderr && !message.includes(stderr)) {
          message = `${message}
${stderr}`.trim();
        }
        throw new import_token_error.VercelOidcTokenError(
          message
            ? `Failed to refresh OIDC token with the Vercel CLI: ${message}`
            : "Failed to refresh OIDC token with the Vercel CLI",
        );
      }
    }
    async function getVercelOidcToken(authToken, projectId, teamId) {
      const url = `https://api.vercel.com/v1/projects/${projectId}/token?source=vercel-oidc-refresh${teamId ? `&teamId=${teamId}` : ""}`;
      const res = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      if (!res.ok) {
        throw new import_token_error.VercelOidcTokenError(`Failed to refresh OIDC token: ${res.statusText}`);
      }
      const tokenRes = await res.json();
      assertVercelOidcTokenResponse(tokenRes);
      return tokenRes;
    }
    function assertVercelOidcTokenResponse(res) {
      if (!res || typeof res !== "object") {
        throw new TypeError("Vercel OIDC token is malformed. Expected an object.");
      }
      if (!("token" in res) || typeof res.token !== "string") {
        throw new TypeError("Vercel OIDC token is malformed. Expected a string-valued token property.");
      }
    }
    function findProjectInfo() {
      const dir = (0, import_token_io.findRootDir)();
      if (!dir) {
        throw new import_token_error.VercelOidcTokenError(
          "Unable to find project root directory. Have you linked your project with `vc link?`",
        );
      }
      const prjPath = path.join(dir, ".vercel", "project.json");
      if (!fs.existsSync(prjPath)) {
        throw new import_token_error.VercelOidcTokenError(
          "project.json not found, have you linked your project with `vc link?`",
        );
      }
      const prj = JSON.parse(fs.readFileSync(prjPath, "utf8"));
      if (typeof prj.projectId !== "string" && typeof prj.orgId !== "string") {
        throw new TypeError(
          "Expected a string-valued projectId property. Try running `vc link` to re-link your project.",
        );
      }
      return {
        projectId: prj.projectId,
        teamId: prj.orgId,
      };
    }
    function saveToken(token, projectId) {
      const dir = (0, import_token_io.getUserDataDir)();
      if (!dir) {
        throw new import_token_error.VercelOidcTokenError(
          "Unable to find user data directory. Please reach out to Vercel support.",
        );
      }
      const tokenPath = path.join(dir, "com.vercel.token", `${projectId}.json`);
      const tokenJson = JSON.stringify(token);
      fs.mkdirSync(path.dirname(tokenPath), {
        mode: 504,
        recursive: true,
      });
      fs.writeFileSync(tokenPath, tokenJson);
      fs.chmodSync(tokenPath, 432);
      return;
    }
    function loadToken(projectId) {
      const dir = (0, import_token_io.getUserDataDir)();
      if (!dir) {
        throw new import_token_error.VercelOidcTokenError(
          "Unable to find user data directory. Please reach out to Vercel support.",
        );
      }
      const tokenPath = path.join(dir, "com.vercel.token", `${projectId}.json`);
      if (!fs.existsSync(tokenPath)) {
        return null;
      }
      const token = JSON.parse(fs.readFileSync(tokenPath, "utf8"));
      assertVercelOidcTokenResponse(token);
      return token;
    }
    function getTokenPayload(token) {
      const tokenParts = token.split(".");
      if (tokenParts.length !== 3) {
        throw new import_token_error.VercelOidcTokenError("Invalid token.");
      }
      const base64 = tokenParts[1].replace(/-/g, "+").replace(/_/g, "/");
      const padded = base64.padEnd(base64.length + ((4 - (base64.length % 4)) % 4), "=");
      return JSON.parse(Buffer.from(padded, "base64").toString("utf8"));
    }
    function isExpired(token, bufferMs = 0) {
      return token.exp * 1e3 < Date.now() + bufferMs;
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        assertVercelOidcTokenResponse,
        findProjectInfo,
        getTokenPayload,
        getVercelOidcToken,
        getVercelOidcTokenFromCli,
        getVercelToken,
        isExpired,
        loadToken,
        saveToken,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/verify-vercel-oidc-token.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var verify_vercel_oidc_token_exports = {};
    __export(verify_vercel_oidc_token_exports, {
      verifyVercelOidcToken: () => verifyVercelOidcToken,
    });
    module.exports = __toCommonJS(verify_vercel_oidc_token_exports);
    var import_jose = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/jose@5.10.0/node_modules/jose/dist/node/cjs/index.js [app-route] (ecmascript)",
    );
    const VERCEL_OIDC_ISSUER = "https://oidc.vercel.com";
    const VERCEL_OIDC_JWKS_URL = new URL("https://oidc.vercel.com/.well-known/jwks");
    const DEFAULT_ALGORITHMS = ["RS256"];
    const VERCEL_OIDC_JWKS = (0, import_jose.createRemoteJWKSet)(VERCEL_OIDC_JWKS_URL);
    async function verifyVercelOidcToken(token, options) {
      const {
        algorithms,
        projectId = process.env.VERCEL_PROJECT_ID,
        environment = process.env.VERCEL_TARGET_ENV || process.env.VERCEL_ENV,
        ownerId,
        ...verifyOptions
      } = options ?? {};
      if (projectId === "*" && ownerId === void 0 && !hasAudienceVerification(verifyOptions.audience)) {
        throw new TypeError("Expected ownerId or audience to be provided when projectId is '*'.");
      }
      const result = await (0, import_jose.jwtVerify)(token, VERCEL_OIDC_JWKS, {
        ...verifyOptions,
        algorithms: algorithms ?? DEFAULT_ALGORITHMS,
      });
      validateIssuer(result.payload.iss);
      validateClaim({
        actual: result.payload.project_id,
        claim: "project_id",
        env: "VERCEL_PROJECT_ID",
        expected: projectId,
        option: "projectId",
      });
      validateClaim({
        actual: result.payload.environment,
        claim: "environment",
        env: "VERCEL_TARGET_ENV or VERCEL_ENV",
        expected: environment,
        option: "environment",
      });
      validateOptionalClaim({
        actual: result.payload.owner_id,
        claim: "owner_id",
        expected: ownerId,
      });
      return result;
    }
    function hasAudienceVerification(audience) {
      return Array.isArray(audience) ? audience.length > 0 : audience !== void 0;
    }
    function validateIssuer(actual) {
      if (
        actual !== VERCEL_OIDC_ISSUER &&
        (typeof actual !== "string" || !actual.startsWith(`${VERCEL_OIDC_ISSUER}/`))
      ) {
        throw new TypeError(
          `Expected Vercel OIDC token iss claim to be "${VERCEL_OIDC_ISSUER}" or to start with "${VERCEL_OIDC_ISSUER}/".`,
        );
      }
    }
    function validateClaim({ actual, claim, env, expected, option }) {
      if (expected === "*") {
        return;
      }
      if (expected === void 0 || expected.length === 0) {
        throw new TypeError(
          `Expected ${env} to be set or ${option} to be provided. Pass ${option}: '*' to allow any ${claim} claim.`,
        );
      }
      if (Array.isArray(expected) && typeof actual === "string" && expected.includes(actual)) {
        return;
      }
      if (actual !== expected) {
        throw new TypeError(
          Array.isArray(expected)
            ? `Expected Vercel OIDC token ${claim} claim to be one of: ${expected.map((value) => `"${value}"`).join(", ")}.`
            : `Expected Vercel OIDC token ${claim} claim to be "${expected}".`,
        );
      }
    }
    function validateOptionalClaim({ actual, claim, expected }) {
      if (expected === void 0) {
        return;
      }
      if (actual !== expected) {
        throw new TypeError(`Expected Vercel OIDC token ${claim} claim to be "${expected}".`);
      }
    }
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        verifyVercelOidcToken,
      });
  },
  "[project]/node_modules/.pnpm/@vercel+oidc@3.8.10/node_modules/@vercel/oidc/dist/version.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var __defProp = Object.defineProperty;
    var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
    var __getOwnPropNames = Object.getOwnPropertyNames;
    var __hasOwnProp = Object.prototype.hasOwnProperty;
    var __export = (target, all) => {
      for (var name in all)
        __defProp(target, name, {
          get: all[name],
          enumerable: true,
        });
    };
    var __copyProps = (to, from, except, desc) => {
      if ((from && typeof from === "object") || typeof from === "function") {
        for (const key of __getOwnPropNames(from))
          if (!__hasOwnProp.call(to, key) && key !== except)
            __defProp(to, key, {
              get: () => from[key],
              enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable,
            });
      }
      return to;
    };
    var __toCommonJS = (mod) =>
      __copyProps(
        __defProp({}, "__esModule", {
          value: true,
        }),
        mod,
      );
    var version_exports = {};
    __export(version_exports, {
      version: () => version,
    });
    module.exports = __toCommonJS(version_exports);
    const version = "3.8.10";
    // Annotate the CommonJS export names for ESM import in node:
    0 &&
      (module.exports = {
        version,
      });
  },
  "[project]/node_modules/.pnpm/async-retry@1.3.3/node_modules/async-retry/lib/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    // Packages
    var retrier = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/retry@0.13.1/node_modules/retry/index.js [app-route] (ecmascript)",
    );
    function retry(fn, opts) {
      function run(resolve, reject) {
        var options = opts || {};
        var op;
        // Default `randomize` to true
        if (!("randomize" in options)) {
          options.randomize = true;
        }
        op = retrier.operation(options);
        // We allow the user to abort retrying
        // this makes sense in the cases where
        // knowledge is obtained that retrying
        // would be futile (e.g.: auth errors)
        function bail(err) {
          reject(err || new Error("Aborted"));
        }
        function onError(err, num) {
          if (err.bail) {
            bail(err);
            return;
          }
          if (!op.retry(err)) {
            reject(op.mainError());
          } else if (options.onRetry) {
            options.onRetry(err, num);
          }
        }
        function runAttempt(num) {
          var val;
          try {
            val = fn(bail, num);
          } catch (err) {
            onError(err, num);
            return;
          }
          Promise.resolve(val)
            .then(resolve)
            .catch(function catchIt(err) {
              onError(err, num);
            });
        }
        op.attempt(runAttempt);
      }
      return new Promise(run);
    }
    module.exports = retry;
  },
  "[project]/node_modules/.pnpm/aws4fetch@1.0.20/node_modules/aws4fetch/dist/aws4fetch.esm.mjs [app-route] (ecmascript)",
  (__turbopack_context__) => {
    __turbopack_context__.s(["AwsClient", () => AwsClient, "AwsV4Signer", () => AwsV4Signer]);
    /**
     * @license MIT <https://opensource.org/licenses/MIT>
     * @copyright Michael Hart 2024
     */ const encoder = new TextEncoder();
    const HOST_SERVICES = {
      appstream2: "appstream",
      cloudhsmv2: "cloudhsm",
      email: "ses",
      marketplace: "aws-marketplace",
      mobile: "AWSMobileHubService",
      pinpoint: "mobiletargeting",
      queue: "sqs",
      "git-codecommit": "codecommit",
      "mturk-requester-sandbox": "mturk-requester",
      "personalize-runtime": "personalize",
    };
    const UNSIGNABLE_HEADERS = new Set([
      "authorization",
      "content-type",
      "content-length",
      "user-agent",
      "presigned-expires",
      "expect",
      "x-amzn-trace-id",
      "range",
      "connection",
    ]);
    class AwsClient {
      constructor({ accessKeyId, secretAccessKey, sessionToken, service, region, cache, retries, initRetryMs }) {
        if (accessKeyId == null) throw new TypeError("accessKeyId is a required option");
        if (secretAccessKey == null) throw new TypeError("secretAccessKey is a required option");
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.sessionToken = sessionToken;
        this.service = service;
        this.region = region;
        this.cache = cache || new Map();
        this.retries = retries != null ? retries : 10;
        this.initRetryMs = initRetryMs || 50;
      }
      async sign(input, init) {
        if (input instanceof Request) {
          const { method, url, headers, body } = input;
          init = Object.assign(
            {
              method,
              url,
              headers,
            },
            init,
          );
          if (init.body == null && headers.has("Content-Type")) {
            init.body = body != null && headers.has("X-Amz-Content-Sha256") ? body : await input.clone().arrayBuffer();
          }
          input = url;
        }
        const signer = new AwsV4Signer(
          Object.assign(
            {
              url: input.toString(),
            },
            init,
            this,
            init && init.aws,
          ),
        );
        const signed = Object.assign({}, init, await signer.sign());
        delete signed.aws;
        try {
          return new Request(signed.url.toString(), signed);
        } catch (e) {
          if (e instanceof TypeError) {
            return new Request(
              signed.url.toString(),
              Object.assign(
                {
                  duplex: "half",
                },
                signed,
              ),
            );
          }
          throw e;
        }
      }
      async fetch(input, init) {
        for (let i = 0; i <= this.retries; i++) {
          const fetched = fetch(await this.sign(input, init));
          if (i === this.retries) {
            return fetched;
          }
          const res = await fetched;
          if (res.status < 500 && res.status !== 429) {
            return res;
          }
          await new Promise((resolve) => setTimeout(resolve, Math.random() * this.initRetryMs * Math.pow(2, i)));
        }
        throw new Error("An unknown error occurred, ensure retries is not negative");
      }
    }
    class AwsV4Signer {
      constructor({
        method,
        url,
        headers,
        body,
        accessKeyId,
        secretAccessKey,
        sessionToken,
        service,
        region,
        cache,
        datetime,
        signQuery,
        appendSessionToken,
        allHeaders,
        singleEncode,
      }) {
        if (url == null) throw new TypeError("url is a required option");
        if (accessKeyId == null) throw new TypeError("accessKeyId is a required option");
        if (secretAccessKey == null) throw new TypeError("secretAccessKey is a required option");
        this.method = method || (body ? "POST" : "GET");
        this.url = new URL(url);
        this.headers = new Headers(headers || {});
        this.body = body;
        this.accessKeyId = accessKeyId;
        this.secretAccessKey = secretAccessKey;
        this.sessionToken = sessionToken;
        let guessedService, guessedRegion;
        if (!service || !region) {
          [guessedService, guessedRegion] = guessServiceRegion(this.url, this.headers);
        }
        this.service = service || guessedService || "";
        this.region = region || guessedRegion || "us-east-1";
        this.cache = cache || new Map();
        this.datetime = datetime || new Date().toISOString().replace(/[:-]|\.\d{3}/g, "");
        this.signQuery = signQuery;
        this.appendSessionToken = appendSessionToken || this.service === "iotdevicegateway";
        this.headers.delete("Host");
        if (this.service === "s3" && !this.signQuery && !this.headers.has("X-Amz-Content-Sha256")) {
          this.headers.set("X-Amz-Content-Sha256", "UNSIGNED-PAYLOAD");
        }
        const params = this.signQuery ? this.url.searchParams : this.headers;
        params.set("X-Amz-Date", this.datetime);
        if (this.sessionToken && !this.appendSessionToken) {
          params.set("X-Amz-Security-Token", this.sessionToken);
        }
        this.signableHeaders = ["host", ...this.headers.keys()]
          .filter((header) => allHeaders || !UNSIGNABLE_HEADERS.has(header))
          .sort();
        this.signedHeaders = this.signableHeaders.join(";");
        this.canonicalHeaders = this.signableHeaders
          .map(
            (header) =>
              header +
              ":" +
              (header === "host" ? this.url.host : (this.headers.get(header) || "").replace(/\s+/g, " ")),
          )
          .join("\n");
        this.credentialString = [this.datetime.slice(0, 8), this.region, this.service, "aws4_request"].join("/");
        if (this.signQuery) {
          if (this.service === "s3" && !params.has("X-Amz-Expires")) {
            params.set("X-Amz-Expires", "86400");
          }
          params.set("X-Amz-Algorithm", "AWS4-HMAC-SHA256");
          params.set("X-Amz-Credential", this.accessKeyId + "/" + this.credentialString);
          params.set("X-Amz-SignedHeaders", this.signedHeaders);
        }
        if (this.service === "s3") {
          try {
            this.encodedPath = decodeURIComponent(this.url.pathname.replace(/\+/g, " "));
          } catch (e) {
            this.encodedPath = this.url.pathname;
          }
        } else {
          this.encodedPath = this.url.pathname.replace(/\/+/g, "/");
        }
        if (!singleEncode) {
          this.encodedPath = encodeURIComponent(this.encodedPath).replace(/%2F/g, "/");
        }
        this.encodedPath = encodeRfc3986(this.encodedPath);
        const seenKeys = new Set();
        this.encodedSearch = [...this.url.searchParams]
          .filter(([k]) => {
            if (!k) return false;
            if (this.service === "s3") {
              if (seenKeys.has(k)) return false;
              seenKeys.add(k);
            }
            return true;
          })
          .map((pair) => pair.map((p) => encodeRfc3986(encodeURIComponent(p))))
          .sort(([k1, v1], [k2, v2]) => (k1 < k2 ? -1 : k1 > k2 ? 1 : v1 < v2 ? -1 : v1 > v2 ? 1 : 0))
          .map((pair) => pair.join("="))
          .join("&");
      }
      async sign() {
        if (this.signQuery) {
          this.url.searchParams.set("X-Amz-Signature", await this.signature());
          if (this.sessionToken && this.appendSessionToken) {
            this.url.searchParams.set("X-Amz-Security-Token", this.sessionToken);
          }
        } else {
          this.headers.set("Authorization", await this.authHeader());
        }
        return {
          method: this.method,
          url: this.url,
          headers: this.headers,
          body: this.body,
        };
      }
      async authHeader() {
        return [
          "AWS4-HMAC-SHA256 Credential=" + this.accessKeyId + "/" + this.credentialString,
          "SignedHeaders=" + this.signedHeaders,
          "Signature=" + (await this.signature()),
        ].join(", ");
      }
      async signature() {
        const date = this.datetime.slice(0, 8);
        const cacheKey = [this.secretAccessKey, date, this.region, this.service].join();
        let kCredentials = this.cache.get(cacheKey);
        if (!kCredentials) {
          const kDate = await hmac("AWS4" + this.secretAccessKey, date);
          const kRegion = await hmac(kDate, this.region);
          const kService = await hmac(kRegion, this.service);
          kCredentials = await hmac(kService, "aws4_request");
          this.cache.set(cacheKey, kCredentials);
        }
        return buf2hex(await hmac(kCredentials, await this.stringToSign()));
      }
      async stringToSign() {
        return [
          "AWS4-HMAC-SHA256",
          this.datetime,
          this.credentialString,
          buf2hex(await hash(await this.canonicalString())),
        ].join("\n");
      }
      async canonicalString() {
        return [
          this.method.toUpperCase(),
          this.encodedPath,
          this.encodedSearch,
          this.canonicalHeaders + "\n",
          this.signedHeaders,
          await this.hexBodyHash(),
        ].join("\n");
      }
      async hexBodyHash() {
        let hashHeader =
          this.headers.get("X-Amz-Content-Sha256") ||
          (this.service === "s3" && this.signQuery ? "UNSIGNED-PAYLOAD" : null);
        if (hashHeader == null) {
          if (this.body && typeof this.body !== "string" && !("byteLength" in this.body)) {
            throw new Error(
              "body must be a string, ArrayBuffer or ArrayBufferView, unless you include the X-Amz-Content-Sha256 header",
            );
          }
          hashHeader = buf2hex(await hash(this.body || ""));
        }
        return hashHeader;
      }
    }
    async function hmac(key, string) {
      const cryptoKey = await crypto.subtle.importKey(
        "raw",
        typeof key === "string" ? encoder.encode(key) : key,
        {
          name: "HMAC",
          hash: {
            name: "SHA-256",
          },
        },
        false,
        ["sign"],
      );
      return crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(string));
    }
    async function hash(content) {
      return crypto.subtle.digest("SHA-256", typeof content === "string" ? encoder.encode(content) : content);
    }
    const HEX_CHARS = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9", "a", "b", "c", "d", "e", "f"];
    function buf2hex(arrayBuffer) {
      const buffer = new Uint8Array(arrayBuffer);
      let out = "";
      for (let idx = 0; idx < buffer.length; idx++) {
        const n = buffer[idx];
        out += HEX_CHARS[(n >>> 4) & 0xf];
        out += HEX_CHARS[n & 0xf];
      }
      return out;
    }
    function encodeRfc3986(urlEncodedStr) {
      return urlEncodedStr.replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());
    }
    function guessServiceRegion(url, headers) {
      const { hostname, pathname } = url;
      if (hostname.endsWith(".on.aws")) {
        const match = hostname.match(/^[^.]{1,63}\.lambda-url\.([^.]{1,63})\.on\.aws$/);
        return match != null ? ["lambda", match[1] || ""] : ["", ""];
      }
      if (hostname.endsWith(".r2.cloudflarestorage.com")) {
        return ["s3", "auto"];
      }
      if (hostname.endsWith(".backblazeb2.com")) {
        const match = hostname.match(/^(?:[^.]{1,63}\.)?s3\.([^.]{1,63})\.backblazeb2\.com$/);
        return match != null ? ["s3", match[1] || ""] : ["", ""];
      }
      const match = hostname
        .replace("dualstack.", "")
        .match(/([^.]{1,63})\.(?:([^.]{0,63})\.)?amazonaws\.com(?:\.cn)?$/);
      let service = (match && match[1]) || "";
      let region = match && match[2];
      if (region === "us-gov") {
        region = "us-gov-west-1";
      } else if (region === "s3" || region === "s3-accelerate") {
        region = "us-east-1";
        service = "s3";
      } else if (service === "iot") {
        if (hostname.startsWith("iot.")) {
          service = "execute-api";
        } else if (hostname.startsWith("data.jobs.iot.")) {
          service = "iot-jobs-data";
        } else {
          service = pathname === "/mqtt" ? "iotdevicegateway" : "iotdata";
        }
      } else if (service === "autoscaling") {
        const targetPrefix = (headers.get("X-Amz-Target") || "").split(".")[0];
        if (targetPrefix === "AnyScaleFrontendService") {
          service = "application-autoscaling";
        } else if (targetPrefix === "AnyScaleScalingPlannerFrontendService") {
          service = "autoscaling-plans";
        }
      } else if (region == null && service.startsWith("s3-")) {
        region = service.slice(3).replace(/^fips-|^external-1/, "");
        service = "s3";
      } else if (service.endsWith("-fips")) {
        service = service.slice(0, -5);
      } else if (region && /-\d$/.test(service) && !/-\d$/.test(region)) {
        [service, region] = [region, service];
      }
      return [HOST_SERVICES[service] || service, region || ""];
    }
  },
  "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const cp = __turbopack_context__.r("[externals]/child_process [external] (child_process, cjs)");
    const parse = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js [app-route] (ecmascript)",
    );
    const enoent = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js [app-route] (ecmascript)",
    );
    function spawn(command, args, options) {
      // Parse the arguments
      const parsed = parse(command, args, options);
      // Spawn the child process
      const spawned = cp.spawn(parsed.command, parsed.args, parsed.options);
      // Hook into child process "exit" event to emit an error if the command
      // does not exists, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
      enoent.hookChildProcess(spawned, parsed);
      return spawned;
    }
    function spawnSync(command, args, options) {
      // Parse the arguments
      const parsed = parse(command, args, options);
      // Spawn the child process
      const result = cp.spawnSync(parsed.command, parsed.args, parsed.options);
      // Analyze if the command does not exist, see: https://github.com/IndigoUnited/node-cross-spawn/issues/16
      result.error = result.error || enoent.verifyENOENTSync(result.status, parsed);
      return result;
    }
    module.exports = spawn;
    module.exports.spawn = spawn;
    module.exports.sync = spawnSync;
    module.exports._parse = parse;
    module.exports._enoent = enoent;
  },
  "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/enoent.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const isWin = process.platform === "win32";
    function notFoundError(original, syscall) {
      return Object.assign(new Error(`${syscall} ${original.command} ENOENT`), {
        code: "ENOENT",
        errno: "ENOENT",
        syscall: `${syscall} ${original.command}`,
        path: original.command,
        spawnargs: original.args,
      });
    }
    function hookChildProcess(cp, parsed) {
      if (("TURBOPACK compile-time truthy", 1)) {
        return;
      }
      //TURBOPACK unreachable
      const originalEmit = undefined;
    }
    function verifyENOENT(status, parsed) {
      if (
        ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
      );
      return null;
    }
    function verifyENOENTSync(status, parsed) {
      if (
        ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
      );
      return null;
    }
    module.exports = {
      hookChildProcess,
      verifyENOENT,
      verifyENOENTSync,
      notFoundError,
    };
  },
  "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/parse.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
    const resolveCommand = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js [app-route] (ecmascript)",
    );
    const escape = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js [app-route] (ecmascript)",
    );
    const readShebang = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js [app-route] (ecmascript)",
    );
    const isWin = process.platform === "win32";
    const isExecutableRegExp = /\.(?:com|exe)$/i;
    const isCmdShimRegExp = /node_modules[\\/].bin[\\/][^\\/]+\.cmd$/i;
    function detectShebang(parsed) {
      parsed.file = resolveCommand(parsed);
      const shebang = parsed.file && readShebang(parsed.file);
      if (shebang) {
        parsed.args.unshift(parsed.file);
        parsed.command = shebang;
        return resolveCommand(parsed);
      }
      return parsed.file;
    }
    function parseNonShell(parsed) {
      if (("TURBOPACK compile-time truthy", 1)) {
        return parsed;
      }
      //TURBOPACK unreachable
      // Detect & add support for shebangs
      const commandFile = undefined;
      // We don't need a shell if the command filename is an executable
      const needsShell = undefined;
    }
    function parse(command, args, options) {
      // Normalize arguments, similar to nodejs
      if (args && !Array.isArray(args)) {
        options = args;
        args = null;
      }
      args = args ? args.slice(0) : []; // Clone array to avoid changing the original
      options = Object.assign({}, options); // Clone object to avoid changing the original
      // Build our parsed object
      const parsed = {
        command,
        args,
        options,
        file: undefined,
        original: {
          command,
          args,
        },
      };
      // Delegate further parsing to shell or non-shell
      return options.shell ? parsed : parseNonShell(parsed);
    }
    module.exports = parse;
  },
  "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/escape.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    // See http://www.robvanderwoude.com/escapechars.php
    const metaCharsRegExp = /([()\][%!^"`<>&|;, *?])/g;
    function escapeCommand(arg) {
      // Escape meta chars
      arg = arg.replace(metaCharsRegExp, "^$1");
      return arg;
    }
    function escapeArgument(arg, doubleEscapeMetaChars) {
      // Convert to string
      arg = `${arg}`;
      // Algorithm below is based on https://qntm.org/cmd
      // It's slightly altered to disable JS backtracking to avoid hanging on specially crafted input
      // Please see https://github.com/moxystudio/node-cross-spawn/pull/160 for more information
      // Sequence of backslashes followed by a double quote:
      // double up all the backslashes and escape the double quote
      arg = arg.replace(/(?=(\\+?)?)\1"/g, '$1$1\\"');
      // Sequence of backslashes followed by the end of the string
      // (which will become a double quote later):
      // double up all the backslashes
      arg = arg.replace(/(?=(\\+?)?)\1$/, "$1$1");
      // All other backslashes occur literally
      // Quote the whole thing:
      arg = `"${arg}"`;
      // Escape meta chars
      arg = arg.replace(metaCharsRegExp, "^$1");
      // Double escape meta chars if necessary
      if (doubleEscapeMetaChars) {
        arg = arg.replace(metaCharsRegExp, "^$1");
      }
      return arg;
    }
    module.exports.command = escapeCommand;
    module.exports.argument = escapeArgument;
  },
  "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/readShebang.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    const shebangCommand = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js [app-route] (ecmascript)",
    );
    function readShebang(command) {
      // Read the first 150 bytes from the file
      const size = 150;
      const buffer = Buffer.alloc(size);
      let fd;
      try {
        fd = fs.openSync(command, "r");
        fs.readSync(fd, buffer, 0, size, 0);
        fs.closeSync(fd);
      } catch (e) {}
      // Attempt to extract shebang (null is returned if not a shebang)
      return shebangCommand(buffer.toString());
    }
    module.exports = readShebang;
  },
  "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/lib/util/resolveCommand.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
    const which = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/which@2.0.2/node_modules/which/which.js [app-route] (ecmascript)",
    );
    const getPathKey = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js [app-route] (ecmascript)",
    );
    function resolveCommandAttempt(parsed, withoutPathExt) {
      const env = parsed.options.env || process.env;
      const cwd = process.cwd();
      const hasCustomCwd = parsed.options.cwd != null;
      // Worker threads do not have process.chdir()
      const shouldSwitchCwd = hasCustomCwd && process.chdir !== undefined && !process.chdir.disabled;
      // If a custom `cwd` was specified, we need to change the process cwd
      // because `which` will do stat calls but does not support a custom cwd
      if (shouldSwitchCwd) {
        try {
          process.chdir(parsed.options.cwd);
        } catch (err) {
          /* Empty */
        }
      }
      let resolved;
      try {
        resolved = which.sync(parsed.command, {
          path: env[
            getPathKey({
              env,
            })
          ],
          pathExt: withoutPathExt ? path.delimiter : undefined,
        });
      } catch (e) {
        /* Empty */
      } finally {
        if (shouldSwitchCwd) {
          process.chdir(cwd);
        }
      }
      // If we successfully resolved, ensure that an absolute path is returned
      // Note that when a custom `cwd` was used, we need to resolve to an absolute path based on it
      if (resolved) {
        resolved = path.resolve(hasCustomCwd ? parsed.options.cwd : "", resolved);
      }
      return resolved;
    }
    function resolveCommand(parsed) {
      return resolveCommandAttempt(parsed) || resolveCommandAttempt(parsed, true);
    }
    module.exports = resolveCommand;
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
    const childProcess = __turbopack_context__.r("[externals]/child_process [external] (child_process, cjs)");
    const crossSpawn = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/cross-spawn@7.0.6/node_modules/cross-spawn/index.js [app-route] (ecmascript)",
    );
    const stripFinalNewline = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/strip-final-newline@2.0.0/node_modules/strip-final-newline/index.js [app-route] (ecmascript)",
    );
    const npmRunPath = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/npm-run-path@4.0.1/node_modules/npm-run-path/index.js [app-route] (ecmascript)",
    );
    const onetime = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/onetime@5.1.2/node_modules/onetime/index.js [app-route] (ecmascript)",
    );
    const makeError = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/error.js [app-route] (ecmascript)",
    );
    const normalizeStdio = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stdio.js [app-route] (ecmascript)",
    );
    const { spawnedKill, spawnedCancel, setupTimeout, validateTimeout, setExitHandler } = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/kill.js [app-route] (ecmascript)",
    );
    const { handleInput, getSpawnedResult, makeAllStream, validateInputSync } = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stream.js [app-route] (ecmascript)",
    );
    const { mergePromise, getSpawnedPromise } = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/promise.js [app-route] (ecmascript)",
    );
    const { joinCommand, parseCommand, getEscapedCommand } = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/command.js [app-route] (ecmascript)",
    );
    const DEFAULT_MAX_BUFFER = 1000 * 1000 * 100;
    const getEnv = ({ env: envOption, extendEnv, preferLocal, localDir, execPath }) => {
      const env = extendEnv
        ? {
            ...process.env,
            ...envOption,
          }
        : envOption;
      if (preferLocal) {
        return npmRunPath.env({
          env,
          cwd: localDir,
          execPath,
        });
      }
      return env;
    };
    const handleArguments = (file, args, options = {}) => {
      const parsed = crossSpawn._parse(file, args, options);
      file = parsed.command;
      args = parsed.args;
      options = parsed.options;
      options = {
        maxBuffer: DEFAULT_MAX_BUFFER,
        buffer: true,
        stripFinalNewline: true,
        extendEnv: true,
        preferLocal: false,
        localDir: options.cwd || process.cwd(),
        execPath: process.execPath,
        encoding: "utf8",
        reject: true,
        cleanup: true,
        all: false,
        windowsHide: true,
        ...options,
      };
      options.env = getEnv(options);
      options.stdio = normalizeStdio(options);
      if (
        process.platform === "win32" &&
        path.basename(file, ".exe") === "cmd" //TURBOPACK unreachable
      );
      return {
        file,
        args,
        options,
        parsed,
      };
    };
    const handleOutput = (options, value, error) => {
      if (typeof value !== "string" && !Buffer.isBuffer(value)) {
        // When `execa.sync()` errors, we normalize it to '' to mimic `execa()`
        return error === undefined ? undefined : "";
      }
      if (options.stripFinalNewline) {
        return stripFinalNewline(value);
      }
      return value;
    };
    const execa = (file, args, options) => {
      const parsed = handleArguments(file, args, options);
      const command = joinCommand(file, args);
      const escapedCommand = getEscapedCommand(file, args);
      validateTimeout(parsed.options);
      let spawned;
      try {
        spawned = childProcess.spawn(parsed.file, parsed.args, parsed.options);
      } catch (error) {
        // Ensure the returned error is always both a promise and a child process
        const dummySpawned = new childProcess.ChildProcess();
        const errorPromise = Promise.reject(
          makeError({
            error,
            stdout: "",
            stderr: "",
            all: "",
            command,
            escapedCommand,
            parsed,
            timedOut: false,
            isCanceled: false,
            killed: false,
          }),
        );
        return mergePromise(dummySpawned, errorPromise);
      }
      const spawnedPromise = getSpawnedPromise(spawned);
      const timedPromise = setupTimeout(spawned, parsed.options, spawnedPromise);
      const processDone = setExitHandler(spawned, parsed.options, timedPromise);
      const context = {
        isCanceled: false,
      };
      spawned.kill = spawnedKill.bind(null, spawned.kill.bind(spawned));
      spawned.cancel = spawnedCancel.bind(null, spawned, context);
      const handlePromise = async () => {
        const [{ error, exitCode, signal, timedOut }, stdoutResult, stderrResult, allResult] = await getSpawnedResult(
          spawned,
          parsed.options,
          processDone,
        );
        const stdout = handleOutput(parsed.options, stdoutResult);
        const stderr = handleOutput(parsed.options, stderrResult);
        const all = handleOutput(parsed.options, allResult);
        if (error || exitCode !== 0 || signal !== null) {
          const returnedError = makeError({
            error,
            exitCode,
            signal,
            stdout,
            stderr,
            all,
            command,
            escapedCommand,
            parsed,
            timedOut,
            isCanceled: context.isCanceled,
            killed: spawned.killed,
          });
          if (!parsed.options.reject) {
            return returnedError;
          }
          throw returnedError;
        }
        return {
          command,
          escapedCommand,
          exitCode: 0,
          stdout,
          stderr,
          all,
          failed: false,
          timedOut: false,
          isCanceled: false,
          killed: false,
        };
      };
      const handlePromiseOnce = onetime(handlePromise);
      handleInput(spawned, parsed.options.input);
      spawned.all = makeAllStream(spawned, parsed.options);
      return mergePromise(spawned, handlePromiseOnce);
    };
    module.exports = execa;
    module.exports.sync = (file, args, options) => {
      const parsed = handleArguments(file, args, options);
      const command = joinCommand(file, args);
      const escapedCommand = getEscapedCommand(file, args);
      validateInputSync(parsed.options);
      let result;
      try {
        result = childProcess.spawnSync(parsed.file, parsed.args, parsed.options);
      } catch (error) {
        throw makeError({
          error,
          stdout: "",
          stderr: "",
          all: "",
          command,
          escapedCommand,
          parsed,
          timedOut: false,
          isCanceled: false,
          killed: false,
        });
      }
      const stdout = handleOutput(parsed.options, result.stdout, result.error);
      const stderr = handleOutput(parsed.options, result.stderr, result.error);
      if (result.error || result.status !== 0 || result.signal !== null) {
        const error = makeError({
          stdout,
          stderr,
          error: result.error,
          signal: result.signal,
          exitCode: result.status,
          command,
          escapedCommand,
          parsed,
          timedOut: result.error && result.error.code === "ETIMEDOUT",
          isCanceled: false,
          killed: result.signal !== null,
        });
        if (!parsed.options.reject) {
          return error;
        }
        throw error;
      }
      return {
        command,
        escapedCommand,
        exitCode: 0,
        stdout,
        stderr,
        failed: false,
        timedOut: false,
        isCanceled: false,
        killed: false,
      };
    };
    module.exports.command = (command, options) => {
      const [file, ...args] = parseCommand(command);
      return execa(file, args, options);
    };
    module.exports.commandSync = (command, options) => {
      const [file, ...args] = parseCommand(command);
      return execa.sync(file, args, options);
    };
    module.exports.node = (scriptPath, args, options = {}) => {
      if (args && !Array.isArray(args) && typeof args === "object") {
        options = args;
        args = [];
      }
      const stdio = normalizeStdio.node(options);
      const defaultExecArgv = process.execArgv.filter((arg) => !arg.startsWith("--inspect"));
      const { nodePath = process.execPath, nodeOptions = defaultExecArgv } = options;
      return execa(nodePath, [...nodeOptions, scriptPath, ...(Array.isArray(args) ? args : [])], {
        ...options,
        stdin: undefined,
        stdout: undefined,
        stderr: undefined,
        stdio,
        shell: false,
      });
    };
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/command.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const normalizeArgs = (file, args = []) => {
      if (!Array.isArray(args)) {
        return [file];
      }
      return [file, ...args];
    };
    const NO_ESCAPE_REGEXP = /^[\w.-]+$/;
    const DOUBLE_QUOTES_REGEXP = /"/g;
    const escapeArg = (arg) => {
      if (typeof arg !== "string" || NO_ESCAPE_REGEXP.test(arg)) {
        return arg;
      }
      return `"${arg.replace(DOUBLE_QUOTES_REGEXP, '\\"')}"`;
    };
    const joinCommand = (file, args) => {
      return normalizeArgs(file, args).join(" ");
    };
    const getEscapedCommand = (file, args) => {
      return normalizeArgs(file, args)
        .map((arg) => escapeArg(arg))
        .join(" ");
    };
    const SPACES_REGEXP = / +/g;
    // Handle `execa.command()`
    const parseCommand = (command) => {
      const tokens = [];
      for (const token of command.trim().split(SPACES_REGEXP)) {
        // Allow spaces to be escaped by a backslash if not meant as a delimiter
        const previousToken = tokens[tokens.length - 1];
        if (previousToken && previousToken.endsWith("\\")) {
          // Merge previous token with current one
          tokens[tokens.length - 1] = `${previousToken.slice(0, -1)} ${token}`;
        } else {
          tokens.push(token);
        }
      }
      return tokens;
    };
    module.exports = {
      joinCommand,
      getEscapedCommand,
      parseCommand,
    };
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/error.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const { signalsByName } = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/main.js [app-route] (ecmascript)",
    );
    const getErrorPrefix = ({ timedOut, timeout, errorCode, signal, signalDescription, exitCode, isCanceled }) => {
      if (timedOut) {
        return `timed out after ${timeout} milliseconds`;
      }
      if (isCanceled) {
        return "was canceled";
      }
      if (errorCode !== undefined) {
        return `failed with ${errorCode}`;
      }
      if (signal !== undefined) {
        return `was killed with ${signal} (${signalDescription})`;
      }
      if (exitCode !== undefined) {
        return `failed with exit code ${exitCode}`;
      }
      return "failed";
    };
    const makeError = ({
      stdout,
      stderr,
      all,
      error,
      signal,
      exitCode,
      command,
      escapedCommand,
      timedOut,
      isCanceled,
      killed,
      parsed: {
        options: { timeout },
      },
    }) => {
      // `signal` and `exitCode` emitted on `spawned.on('exit')` event can be `null`.
      // We normalize them to `undefined`
      exitCode = exitCode === null ? undefined : exitCode;
      signal = signal === null ? undefined : signal;
      const signalDescription = signal === undefined ? undefined : signalsByName[signal].description;
      const errorCode = error && error.code;
      const prefix = getErrorPrefix({
        timedOut,
        timeout,
        errorCode,
        signal,
        signalDescription,
        exitCode,
        isCanceled,
      });
      const execaMessage = `Command ${prefix}: ${command}`;
      const isError = Object.prototype.toString.call(error) === "[object Error]";
      const shortMessage = isError ? `${execaMessage}\n${error.message}` : execaMessage;
      const message = [shortMessage, stderr, stdout].filter(Boolean).join("\n");
      if (isError) {
        error.originalMessage = error.message;
        error.message = message;
      } else {
        error = new Error(message);
      }
      error.shortMessage = shortMessage;
      error.command = command;
      error.escapedCommand = escapedCommand;
      error.exitCode = exitCode;
      error.signal = signal;
      error.signalDescription = signalDescription;
      error.stdout = stdout;
      error.stderr = stderr;
      if (all !== undefined) {
        error.all = all;
      }
      if ("bufferedData" in error) {
        delete error.bufferedData;
      }
      error.failed = true;
      error.timedOut = Boolean(timedOut);
      error.isCanceled = isCanceled;
      error.killed = killed && !timedOut;
      return error;
    };
    module.exports = makeError;
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/kill.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const os = __turbopack_context__.r("[externals]/os [external] (os, cjs)");
    const onExit = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js [app-route] (ecmascript)",
    );
    const DEFAULT_FORCE_KILL_TIMEOUT = 1000 * 5;
    // Monkey-patches `childProcess.kill()` to add `forceKillAfterTimeout` behavior
    const spawnedKill = (kill, signal = "SIGTERM", options = {}) => {
      const killResult = kill(signal);
      setKillTimeout(kill, signal, options, killResult);
      return killResult;
    };
    const setKillTimeout = (kill, signal, options, killResult) => {
      if (!shouldForceKill(signal, options, killResult)) {
        return;
      }
      const timeout = getForceKillAfterTimeout(options);
      const t = setTimeout(() => {
        kill("SIGKILL");
      }, timeout);
      // Guarded because there's no `.unref()` when `execa` is used in the renderer
      // process in Electron. This cannot be tested since we don't run tests in
      // Electron.
      // istanbul ignore else
      if (t.unref) {
        t.unref();
      }
    };
    const shouldForceKill = (signal, { forceKillAfterTimeout }, killResult) => {
      return isSigterm(signal) && forceKillAfterTimeout !== false && killResult;
    };
    const isSigterm = (signal) => {
      return (
        signal === os.constants.signals.SIGTERM || (typeof signal === "string" && signal.toUpperCase() === "SIGTERM")
      );
    };
    const getForceKillAfterTimeout = ({ forceKillAfterTimeout = true }) => {
      if (forceKillAfterTimeout === true) {
        return DEFAULT_FORCE_KILL_TIMEOUT;
      }
      if (!Number.isFinite(forceKillAfterTimeout) || forceKillAfterTimeout < 0) {
        throw new TypeError(
          `Expected the \`forceKillAfterTimeout\` option to be a non-negative integer, got \`${forceKillAfterTimeout}\` (${typeof forceKillAfterTimeout})`,
        );
      }
      return forceKillAfterTimeout;
    };
    // `childProcess.cancel()`
    const spawnedCancel = (spawned, context) => {
      const killResult = spawned.kill();
      if (killResult) {
        context.isCanceled = true;
      }
    };
    const timeoutKill = (spawned, signal, reject) => {
      spawned.kill(signal);
      reject(
        Object.assign(new Error("Timed out"), {
          timedOut: true,
          signal,
        }),
      );
    };
    // `timeout` option handling
    const setupTimeout = (spawned, { timeout, killSignal = "SIGTERM" }, spawnedPromise) => {
      if (timeout === 0 || timeout === undefined) {
        return spawnedPromise;
      }
      let timeoutId;
      const timeoutPromise = new Promise((resolve, reject) => {
        timeoutId = setTimeout(() => {
          timeoutKill(spawned, killSignal, reject);
        }, timeout);
      });
      const safeSpawnedPromise = spawnedPromise.finally(() => {
        clearTimeout(timeoutId);
      });
      return Promise.race([timeoutPromise, safeSpawnedPromise]);
    };
    const validateTimeout = ({ timeout }) => {
      if (timeout !== undefined && (!Number.isFinite(timeout) || timeout < 0)) {
        throw new TypeError(
          `Expected the \`timeout\` option to be a non-negative integer, got \`${timeout}\` (${typeof timeout})`,
        );
      }
    };
    // `cleanup` option handling
    const setExitHandler = async (spawned, { cleanup, detached }, timedPromise) => {
      if (!cleanup || detached) {
        return timedPromise;
      }
      const removeExitHandler = onExit(() => {
        spawned.kill();
      });
      return timedPromise.finally(() => {
        removeExitHandler();
      });
    };
    module.exports = {
      spawnedKill,
      spawnedCancel,
      setupTimeout,
      validateTimeout,
      setExitHandler,
    };
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/promise.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const nativePromisePrototype = (async () => {})().constructor.prototype;
    const descriptors = ["then", "catch", "finally"].map((property) => [
      property,
      Reflect.getOwnPropertyDescriptor(nativePromisePrototype, property),
    ]);
    // The return value is a mixin of `childProcess` and `Promise`
    const mergePromise = (spawned, promise) => {
      for (const [property, descriptor] of descriptors) {
        // Starting the main `promise` is deferred to avoid consuming streams
        const value =
          typeof promise === "function"
            ? (...args) => Reflect.apply(descriptor.value, promise(), args)
            : descriptor.value.bind(promise);
        Reflect.defineProperty(spawned, property, {
          ...descriptor,
          value,
        });
      }
      return spawned;
    };
    // Use promises instead of `child_process` events
    const getSpawnedPromise = (spawned) => {
      return new Promise((resolve, reject) => {
        spawned.on("exit", (exitCode, signal) => {
          resolve({
            exitCode,
            signal,
          });
        });
        spawned.on("error", (error) => {
          reject(error);
        });
        if (spawned.stdin) {
          spawned.stdin.on("error", (error) => {
            reject(error);
          });
        }
      });
    };
    module.exports = {
      mergePromise,
      getSpawnedPromise,
    };
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stdio.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const aliases = ["stdin", "stdout", "stderr"];
    const hasAlias = (options) => aliases.some((alias) => options[alias] !== undefined);
    const normalizeStdio = (options) => {
      if (!options) {
        return;
      }
      const { stdio } = options;
      if (stdio === undefined) {
        return aliases.map((alias) => options[alias]);
      }
      if (hasAlias(options)) {
        throw new Error(
          `It's not possible to provide \`stdio\` in combination with one of ${aliases.map((alias) => `\`${alias}\``).join(", ")}`,
        );
      }
      if (typeof stdio === "string") {
        return stdio;
      }
      if (!Array.isArray(stdio)) {
        throw new TypeError(`Expected \`stdio\` to be of type \`string\` or \`Array\`, got \`${typeof stdio}\``);
      }
      const length = Math.max(stdio.length, aliases.length);
      return Array.from(
        {
          length,
        },
        (value, index) => stdio[index],
      );
    };
    module.exports = normalizeStdio;
    // `ipc` is pushed unless it is already present
    module.exports.node = (options) => {
      const stdio = normalizeStdio(options);
      if (stdio === "ipc") {
        return "ipc";
      }
      if (stdio === undefined || typeof stdio === "string") {
        return [stdio, stdio, stdio, "ipc"];
      }
      if (stdio.includes("ipc")) {
        return stdio;
      }
      return [...stdio, "ipc"];
    };
  },
  "[project]/node_modules/.pnpm/execa@5.1.1/node_modules/execa/lib/stream.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const isStream = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/is-stream@2.0.1/node_modules/is-stream/index.js [app-route] (ecmascript)",
    );
    const getStream = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/index.js [app-route] (ecmascript)",
    );
    const mergeStream = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/merge-stream@2.0.0/node_modules/merge-stream/index.js [app-route] (ecmascript)",
    );
    // `input` option
    const handleInput = (spawned, input) => {
      // Checking for stdin is workaround for https://github.com/nodejs/node/issues/26852
      // @todo remove `|| spawned.stdin === undefined` once we drop support for Node.js <=12.2.0
      if (input === undefined || spawned.stdin === undefined) {
        return;
      }
      if (isStream(input)) {
        input.pipe(spawned.stdin);
      } else {
        spawned.stdin.end(input);
      }
    };
    // `all` interleaves `stdout` and `stderr`
    const makeAllStream = (spawned, { all }) => {
      if (!all || (!spawned.stdout && !spawned.stderr)) {
        return;
      }
      const mixed = mergeStream();
      if (spawned.stdout) {
        mixed.add(spawned.stdout);
      }
      if (spawned.stderr) {
        mixed.add(spawned.stderr);
      }
      return mixed;
    };
    // On failure, `result.stdout|stderr|all` should contain the currently buffered stream
    const getBufferedData = async (stream, streamPromise) => {
      if (!stream) {
        return;
      }
      stream.destroy();
      try {
        return await streamPromise;
      } catch (error) {
        return error.bufferedData;
      }
    };
    const getStreamPromise = (stream, { encoding, buffer, maxBuffer }) => {
      if (!stream || !buffer) {
        return;
      }
      if (encoding) {
        return getStream(stream, {
          encoding,
          maxBuffer,
        });
      }
      return getStream.buffer(stream, {
        maxBuffer,
      });
    };
    // Retrieve result of child process: exit code, signal, error, streams (stdout/stderr/all)
    const getSpawnedResult = async ({ stdout, stderr, all }, { encoding, buffer, maxBuffer }, processDone) => {
      const stdoutPromise = getStreamPromise(stdout, {
        encoding,
        buffer,
        maxBuffer,
      });
      const stderrPromise = getStreamPromise(stderr, {
        encoding,
        buffer,
        maxBuffer,
      });
      const allPromise = getStreamPromise(all, {
        encoding,
        buffer,
        maxBuffer: maxBuffer * 2,
      });
      try {
        return await Promise.all([processDone, stdoutPromise, stderrPromise, allPromise]);
      } catch (error) {
        return Promise.all([
          {
            error,
            signal: error.signal,
            timedOut: error.timedOut,
          },
          getBufferedData(stdout, stdoutPromise),
          getBufferedData(stderr, stderrPromise),
          getBufferedData(all, allPromise),
        ]);
      }
    };
    const validateInputSync = ({ input }) => {
      if (isStream(input)) {
        throw new TypeError("The `input` option cannot be a stream in sync mode");
      }
    };
    module.exports = {
      handleInput,
      makeAllStream,
      getSpawnedResult,
      validateInputSync,
    };
  },
  "[project]/node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/buffer-stream.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const { PassThrough: PassThroughStream } = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
    module.exports = (options) => {
      options = {
        ...options,
      };
      const { array } = options;
      let { encoding } = options;
      const isBuffer = encoding === "buffer";
      let objectMode = false;
      if (array) {
        objectMode = !(encoding || isBuffer);
      } else {
        encoding = encoding || "utf8";
      }
      if (isBuffer) {
        encoding = null;
      }
      const stream = new PassThroughStream({
        objectMode,
      });
      if (encoding) {
        stream.setEncoding(encoding);
      }
      let length = 0;
      const chunks = [];
      stream.on("data", (chunk) => {
        chunks.push(chunk);
        if (objectMode) {
          length = chunks.length;
        } else {
          length += chunk.length;
        }
      });
      stream.getBufferedValue = () => {
        if (array) {
          return chunks;
        }
        return isBuffer ? Buffer.concat(chunks, length) : chunks.join("");
      };
      stream.getBufferedLength = () => length;
      return stream;
    };
  },
  "[project]/node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const { constants: BufferConstants } = __turbopack_context__.r("[externals]/buffer [external] (buffer, cjs)");
    const stream = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
    const { promisify } = __turbopack_context__.r("[externals]/util [external] (util, cjs)");
    const bufferStream = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/get-stream@6.0.1/node_modules/get-stream/buffer-stream.js [app-route] (ecmascript)",
    );
    const streamPipelinePromisified = promisify(stream.pipeline);
    class MaxBufferError extends Error {
      constructor() {
        super("maxBuffer exceeded");
        this.name = "MaxBufferError";
      }
    }
    async function getStream(inputStream, options) {
      if (!inputStream) {
        throw new Error("Expected a stream");
      }
      options = {
        maxBuffer: Infinity,
        ...options,
      };
      const { maxBuffer } = options;
      const stream = bufferStream(options);
      await new Promise((resolve, reject) => {
        const rejectPromise = (error) => {
          // Don't retrieve an oversized buffer.
          if (error && stream.getBufferedLength() <= BufferConstants.MAX_LENGTH) {
            error.bufferedData = stream.getBufferedValue();
          }
          reject(error);
        };
        (async () => {
          try {
            await streamPipelinePromisified(inputStream, stream);
            resolve();
          } catch (error) {
            rejectPromise(error);
          }
        })();
        stream.on("data", () => {
          if (stream.getBufferedLength() > maxBuffer) {
            rejectPromise(new MaxBufferError());
          }
        });
      });
      return stream.getBufferedValue();
    }
    module.exports = getStream;
    module.exports.buffer = (stream, options) =>
      getStream(stream, {
        ...options,
        encoding: "buffer",
      });
    module.exports.array = (stream, options) =>
      getStream(stream, {
        ...options,
        array: true,
      });
    module.exports.MaxBufferError = MaxBufferError;
  },
  "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/core.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.SIGNALS = void 0;
    const SIGNALS = [
      {
        name: "SIGHUP",
        number: 1,
        action: "terminate",
        description: "Terminal closed",
        standard: "posix",
      },
      {
        name: "SIGINT",
        number: 2,
        action: "terminate",
        description: "User interruption with CTRL-C",
        standard: "ansi",
      },
      {
        name: "SIGQUIT",
        number: 3,
        action: "core",
        description: "User interruption with CTRL-\\",
        standard: "posix",
      },
      {
        name: "SIGILL",
        number: 4,
        action: "core",
        description: "Invalid machine instruction",
        standard: "ansi",
      },
      {
        name: "SIGTRAP",
        number: 5,
        action: "core",
        description: "Debugger breakpoint",
        standard: "posix",
      },
      {
        name: "SIGABRT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "ansi",
      },
      {
        name: "SIGIOT",
        number: 6,
        action: "core",
        description: "Aborted",
        standard: "bsd",
      },
      {
        name: "SIGBUS",
        number: 7,
        action: "core",
        description: "Bus error due to misaligned, non-existing address or paging error",
        standard: "bsd",
      },
      {
        name: "SIGEMT",
        number: 7,
        action: "terminate",
        description: "Command should be emulated but is not implemented",
        standard: "other",
      },
      {
        name: "SIGFPE",
        number: 8,
        action: "core",
        description: "Floating point arithmetic error",
        standard: "ansi",
      },
      {
        name: "SIGKILL",
        number: 9,
        action: "terminate",
        description: "Forced termination",
        standard: "posix",
        forced: true,
      },
      {
        name: "SIGUSR1",
        number: 10,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix",
      },
      {
        name: "SIGSEGV",
        number: 11,
        action: "core",
        description: "Segmentation fault",
        standard: "ansi",
      },
      {
        name: "SIGUSR2",
        number: 12,
        action: "terminate",
        description: "Application-specific signal",
        standard: "posix",
      },
      {
        name: "SIGPIPE",
        number: 13,
        action: "terminate",
        description: "Broken pipe or socket",
        standard: "posix",
      },
      {
        name: "SIGALRM",
        number: 14,
        action: "terminate",
        description: "Timeout or timer",
        standard: "posix",
      },
      {
        name: "SIGTERM",
        number: 15,
        action: "terminate",
        description: "Termination",
        standard: "ansi",
      },
      {
        name: "SIGSTKFLT",
        number: 16,
        action: "terminate",
        description: "Stack is empty or overflowed",
        standard: "other",
      },
      {
        name: "SIGCHLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "posix",
      },
      {
        name: "SIGCLD",
        number: 17,
        action: "ignore",
        description: "Child process terminated, paused or unpaused",
        standard: "other",
      },
      {
        name: "SIGCONT",
        number: 18,
        action: "unpause",
        description: "Unpaused",
        standard: "posix",
        forced: true,
      },
      {
        name: "SIGSTOP",
        number: 19,
        action: "pause",
        description: "Paused",
        standard: "posix",
        forced: true,
      },
      {
        name: "SIGTSTP",
        number: 20,
        action: "pause",
        description: 'Paused using CTRL-Z or "suspend"',
        standard: "posix",
      },
      {
        name: "SIGTTIN",
        number: 21,
        action: "pause",
        description: "Background process cannot read terminal input",
        standard: "posix",
      },
      {
        name: "SIGBREAK",
        number: 21,
        action: "terminate",
        description: "User interruption with CTRL-BREAK",
        standard: "other",
      },
      {
        name: "SIGTTOU",
        number: 22,
        action: "pause",
        description: "Background process cannot write to terminal output",
        standard: "posix",
      },
      {
        name: "SIGURG",
        number: 23,
        action: "ignore",
        description: "Socket received out-of-band data",
        standard: "bsd",
      },
      {
        name: "SIGXCPU",
        number: 24,
        action: "core",
        description: "Process timed out",
        standard: "bsd",
      },
      {
        name: "SIGXFSZ",
        number: 25,
        action: "core",
        description: "File too big",
        standard: "bsd",
      },
      {
        name: "SIGVTALRM",
        number: 26,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd",
      },
      {
        name: "SIGPROF",
        number: 27,
        action: "terminate",
        description: "Timeout or timer",
        standard: "bsd",
      },
      {
        name: "SIGWINCH",
        number: 28,
        action: "ignore",
        description: "Terminal window size changed",
        standard: "bsd",
      },
      {
        name: "SIGIO",
        number: 29,
        action: "terminate",
        description: "I/O is available",
        standard: "other",
      },
      {
        name: "SIGPOLL",
        number: 29,
        action: "terminate",
        description: "Watched event",
        standard: "other",
      },
      {
        name: "SIGINFO",
        number: 29,
        action: "ignore",
        description: "Request for process information",
        standard: "other",
      },
      {
        name: "SIGPWR",
        number: 30,
        action: "terminate",
        description: "Device running out of power",
        standard: "systemv",
      },
      {
        name: "SIGSYS",
        number: 31,
        action: "core",
        description: "Invalid system call",
        standard: "other",
      },
      {
        name: "SIGUNUSED",
        number: 31,
        action: "terminate",
        description: "Invalid system call",
        standard: "other",
      },
    ];
    exports.SIGNALS = SIGNALS;
  },
  "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/main.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.signalsByNumber = exports.signalsByName = void 0;
    var _os = __turbopack_context__.r("[externals]/os [external] (os, cjs)");
    var _signals = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/signals.js [app-route] (ecmascript)",
    );
    var _realtime = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/realtime.js [app-route] (ecmascript)",
    );
    const getSignalsByName = () => {
      const signals = (0, _signals.getSignals)();
      return signals.reduce(getSignalByName, {});
    };
    const getSignalByName = (signalByNameMemo, { name, number, description, supported, action, forced, standard }) => ({
      ...signalByNameMemo,
      [name]: {
        name,
        number,
        description,
        supported,
        action,
        forced,
        standard,
      },
    });
    const signalsByName = getSignalsByName();
    exports.signalsByName = signalsByName;
    const getSignalsByNumber = () => {
      const signals = (0, _signals.getSignals)();
      const length = _realtime.SIGRTMAX + 1;
      const signalsA = Array.from(
        {
          length,
        },
        (value, number) => getSignalByNumber(number, signals),
      );
      return Object.assign({}, ...signalsA);
    };
    const getSignalByNumber = (number, signals) => {
      const signal = findSignalByNumber(number, signals);
      if (signal === undefined) {
        return {};
      }
      const { name, description, supported, action, forced, standard } = signal;
      return {
        [number]: {
          name,
          number,
          description,
          supported,
          action,
          forced,
          standard,
        },
      };
    };
    const findSignalByNumber = (number, signals) => {
      const signal = signals.find(({ name }) => _os.constants.signals[name] === number);
      if (signal !== undefined) {
        return signal;
      }
      return signals.find((signalA) => signalA.number === number);
    };
    const signalsByNumber = getSignalsByNumber();
    exports.signalsByNumber = signalsByNumber;
  },
  "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/realtime.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.SIGRTMAX = exports.getRealtimeSignals = void 0;
    const getRealtimeSignals = () => {
      const length = SIGRTMAX - SIGRTMIN + 1;
      return Array.from(
        {
          length,
        },
        getRealtimeSignal,
      );
    };
    exports.getRealtimeSignals = getRealtimeSignals;
    const getRealtimeSignal = (value, index) => ({
      name: `SIGRT${index + 1}`,
      number: SIGRTMIN + index,
      action: "terminate",
      description: "Application-specific signal (realtime)",
      standard: "posix",
    });
    const SIGRTMIN = 34;
    const SIGRTMAX = 64;
    exports.SIGRTMAX = SIGRTMAX;
  },
  "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/signals.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    Object.defineProperty(exports, "__esModule", {
      value: true,
    });
    exports.getSignals = void 0;
    var _os = __turbopack_context__.r("[externals]/os [external] (os, cjs)");
    var _core = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/core.js [app-route] (ecmascript)",
    );
    var _realtime = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/human-signals@2.1.0/node_modules/human-signals/build/src/realtime.js [app-route] (ecmascript)",
    );
    const getSignals = () => {
      const realtimeSignals = (0, _realtime.getRealtimeSignals)();
      const signals = [..._core.SIGNALS, ...realtimeSignals].map(normalizeSignal);
      return signals;
    };
    exports.getSignals = getSignals;
    const normalizeSignal = ({ name, number: defaultNumber, description, action, forced = false, standard }) => {
      const {
        signals: { [name]: constantSignal },
      } = _os.constants;
      const supported = constantSignal !== undefined;
      const number = supported ? constantSignal : defaultNumber;
      return {
        name,
        number,
        description,
        supported,
        action,
        forced,
        standard,
      };
    };
  },
  "[project]/node_modules/.pnpm/is-buffer@2.0.5/node_modules/is-buffer/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    /*!
     * Determine if an object is a Buffer
     *
     * @author   Feross Aboukhadijeh <https://feross.org>
     * @license  MIT
     */ module.exports = function isBuffer(obj) {
      return (
        obj != null &&
        obj.constructor != null &&
        typeof obj.constructor.isBuffer === "function" &&
        obj.constructor.isBuffer(obj)
      );
    };
  },
  "[project]/node_modules/.pnpm/is-node-process@1.2.0/node_modules/is-node-process/lib/index.mjs [app-route] (ecmascript)",
  (__turbopack_context__) => {
    __turbopack_context__.s(["isNodeProcess", () => isNodeProcess]);
    // src/index.ts
    function isNodeProcess() {
      if (typeof navigator !== "undefined" && navigator.product === "ReactNative") {
        return true;
      }
      if (typeof process !== "undefined") {
        const type = process.type;
        if (type === "renderer" || type === "worker") {
          return false;
        }
        return !!(process.versions && process.versions.node);
      }
      return false;
    }
  },
  "[project]/node_modules/.pnpm/is-stream@2.0.1/node_modules/is-stream/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const isStream = (stream) => stream !== null && typeof stream === "object" && typeof stream.pipe === "function";
    isStream.writable = (stream) =>
      isStream(stream) &&
      stream.writable !== false &&
      typeof stream._write === "function" &&
      typeof stream._writableState === "object";
    isStream.readable = (stream) =>
      isStream(stream) &&
      stream.readable !== false &&
      typeof stream._read === "function" &&
      typeof stream._readableState === "object";
    isStream.duplex = (stream) => isStream.writable(stream) && isStream.readable(stream);
    isStream.transform = (stream) => isStream.duplex(stream) && typeof stream._transform === "function";
    module.exports = isStream;
  },
  "[project]/node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    var core;
    if (process.platform === "win32" || /*TURBOPACK member replacement*/ __turbopack_context__.g.TESTING_WINDOWS) {
      core = __turbopack_context__.r(
        "[project]/node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js [app-route] (ecmascript)",
      );
    } else {
      core = __turbopack_context__.r(
        "[project]/node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js [app-route] (ecmascript)",
      );
    }
    module.exports = isexe;
    isexe.sync = sync;
    function isexe(path, options, cb) {
      if (typeof options === "function") {
        cb = options;
        options = {};
      }
      if (!cb) {
        if (typeof Promise !== "function") {
          throw new TypeError("callback not provided");
        }
        return new Promise((resolve, reject) => {
          isexe(path, options || {}, (er, is) => {
            if (er) {
              reject(er);
            } else {
              resolve(is);
            }
          });
        });
      }
      core(path, options || {}, (er, is) => {
        // ignore EACCES because that just means we aren't allowed to run it
        if (er) {
          if (er.code === "EACCES" || (options && options.ignoreErrors)) {
            er = null;
            is = false;
          }
        }
        cb(er, is);
      });
    }
    function sync(path, options) {
      // my kingdom for a filtered catch
      try {
        return core.sync(path, options || {});
      } catch (er) {
        if ((options && options.ignoreErrors) || er.code === "EACCES") {
          return false;
        } else {
          throw er;
        }
      }
    }
  },
  "[project]/node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/mode.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    module.exports = isexe;
    isexe.sync = sync;
    var fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    function isexe(path, options, cb) {
      fs.stat(path, (er, stat) => {
        cb(er, er ? false : checkStat(stat, options));
      });
    }
    function sync(path, options) {
      return checkStat(fs.statSync(path), options);
    }
    function checkStat(stat, options) {
      return stat.isFile() && checkMode(stat, options);
    }
    function checkMode(stat, options) {
      var mod = stat.mode;
      var uid = stat.uid;
      var gid = stat.gid;
      var myUid = options.uid !== undefined ? options.uid : process.getuid && process.getuid();
      var myGid = options.gid !== undefined ? options.gid : process.getgid && process.getgid();
      var u = parseInt("100", 8);
      var g = parseInt("010", 8);
      var o = parseInt("001", 8);
      var ug = u | g;
      var ret = mod & o || (mod & g && gid === myGid) || (mod & u && uid === myUid) || (mod & ug && myUid === 0);
      return ret;
    }
  },
  "[project]/node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/windows.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    module.exports = isexe;
    isexe.sync = sync;
    var fs = __turbopack_context__.r("[externals]/fs [external] (fs, cjs)");
    function checkPathExt(path, options) {
      var pathext = options.pathExt !== undefined ? options.pathExt : process.env.PATHEXT;
      if (!pathext) {
        return true;
      }
      pathext = pathext.split(";");
      if (pathext.indexOf("") !== -1) {
        return true;
      }
      for (var i = 0; i < pathext.length; i++) {
        var p = pathext[i].toLowerCase();
        if (p && path.substr(-p.length).toLowerCase() === p) {
          return true;
        }
      }
      return false;
    }
    function checkStat(stat, path, options) {
      if (!stat.isSymbolicLink() && !stat.isFile()) {
        return false;
      }
      return checkPathExt(path, options);
    }
    function isexe(path, options, cb) {
      fs.stat(path, (er, stat) => {
        cb(er, er ? false : checkStat(stat, path, options));
      });
    }
    function sync(path, options) {
      return checkStat(fs.statSync(path), path, options);
    }
  },
  "[project]/node_modules/.pnpm/merge-stream@2.0.0/node_modules/merge-stream/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const { PassThrough } = __turbopack_context__.r("[externals]/stream [external] (stream, cjs)");
    module.exports = () => {
      var sources = [];
      var output = new PassThrough({
        objectMode: true,
      });
      output.setMaxListeners(0);
      output.add = add;
      output.isEmpty = isEmpty;
      output.on("unpipe", remove);
      Array.prototype.slice.call(arguments).forEach(add);
      return output;
      //TURBOPACK unreachable
      function add(source) {
        if (Array.isArray(source)) {
          source.forEach(add);
          return this;
        }
        sources.push(source);
        source.once("end", remove.bind(null, source));
        source.once("error", output.emit.bind(output, "error"));
        source.pipe(output, {
          end: false,
        });
        return this;
      }
      function isEmpty() {
        return sources.length == 0;
      }
      function remove(source) {
        sources = sources.filter((it) => it !== source);
        if (!sources.length && output.readable) {
          output.end();
        }
      }
    };
  },
  "[project]/node_modules/.pnpm/mimic-fn@2.1.0/node_modules/mimic-fn/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const mimicFn = (to, from) => {
      for (const prop of Reflect.ownKeys(from)) {
        Object.defineProperty(to, prop, Object.getOwnPropertyDescriptor(from, prop));
      }
      return to;
    };
    module.exports = mimicFn;
    // TODO: Remove this for the next major release
    module.exports.default = mimicFn;
  },
  "[project]/node_modules/.pnpm/npm-run-path@4.0.1/node_modules/npm-run-path/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
    const pathKey = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js [app-route] (ecmascript)",
    );
    const npmRunPath = (options) => {
      options = {
        cwd: process.cwd(),
        path: process.env[pathKey()],
        execPath: process.execPath,
        ...options,
      };
      let previous;
      let cwdPath = path.resolve(options.cwd);
      const result = [];
      while (previous !== cwdPath) {
        result.push(path.join(cwdPath, "node_modules/.bin"));
        previous = cwdPath;
        cwdPath = path.resolve(cwdPath, "..");
      }
      // Ensure the running `node` binary is used
      const execPathDir = path.resolve(options.cwd, options.execPath, "..");
      result.push(execPathDir);
      return result.concat(options.path).join(path.delimiter);
    };
    module.exports = npmRunPath;
    // TODO: Remove this for the next major release
    module.exports.default = npmRunPath;
    module.exports.env = (options) => {
      options = {
        env: process.env,
        ...options,
      };
      const env = {
        ...options.env,
      };
      const path = pathKey({
        env,
      });
      options.path = env[path];
      env[path] = module.exports(options);
      return env;
    };
  },
  "[project]/node_modules/.pnpm/onetime@5.1.2/node_modules/onetime/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const mimicFn = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/mimic-fn@2.1.0/node_modules/mimic-fn/index.js [app-route] (ecmascript)",
    );
    const calledFunctions = new WeakMap();
    const onetime = (function_, options = {}) => {
      if (typeof function_ !== "function") {
        throw new TypeError("Expected a function");
      }
      let returnValue;
      let callCount = 0;
      const functionName = function_.displayName || function_.name || "<anonymous>";
      const onetime = function (...arguments_) {
        calledFunctions.set(onetime, ++callCount);
        if (callCount === 1) {
          returnValue = function_.apply(this, arguments_);
          function_ = null;
        } else if (options.throw === true) {
          throw new Error(`Function \`${functionName}\` can only be called once`);
        }
        return returnValue;
      };
      mimicFn(onetime, function_);
      calledFunctions.set(onetime, callCount);
      return onetime;
    };
    module.exports = onetime;
    // TODO: Remove this for the next major release
    module.exports.default = onetime;
    module.exports.callCount = (function_) => {
      if (!calledFunctions.has(function_)) {
        throw new Error(`The given function \`${function_.name}\` is not wrapped by the \`onetime\` package`);
      }
      return calledFunctions.get(function_);
    };
  },
  "[project]/node_modules/.pnpm/path-key@3.1.1/node_modules/path-key/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const pathKey = (options = {}) => {
      const environment = options.env || process.env;
      const platform = options.platform || process.platform;
      if (platform !== "win32") {
        return "PATH";
      }
      return (
        Object.keys(environment)
          .reverse()
          .find((key) => key.toUpperCase() === "PATH") || "Path"
      );
    };
    module.exports = pathKey;
    // TODO: Remove this for the next major release
    module.exports.default = pathKey;
  },
  "[project]/node_modules/.pnpm/retry@0.13.1/node_modules/retry/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    module.exports = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/retry@0.13.1/node_modules/retry/lib/retry.js [app-route] (ecmascript)",
    );
  },
  "[project]/node_modules/.pnpm/retry@0.13.1/node_modules/retry/lib/retry.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    var RetryOperation = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/retry@0.13.1/node_modules/retry/lib/retry_operation.js [app-route] (ecmascript)",
    );
    exports.operation = (options) => {
      var timeouts = exports.timeouts(options);
      return new RetryOperation(timeouts, {
        forever: options && (options.forever || options.retries === Infinity),
        unref: options && options.unref,
        maxRetryTime: options && options.maxRetryTime,
      });
    };
    exports.timeouts = function (options) {
      if (options instanceof Array) {
        return [].concat(options);
      }
      var opts = {
        retries: 10,
        factor: 2,
        minTimeout: 1 * 1000,
        maxTimeout: Infinity,
        randomize: false,
      };
      for (var key in options) {
        opts[key] = options[key];
      }
      if (opts.minTimeout > opts.maxTimeout) {
        throw new Error("minTimeout is greater than maxTimeout");
      }
      var timeouts = [];
      for (var i = 0; i < opts.retries; i++) {
        timeouts.push(this.createTimeout(i, opts));
      }
      if (options && options.forever && !timeouts.length) {
        timeouts.push(this.createTimeout(i, opts));
      }
      // sort the array numerically ascending
      timeouts.sort((a, b) => a - b);
      return timeouts;
    };
    exports.createTimeout = (attempt, opts) => {
      var random = opts.randomize ? Math.random() + 1 : 1;
      var timeout = Math.round(random * Math.max(opts.minTimeout, 1) * Math.pow(opts.factor, attempt));
      timeout = Math.min(timeout, opts.maxTimeout);
      return timeout;
    };
    exports.wrap = (obj, options, methods) => {
      if (options instanceof Array) {
        methods = options;
        options = null;
      }
      if (!methods) {
        methods = [];
        for (var key in obj) {
          if (typeof obj[key] === "function") {
            methods.push(key);
          }
        }
      }
      for (var i = 0; i < methods.length; i++) {
        var method = methods[i];
        var original = obj[method];
        obj[method] = function retryWrapper(original) {
          var op = exports.operation(options);
          var args = Array.prototype.slice.call(arguments, 1);
          var callback = args.pop();
          args.push(function (err) {
            if (op.retry(err)) {
              return;
            }
            if (err) {
              arguments[0] = op.mainError();
            }
            callback.apply(this, arguments);
          });
          op.attempt(() => {
            original.apply(obj, args);
          });
        }.bind(obj, original);
        obj[method].options = options;
      }
    };
  },
  "[project]/node_modules/.pnpm/retry@0.13.1/node_modules/retry/lib/retry_operation.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    function RetryOperation(timeouts, options) {
      // Compatibility for the old (timeouts, retryForever) signature
      if (typeof options === "boolean") {
        options = {
          forever: options,
        };
      }
      this._originalTimeouts = JSON.parse(JSON.stringify(timeouts));
      this._timeouts = timeouts;
      this._options = options || {};
      this._maxRetryTime = (options && options.maxRetryTime) || Infinity;
      this._fn = null;
      this._errors = [];
      this._attempts = 1;
      this._operationTimeout = null;
      this._operationTimeoutCb = null;
      this._timeout = null;
      this._operationStart = null;
      this._timer = null;
      if (this._options.forever) {
        this._cachedTimeouts = this._timeouts.slice(0);
      }
    }
    module.exports = RetryOperation;
    RetryOperation.prototype.reset = function () {
      this._attempts = 1;
      this._timeouts = this._originalTimeouts.slice(0);
    };
    RetryOperation.prototype.stop = function () {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (this._timer) {
        clearTimeout(this._timer);
      }
      this._timeouts = [];
      this._cachedTimeouts = null;
    };
    RetryOperation.prototype.retry = function (err) {
      if (this._timeout) {
        clearTimeout(this._timeout);
      }
      if (!err) {
        return false;
      }
      var currentTime = new Date().getTime();
      if (err && currentTime - this._operationStart >= this._maxRetryTime) {
        this._errors.push(err);
        this._errors.unshift(new Error("RetryOperation timeout occurred"));
        return false;
      }
      this._errors.push(err);
      var timeout = this._timeouts.shift();
      if (timeout === undefined) {
        if (this._cachedTimeouts) {
          // retry forever, only keep last error
          this._errors.splice(0, this._errors.length - 1);
          timeout = this._cachedTimeouts.slice(-1);
        } else {
          return false;
        }
      }
      this._timer = setTimeout(() => {
        this._attempts++;
        if (this._operationTimeoutCb) {
          this._timeout = setTimeout(() => {
            this._operationTimeoutCb(this._attempts);
          }, this._operationTimeout);
          if (this._options.unref) {
            this._timeout.unref();
          }
        }
        this._fn(this._attempts);
      }, timeout);
      if (this._options.unref) {
        this._timer.unref();
      }
      return true;
    };
    RetryOperation.prototype.attempt = function (fn, timeoutOps) {
      this._fn = fn;
      if (timeoutOps) {
        if (timeoutOps.timeout) {
          this._operationTimeout = timeoutOps.timeout;
        }
        if (timeoutOps.cb) {
          this._operationTimeoutCb = timeoutOps.cb;
        }
      }
      if (this._operationTimeoutCb) {
        this._timeout = setTimeout(() => {
          this._operationTimeoutCb();
        }, this._operationTimeout);
      }
      this._operationStart = new Date().getTime();
      this._fn(this._attempts);
    };
    RetryOperation.prototype.try = function (fn) {
      console.log("Using RetryOperation.try() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = function (fn) {
      console.log("Using RetryOperation.start() is deprecated");
      this.attempt(fn);
    };
    RetryOperation.prototype.start = RetryOperation.prototype.try;
    RetryOperation.prototype.errors = function () {
      return this._errors;
    };
    RetryOperation.prototype.attempts = function () {
      return this._attempts;
    };
    RetryOperation.prototype.mainError = function () {
      if (this._errors.length === 0) {
        return null;
      }
      var counts = {};
      var mainError = null;
      var mainErrorCount = 0;
      for (var i = 0; i < this._errors.length; i++) {
        var error = this._errors[i];
        var message = error.message;
        var count = (counts[message] || 0) + 1;
        counts[message] = count;
        if (count >= mainErrorCount) {
          mainError = error;
          mainErrorCount = count;
        }
      }
      return mainError;
    };
  },
  "[project]/node_modules/.pnpm/shebang-command@2.0.0/node_modules/shebang-command/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const shebangRegex = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js [app-route] (ecmascript)",
    );
    module.exports = (string = "") => {
      const match = string.match(shebangRegex);
      if (!match) {
        return null;
      }
      const [path, argument] = match[0].replace(/#! ?/, "").split(" ");
      const binary = path.split("/").pop();
      if (binary === "env") {
        return argument;
      }
      return argument ? `${binary} ${argument}` : binary;
    };
  },
  "[project]/node_modules/.pnpm/shebang-regex@3.0.0/node_modules/shebang-regex/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    module.exports = /^#!(.*)/;
  },
  "[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    // Note: since nyc uses this module to output coverage, any lines
    // that are in the direct sync flow of nyc's outputCoverage are
    // ignored, since we can never get coverage for them.
    // grab a reference to node's real process object right away
    var process = /*TURBOPACK member replacement*/ __turbopack_context__.g.process;
    const processOk = (process) =>
      process &&
      typeof process === "object" &&
      typeof process.removeListener === "function" &&
      typeof process.emit === "function" &&
      typeof process.reallyExit === "function" &&
      typeof process.listeners === "function" &&
      typeof process.kill === "function" &&
      typeof process.pid === "number" &&
      typeof process.on === "function";
    // some kind of non-node environment, just no-op
    /* istanbul ignore if */ if (!processOk(process)) {
      module.exports = () => () => {};
    } else {
      var assert = __turbopack_context__.r("[externals]/assert [external] (assert, cjs)");
      var signals = __turbopack_context__.r(
        "[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js [app-route] (ecmascript)",
      );
      var isWin = /^win/i.test(process.platform);
      var EE = __turbopack_context__.r("[externals]/events [external] (events, cjs)");
      /* istanbul ignore if */ if (typeof EE !== "function") {
        EE = EE.EventEmitter;
      }
      var emitter;
      if (process.__signal_exit_emitter__) {
        emitter = process.__signal_exit_emitter__;
      } else {
        emitter = process.__signal_exit_emitter__ = new EE();
        emitter.count = 0;
        emitter.emitted = {};
      }
      // Because this emitter is a global, we have to check to see if a
      // previous version of this library failed to enable infinite listeners.
      // I know what you're about to say.  But literally everything about
      // signal-exit is a compromise with evil.  Get used to it.
      if (!emitter.infinite) {
        emitter.setMaxListeners(Infinity);
        emitter.infinite = true;
      }
      module.exports = (cb, opts) => {
        /* istanbul ignore if */ if (!processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
          return () => {};
        }
        assert.equal(typeof cb, "function", "a callback must be provided for exit handler");
        if (loaded === false) {
          load();
        }
        var ev = "exit";
        if (opts && opts.alwaysLast) {
          ev = "afterexit";
        }
        var remove = () => {
          emitter.removeListener(ev, cb);
          if (emitter.listeners("exit").length === 0 && emitter.listeners("afterexit").length === 0) {
            unload();
          }
        };
        emitter.on(ev, cb);
        return remove;
      };
      var unload = function unload() {
        if (!loaded || !processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
          return;
        }
        loaded = false;
        signals.forEach((sig) => {
          try {
            process.removeListener(sig, sigListeners[sig]);
          } catch (er) {}
        });
        process.emit = originalProcessEmit;
        process.reallyExit = originalProcessReallyExit;
        emitter.count -= 1;
      };
      module.exports.unload = unload;
      var emit = function emit(event, code, signal) {
        /* istanbul ignore if */ if (emitter.emitted[event]) {
          return;
        }
        emitter.emitted[event] = true;
        emitter.emit(event, code, signal);
      };
      // { <signal>: <listener fn>, ... }
      var sigListeners = {};
      signals.forEach((sig) => {
        sigListeners[sig] = function listener() {
          /* istanbul ignore if */ if (!processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
            return;
          }
          // If there are no other listeners, an exit is coming!
          // Simplest way: remove us and then re-send the signal.
          // We know that this will kill the process, so we can
          // safely emit now.
          var listeners = process.listeners(sig);
          if (listeners.length === emitter.count) {
            unload();
            emit("exit", null, sig);
            /* istanbul ignore next */ emit("afterexit", null, sig);
            /* istanbul ignore next */ if (isWin && sig === "SIGHUP") {
              // "SIGHUP" throws an `ENOSYS` error on Windows,
              // so use a supported signal instead
              sig = "SIGINT";
            }
            /* istanbul ignore next */ process.kill(process.pid, sig);
          }
        };
      });
      module.exports.signals = () => signals;
      var loaded = false;
      var load = function load() {
        if (loaded || !processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
          return;
        }
        loaded = true;
        // This is the number of onSignalExit's that are in play.
        // It's important so that we can count the correct number of
        // listeners on signals, and don't wait for the other one to
        // handle it instead of us.
        emitter.count += 1;
        signals = signals.filter((sig) => {
          try {
            process.on(sig, sigListeners[sig]);
            return true;
          } catch (er) {
            return false;
          }
        });
        process.emit = processEmit;
        process.reallyExit = processReallyExit;
      };
      module.exports.load = load;
      var originalProcessReallyExit = process.reallyExit;
      var processReallyExit = function processReallyExit(code) {
        /* istanbul ignore if */ if (!processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
          return;
        }
        process.exitCode = code || /* istanbul ignore next */ 0;
        emit("exit", process.exitCode, null);
        /* istanbul ignore next */ emit("afterexit", process.exitCode, null);
        /* istanbul ignore next */ originalProcessReallyExit.call(process, process.exitCode);
      };
      var originalProcessEmit = process.emit;
      var processEmit = function processEmit(ev, arg) {
        if (ev === "exit" && processOk(/*TURBOPACK member replacement*/ __turbopack_context__.g.process)) {
          /* istanbul ignore else */ if (arg !== undefined) {
            process.exitCode = arg;
          }
          var ret = originalProcessEmit.apply(this, arguments);
          /* istanbul ignore next */ emit("exit", process.exitCode, null);
          /* istanbul ignore next */ emit("afterexit", process.exitCode, null);
          /* istanbul ignore next */ return ret;
        } else {
          return originalProcessEmit.apply(this, arguments);
        }
      };
    }
  },
  "[project]/node_modules/.pnpm/signal-exit@3.0.7/node_modules/signal-exit/signals.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    // This is not the set of all possible signals.
    //
    // It IS, however, the set of all signals that trigger
    // an exit on either Linux or BSD systems.  Linux is a
    // superset of the signal names supported on BSD, and
    // the unknown signals just fail to register, so we can
    // catch that easily enough.
    //
    // Don't bother with SIGKILL.  It's uncatchable, which
    // means that we can't fire any callbacks anyway.
    //
    // If a user does happen to register a handler on a non-
    // fatal signal like SIGWINCH or something, and then
    // exit, it'll end up firing `process.emit('exit')`, so
    // the handler will be fired anyway.
    //
    // SIGBUS, SIGFPE, SIGSEGV and SIGILL, when not raised
    // artificially, inherently leave the process in a
    // state from which it is not safe to try and enter JS
    // listeners.
    module.exports = ["SIGABRT", "SIGALRM", "SIGHUP", "SIGINT", "SIGTERM"];
    if (("TURBOPACK compile-time truthy", 1)) {
      module.exports.push("SIGVTALRM", "SIGXCPU", "SIGXFSZ", "SIGUSR2", "SIGTRAP", "SIGSYS", "SIGQUIT", "SIGIOT");
    }
    if (
      ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    );
  },
  "[project]/node_modules/.pnpm/strip-final-newline@2.0.0/node_modules/strip-final-newline/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    module.exports = (input) => {
      const LF = typeof input === "string" ? "\n" : "\n".charCodeAt();
      const CR = typeof input === "string" ? "\r" : "\r".charCodeAt();
      if (input[input.length - 1] === LF) {
        input = input.slice(0, input.length - 1);
      }
      if (input[input.length - 1] === CR) {
        input = input.slice(0, input.length - 1);
      }
      return input;
    };
  },
  "[project]/node_modules/.pnpm/throttleit@2.1.0/node_modules/throttleit/index.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    function throttle(function_, wait) {
      if (typeof function_ !== "function") {
        throw new TypeError(`Expected the first argument to be a \`function\`, got \`${typeof function_}\`.`);
      }
      // TODO: Add `wait` validation too in the next major version.
      let timeoutId;
      let lastCallTime = 0;
      return function throttled(...arguments_) {
        clearTimeout(timeoutId);
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTime;
        const delayForNextCall = wait - timeSinceLastCall;
        if (delayForNextCall <= 0) {
          lastCallTime = now;
          function_.apply(this, arguments_);
        } else {
          timeoutId = setTimeout(() => {
            lastCallTime = Date.now();
            function_.apply(this, arguments_);
          }, delayForNextCall);
        }
      };
    }
    module.exports = throttle;
  },
  "[project]/node_modules/.pnpm/which@2.0.2/node_modules/which/which.js [app-route] (ecmascript)",
  (__turbopack_context__, module, exports) => {
    const isWindows = process.platform === "win32" || process.env.OSTYPE === "cygwin" || process.env.OSTYPE === "msys";
    const path = __turbopack_context__.r("[externals]/path [external] (path, cjs)");
    const COLON = isWindows ? ";" : ":";
    const isexe = __turbopack_context__.r(
      "[project]/node_modules/.pnpm/isexe@2.0.0/node_modules/isexe/index.js [app-route] (ecmascript)",
    );
    const getNotFoundError = (cmd) =>
      Object.assign(new Error(`not found: ${cmd}`), {
        code: "ENOENT",
      });
    const getPathInfo = (cmd, opt) => {
      const colon = opt.colon || COLON;
      // If it has a slash, then we don't bother searching the pathenv.
      // just check the file itself, and that's it.
      const pathEnv =
        cmd.match(/\//) || (isWindows && cmd.match(/\\/))
          ? [""]
          : [
              // windows always checks the cwd first
              ...(isWindows ? [process.cwd()] : []),
              ...(opt.path || process.env.PATH || /* istanbul ignore next: very unusual */ "").split(colon),
            ];
      const pathExtExe = isWindows ? opt.pathExt || process.env.PATHEXT || ".EXE;.CMD;.BAT;.COM" : "";
      const pathExt = isWindows ? pathExtExe.split(colon) : [""];
      if (isWindows) {
        if (cmd.indexOf(".") !== -1 && pathExt[0] !== "") pathExt.unshift("");
      }
      return {
        pathEnv,
        pathExt,
        pathExtExe,
      };
    };
    const which = (cmd, opt, cb) => {
      if (typeof opt === "function") {
        cb = opt;
        opt = {};
      }
      if (!opt) opt = {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      const step = (i) =>
        new Promise((resolve, reject) => {
          if (i === pathEnv.length) return opt.all && found.length ? resolve(found) : reject(getNotFoundError(cmd));
          const ppRaw = pathEnv[i];
          const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
          const pCmd = path.join(pathPart, cmd);
          const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
          resolve(subStep(p, i, 0));
        });
      const subStep = (p, i, ii) =>
        new Promise((resolve, reject) => {
          if (ii === pathExt.length) return resolve(step(i + 1));
          const ext = pathExt[ii];
          isexe(
            p + ext,
            {
              pathExt: pathExtExe,
            },
            (er, is) => {
              if (!er && is) {
                if (opt.all) found.push(p + ext);
                else return resolve(p + ext);
              }
              return resolve(subStep(p, i, ii + 1));
            },
          );
        });
      return cb ? step(0).then((res) => cb(null, res), cb) : step(0);
    };
    const whichSync = (cmd, opt) => {
      opt = opt || {};
      const { pathEnv, pathExt, pathExtExe } = getPathInfo(cmd, opt);
      const found = [];
      for (let i = 0; i < pathEnv.length; i++) {
        const ppRaw = pathEnv[i];
        const pathPart = /^".*"$/.test(ppRaw) ? ppRaw.slice(1, -1) : ppRaw;
        const pCmd = path.join(pathPart, cmd);
        const p = !pathPart && /^\.[\\\/]/.test(cmd) ? cmd.slice(0, 2) + pCmd : pCmd;
        for (let j = 0; j < pathExt.length; j++) {
          const cur = p + pathExt[j];
          try {
            const is = isexe.sync(cur, {
              pathExt: pathExtExe,
            });
            if (is) {
              if (opt.all) found.push(cur);
              else return cur;
            }
          } catch (ex) {}
        }
      }
      if (opt.all && found.length) return found;
      if (opt.nothrow) return null;
      throw getNotFoundError(cmd);
    };
    module.exports = which;
    which.sync = whichSync;
  },
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1d6u1e3._.js.map
