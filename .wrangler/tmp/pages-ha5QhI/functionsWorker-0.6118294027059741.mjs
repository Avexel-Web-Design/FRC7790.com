var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// ../.wrangler/tmp/bundle-h6UOXN/checked-fetch.js
var urls = /* @__PURE__ */ new Set();
function checkURL(request, init) {
  const url = request instanceof URL ? request : new URL(
    (typeof request === "string" ? new Request(request, init) : request).url
  );
  if (url.port && url.port !== "443" && url.protocol === "https:") {
    if (!urls.has(url.toString())) {
      urls.add(url.toString());
      console.warn(
        `WARNING: known issue with \`fetch()\` requests to custom HTTPS ports in published Workers:
 - ${url.toString()} - the custom port will be ignored when the Worker is published using the \`wrangler deploy\` command.
`
      );
    }
  }
}
__name(checkURL, "checkURL");
globalThis.fetch = new Proxy(globalThis.fetch, {
  apply(target, thisArg, argArray) {
    const [request, init] = argArray;
    checkURL(request, init);
    return Reflect.apply(target, thisArg, argArray);
  }
});

// ../node_modules/hono/dist/compose.js
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// ../node_modules/hono/dist/request/constants.js
var GET_MATCH_RESULT = Symbol();

// ../node_modules/hono/dist/utils/body.js
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = request instanceof HonoRequest ? request.raw.headers : request.headers;
  const contentType = headers.get("Content-Type");
  if (contentType?.startsWith("multipart/form-data") || contentType?.startsWith("application/x-www-form-urlencoded")) {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  const formData = await request.formData();
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// ../node_modules/hono/dist/utils/url.js
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf(
    "/",
    url.charCodeAt(9) === 58 ? 13 : 8
  );
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const path = url.slice(start, queryIndex === -1 ? void 0 : queryIndex);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf(`?${key}`, 8);
    if (keyIndex2 === -1) {
      keyIndex2 = url.indexOf(`&${key}`, 8);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// ../node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  raw;
  #validatedData;
  #matchResult;
  routeIndex = 0;
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param ? /\%/.test(param) ? tryDecodeURIComponent(param) : param : void 0;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value && typeof value === "string") {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return this.bodyCache.parsedBody ??= await parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  json() {
    return this.#cachedBody("json");
  }
  text() {
    return this.#cachedBody("text");
  }
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  blob() {
    return this.#cachedBody("blob");
  }
  formData() {
    return this.#cachedBody("formData");
  }
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  get url() {
    return this.raw.url;
  }
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// ../node_modules/hono/dist/utils/html.js
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// ../node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  env = {};
  #var;
  finalized = false;
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  get res() {
    return this.#res ||= new Response(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  set res(_res) {
    if (this.#res && _res) {
      _res = new Response(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = new Response(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return new Response(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  redirect = /* @__PURE__ */ __name((location, status) => {
    this.header("Location", String(location));
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => new Response();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// ../node_modules/hono/dist/router.js
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// ../node_modules/hono/dist/utils/constants.js
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// ../node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class {
  static {
    __name(this, "Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  router;
  getPath;
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  errorHandler = errorHandler;
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler);
    });
    return this;
  }
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = url.pathname.slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = { basePath: this._basePath, path, method, handler };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// ../node_modules/hono/dist/router/reg-exp-router/node.js
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class {
  static {
    __name(this, "Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// ../node_modules/hono/dist/router/reg-exp-router/trie.js
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// ../node_modules/hono/dist/router/reg-exp-router/router.js
var emptyParam = [];
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes2) {
  const trie = new Trie();
  const handlerData = [];
  if (routes2.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes2.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes2 = this.#routes;
    if (!middleware || !routes2) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes2].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes2[m]).forEach(
            (p) => re.test(p) && routes2[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes2).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes2[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes2[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match(method, path) {
    clearWildcardRegExpCache();
    const matchers = this.#buildAllMatchers();
    this.match = (method2, path2) => {
      const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
      const staticMatch = matcher[2][path2];
      if (staticMatch) {
        return staticMatch;
      }
      const match2 = path2.match(matcher[0]);
      if (!match2) {
        return [[], emptyParam];
      }
      const index = match2.indexOf("", 1);
      return [matcher[1][index], match2];
    };
    return this.match(method, path);
  }
  #buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    return matchers;
  }
  #buildMatcher(method) {
    const routes2 = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes2.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes2.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes2);
    }
  }
};

// ../node_modules/hono/dist/router/smart-router/router.js
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes2 = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes2.length; i2 < len2; i2++) {
          router.add(...routes2[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// ../node_modules/hono/dist/router/trie-router/node.js
var emptyParams = /* @__PURE__ */ Object.create(null);
var Node2 = class {
  static {
    __name(this, "Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #getHandlerSets(node, method, nodeParams, params) {
    const handlerSets = [];
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
    return handlerSets;
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              handlerSets.push(
                ...this.#getHandlerSets(nextNode.#children["*"], method, node.#params)
              );
            }
            handlerSets.push(...this.#getHandlerSets(nextNode, method, node.#params));
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              handlerSets.push(...this.#getHandlerSets(astNode, method, node.#params));
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          if (!part) {
            continue;
          }
          const [key, name, matcher] = pattern;
          const child = node.#children[key];
          const restPathString = parts.slice(i).join("/");
          if (matcher instanceof RegExp) {
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              handlerSets.push(...this.#getHandlerSets(child, method, node.#params, params));
              if (Object.keys(child.#children).length) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              handlerSets.push(...this.#getHandlerSets(child, method, params, node.#params));
              if (child.#children["*"]) {
                handlerSets.push(
                  ...this.#getHandlerSets(child.#children["*"], method, params, node.#params)
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      curNodes = tempNodes.concat(curNodesQueue.shift() ?? []);
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// ../node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// ../node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// ../node_modules/hono/dist/adapter/cloudflare-pages/handler.js
var handle = /* @__PURE__ */ __name((app2) => (eventContext) => {
  return app2.fetch(
    eventContext.request,
    { ...eventContext.env, eventContext },
    {
      waitUntil: eventContext.waitUntil,
      passThroughOnException: eventContext.passThroughOnException,
      props: {}
    }
  );
}, "handle");

// ../node_modules/hono/dist/helper/factory/index.js
var createMiddleware = /* @__PURE__ */ __name((middleware) => middleware, "createMiddleware");

// api/middleware/index.ts
var corsMiddleware = createMiddleware(async (c, next) => {
  c.header("Access-Control-Allow-Origin", "*");
  c.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  c.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Session-ID");
  c.header("Access-Control-Allow-Credentials", "true");
  if (c.req.method === "OPTIONS") {
    return c.text("", 200);
  }
  await next();
});
var errorMiddleware = createMiddleware(async (c, next) => {
  try {
    await next();
  } catch (error) {
    console.error("API Error:", error);
    if (error instanceof Error) {
      return c.json({
        error: "Internal Server Error",
        message: error.message
      }, 500);
    }
    return c.json({
      error: "Internal Server Error",
      message: "An unexpected error occurred"
    }, 500);
  }
});
var requestCounts = /* @__PURE__ */ new Map();
var rateLimitMiddleware = createMiddleware(async (c, next) => {
  const clientIP = c.req.header("CF-Connecting-IP") || c.req.header("X-Forwarded-For") || "unknown";
  const now = Date.now();
  const windowMs = 15 * 60 * 1e3;
  const maxRequests = 100;
  const clientData = requestCounts.get(clientIP);
  if (!clientData || now > clientData.resetTime) {
    requestCounts.set(clientIP, { count: 1, resetTime: now + windowMs });
  } else {
    clientData.count++;
    if (clientData.count > maxRequests) {
      return c.json({ error: "Rate limit exceeded" }, 429);
    }
  }
  await next();
});

// ../node_modules/hono/dist/utils/encode.js
var decodeBase64Url = /* @__PURE__ */ __name((str) => {
  return decodeBase64(str.replace(/_|-/g, (m) => ({ _: "/", "-": "+" })[m] ?? m));
}, "decodeBase64Url");
var encodeBase64Url = /* @__PURE__ */ __name((buf) => encodeBase64(buf).replace(/\/|\+/g, (m) => ({ "/": "_", "+": "-" })[m] ?? m), "encodeBase64Url");
var encodeBase64 = /* @__PURE__ */ __name((buf) => {
  let binary = "";
  const bytes = new Uint8Array(buf);
  for (let i = 0, len = bytes.length; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}, "encodeBase64");
var decodeBase64 = /* @__PURE__ */ __name((str) => {
  const binary = atob(str);
  const bytes = new Uint8Array(new ArrayBuffer(binary.length));
  const half = binary.length / 2;
  for (let i = 0, j = binary.length - 1; i <= half; i++, j--) {
    bytes[i] = binary.charCodeAt(i);
    bytes[j] = binary.charCodeAt(j);
  }
  return bytes;
}, "decodeBase64");

// ../node_modules/hono/dist/utils/jwt/jwa.js
var AlgorithmTypes = /* @__PURE__ */ ((AlgorithmTypes2) => {
  AlgorithmTypes2["HS256"] = "HS256";
  AlgorithmTypes2["HS384"] = "HS384";
  AlgorithmTypes2["HS512"] = "HS512";
  AlgorithmTypes2["RS256"] = "RS256";
  AlgorithmTypes2["RS384"] = "RS384";
  AlgorithmTypes2["RS512"] = "RS512";
  AlgorithmTypes2["PS256"] = "PS256";
  AlgorithmTypes2["PS384"] = "PS384";
  AlgorithmTypes2["PS512"] = "PS512";
  AlgorithmTypes2["ES256"] = "ES256";
  AlgorithmTypes2["ES384"] = "ES384";
  AlgorithmTypes2["ES512"] = "ES512";
  AlgorithmTypes2["EdDSA"] = "EdDSA";
  return AlgorithmTypes2;
})(AlgorithmTypes || {});

// ../node_modules/hono/dist/helper/adapter/index.js
var knownUserAgents = {
  deno: "Deno",
  bun: "Bun",
  workerd: "Cloudflare-Workers",
  node: "Node.js"
};
var getRuntimeKey = /* @__PURE__ */ __name(() => {
  const global = globalThis;
  const userAgentSupported = typeof navigator !== "undefined" && true;
  if (userAgentSupported) {
    for (const [runtimeKey, userAgent] of Object.entries(knownUserAgents)) {
      if (checkUserAgentEquals(userAgent)) {
        return runtimeKey;
      }
    }
  }
  if (typeof global?.EdgeRuntime === "string") {
    return "edge-light";
  }
  if (global?.fastly !== void 0) {
    return "fastly";
  }
  if (global?.process?.release?.name === "node") {
    return "node";
  }
  return "other";
}, "getRuntimeKey");
var checkUserAgentEquals = /* @__PURE__ */ __name((platform) => {
  const userAgent = "Cloudflare-Workers";
  return userAgent.startsWith(platform);
}, "checkUserAgentEquals");

// ../node_modules/hono/dist/utils/jwt/types.js
var JwtAlgorithmNotImplemented = class extends Error {
  static {
    __name(this, "JwtAlgorithmNotImplemented");
  }
  constructor(alg) {
    super(`${alg} is not an implemented algorithm`);
    this.name = "JwtAlgorithmNotImplemented";
  }
};
var JwtTokenInvalid = class extends Error {
  static {
    __name(this, "JwtTokenInvalid");
  }
  constructor(token) {
    super(`invalid JWT token: ${token}`);
    this.name = "JwtTokenInvalid";
  }
};
var JwtTokenNotBefore = class extends Error {
  static {
    __name(this, "JwtTokenNotBefore");
  }
  constructor(token) {
    super(`token (${token}) is being used before it's valid`);
    this.name = "JwtTokenNotBefore";
  }
};
var JwtTokenExpired = class extends Error {
  static {
    __name(this, "JwtTokenExpired");
  }
  constructor(token) {
    super(`token (${token}) expired`);
    this.name = "JwtTokenExpired";
  }
};
var JwtTokenIssuedAt = class extends Error {
  static {
    __name(this, "JwtTokenIssuedAt");
  }
  constructor(currentTimestamp, iat) {
    super(
      `Invalid "iat" claim, must be a valid number lower than "${currentTimestamp}" (iat: "${iat}")`
    );
    this.name = "JwtTokenIssuedAt";
  }
};
var JwtHeaderInvalid = class extends Error {
  static {
    __name(this, "JwtHeaderInvalid");
  }
  constructor(header) {
    super(`jwt header is invalid: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderInvalid";
  }
};
var JwtHeaderRequiresKid = class extends Error {
  static {
    __name(this, "JwtHeaderRequiresKid");
  }
  constructor(header) {
    super(`required "kid" in jwt header: ${JSON.stringify(header)}`);
    this.name = "JwtHeaderRequiresKid";
  }
};
var JwtTokenSignatureMismatched = class extends Error {
  static {
    __name(this, "JwtTokenSignatureMismatched");
  }
  constructor(token) {
    super(`token(${token}) signature mismatched`);
    this.name = "JwtTokenSignatureMismatched";
  }
};
var CryptoKeyUsage = /* @__PURE__ */ ((CryptoKeyUsage2) => {
  CryptoKeyUsage2["Encrypt"] = "encrypt";
  CryptoKeyUsage2["Decrypt"] = "decrypt";
  CryptoKeyUsage2["Sign"] = "sign";
  CryptoKeyUsage2["Verify"] = "verify";
  CryptoKeyUsage2["DeriveKey"] = "deriveKey";
  CryptoKeyUsage2["DeriveBits"] = "deriveBits";
  CryptoKeyUsage2["WrapKey"] = "wrapKey";
  CryptoKeyUsage2["UnwrapKey"] = "unwrapKey";
  return CryptoKeyUsage2;
})(CryptoKeyUsage || {});

// ../node_modules/hono/dist/utils/jwt/utf8.js
var utf8Encoder = new TextEncoder();
var utf8Decoder = new TextDecoder();

// ../node_modules/hono/dist/utils/jwt/jws.js
async function signing(privateKey, alg, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPrivateKey(privateKey, algorithm);
  return await crypto.subtle.sign(algorithm, cryptoKey, data);
}
__name(signing, "signing");
async function verifying(publicKey, alg, signature, data) {
  const algorithm = getKeyAlgorithm(alg);
  const cryptoKey = await importPublicKey(publicKey, algorithm);
  return await crypto.subtle.verify(algorithm, cryptoKey, signature, data);
}
__name(verifying, "verifying");
function pemToBinary(pem) {
  return decodeBase64(pem.replace(/-+(BEGIN|END).*/g, "").replace(/\s/g, ""));
}
__name(pemToBinary, "pemToBinary");
async function importPrivateKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type !== "private" && key.type !== "secret") {
      throw new Error(
        `unexpected key type: CryptoKey.type is ${key.type}, expected private or secret`
      );
    }
    return key;
  }
  const usages = [CryptoKeyUsage.Sign];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PRIVATE")) {
    return await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPrivateKey, "importPrivateKey");
async function importPublicKey(key, alg) {
  if (!crypto.subtle || !crypto.subtle.importKey) {
    throw new Error("`crypto.subtle.importKey` is undefined. JWT auth middleware requires it.");
  }
  if (isCryptoKey(key)) {
    if (key.type === "public" || key.type === "secret") {
      return key;
    }
    key = await exportPublicJwkFrom(key);
  }
  if (typeof key === "string" && key.includes("PRIVATE")) {
    const privateKey = await crypto.subtle.importKey("pkcs8", pemToBinary(key), alg, true, [
      CryptoKeyUsage.Sign
    ]);
    key = await exportPublicJwkFrom(privateKey);
  }
  const usages = [CryptoKeyUsage.Verify];
  if (typeof key === "object") {
    return await crypto.subtle.importKey("jwk", key, alg, false, usages);
  }
  if (key.includes("PUBLIC")) {
    return await crypto.subtle.importKey("spki", pemToBinary(key), alg, false, usages);
  }
  return await crypto.subtle.importKey("raw", utf8Encoder.encode(key), alg, false, usages);
}
__name(importPublicKey, "importPublicKey");
async function exportPublicJwkFrom(privateKey) {
  if (privateKey.type !== "private") {
    throw new Error(`unexpected key type: ${privateKey.type}`);
  }
  if (!privateKey.extractable) {
    throw new Error("unexpected private key is unextractable");
  }
  const jwk = await crypto.subtle.exportKey("jwk", privateKey);
  const { kty } = jwk;
  const { alg, e, n } = jwk;
  const { crv, x, y } = jwk;
  return { kty, alg, e, n, crv, x, y, key_ops: [CryptoKeyUsage.Verify] };
}
__name(exportPublicJwkFrom, "exportPublicJwkFrom");
function getKeyAlgorithm(name) {
  switch (name) {
    case "HS256":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-256"
        }
      };
    case "HS384":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-384"
        }
      };
    case "HS512":
      return {
        name: "HMAC",
        hash: {
          name: "SHA-512"
        }
      };
    case "RS256":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-256"
        }
      };
    case "RS384":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-384"
        }
      };
    case "RS512":
      return {
        name: "RSASSA-PKCS1-v1_5",
        hash: {
          name: "SHA-512"
        }
      };
    case "PS256":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-256"
        },
        saltLength: 32
      };
    case "PS384":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-384"
        },
        saltLength: 48
      };
    case "PS512":
      return {
        name: "RSA-PSS",
        hash: {
          name: "SHA-512"
        },
        saltLength: 64
      };
    case "ES256":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-256"
        },
        namedCurve: "P-256"
      };
    case "ES384":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-384"
        },
        namedCurve: "P-384"
      };
    case "ES512":
      return {
        name: "ECDSA",
        hash: {
          name: "SHA-512"
        },
        namedCurve: "P-521"
      };
    case "EdDSA":
      return {
        name: "Ed25519",
        namedCurve: "Ed25519"
      };
    default:
      throw new JwtAlgorithmNotImplemented(name);
  }
}
__name(getKeyAlgorithm, "getKeyAlgorithm");
function isCryptoKey(key) {
  const runtime = getRuntimeKey();
  if (runtime === "node" && !!crypto.webcrypto) {
    return key instanceof crypto.webcrypto.CryptoKey;
  }
  return key instanceof CryptoKey;
}
__name(isCryptoKey, "isCryptoKey");

// ../node_modules/hono/dist/utils/jwt/jwt.js
var encodeJwtPart = /* @__PURE__ */ __name((part) => encodeBase64Url(utf8Encoder.encode(JSON.stringify(part)).buffer).replace(/=/g, ""), "encodeJwtPart");
var encodeSignaturePart = /* @__PURE__ */ __name((buf) => encodeBase64Url(buf).replace(/=/g, ""), "encodeSignaturePart");
var decodeJwtPart = /* @__PURE__ */ __name((part) => JSON.parse(utf8Decoder.decode(decodeBase64Url(part))), "decodeJwtPart");
function isTokenHeader(obj) {
  if (typeof obj === "object" && obj !== null) {
    const objWithAlg = obj;
    return "alg" in objWithAlg && Object.values(AlgorithmTypes).includes(objWithAlg.alg) && (!("typ" in objWithAlg) || objWithAlg.typ === "JWT");
  }
  return false;
}
__name(isTokenHeader, "isTokenHeader");
var sign = /* @__PURE__ */ __name(async (payload, privateKey, alg = "HS256") => {
  const encodedPayload = encodeJwtPart(payload);
  let encodedHeader;
  if (typeof privateKey === "object" && "alg" in privateKey) {
    alg = privateKey.alg;
    encodedHeader = encodeJwtPart({ alg, typ: "JWT", kid: privateKey.kid });
  } else {
    encodedHeader = encodeJwtPart({ alg, typ: "JWT" });
  }
  const partialToken = `${encodedHeader}.${encodedPayload}`;
  const signaturePart = await signing(privateKey, alg, utf8Encoder.encode(partialToken));
  const signature = encodeSignaturePart(signaturePart);
  return `${partialToken}.${signature}`;
}, "sign");
var verify = /* @__PURE__ */ __name(async (token, publicKey, alg = "HS256") => {
  const tokenParts = token.split(".");
  if (tokenParts.length !== 3) {
    throw new JwtTokenInvalid(token);
  }
  const { header, payload } = decode(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  const now = Date.now() / 1e3 | 0;
  if (payload.nbf && payload.nbf > now) {
    throw new JwtTokenNotBefore(token);
  }
  if (payload.exp && payload.exp <= now) {
    throw new JwtTokenExpired(token);
  }
  if (payload.iat && now < payload.iat) {
    throw new JwtTokenIssuedAt(now, payload.iat);
  }
  const headerPayload = token.substring(0, token.lastIndexOf("."));
  const verified = await verifying(
    publicKey,
    alg,
    decodeBase64Url(tokenParts[2]),
    utf8Encoder.encode(headerPayload)
  );
  if (!verified) {
    throw new JwtTokenSignatureMismatched(token);
  }
  return payload;
}, "verify");
var verifyFromJwks = /* @__PURE__ */ __name(async (token, options, init) => {
  const header = decodeHeader(token);
  if (!isTokenHeader(header)) {
    throw new JwtHeaderInvalid(header);
  }
  if (!header.kid) {
    throw new JwtHeaderRequiresKid(header);
  }
  if (options.jwks_uri) {
    const response = await fetch(options.jwks_uri, init);
    if (!response.ok) {
      throw new Error(`failed to fetch JWKS from ${options.jwks_uri}`);
    }
    const data = await response.json();
    if (!data.keys) {
      throw new Error('invalid JWKS response. "keys" field is missing');
    }
    if (!Array.isArray(data.keys)) {
      throw new Error('invalid JWKS response. "keys" field is not an array');
    }
    if (options.keys) {
      options.keys.push(...data.keys);
    } else {
      options.keys = data.keys;
    }
  } else if (!options.keys) {
    throw new Error('verifyFromJwks requires options for either "keys" or "jwks_uri" or both');
  }
  const matchingKey = options.keys.find((key) => key.kid === header.kid);
  if (!matchingKey) {
    throw new JwtTokenInvalid(token);
  }
  return await verify(token, matchingKey, matchingKey.alg || header.alg);
}, "verifyFromJwks");
var decode = /* @__PURE__ */ __name((token) => {
  try {
    const [h, p] = token.split(".");
    const header = decodeJwtPart(h);
    const payload = decodeJwtPart(p);
    return {
      header,
      payload
    };
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decode");
var decodeHeader = /* @__PURE__ */ __name((token) => {
  try {
    const [h] = token.split(".");
    return decodeJwtPart(h);
  } catch {
    throw new JwtTokenInvalid(token);
  }
}, "decodeHeader");

// ../node_modules/hono/dist/utils/jwt/index.js
var Jwt = { sign, verify, decode, verifyFromJwks };

// ../node_modules/hono/dist/middleware/jwt/jwt.js
var verify2 = Jwt.verify;
var decode2 = Jwt.decode;
var sign2 = Jwt.sign;

// api/auth/register.ts
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword, "hashPassword");
var register = new Hono2();
register.post("/", async (c) => {
  try {
    const { username, password, is_admin } = await c.req.json();
    const authHeader = c.req.header("Authorization");
    let isAdmin = false;
    if (is_admin === true) {
      if (!authHeader || !authHeader.startsWith("Bearer ")) {
        return c.json({ error: "Admin privileges cannot be assigned by non-admin users" }, 403);
      }
      try {
        const token = authHeader.split(" ")[1];
        const decoded = await verify2(token, c.env.JWT_SECRET);
        if (!(decoded.isAdmin === true || decoded.isAdmin === 1)) {
          return c.json({ error: "Only administrators can create admin users" }, 403);
        }
        isAdmin = true;
      } catch (e) {
        return c.json({ error: "Invalid authorization for admin user creation" }, 401);
      }
    }
    const isAdminValue = isAdmin ? 1 : 0;
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }
    if (password.length < 6) {
      return c.json({ error: "Password must be at least 6 characters long" }, 400);
    }
    const hashedPassword = await hashPassword(password);
    const { success, meta } = await c.env.DB.prepare(
      "INSERT INTO users (username, password, avatar, is_admin) VALUES (?, ?, ?, ?)"
    ).bind(
      username,
      hashedPassword,
      `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
      isAdminValue
    ).run();
    if (success) {
      const userId = meta.last_row_id;
      const token = await sign2(
        {
          id: userId,
          username,
          isAdmin: isAdminValue,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`,
          iat: Math.floor(Date.now() / 1e3),
          exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60
          // 24 hours
        },
        c.env.JWT_SECRET
      );
      return c.json({
        token,
        user: {
          id: userId,
          username,
          isAdmin: isAdminValue === 1,
          avatar: `https://api.dicebear.com/7.x/initials/svg?seed=${username}`
        },
        message: "Registration successful"
      });
    }
    return c.json({ error: "Failed to register user" }, 500);
  } catch (e) {
    if (e instanceof Error && e.message.includes("UNIQUE constraint failed")) {
      return c.json({ error: "Username already exists" }, 409);
    }
    console.error("Registration error:", e);
    return c.json({ error: "Internal server error" }, 500);
  }
});
var register_default = register;

// api/auth/login.ts
async function verifyPassword(password, hashedPassword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === hashedPassword;
}
__name(verifyPassword, "verifyPassword");
var login = new Hono2();
login.post("/", async (c) => {
  try {
    const { username, password } = await c.req.json();
    if (!username || !password) {
      return c.json({ error: "Username and password are required" }, 400);
    }
    const user = await c.env.DB.prepare("SELECT * FROM users WHERE username = ?").bind(username).first();
    if (!user) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    const validPassword = await verifyPassword(password, user.password);
    if (!validPassword) {
      return c.json({ error: "Invalid credentials" }, 401);
    }
    const token = await sign2(
      {
        id: user.id,
        username: user.username,
        isAdmin: user.is_admin,
        iat: Math.floor(Date.now() / 1e3),
        exp: Math.floor(Date.now() / 1e3) + 24 * 60 * 60
        // 24 hours
      },
      c.env.JWT_SECRET
    );
    return c.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        isAdmin: !!user.is_admin
      },
      message: "Login successful"
    });
  } catch (error) {
    console.error("Login error:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
var login_default = login;

// api/auth/middleware.ts
var authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  const token = authHeader.split(" ")[1];
  try {
    const decoded = await verify2(token, c.env.JWT_SECRET);
    const user = {
      id: decoded.id,
      username: decoded.username,
      isAdmin: decoded.isAdmin
    };
    c.set("user", user);
    await next();
  } catch (e) {
    return c.json({ error: "Unauthorized" }, 401);
  }
});

// api/admin/users.ts
var users = new Hono2();
users.use("*", authMiddleware);
users.get("/", async (c) => {
  const user = c.get("user");
  if (!user.isAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }
  try {
    const { results } = await c.env.DB.prepare("SELECT id, username, is_admin, created_at, avatar_color FROM users").all();
    return c.json(results);
  } catch (error) {
    console.error("Error fetching users:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
users.put("/:userId", async (c) => {
  const currentUser = c.get("user");
  if (!currentUser.isAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const userId = parseInt(c.req.param("userId"), 10);
  const body = await c.req.json();
  if (userId === currentUser.id) {
    return c.json({ error: "Cannot modify your own admin status" }, 400);
  }
  try {
    const isAdmin = body.is_admin === true ? 1 : 0;
    await c.env.DB.prepare("UPDATE users SET is_admin = ? WHERE id = ?").bind(isAdmin, userId).run();
    return c.json({ success: true });
  } catch (error) {
    console.error("Error updating user:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
users.delete("/:userId", async (c) => {
  const currentUser = c.get("user");
  if (!currentUser.isAdmin) {
    return c.json({ error: "Forbidden" }, 403);
  }
  const userId = parseInt(c.req.param("userId"), 10);
  if (userId === currentUser.id) {
    return c.json({ error: "Cannot delete your own account" }, 400);
  }
  try {
    await c.env.DB.prepare("DELETE FROM users WHERE id = ?").bind(userId).run();
    return c.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
var users_default = users;

// api/calendar/index.ts
var calendar = new Hono2();
calendar.use("*", authMiddleware);
function generateRecurringInstances(baseEvent, startDate, endDate) {
  if (!baseEvent.is_recurring) {
    return [baseEvent];
  }
  const instances = [];
  const eventStartDate = /* @__PURE__ */ new Date(baseEvent.event_date + "T00:00:00");
  let currentDate = new Date(Math.max(eventStartDate.getTime(), startDate.getTime()));
  let occurrenceCount = 0;
  const maxOccurrences = baseEvent.recurrence_occurrences || 1e3;
  const config = {
    type: baseEvent.recurrence_type,
    interval: baseEvent.recurrence_interval || 1,
    daysOfWeek: baseEvent.recurrence_days_of_week ? JSON.parse(baseEvent.recurrence_days_of_week) : void 0,
    dayOfMonth: baseEvent.recurrence_day_of_month,
    weekOfMonth: baseEvent.recurrence_week_of_month,
    dayOfWeek: baseEvent.recurrence_day_of_week,
    months: baseEvent.recurrence_months ? JSON.parse(baseEvent.recurrence_months) : void 0,
    endType: baseEvent.recurrence_end_type || "never",
    endDate: baseEvent.recurrence_end_date,
    occurrences: baseEvent.recurrence_occurrences,
    exceptions: baseEvent.recurrence_exceptions ? JSON.parse(baseEvent.recurrence_exceptions) : []
  };
  while (currentDate <= endDate && occurrenceCount < maxOccurrences) {
    if (config.endType === "end_date" && config.endDate) {
      const endDateObj = /* @__PURE__ */ new Date(config.endDate + "T00:00:00");
      if (currentDate > endDateObj) break;
    }
    if (config.endType === "after_occurrences" && occurrenceCount >= maxOccurrences) {
      break;
    }
    const dateStr = currentDate.getFullYear() + "-" + String(currentDate.getMonth() + 1).padStart(2, "0") + "-" + String(currentDate.getDate()).padStart(2, "0");
    if (config.exceptions?.includes(dateStr)) {
      currentDate = getNextOccurrence(currentDate, config);
      continue;
    }
    if (isValidOccurrence(currentDate, eventStartDate, config)) {
      instances.push({
        ...baseEvent,
        id: `${baseEvent.id}_${dateStr}`,
        // Unique ID for recurring instance
        event_date: dateStr,
        parent_event_id: baseEvent.id,
        is_recurring_instance: true,
        is_recurring: false
        // Instances themselves are not recurring
      });
      occurrenceCount++;
    }
    currentDate = getNextOccurrence(currentDate, config);
  }
  return instances;
}
__name(generateRecurringInstances, "generateRecurringInstances");
function isValidOccurrence(date, startDate, config) {
  const daysDiff = Math.floor((date.getTime() - startDate.getTime()) / (1e3 * 60 * 60 * 24));
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  switch (config.type) {
    case "daily":
      return daysDiff >= 0 && daysDiff % config.interval === 0;
    case "weekly":
      if (daysDiff < 0) return false;
      const weeksDiff = Math.floor(daysDiff / 7);
      if (weeksDiff % config.interval !== 0) return false;
      if (config.daysOfWeek && config.daysOfWeek.length > 0) {
        const dayName = DAY_NAMES[date.getDay()];
        return config.daysOfWeek.includes(dayName);
      }
      return date.getDay() === startDate.getDay();
    case "monthly":
      if (daysDiff < 0) return false;
      if (config.dayOfMonth) {
        const monthsDiff = (date.getFullYear() - startDate.getFullYear()) * 12 + (date.getMonth() - startDate.getMonth());
        if (monthsDiff % config.interval !== 0) return false;
        return date.getDate() === config.dayOfMonth;
      }
      return false;
    case "yearly":
      if (daysDiff < 0) return false;
      const yearsDiff = date.getFullYear() - startDate.getFullYear();
      if (yearsDiff % config.interval !== 0) return false;
      if (config.months && config.months.length > 0) {
        return config.months.includes(date.getMonth() + 1) && date.getDate() === startDate.getDate();
      }
      return date.getMonth() === startDate.getMonth() && date.getDate() === startDate.getDate();
    default:
      return false;
  }
}
__name(isValidOccurrence, "isValidOccurrence");
function getNextOccurrence(currentDate, config) {
  const nextDate = new Date(currentDate);
  const DAY_NAMES = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  switch (config.type) {
    case "daily":
      nextDate.setDate(nextDate.getDate() + config.interval);
      break;
    case "weekly":
      if (config.daysOfWeek && config.daysOfWeek.length > 1) {
        let found = false;
        for (let i = 1; i <= 7; i++) {
          const testDate = new Date(currentDate);
          testDate.setDate(testDate.getDate() + i);
          const dayName = DAY_NAMES[testDate.getDay()];
          if (config.daysOfWeek.includes(dayName)) {
            nextDate.setTime(testDate.getTime());
            found = true;
            break;
          }
        }
        if (!found) {
          nextDate.setDate(nextDate.getDate() + 7 * config.interval);
        }
      } else {
        nextDate.setDate(nextDate.getDate() + 7 * config.interval);
      }
      break;
    case "monthly":
      nextDate.setMonth(nextDate.getMonth() + config.interval);
      break;
    case "yearly":
      nextDate.setFullYear(nextDate.getFullYear() + config.interval);
      break;
    default:
      nextDate.setDate(nextDate.getDate() + 1);
  }
  return nextDate;
}
__name(getNextOccurrence, "getNextOccurrence");
calendar.get("/", async (c) => {
  try {
    const startDate = c.req.query("start");
    const endDate = c.req.query("end");
    let query = `
      SELECT * FROM calendar_events 
      WHERE (parent_event_id IS NULL OR parent_event_id = 0)
    `;
    if (startDate && endDate) {
      query += ` AND (
        (is_recurring = 0 AND event_date BETWEEN ? AND ?) OR
        (is_recurring = 1 AND (
          recurrence_end_date IS NULL OR 
          recurrence_end_date >= ? OR
          event_date <= ?
        ))
      )`;
    }
    query += ` ORDER BY event_date ASC, event_time ASC`;
    const params = startDate && endDate ? [startDate, endDate, startDate, endDate] : [];
    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    let standaloneInstances = [];
    if (startDate && endDate) {
      const { results: standalone } = await c.env.DB.prepare(`
        SELECT * FROM calendar_events 
        WHERE parent_event_id IS NOT NULL AND parent_event_id != 0 
        AND event_date BETWEEN ? AND ?
        ORDER BY event_date ASC, event_time ASC
      `).bind(startDate, endDate).all();
      standaloneInstances = standalone;
    }
    if (startDate && endDate) {
      const expandedEvents = [];
      const start = /* @__PURE__ */ new Date(startDate + "T00:00:00");
      const end = /* @__PURE__ */ new Date(endDate + "T23:59:59");
      for (const event of results) {
        if (event.is_recurring) {
          const instances = generateRecurringInstances(event, start, end);
          expandedEvents.push(...instances);
        } else {
          expandedEvents.push(event);
        }
      }
      expandedEvents.push(...standaloneInstances);
      return c.json(expandedEvents.sort((a, b) => {
        const dateA = /* @__PURE__ */ new Date(a.event_date + " " + (a.event_time || "00:00"));
        const dateB = /* @__PURE__ */ new Date(b.event_date + " " + (b.event_time || "00:00"));
        return dateA.getTime() - dateB.getTime();
      }));
    }
    return c.json(results);
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.post("/", async (c) => {
  try {
    const user = c.get("user");
    const {
      title,
      description,
      event_date,
      event_time,
      event_end_time,
      location,
      is_recurring,
      recurrence
    } = await c.req.json();
    if (!title || !event_date) {
      return c.json({ error: "Missing required fields: title, event_date" }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }
    if (event_time && !/^\d{2}:\d{2}$/.test(event_time)) {
      return c.json({ error: "Invalid time format. Use HH:MM" }, 400);
    }
    if (event_end_time && !/^\d{2}:\d{2}$/.test(event_end_time)) {
      return c.json({ error: "Invalid end time format. Use HH:MM" }, 400);
    }
    if (is_recurring && recurrence) {
      const validTypes = ["daily", "weekly", "monthly", "yearly", "custom"];
      if (!validTypes.includes(recurrence.type)) {
        return c.json({ error: "Invalid recurrence type" }, 400);
      }
      if (recurrence.endType === "end_date" && recurrence.endDate) {
        if (!/^\d{4}-\d{2}-\d{2}$/.test(recurrence.endDate)) {
          return c.json({ error: "Invalid recurrence end date format. Use YYYY-MM-DD" }, 400);
        }
      }
    }
    const recurrenceFields = is_recurring && recurrence ? {
      is_recurring: 1,
      recurrence_type: recurrence.type,
      recurrence_interval: recurrence.interval || 1,
      recurrence_days_of_week: recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
      recurrence_day_of_month: recurrence.dayOfMonth || null,
      recurrence_week_of_month: recurrence.weekOfMonth || null,
      recurrence_day_of_week: recurrence.dayOfWeek || null,
      recurrence_months: recurrence.months ? JSON.stringify(recurrence.months) : null,
      recurrence_end_type: recurrence.endType || "never",
      recurrence_end_date: recurrence.endDate || null,
      recurrence_occurrences: recurrence.occurrences || null,
      recurrence_exceptions: recurrence.exceptions ? JSON.stringify(recurrence.exceptions) : null
    } : {
      is_recurring: 0,
      recurrence_type: null,
      recurrence_interval: null,
      recurrence_days_of_week: null,
      recurrence_day_of_month: null,
      recurrence_week_of_month: null,
      recurrence_day_of_week: null,
      recurrence_months: null,
      recurrence_end_type: null,
      recurrence_end_date: null,
      recurrence_occurrences: null,
      recurrence_exceptions: null
    };
    const { success } = await c.env.DB.prepare(`
      INSERT INTO calendar_events (
        title, description, event_date, event_time, event_end_time, location, created_by,
        is_recurring, recurrence_type, recurrence_interval, recurrence_days_of_week,
        recurrence_day_of_month, recurrence_week_of_month, recurrence_day_of_week,
        recurrence_months, recurrence_end_type, recurrence_end_date, 
        recurrence_occurrences, recurrence_exceptions
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      title,
      description || null,
      event_date,
      event_time || null,
      event_end_time || null,
      location || null,
      user.id,
      recurrenceFields.is_recurring,
      recurrenceFields.recurrence_type,
      recurrenceFields.recurrence_interval,
      recurrenceFields.recurrence_days_of_week,
      recurrenceFields.recurrence_day_of_month,
      recurrenceFields.recurrence_week_of_month,
      recurrenceFields.recurrence_day_of_week,
      recurrenceFields.recurrence_months,
      recurrenceFields.recurrence_end_type,
      recurrenceFields.recurrence_end_date,
      recurrenceFields.recurrence_occurrences,
      recurrenceFields.recurrence_exceptions
    ).run();
    if (success) {
      return c.json({ message: "Event created successfully" });
    }
    return c.json({ error: "Failed to create event" }, 500);
  } catch (error) {
    console.error("Error creating event:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.get("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM calendar_events WHERE id = ?"
    ).bind(id).all();
    if (results.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    return c.json(results[0]);
  } catch (error) {
    console.error("Error fetching event:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const {
      title,
      description,
      event_date,
      event_time,
      event_end_time,
      location,
      is_recurring,
      recurrence,
      update_series,
      original_instance_date
    } = await c.req.json();
    if (!title || !event_date) {
      return c.json({ error: "Missing required fields: title, event_date" }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(event_date)) {
      return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }
    if (event_time && !/^\d{2}:\d{2}$/.test(event_time)) {
      return c.json({ error: "Invalid time format. Use HH:MM" }, 400);
    }
    if (event_end_time && !/^\d{2}:\d{2}$/.test(event_end_time)) {
      return c.json({ error: "Invalid end time format. Use HH:MM" }, 400);
    }
    const { results: existingEvents } = await c.env.DB.prepare(
      "SELECT * FROM calendar_events WHERE id = ?"
    ).bind(id).all();
    if (existingEvents.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    const existingEvent = existingEvents[0];
    console.log("PUT /calendar/:id Debug Info:");
    console.log("ID:", id);
    console.log("original_instance_date:", original_instance_date);
    console.log("update_series:", update_series);
    console.log("existingEvent.is_recurring:", existingEvent.is_recurring);
    console.log("existingEvent.parent_event_id:", existingEvent.parent_event_id);
    console.log("existingEvent.recurrence_exceptions:", existingEvent.recurrence_exceptions);
    if (original_instance_date && !update_series) {
      const parentEvent = existingEvent;
      const { results: existingStandalone } = await c.env.DB.prepare(
        "SELECT * FROM calendar_events WHERE parent_event_id = ? AND event_date = ?"
      ).bind(id, original_instance_date).all();
      if (existingStandalone.length > 0) {
        const { success } = await c.env.DB.prepare(`
          UPDATE calendar_events SET 
            title = ?, description = ?, event_date = ?, event_time = ?, 
            event_end_time = ?, location = ?, updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(
          title,
          description || null,
          event_date,
          event_time || null,
          event_end_time || null,
          location || null,
          existingStandalone[0].id
        ).run();
        if (success) {
          return c.json({ message: "Recurring instance updated successfully" });
        }
        return c.json({ error: "Failed to update recurring instance" }, 500);
      } else {
        const currentExceptions = parentEvent.recurrence_exceptions ? JSON.parse(parentEvent.recurrence_exceptions) : [];
        const updatedExceptions = [...currentExceptions];
        if (!updatedExceptions.includes(original_instance_date)) {
          updatedExceptions.push(original_instance_date);
        }
        await c.env.DB.prepare(`
          UPDATE calendar_events SET 
            recurrence_exceptions = ?,
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).bind(JSON.stringify(updatedExceptions), id).run();
        const { success } = await c.env.DB.prepare(`
          INSERT INTO calendar_events (
            title, description, event_date, event_time, event_end_time, location, 
            created_by, is_recurring, parent_event_id
          ) VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?)
        `).bind(
          title,
          description || null,
          event_date,
          event_time || null,
          event_end_time || null,
          location || null,
          parentEvent.created_by,
          id
          // Reference to parent for tracking
        ).run();
        if (success) {
          return c.json({ message: "Recurring instance updated successfully" });
        }
        return c.json({ error: "Failed to update recurring instance" }, 500);
      }
    } else {
      const targetId = id;
      console.log("Updating series/regular event:");
      console.log("targetId:", targetId);
      console.log("is_recurring:", is_recurring);
      console.log("recurrence provided:", !!recurrence);
      const recurrenceFields = is_recurring && recurrence ? {
        is_recurring: 1,
        recurrence_type: recurrence.type,
        recurrence_interval: recurrence.interval || 1,
        recurrence_days_of_week: recurrence.daysOfWeek ? JSON.stringify(recurrence.daysOfWeek) : null,
        recurrence_day_of_month: recurrence.dayOfMonth || null,
        recurrence_week_of_month: recurrence.weekOfMonth || null,
        recurrence_day_of_week: recurrence.dayOfWeek || null,
        recurrence_months: recurrence.months ? JSON.stringify(recurrence.months) : null,
        recurrence_end_type: recurrence.endType || "never",
        recurrence_end_date: recurrence.endDate || null,
        recurrence_occurrences: recurrence.occurrences || null,
        // Always preserve existing exceptions when updating a series
        recurrence_exceptions: existingEvent.recurrence_exceptions
      } : {
        is_recurring: 0,
        recurrence_type: null,
        recurrence_interval: null,
        recurrence_days_of_week: null,
        recurrence_day_of_month: null,
        recurrence_week_of_month: null,
        recurrence_day_of_week: null,
        recurrence_months: null,
        recurrence_end_type: null,
        recurrence_end_date: null,
        recurrence_occurrences: null,
        recurrence_exceptions: null
      };
      console.log("recurrenceFields.recurrence_exceptions:", recurrenceFields.recurrence_exceptions);
      console.log("About to update event with targetId:", targetId);
      const { success } = await c.env.DB.prepare(`
        UPDATE calendar_events SET 
          title = ?, description = ?, event_time = ?, event_end_time = ?, 
          location = ?, updated_at = CURRENT_TIMESTAMP,
          is_recurring = ?, recurrence_type = ?, recurrence_interval = ?, 
          recurrence_days_of_week = ?, recurrence_day_of_month = ?, 
          recurrence_week_of_month = ?, recurrence_day_of_week = ?, 
          recurrence_months = ?, recurrence_end_type = ?, recurrence_end_date = ?, 
          recurrence_occurrences = ?, recurrence_exceptions = ?
        WHERE id = ?
      `).bind(
        title,
        description || null,
        event_time || null,
        event_end_time || null,
        location || null,
        recurrenceFields.is_recurring,
        recurrenceFields.recurrence_type,
        recurrenceFields.recurrence_interval,
        recurrenceFields.recurrence_days_of_week,
        recurrenceFields.recurrence_day_of_month,
        recurrenceFields.recurrence_week_of_month,
        recurrenceFields.recurrence_day_of_week,
        recurrenceFields.recurrence_months,
        recurrenceFields.recurrence_end_type,
        recurrenceFields.recurrence_end_date,
        recurrenceFields.recurrence_occurrences,
        recurrenceFields.recurrence_exceptions,
        targetId
      ).run();
      if (success) {
        return c.json({ message: "Event updated successfully" });
      }
      return c.json({ error: "Failed to update event" }, 500);
    }
  } catch (error) {
    console.error("Error updating event:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { delete_series, exception_date } = await c.req.json().catch(() => ({}));
    const { results: existingEvents } = await c.env.DB.prepare(
      "SELECT * FROM calendar_events WHERE id = ?"
    ).bind(id).all();
    if (existingEvents.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    const existingEvent = existingEvents[0];
    if (exception_date && !delete_series) {
      let parentEventId = existingEvent.parent_event_id || id;
      const { results: parentEvents } = await c.env.DB.prepare(
        "SELECT * FROM calendar_events WHERE id = ?"
      ).bind(parentEventId).all();
      if (parentEvents.length > 0) {
        const parentEvent = parentEvents[0];
        const exceptions = parentEvent.recurrence_exceptions ? JSON.parse(parentEvent.recurrence_exceptions) : [];
        if (!exceptions.includes(exception_date)) {
          exceptions.push(exception_date);
          await c.env.DB.prepare(
            "UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?"
          ).bind(JSON.stringify(exceptions), parentEventId).run();
        }
        return c.json({ message: "Event occurrence deleted successfully" });
      }
    }
    if (delete_series) {
      const { success } = await c.env.DB.prepare("DELETE FROM calendar_events WHERE id = ?").bind(id).run();
      if (success) {
        await c.env.DB.prepare("DELETE FROM calendar_events WHERE parent_event_id = ?").bind(id).run();
        return c.json({ message: "Event series deleted successfully" });
      }
    } else {
      const { success } = await c.env.DB.prepare("DELETE FROM calendar_events WHERE id = ?").bind(id).run();
      if (success) {
        return c.json({ message: "Event deleted successfully" });
      }
    }
    return c.json({ error: "Failed to delete event" }, 500);
  } catch (error) {
    console.error("Error deleting event:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.post("/:id/exception", async (c) => {
  try {
    const { id } = c.req.param();
    const { exception_date } = await c.req.json();
    if (!exception_date) {
      return c.json({ error: "Missing required field: exception_date" }, 400);
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(exception_date)) {
      return c.json({ error: "Invalid date format. Use YYYY-MM-DD" }, 400);
    }
    const { results: events } = await c.env.DB.prepare(
      "SELECT * FROM calendar_events WHERE id = ?"
    ).bind(id).all();
    if (events.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    const event = events[0];
    if (!event.is_recurring) {
      return c.json({ error: "Event is not recurring" }, 400);
    }
    const exceptions = event.recurrence_exceptions ? JSON.parse(event.recurrence_exceptions) : [];
    if (!exceptions.includes(exception_date)) {
      exceptions.push(exception_date);
      const { success } = await c.env.DB.prepare(
        "UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?"
      ).bind(JSON.stringify(exceptions), id).run();
      if (success) {
        return c.json({ message: "Exception added successfully" });
      }
    }
    return c.json({ message: "Exception already exists or failed to add" });
  } catch (error) {
    console.error("Error adding exception:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.delete("/:id/exception", async (c) => {
  try {
    const { id } = c.req.param();
    const { exception_date } = await c.req.json();
    if (!exception_date) {
      return c.json({ error: "Missing required field: exception_date" }, 400);
    }
    const { results: events } = await c.env.DB.prepare(
      "SELECT * FROM calendar_events WHERE id = ?"
    ).bind(id).all();
    if (events.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    const event = events[0];
    if (!event.is_recurring) {
      return c.json({ error: "Event is not recurring" }, 400);
    }
    const exceptions = event.recurrence_exceptions ? JSON.parse(event.recurrence_exceptions) : [];
    const updatedExceptions = exceptions.filter((date) => date !== exception_date);
    const { success } = await c.env.DB.prepare(
      "UPDATE calendar_events SET recurrence_exceptions = ? WHERE id = ?"
    ).bind(JSON.stringify(updatedExceptions), id).run();
    if (success) {
      return c.json({ message: "Exception removed successfully" });
    }
    return c.json({ error: "Failed to remove exception" }, 500);
  } catch (error) {
    console.error("Error removing exception:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
calendar.get("/test/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const startDate = /* @__PURE__ */ new Date();
    const endDate = /* @__PURE__ */ new Date();
    endDate.setMonth(endDate.getMonth() + 3);
    const { results } = await c.env.DB.prepare(
      "SELECT * FROM calendar_events WHERE id = ?"
    ).bind(id).all();
    if (results.length === 0) {
      return c.json({ error: "Event not found" }, 404);
    }
    const event = results[0];
    const instances = generateRecurringInstances(event, startDate, endDate);
    return c.json({
      baseEvent: event,
      generatedInstances: instances,
      count: instances.length
    });
  } catch (error) {
    console.error("Error testing recurring event:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
var calendar_default = calendar;

// api/tasks/index.ts
var tasks = new Hono2();
tasks.use("*", authMiddleware);
tasks.get("/", async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT t.*, 
             u1.username as creator_username,
             u2.username as assignee_username
      FROM tasks t 
      LEFT JOIN users u1 ON t.created_by = u1.id
      LEFT JOIN users u2 ON t.assigned_to = u2.id
      ORDER BY t.due_date ASC, t.created_at DESC
    `).all();
    return c.json(results);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
tasks.post("/", async (c) => {
  try {
    const user = c.get("user");
    const { title, description, assigned_to, due_date, priority } = await c.req.json();
    if (!title) {
      return c.json({ error: "Title is required" }, 400);
    }
    const validPriorities = ["low", "medium", "high"];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : "medium";
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return c.json({ error: "Invalid due date format. Use YYYY-MM-DD" }, 400);
    }
    const { success } = await c.env.DB.prepare(
      "INSERT INTO tasks (title, description, assigned_to, created_by, due_date, priority) VALUES (?, ?, ?, ?, ?, ?)"
    ).bind(title, description || null, assigned_to || null, user.id, due_date || null, taskPriority).run();
    if (success) {
      return c.json({ message: "Task created successfully" });
    }
    return c.json({ error: "Failed to create task" }, 500);
  } catch (error) {
    console.error("Error creating task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
tasks.put("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { title, description, completed, assigned_to, due_date, priority } = await c.req.json();
    if (!title) {
      return c.json({ error: "Title is required" }, 400);
    }
    const validPriorities = ["low", "medium", "high"];
    const taskPriority = priority && validPriorities.includes(priority) ? priority : "medium";
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return c.json({ error: "Invalid due date format. Use YYYY-MM-DD" }, 400);
    }
    const { success } = await c.env.DB.prepare(
      "UPDATE tasks SET title = ?, description = ?, completed = ?, assigned_to = ?, due_date = ?, priority = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(
      title,
      description || null,
      completed ? 1 : 0,
      assigned_to || null,
      due_date || null,
      taskPriority,
      id
    ).run();
    if (success) {
      return c.json({ message: "Task updated successfully" });
    }
    return c.json({ error: "Failed to update task" }, 500);
  } catch (error) {
    console.error("Error updating task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
tasks.patch("/:id/complete", async (c) => {
  try {
    const { id } = c.req.param();
    const { completed } = await c.req.json();
    if (typeof completed !== "boolean") {
      return c.json({ error: "Invalid completed status" }, 400);
    }
    const { success } = await c.env.DB.prepare(
      "UPDATE tasks SET completed = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(completed ? 1 : 0, id).run();
    if (success) {
      return c.json({ message: "Task completion status updated" });
    }
    return c.json({ error: "Failed to update task" }, 500);
  } catch (error) {
    console.error("Error updating task completion:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
tasks.delete("/:id", async (c) => {
  try {
    const { id } = c.req.param();
    const { success } = await c.env.DB.prepare("DELETE FROM tasks WHERE id = ?").bind(id).run();
    if (success) {
      return c.json({ message: "Task deleted successfully" });
    }
    return c.json({ error: "Failed to delete task" }, 500);
  } catch (error) {
    console.error("Error deleting task:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
var tasks_default = tasks;

// api/profile/index.ts
async function hashPassword2(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}
__name(hashPassword2, "hashPassword");
async function verifyPassword2(password, hashedPassword) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const computedHash = hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  return computedHash === hashedPassword;
}
__name(verifyPassword2, "verifyPassword");
var profile = new Hono2();
profile.use("*", authMiddleware);
profile.get("/", async (c) => {
  try {
    const user = c.get("user");
    const dbUser = await c.env.DB.prepare("SELECT id, username, is_admin, created_at, avatar_color FROM users WHERE id = ?").bind(user.id).first();
    if (!dbUser) {
      return c.json({ error: "User not found" }, 404);
    }
    return c.json({
      id: dbUser.id,
      username: dbUser.username,
      is_admin: !!dbUser.is_admin,
      created_at: dbUser.created_at,
      avatar_color: dbUser.avatar_color
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
profile.put("/", async (c) => {
  try {
    const user = c.get("user");
    const body = await c.req.json();
    if (body.password) {
      if (body.password.length < 6) {
        return c.json({ error: "Password must be at least 6 characters long" }, 400);
      }
      const hashedPassword = await hashPassword2(body.password);
      const { success } = await c.env.DB.prepare(
        "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(hashedPassword, user.id).run();
      if (success) {
        return c.json({ message: "Password updated successfully" });
      }
      return c.json({ error: "Failed to update password" }, 500);
    }
    if (body.avatar_color !== void 0) {
      const { success } = await c.env.DB.prepare(
        "UPDATE users SET avatar_color = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(body.avatar_color, user.id).run();
      if (success) {
        return c.json({ message: "Avatar color updated successfully" });
      }
      return c.json({ error: "Failed to update avatar color" }, 500);
    }
    if (body.username !== void 0) {
      const newUsername = String(body.username).trim();
      if (newUsername.length < 3) {
        return c.json({ error: "Username must be at least 3 characters long" }, 400);
      }
      const existingUser = await c.env.DB.prepare("SELECT id FROM users WHERE LOWER(username) = LOWER(?) AND id != ?").bind(newUsername, user.id).first();
      if (existingUser) {
        return c.json({ error: "Username already taken" }, 409);
      }
      const { success } = await c.env.DB.prepare(
        "UPDATE users SET username = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
      ).bind(newUsername, user.id).run();
      if (success) {
        return c.json({ message: "Profile updated successfully" });
      }
      return c.json({ error: "Failed to update profile" }, 500);
    }
    return c.json({ error: "No valid fields to update" }, 400);
  } catch (error) {
    console.error("Error updating user profile:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
profile.post("/change-password", async (c) => {
  try {
    const user = c.get("user");
    const { currentPassword, newPassword, confirmPassword } = await c.req.json();
    if (!currentPassword || !newPassword || !confirmPassword) {
      return c.json({ error: "All password fields are required" }, 400);
    }
    if (newPassword !== confirmPassword) {
      return c.json({ error: "New passwords do not match" }, 400);
    }
    if (newPassword.length < 6) {
      return c.json({ error: "New password must be at least 6 characters long" }, 400);
    }
    const dbUser = await c.env.DB.prepare("SELECT password FROM users WHERE id = ?").bind(user.id).first();
    if (!dbUser) {
      return c.json({ error: "User not found" }, 404);
    }
    const validPassword = await verifyPassword2(currentPassword, dbUser.password);
    if (!validPassword) {
      return c.json({ error: "Current password is incorrect" }, 401);
    }
    const hashedPassword = await hashPassword2(newPassword);
    const { success } = await c.env.DB.prepare(
      "UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?"
    ).bind(hashedPassword, user.id).run();
    if (success) {
      return c.json({ message: "Password changed successfully" });
    }
    return c.json({ error: "Failed to change password" }, 500);
  } catch (error) {
    console.error("Error changing password:", error);
    return c.json({ error: "Internal server error" }, 500);
  }
});
var profile_default = profile;

// api/chat/messages.ts
async function getMessages(c) {
  console.log("getMessages: Received request");
  const { channelId } = c.req.param();
  console.log("getMessages: Channel ID", channelId);
  const userIdStr = c.req.query("user_id");
  const userId = userIdStr ? Number(userIdStr) : void 0;
  if (!channelId) {
    return new Response("Channel ID is required", { status: 400 });
  }
  try {
    const channelRow = await c.env.DB.prepare("SELECT is_private FROM channels WHERE id = ?").bind(channelId).first();
    if (!channelRow) {
      return new Response("Channel not found", { status: 404 });
    }
    const isPrivate = channelRow.is_private === 1;
    if (isPrivate) {
      if (!userId) {
        return new Response("Unauthorized", { status: 401 });
      }
      const adminRow = await c.env.DB.prepare("SELECT is_admin FROM users WHERE id = ?").bind(userId).first();
      const isAdmin = adminRow && adminRow.is_admin === 1;
      if (!isAdmin) {
        const memberRow = await c.env.DB.prepare("SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?").bind(channelId, userId).first();
        if (!memberRow) {
          return new Response("Forbidden", { status: 403 });
        }
      }
    }
    console.log("getMessages: Fetching messages for channel", channelId);
    const { results } = await c.env.DB.prepare(
      "SELECT messages.*, users.username as sender_username, users.avatar FROM messages JOIN users ON messages.sender_id = users.id WHERE channel_id = ? ORDER BY timestamp ASC"
    ).bind(channelId).all();
    console.log(`getMessages: Found ${results.length} messages`);
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return new Response("Error fetching messages: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(getMessages, "getMessages");
async function sendMessage(c) {
  console.log("sendMessage: Received request");
  const { channelId } = c.req.param();
  console.log("sendMessage: Channel ID", channelId);
  const userIdStr = c.req.query("user_id");
  const userIdFromQuery = userIdStr ? Number(userIdStr) : void 0;
  if (!channelId) {
    return new Response("Channel ID is required", { status: 400 });
  }
  try {
    const { content, sender_id } = await c.req.json();
    console.log("sendMessage: Parsed body", { content, sender_id });
    if (!content || !sender_id) {
      return new Response("Content and sender_id are required", { status: 400 });
    }
    const effectiveUserId = userIdFromQuery || Number(sender_id);
    if (!effectiveUserId) {
      return new Response("Unauthorized", { status: 401 });
    }
    const chanRow = await c.env.DB.prepare("SELECT is_private FROM channels WHERE id = ?").bind(channelId).first();
    if (!chanRow) {
      return new Response("Channel not found", { status: 404 });
    }
    const isPrivateChan = chanRow.is_private === 1;
    if (isPrivateChan) {
      const admRow = await c.env.DB.prepare("SELECT is_admin FROM users WHERE id = ?").bind(effectiveUserId).first();
      const isAdmin = admRow && admRow.is_admin === 1;
      if (!isAdmin) {
        const membRow = await c.env.DB.prepare("SELECT 1 FROM channel_members WHERE channel_id = ? AND user_id = ?").bind(channelId, effectiveUserId).first();
        if (!membRow) {
          return new Response("Forbidden", { status: 403 });
        }
      }
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.log("sendMessage: Inserting message", { channelId, sender_id, timestamp });
    const result = await c.env.DB.prepare(
      "INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?)"
    ).bind(channelId, sender_id, content, timestamp).run();
    console.log("sendMessage: Insert result", result);
    if (result.success) {
      return new Response(JSON.stringify({ message: "Message sent" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Failed to send message", { status: 500 });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    return new Response("Error sending message: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(sendMessage, "sendMessage");
async function deleteMessage(c) {
  console.log("deleteMessage: Received request");
  const { messageId } = c.req.param();
  console.log("deleteMessage: Message ID", messageId);
  if (!messageId) {
    return new Response("Message ID is required", { status: 400 });
  }
  try {
    const { user_id } = await c.req.json();
    console.log("deleteMessage: User ID", user_id);
    if (!user_id) {
      return new Response("User ID is required", { status: 400 });
    }
    const message = await c.env.DB.prepare(
      "SELECT sender_id FROM messages WHERE id = ?"
    ).bind(messageId).first();
    if (!message) {
      return new Response("Message not found", { status: 404 });
    }
    const isAdmin = await c.env.DB.prepare(
      "SELECT is_admin FROM users WHERE id = ?"
    ).bind(user_id).first();
    const isAuthorized = isAdmin && isAdmin.is_admin === 1 || message.sender_id === Number(user_id);
    if (!isAuthorized) {
      return new Response("Unauthorized: You can only delete your own messages", { status: 403 });
    }
    const result = await c.env.DB.prepare(
      "DELETE FROM messages WHERE id = ?"
    ).bind(messageId).run();
    console.log("deleteMessage: Delete result", result);
    if (result.success) {
      return new Response(JSON.stringify({ message: "Message deleted" }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Failed to delete message", { status: 500 });
    }
  } catch (error) {
    console.error("Error deleting message:", error);
    return new Response("Error deleting message: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(deleteMessage, "deleteMessage");
async function getDMMessages(c) {
  console.log("getDMMessages: Received request");
  const { dmId } = c.req.param();
  console.log("getDMMessages: DM ID", dmId);
  const userIdStr = c.req.query("user_id");
  const userId = userIdStr ? Number(userIdStr) : void 0;
  if (!dmId || !dmId.startsWith("dm_")) {
    return new Response("Invalid DM ID", { status: 400 });
  }
  if (!userId) {
    return new Response("User ID is required", { status: 401 });
  }
  try {
    const dmParts = dmId.split("_");
    if (dmParts.length !== 3) {
      return new Response("Invalid DM ID format", { status: 400 });
    }
    const user1Id = parseInt(dmParts[1]);
    const user2Id = parseInt(dmParts[2]);
    if (userId !== user1Id && userId !== user2Id) {
      return new Response("Unauthorized: You can only view your own DMs", { status: 403 });
    }
    console.log("getDMMessages: Fetching DM messages for", dmId);
    const { results } = await c.env.DB.prepare(
      "SELECT messages.*, users.username as sender_username, users.avatar FROM messages JOIN users ON messages.sender_id = users.id WHERE channel_id = ? ORDER BY timestamp ASC"
    ).bind(dmId).all();
    console.log(`getDMMessages: Found ${results.length} messages`);
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching DM messages:", error);
    return new Response("Error fetching DM messages: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(getDMMessages, "getDMMessages");
async function sendDMMessage(c) {
  console.log("sendDMMessage: Received request");
  const { dmId } = c.req.param();
  console.log("sendDMMessage: DM ID", dmId);
  if (!dmId || !dmId.startsWith("dm_")) {
    return new Response("Invalid DM ID", { status: 400 });
  }
  try {
    const { content, sender_id } = await c.req.json();
    console.log("sendDMMessage: Parsed body", { content, sender_id });
    if (!content || !sender_id) {
      return new Response("Content and sender_id are required", { status: 400 });
    }
    const dmParts = dmId.split("_");
    if (dmParts.length !== 3) {
      return new Response("Invalid DM ID format", { status: 400 });
    }
    const user1Id = parseInt(dmParts[1]);
    const user2Id = parseInt(dmParts[2]);
    if (sender_id !== user1Id && sender_id !== user2Id) {
      return new Response("Unauthorized: You can only send messages in your own DMs", { status: 403 });
    }
    const timestamp = (/* @__PURE__ */ new Date()).toISOString();
    console.log("sendDMMessage: Inserting message", { dmId, sender_id, timestamp });
    const result = await c.env.DB.prepare(
      "INSERT INTO messages (channel_id, sender_id, content, timestamp) VALUES (?, ?, ?, ?)"
    ).bind(dmId, sender_id, content, timestamp).run();
    console.log("sendDMMessage: Insert result", result);
    if (result.success) {
      return new Response(JSON.stringify({ message: "DM message sent" }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Failed to send DM message", { status: 500 });
    }
  } catch (error) {
    console.error("Error sending DM message:", error);
    return new Response("Error sending DM message: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(sendDMMessage, "sendDMMessage");

// api/chat/channels.ts
async function getChannels(c) {
  console.log("getChannels: Received request");
  try {
    const userIdStr = c.req.query("user_id");
    let channels;
    if (userIdStr) {
      const userId = Number(userIdStr);
      const adminRow = await c.env.DB.prepare("SELECT is_admin FROM users WHERE id = ?").bind(userId).first();
      const isAdmin = adminRow && adminRow.is_admin === 1;
      if (isAdmin) {
        const { results } = await c.env.DB.prepare('SELECT * FROM channels WHERE id NOT LIKE "dm_%" AND id NOT LIKE "group_%" ORDER BY position ASC').all();
        channels = results;
      } else {
        const { results } = await c.env.DB.prepare(
          `SELECT DISTINCT channels.*
           FROM channels
           LEFT JOIN channel_members ON channels.id = channel_members.channel_id AND channel_members.user_id = ?
           WHERE channels.id NOT LIKE "dm_%" AND channels.id NOT LIKE "group_%" AND (channels.is_private = 0 OR channel_members.user_id = ?)
           ORDER BY channels.position ASC`
        ).bind(userId, userId).all();
        channels = results;
      }
    } else {
      const { results } = await c.env.DB.prepare('SELECT * FROM channels WHERE is_private = 0 AND id NOT LIKE "dm_%" AND id NOT LIKE "group_%" ORDER BY position ASC').all();
      channels = results;
    }
    console.log("getChannels: Found channels", channels);
    return new Response(JSON.stringify(channels), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching channels:", error);
    return new Response("Error fetching channels: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(getChannels, "getChannels");
async function createChannel(c) {
  console.log("createChannel: Received request");
  try {
    const { id, name, created_by, is_private = false, members = [] } = await c.req.json();
    console.log("createChannel: Parsed body", { id, name, created_by, is_private, members });
    if (!id || !name) {
      return new Response("Channel ID and name are required", { status: 400 });
    }
    const existingChannel = await c.env.DB.prepare(
      "SELECT id FROM channels WHERE id = ?"
    ).bind(id).first();
    if (existingChannel) {
      return new Response("Channel ID already exists", { status: 409 });
    }
    const positionResult = await c.env.DB.prepare(
      "SELECT COALESCE(MAX(position), 0) as max_pos FROM channels"
    ).first();
    const position = positionResult ? positionResult.max_pos + 1 : 1;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    console.log("createChannel: Inserting channel", { id, name, created_by, now, position });
    let memberIds = Array.isArray(members) ? [...members] : [];
    if (is_private && created_by && !memberIds.includes(Number(created_by))) {
      memberIds.push(Number(created_by));
    }
    const result = await c.env.DB.prepare(
      "INSERT INTO channels (id, name, created_by, created_at, updated_at, position, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(id, name, created_by, now, now, position, is_private ? 1 : 0).run();
    console.log("createChannel: Insert result", result);
    if (result.success) {
      if (is_private) {
        for (const memberId of memberIds) {
          try {
            await c.env.DB.prepare(
              "INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)"
            ).bind(id, memberId).run();
          } catch (memberErr) {
            console.error("Error adding channel member:", memberErr);
          }
        }
      }
      return new Response(JSON.stringify({
        message: "Channel created",
        id,
        name,
        position,
        is_private
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Failed to create channel", { status: 500 });
    }
  } catch (error) {
    console.error("Error creating channel:", error);
    return new Response("Error creating channel: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(createChannel, "createChannel");
async function updateChannel(c) {
  console.log("updateChannel: Received request");
  try {
    const { channelId } = c.req.param();
    const { name, is_private, members = [] } = await c.req.json();
    console.log("updateChannel: Parsed data", { channelId, name, is_private, members });
    if (!name) {
      return new Response("Channel name is required", { status: 400 });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    console.log("updateChannel: Updating channel", { channelId, name, now });
    const result = await c.env.DB.prepare(
      "UPDATE channels SET name = ?, is_private = ?, updated_at = ? WHERE id = ?"
    ).bind(name, is_private ? 1 : 0, now, channelId).run();
    console.log("updateChannel: Update result", result);
    if (result.success) {
      if (is_private !== void 0) {
        await c.env.DB.prepare("DELETE FROM channel_members WHERE channel_id = ?").bind(channelId).run();
        if (is_private && Array.isArray(members)) {
          for (const memberId of members) {
            try {
              await c.env.DB.prepare("INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)").bind(channelId, memberId).run();
            } catch (memberErr) {
              console.error("Error updating channel member:", memberErr);
            }
          }
        }
      }
      return new Response(JSON.stringify({
        message: "Channel updated",
        id: channelId,
        name,
        is_private
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Channel not found", { status: 404 });
    }
  } catch (error) {
    console.error("Error updating channel:", error);
    return new Response("Error updating channel: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(updateChannel, "updateChannel");
async function deleteChannel(c) {
  console.log("deleteChannel: Received request");
  try {
    const { channelId } = c.req.param();
    console.log("deleteChannel: Channel ID", channelId);
    if (channelId === "general") {
      return new Response("Cannot delete the general channel", { status: 403 });
    }
    console.log("deleteChannel: Deleting channel members for channel", channelId);
    await c.env.DB.prepare("DELETE FROM channel_members WHERE channel_id = ?").bind(channelId).run();
    console.log("deleteChannel: Deleting messages for channel", channelId);
    await c.env.DB.prepare(
      "DELETE FROM messages WHERE channel_id = ?"
    ).bind(channelId).run();
    console.log("deleteChannel: Deleting channel", channelId);
    const result = await c.env.DB.prepare(
      "DELETE FROM channels WHERE id = ?"
    ).bind(channelId).run();
    console.log("deleteChannel: Delete result", result);
    if (result.success) {
      return new Response(JSON.stringify({
        message: "Channel deleted"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Channel not found", { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting channel:", error);
    return new Response("Error deleting channel: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(deleteChannel, "deleteChannel");
async function reorderChannels(c) {
  console.log("reorderChannels: Received request");
  try {
    const { channels } = await c.req.json();
    console.log("reorderChannels: Parsed channels", channels);
    if (!channels || !Array.isArray(channels) || channels.length === 0) {
      return new Response("Channels array is required", { status: 400 });
    }
    const db = c.env.DB;
    for (const channel of channels) {
      console.log("reorderChannels: Updating channel position", channel);
      await db.prepare(
        "UPDATE channels SET position = ? WHERE id = ?"
      ).bind(channel.position, channel.id).run();
    }
    const { results } = await db.prepare(
      "SELECT * FROM channels ORDER BY position ASC"
    ).all();
    return new Response(JSON.stringify({
      message: "Channels reordered",
      channels: results
    }), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error reordering channels:", error);
    return new Response("Error reordering channels: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(reorderChannels, "reorderChannels");
async function getGroupChats(c) {
  console.log("getGroupChats: Received request");
  try {
    const userIdStr = c.req.query("user_id");
    if (!userIdStr) {
      return new Response("User ID is required", { status: 400 });
    }
    const userId = Number(userIdStr);
    const { results } = await c.env.DB.prepare(
      `SELECT DISTINCT 
         channels.*,
         COALESCE(MAX(messages.timestamp), channels.created_at) as last_activity
       FROM channels 
       JOIN channel_members ON channels.id = channel_members.channel_id 
       LEFT JOIN messages ON channels.id = messages.channel_id
       WHERE channels.id LIKE 'group_%' AND channel_members.user_id = ?
       GROUP BY channels.id, channels.name, channels.created_by, channels.created_at, channels.updated_at, channels.position, channels.is_private
       ORDER BY last_activity DESC`
    ).bind(userId).all();
    console.log("getGroupChats: Found group chats", results);
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching group chats:", error);
    return new Response("Error fetching group chats: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(getGroupChats, "getGroupChats");
async function createGroupChat(c) {
  console.log("createGroupChat: Received request");
  try {
    const { name, created_by, members = [] } = await c.req.json();
    console.log("createGroupChat: Parsed body", { name, created_by, members });
    if (!name || !created_by) {
      return new Response("Group name and creator ID are required", { status: 400 });
    }
    if (!Array.isArray(members) || members.length === 0) {
      return new Response("At least one member is required", { status: 400 });
    }
    const groupId = `group_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const now = (/* @__PURE__ */ new Date()).toISOString();
    let memberIds = [...members];
    if (!memberIds.includes(Number(created_by))) {
      memberIds.push(Number(created_by));
    }
    console.log("createGroupChat: Creating group", { groupId, name, created_by, now, memberIds });
    const result = await c.env.DB.prepare(
      "INSERT INTO channels (id, name, created_by, created_at, updated_at, position, is_private) VALUES (?, ?, ?, ?, ?, ?, ?)"
    ).bind(groupId, name, created_by, now, now, 0, 1).run();
    console.log("createGroupChat: Insert result", result);
    if (result.success) {
      for (const memberId of memberIds) {
        try {
          await c.env.DB.prepare(
            "INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)"
          ).bind(groupId, memberId).run();
        } catch (memberErr) {
          console.error("Error adding group member:", memberErr);
        }
      }
      return new Response(JSON.stringify({
        message: "Group chat created",
        id: groupId,
        name,
        members: memberIds
      }), {
        status: 201,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Failed to create group chat", { status: 500 });
    }
  } catch (error) {
    console.error("Error creating group chat:", error);
    return new Response("Error creating group chat: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(createGroupChat, "createGroupChat");
async function updateGroupChat(c) {
  console.log("updateGroupChat: Received request");
  try {
    const { groupId } = c.req.param();
    const { name, members = [] } = await c.req.json();
    console.log("updateGroupChat: Parsed data", { groupId, name, members });
    if (!name) {
      return new Response("Group name is required", { status: 400 });
    }
    if (!groupId.startsWith("group_")) {
      return new Response("Invalid group ID", { status: 400 });
    }
    const now = (/* @__PURE__ */ new Date()).toISOString();
    console.log("updateGroupChat: Updating group", { groupId, name, now });
    const result = await c.env.DB.prepare(
      "UPDATE channels SET name = ?, updated_at = ? WHERE id = ?"
    ).bind(name, now, groupId).run();
    console.log("updateGroupChat: Update result", result);
    if (result.success) {
      if (Array.isArray(members) && members.length > 0) {
        await c.env.DB.prepare("DELETE FROM channel_members WHERE channel_id = ?").bind(groupId).run();
        for (const memberId of members) {
          try {
            await c.env.DB.prepare("INSERT INTO channel_members (channel_id, user_id) VALUES (?, ?)").bind(groupId, memberId).run();
          } catch (memberErr) {
            console.error("Error updating group member:", memberErr);
          }
        }
      }
      return new Response(JSON.stringify({
        message: "Group chat updated",
        id: groupId,
        name,
        members
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Group chat not found", { status: 404 });
    }
  } catch (error) {
    console.error("Error updating group chat:", error);
    return new Response("Error updating group chat: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(updateGroupChat, "updateGroupChat");
async function getChannelMembers(c) {
  console.log("getChannelMembers: Received request");
  try {
    const { channelId } = c.req.param();
    console.log("getChannelMembers: Channel ID", channelId);
    const { results } = await c.env.DB.prepare(
      `SELECT channel_members.user_id, users.username 
       FROM channel_members 
       JOIN users ON channel_members.user_id = users.id 
       WHERE channel_members.channel_id = ?`
    ).bind(channelId).all();
    console.log("getChannelMembers: Found members", results);
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching channel members:", error);
    return new Response("Error fetching channel members: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(getChannelMembers, "getChannelMembers");
async function deleteGroupChat(c) {
  console.log("deleteGroupChat: Received request");
  try {
    const { groupId } = c.req.param();
    console.log("deleteGroupChat: Group ID", groupId);
    if (!groupId.startsWith("group_")) {
      return new Response("Invalid group ID", { status: 400 });
    }
    console.log("deleteGroupChat: Deleting group members for group", groupId);
    await c.env.DB.prepare("DELETE FROM channel_members WHERE channel_id = ?").bind(groupId).run();
    console.log("deleteGroupChat: Deleting messages for group", groupId);
    await c.env.DB.prepare(
      "DELETE FROM messages WHERE channel_id = ?"
    ).bind(groupId).run();
    console.log("deleteGroupChat: Deleting group", groupId);
    const result = await c.env.DB.prepare(
      "DELETE FROM channels WHERE id = ?"
    ).bind(groupId).run();
    console.log("deleteGroupChat: Delete result", result);
    if (result.success) {
      return new Response(JSON.stringify({
        message: "Group chat deleted"
      }), {
        headers: { "Content-Type": "application/json" }
      });
    } else {
      return new Response("Group chat not found", { status: 404 });
    }
  } catch (error) {
    console.error("Error deleting group chat:", error);
    return new Response("Error deleting group chat: " + (error instanceof Error ? error.message : String(error)), { status: 500 });
  }
}
__name(deleteGroupChat, "deleteGroupChat");

// api/chat/users.ts
async function getUsers(c) {
  try {
    const { results } = await c.env.DB.prepare(
      "SELECT id, username, is_admin FROM users ORDER BY username COLLATE NOCASE ASC"
    ).all();
    return new Response(JSON.stringify(results), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching users list", error);
    return new Response("Error fetching users list", { status: 500 });
  }
}
__name(getUsers, "getUsers");
async function getUsersByRecentActivity(c) {
  try {
    const userIdStr = c.req.query("user_id");
    if (!userIdStr) {
      return new Response("User ID is required", { status: 400 });
    }
    const userId = Number(userIdStr);
    const userIdString = userIdStr;
    console.log(`getUsersByRecentActivity called for user ${userId}`);
    const { results: allUsers } = await c.env.DB.prepare(
      "SELECT id, username, is_admin FROM users WHERE id != ? ORDER BY username COLLATE NOCASE ASC"
    ).bind(userId).all();
    console.log(`Found ${allUsers.length} users (excluding current user)`);
    const { results: recentMessages } = await c.env.DB.prepare(`
      SELECT 
        m.channel_id,
        MAX(m.timestamp) as last_message_time
      FROM messages m
      WHERE m.channel_id LIKE 'dm_%'
        AND (
          m.channel_id LIKE 'dm_' || ? || '_%' 
          OR m.channel_id LIKE 'dm_%_' || ?
        )
      GROUP BY m.channel_id
      ORDER BY last_message_time DESC
    `).bind(userIdString, userIdString).all();
    console.log(`Found ${recentMessages.length} DM conversations:`, recentMessages);
    const { results: allDMMessages } = await c.env.DB.prepare(`
      SELECT channel_id, timestamp, sender_id 
      FROM messages 
      WHERE channel_id LIKE 'dm_%' 
      ORDER BY timestamp DESC 
      LIMIT 10
    `).all();
    console.log(`Sample DM messages in database:`, allDMMessages);
    const userLastMessageMap = /* @__PURE__ */ new Map();
    for (const msg of recentMessages) {
      const channelId = msg.channel_id;
      const parts = channelId.split("_");
      if (parts.length === 3) {
        const user1Id = parseInt(parts[1]);
        const user2Id = parseInt(parts[2]);
        const otherUserId = user1Id === userId ? user2Id : user1Id;
        if (!userLastMessageMap.has(otherUserId)) {
          userLastMessageMap.set(otherUserId, msg.last_message_time);
          console.log(`Mapped user ${otherUserId} to timestamp ${msg.last_message_time}`);
        }
      }
    }
    const usersWithActivity = allUsers.map((user) => ({
      ...user,
      last_message_time: userLastMessageMap.get(user.id) || ""
    }));
    usersWithActivity.sort((a, b) => {
      const aHasMessages = !!a.last_message_time;
      const bHasMessages = !!b.last_message_time;
      if (aHasMessages && bHasMessages) {
        return b.last_message_time.localeCompare(a.last_message_time);
      } else if (aHasMessages && !bHasMessages) {
        return -1;
      } else if (!aHasMessages && bHasMessages) {
        return 1;
      } else {
        return a.username.localeCompare(b.username, void 0, { sensitivity: "base" });
      }
    });
    console.log("Final sorted result:", usersWithActivity.map((u) => ({
      id: u.id,
      username: u.username,
      last_message_time: u.last_message_time
    })));
    return new Response(JSON.stringify(usersWithActivity), {
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching users by recent activity", error);
    return new Response("Error fetching users by recent activity", { status: 500 });
  }
}
__name(getUsersByRecentActivity, "getUsersByRecentActivity");

// api/chat/index.ts
var chat = new Hono2();
chat.get("/debug", async (c) => {
  const authHeader = c.req.header("Authorization");
  console.log("Debug endpoint called");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json({
      message: "No token found",
      hasToken: false
    });
  }
  const token = authHeader.substring(7);
  try {
    const [headerBase64, payloadBase64] = token.split(".");
    const header = JSON.parse(atob(headerBase64));
    const payload = JSON.parse(atob(payloadBase64));
    return c.json({
      message: "Token found and parsed",
      hasToken: true,
      tokenInfo: {
        header,
        payload: {
          ...payload,
          // Don't reveal sensitive fields
          password: payload.password ? "[REDACTED]" : void 0
        }
      }
    });
  } catch (error) {
    return c.json({
      message: "Token parsing error",
      hasToken: true,
      error: String(error)
    });
  }
});
chat.get("/messages/:channelId", getMessages);
chat.post("/messages/:channelId", sendMessage);
chat.delete("/messages/:messageId", deleteMessage);
chat.get("/messages/dm/:dmId", getDMMessages);
chat.post("/messages/dm/:dmId", sendDMMessage);
chat.get("/channels", getChannels);
chat.post("/channels", createChannel);
chat.put("/channels/:channelId", updateChannel);
chat.delete("/channels/:channelId", deleteChannel);
chat.get("/channels/:channelId/members", getChannelMembers);
chat.post("/channels/reorder", reorderChannels);
chat.get("/groups", getGroupChats);
chat.post("/groups", createGroupChat);
chat.put("/groups/:groupId", updateGroupChat);
chat.delete("/groups/:groupId", deleteGroupChat);
chat.get("/users", getUsers);
chat.get("/users/recent", getUsersByRecentActivity);
var chat_default = chat;

// api/[[path]].ts
var app = new Hono2().basePath("/api");
app.use("*", corsMiddleware);
app.use("*", errorMiddleware);
app.use("*", rateLimitMiddleware);
app.route("/auth/register", register_default);
app.route("/auth/login", login_default);
app.route("/admin/users", users_default);
app.route("/calendar", calendar_default);
app.route("/tasks", tasks_default);
app.route("/profile", profile_default);
app.route("/chat", chat_default);
app.get("/health", (c) => c.json({
  status: "ok",
  timestamp: (/* @__PURE__ */ new Date()).toISOString(),
  version: "1.0.0"
}));
app.get("/", (c) => c.json({
  message: "FRC 7790 Baywatch Robotics API",
  version: "1.0.0",
  endpoints: [
    "/api/health",
    "/api/auth/login",
    "/api/auth/register",
    "/api/profile",
    "/api/calendar",
    "/api/tasks",
    "/api/admin/users"
  ]
}));
var onRequest = handle(app);

// ../.wrangler/tmp/pages-ha5QhI/functionsRoutes-0.15450857042804667.mjs
var routes = [
  {
    routePath: "/api/:path*",
    mountPath: "/api",
    method: "",
    middlewares: [],
    modules: [onRequest]
  }
];

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/node_modules/path-to-regexp/dist.es2015/index.js
function lexer(str) {
  var tokens = [];
  var i = 0;
  while (i < str.length) {
    var char = str[i];
    if (char === "*" || char === "+" || char === "?") {
      tokens.push({ type: "MODIFIER", index: i, value: str[i++] });
      continue;
    }
    if (char === "\\") {
      tokens.push({ type: "ESCAPED_CHAR", index: i++, value: str[i++] });
      continue;
    }
    if (char === "{") {
      tokens.push({ type: "OPEN", index: i, value: str[i++] });
      continue;
    }
    if (char === "}") {
      tokens.push({ type: "CLOSE", index: i, value: str[i++] });
      continue;
    }
    if (char === ":") {
      var name = "";
      var j = i + 1;
      while (j < str.length) {
        var code = str.charCodeAt(j);
        if (
          // `0-9`
          code >= 48 && code <= 57 || // `A-Z`
          code >= 65 && code <= 90 || // `a-z`
          code >= 97 && code <= 122 || // `_`
          code === 95
        ) {
          name += str[j++];
          continue;
        }
        break;
      }
      if (!name)
        throw new TypeError("Missing parameter name at ".concat(i));
      tokens.push({ type: "NAME", index: i, value: name });
      i = j;
      continue;
    }
    if (char === "(") {
      var count = 1;
      var pattern = "";
      var j = i + 1;
      if (str[j] === "?") {
        throw new TypeError('Pattern cannot start with "?" at '.concat(j));
      }
      while (j < str.length) {
        if (str[j] === "\\") {
          pattern += str[j++] + str[j++];
          continue;
        }
        if (str[j] === ")") {
          count--;
          if (count === 0) {
            j++;
            break;
          }
        } else if (str[j] === "(") {
          count++;
          if (str[j + 1] !== "?") {
            throw new TypeError("Capturing groups are not allowed at ".concat(j));
          }
        }
        pattern += str[j++];
      }
      if (count)
        throw new TypeError("Unbalanced pattern at ".concat(i));
      if (!pattern)
        throw new TypeError("Missing pattern at ".concat(i));
      tokens.push({ type: "PATTERN", index: i, value: pattern });
      i = j;
      continue;
    }
    tokens.push({ type: "CHAR", index: i, value: str[i++] });
  }
  tokens.push({ type: "END", index: i, value: "" });
  return tokens;
}
__name(lexer, "lexer");
function parse2(str, options) {
  if (options === void 0) {
    options = {};
  }
  var tokens = lexer(str);
  var _a = options.prefixes, prefixes = _a === void 0 ? "./" : _a, _b = options.delimiter, delimiter = _b === void 0 ? "/#?" : _b;
  var result = [];
  var key = 0;
  var i = 0;
  var path = "";
  var tryConsume = /* @__PURE__ */ __name(function(type) {
    if (i < tokens.length && tokens[i].type === type)
      return tokens[i++].value;
  }, "tryConsume");
  var mustConsume = /* @__PURE__ */ __name(function(type) {
    var value2 = tryConsume(type);
    if (value2 !== void 0)
      return value2;
    var _a2 = tokens[i], nextType = _a2.type, index = _a2.index;
    throw new TypeError("Unexpected ".concat(nextType, " at ").concat(index, ", expected ").concat(type));
  }, "mustConsume");
  var consumeText = /* @__PURE__ */ __name(function() {
    var result2 = "";
    var value2;
    while (value2 = tryConsume("CHAR") || tryConsume("ESCAPED_CHAR")) {
      result2 += value2;
    }
    return result2;
  }, "consumeText");
  var isSafe = /* @__PURE__ */ __name(function(value2) {
    for (var _i = 0, delimiter_1 = delimiter; _i < delimiter_1.length; _i++) {
      var char2 = delimiter_1[_i];
      if (value2.indexOf(char2) > -1)
        return true;
    }
    return false;
  }, "isSafe");
  var safePattern = /* @__PURE__ */ __name(function(prefix2) {
    var prev = result[result.length - 1];
    var prevText = prefix2 || (prev && typeof prev === "string" ? prev : "");
    if (prev && !prevText) {
      throw new TypeError('Must have text between two parameters, missing text after "'.concat(prev.name, '"'));
    }
    if (!prevText || isSafe(prevText))
      return "[^".concat(escapeString(delimiter), "]+?");
    return "(?:(?!".concat(escapeString(prevText), ")[^").concat(escapeString(delimiter), "])+?");
  }, "safePattern");
  while (i < tokens.length) {
    var char = tryConsume("CHAR");
    var name = tryConsume("NAME");
    var pattern = tryConsume("PATTERN");
    if (name || pattern) {
      var prefix = char || "";
      if (prefixes.indexOf(prefix) === -1) {
        path += prefix;
        prefix = "";
      }
      if (path) {
        result.push(path);
        path = "";
      }
      result.push({
        name: name || key++,
        prefix,
        suffix: "",
        pattern: pattern || safePattern(prefix),
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    var value = char || tryConsume("ESCAPED_CHAR");
    if (value) {
      path += value;
      continue;
    }
    if (path) {
      result.push(path);
      path = "";
    }
    var open = tryConsume("OPEN");
    if (open) {
      var prefix = consumeText();
      var name_1 = tryConsume("NAME") || "";
      var pattern_1 = tryConsume("PATTERN") || "";
      var suffix = consumeText();
      mustConsume("CLOSE");
      result.push({
        name: name_1 || (pattern_1 ? key++ : ""),
        pattern: name_1 && !pattern_1 ? safePattern(prefix) : pattern_1,
        prefix,
        suffix,
        modifier: tryConsume("MODIFIER") || ""
      });
      continue;
    }
    mustConsume("END");
  }
  return result;
}
__name(parse2, "parse");
function match(str, options) {
  var keys = [];
  var re = pathToRegexp(str, keys, options);
  return regexpToFunction(re, keys, options);
}
__name(match, "match");
function regexpToFunction(re, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.decode, decode3 = _a === void 0 ? function(x) {
    return x;
  } : _a;
  return function(pathname) {
    var m = re.exec(pathname);
    if (!m)
      return false;
    var path = m[0], index = m.index;
    var params = /* @__PURE__ */ Object.create(null);
    var _loop_1 = /* @__PURE__ */ __name(function(i2) {
      if (m[i2] === void 0)
        return "continue";
      var key = keys[i2 - 1];
      if (key.modifier === "*" || key.modifier === "+") {
        params[key.name] = m[i2].split(key.prefix + key.suffix).map(function(value) {
          return decode3(value, key);
        });
      } else {
        params[key.name] = decode3(m[i2], key);
      }
    }, "_loop_1");
    for (var i = 1; i < m.length; i++) {
      _loop_1(i);
    }
    return { path, index, params };
  };
}
__name(regexpToFunction, "regexpToFunction");
function escapeString(str) {
  return str.replace(/([.+*?=^!:${}()[\]|/\\])/g, "\\$1");
}
__name(escapeString, "escapeString");
function flags(options) {
  return options && options.sensitive ? "" : "i";
}
__name(flags, "flags");
function regexpToRegexp(path, keys) {
  if (!keys)
    return path;
  var groupsRegex = /\((?:\?<(.*?)>)?(?!\?)/g;
  var index = 0;
  var execResult = groupsRegex.exec(path.source);
  while (execResult) {
    keys.push({
      // Use parenthesized substring match if available, index otherwise
      name: execResult[1] || index++,
      prefix: "",
      suffix: "",
      modifier: "",
      pattern: ""
    });
    execResult = groupsRegex.exec(path.source);
  }
  return path;
}
__name(regexpToRegexp, "regexpToRegexp");
function arrayToRegexp(paths, keys, options) {
  var parts = paths.map(function(path) {
    return pathToRegexp(path, keys, options).source;
  });
  return new RegExp("(?:".concat(parts.join("|"), ")"), flags(options));
}
__name(arrayToRegexp, "arrayToRegexp");
function stringToRegexp(path, keys, options) {
  return tokensToRegexp(parse2(path, options), keys, options);
}
__name(stringToRegexp, "stringToRegexp");
function tokensToRegexp(tokens, keys, options) {
  if (options === void 0) {
    options = {};
  }
  var _a = options.strict, strict = _a === void 0 ? false : _a, _b = options.start, start = _b === void 0 ? true : _b, _c = options.end, end = _c === void 0 ? true : _c, _d = options.encode, encode = _d === void 0 ? function(x) {
    return x;
  } : _d, _e = options.delimiter, delimiter = _e === void 0 ? "/#?" : _e, _f = options.endsWith, endsWith = _f === void 0 ? "" : _f;
  var endsWithRe = "[".concat(escapeString(endsWith), "]|$");
  var delimiterRe = "[".concat(escapeString(delimiter), "]");
  var route = start ? "^" : "";
  for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
    var token = tokens_1[_i];
    if (typeof token === "string") {
      route += escapeString(encode(token));
    } else {
      var prefix = escapeString(encode(token.prefix));
      var suffix = escapeString(encode(token.suffix));
      if (token.pattern) {
        if (keys)
          keys.push(token);
        if (prefix || suffix) {
          if (token.modifier === "+" || token.modifier === "*") {
            var mod = token.modifier === "*" ? "?" : "";
            route += "(?:".concat(prefix, "((?:").concat(token.pattern, ")(?:").concat(suffix).concat(prefix, "(?:").concat(token.pattern, "))*)").concat(suffix, ")").concat(mod);
          } else {
            route += "(?:".concat(prefix, "(").concat(token.pattern, ")").concat(suffix, ")").concat(token.modifier);
          }
        } else {
          if (token.modifier === "+" || token.modifier === "*") {
            throw new TypeError('Can not repeat "'.concat(token.name, '" without a prefix and suffix'));
          }
          route += "(".concat(token.pattern, ")").concat(token.modifier);
        }
      } else {
        route += "(?:".concat(prefix).concat(suffix, ")").concat(token.modifier);
      }
    }
  }
  if (end) {
    if (!strict)
      route += "".concat(delimiterRe, "?");
    route += !options.endsWith ? "$" : "(?=".concat(endsWithRe, ")");
  } else {
    var endToken = tokens[tokens.length - 1];
    var isEndDelimited = typeof endToken === "string" ? delimiterRe.indexOf(endToken[endToken.length - 1]) > -1 : endToken === void 0;
    if (!strict) {
      route += "(?:".concat(delimiterRe, "(?=").concat(endsWithRe, "))?");
    }
    if (!isEndDelimited) {
      route += "(?=".concat(delimiterRe, "|").concat(endsWithRe, ")");
    }
  }
  return new RegExp(route, flags(options));
}
__name(tokensToRegexp, "tokensToRegexp");
function pathToRegexp(path, keys, options) {
  if (path instanceof RegExp)
    return regexpToRegexp(path, keys);
  if (Array.isArray(path))
    return arrayToRegexp(path, keys, options);
  return stringToRegexp(path, keys, options);
}
__name(pathToRegexp, "pathToRegexp");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/pages-template-worker.ts
var escapeRegex = /[.+?^${}()|[\]\\]/g;
function* executeRequest(request) {
  const requestPath = new URL(request.url).pathname;
  for (const route of [...routes].reverse()) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult) {
      for (const handler of route.middlewares.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: mountMatchResult.path
        };
      }
    }
  }
  for (const route of routes) {
    if (route.method && route.method !== request.method) {
      continue;
    }
    const routeMatcher = match(route.routePath.replace(escapeRegex, "\\$&"), {
      end: true
    });
    const mountMatcher = match(route.mountPath.replace(escapeRegex, "\\$&"), {
      end: false
    });
    const matchResult = routeMatcher(requestPath);
    const mountMatchResult = mountMatcher(requestPath);
    if (matchResult && mountMatchResult && route.modules.length) {
      for (const handler of route.modules.flat()) {
        yield {
          handler,
          params: matchResult.params,
          path: matchResult.path
        };
      }
      break;
    }
  }
}
__name(executeRequest, "executeRequest");
var pages_template_worker_default = {
  async fetch(originalRequest, env, workerContext) {
    let request = originalRequest;
    const handlerIterator = executeRequest(request);
    let data = {};
    let isFailOpen = false;
    const next = /* @__PURE__ */ __name(async (input, init) => {
      if (input !== void 0) {
        let url = input;
        if (typeof input === "string") {
          url = new URL(input, request.url).toString();
        }
        request = new Request(url, init);
      }
      const result = handlerIterator.next();
      if (result.done === false) {
        const { handler, params, path } = result.value;
        const context = {
          request: new Request(request.clone()),
          functionPath: path,
          next,
          params,
          get data() {
            return data;
          },
          set data(value) {
            if (typeof value !== "object" || value === null) {
              throw new Error("context.data must be an object");
            }
            data = value;
          },
          env,
          waitUntil: workerContext.waitUntil.bind(workerContext),
          passThroughOnException: /* @__PURE__ */ __name(() => {
            isFailOpen = true;
          }, "passThroughOnException")
        };
        const response = await handler(context);
        if (!(response instanceof Response)) {
          throw new Error("Your Pages function should return a Response");
        }
        return cloneResponse(response);
      } else if ("ASSETS") {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      } else {
        const response = await fetch(request);
        return cloneResponse(response);
      }
    }, "next");
    try {
      return await next();
    } catch (error) {
      if (isFailOpen) {
        const response = await env["ASSETS"].fetch(request);
        return cloneResponse(response);
      }
      throw error;
    }
  }
};
var cloneResponse = /* @__PURE__ */ __name((response) => (
  // https://fetch.spec.whatwg.org/#null-body-status
  new Response(
    [101, 204, 205, 304].includes(response.status) ? null : response.body,
    response
  )
), "cloneResponse");

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// ../.wrangler/tmp/bundle-h6UOXN/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = pages_template_worker_default;

// ../../../../../AppData/Roaming/npm/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// ../.wrangler/tmp/bundle-h6UOXN/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=functionsWorker-0.6118294027059741.mjs.map
