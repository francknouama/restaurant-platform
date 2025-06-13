var vr = Object.defineProperty;
var pr = (l, o, n) => o in l ? vr(l, o, { enumerable: !0, configurable: !0, writable: !0, value: n }) : l[o] = n;
var we = (l, o, n) => pr(l, typeof o != "symbol" ? o + "" : o, n);
import Te, { Component as gr, Suspense as mr } from "react";
var Z = { exports: {} }, I = {};
/**
 * @license React
 * react-jsx-runtime.production.min.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Ce;
function hr() {
  if (Ce) return I;
  Ce = 1;
  var l = Te, o = Symbol.for("react.element"), n = Symbol.for("react.fragment"), s = Object.prototype.hasOwnProperty, v = l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED.ReactCurrentOwner, h = { key: !0, ref: !0, __self: !0, __source: !0 };
  function y(x, p, C) {
    var b, E = {}, T = null, L = null;
    C !== void 0 && (T = "" + C), p.key !== void 0 && (T = "" + p.key), p.ref !== void 0 && (L = p.ref);
    for (b in p) s.call(p, b) && !h.hasOwnProperty(b) && (E[b] = p[b]);
    if (x && x.defaultProps) for (b in p = x.defaultProps, p) E[b] === void 0 && (E[b] = p[b]);
    return { $$typeof: o, type: x, key: T, ref: L, props: E, _owner: v.current };
  }
  return I.Fragment = n, I.jsx = y, I.jsxs = y, I;
}
var W = {};
/**
 * @license React
 * react-jsx-runtime.development.js
 *
 * Copyright (c) Facebook, Inc. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
var Se;
function yr() {
  return Se || (Se = 1, process.env.NODE_ENV !== "production" && function() {
    var l = Te, o = Symbol.for("react.element"), n = Symbol.for("react.portal"), s = Symbol.for("react.fragment"), v = Symbol.for("react.strict_mode"), h = Symbol.for("react.profiler"), y = Symbol.for("react.provider"), x = Symbol.for("react.context"), p = Symbol.for("react.forward_ref"), C = Symbol.for("react.suspense"), b = Symbol.for("react.suspense_list"), E = Symbol.for("react.memo"), T = Symbol.for("react.lazy"), L = Symbol.for("react.offscreen"), Q = Symbol.iterator, ke = "@@iterator";
    function Pe(e) {
      if (e === null || typeof e != "object")
        return null;
      var r = Q && e[Q] || e[ke];
      return typeof r == "function" ? r : null;
    }
    var P = l.__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED;
    function _(e) {
      {
        for (var r = arguments.length, t = new Array(r > 1 ? r - 1 : 0), a = 1; a < r; a++)
          t[a - 1] = arguments[a];
        Ne("error", e, t);
      }
    }
    function Ne(e, r, t) {
      {
        var a = P.ReactDebugCurrentFrame, f = a.getStackAddendum();
        f !== "" && (r += "%s", t = t.concat([f]));
        var d = t.map(function(c) {
          return String(c);
        });
        d.unshift("Warning: " + r), Function.prototype.apply.call(console[e], console, d);
      }
    }
    var De = !1, Fe = !1, Ae = !1, $e = !1, Ie = !1, ee;
    ee = Symbol.for("react.module.reference");
    function We(e) {
      return !!(typeof e == "string" || typeof e == "function" || e === s || e === h || Ie || e === v || e === C || e === b || $e || e === L || De || Fe || Ae || typeof e == "object" && e !== null && (e.$$typeof === T || e.$$typeof === E || e.$$typeof === y || e.$$typeof === x || e.$$typeof === p || // This needs to include all possible module reference object
      // types supported by any Flight configuration anywhere since
      // we don't know which Flight build this will end up being used
      // with.
      e.$$typeof === ee || e.getModuleId !== void 0));
    }
    function Le(e, r, t) {
      var a = e.displayName;
      if (a)
        return a;
      var f = r.displayName || r.name || "";
      return f !== "" ? t + "(" + f + ")" : t;
    }
    function re(e) {
      return e.displayName || "Context";
    }
    function S(e) {
      if (e == null)
        return null;
      if (typeof e.tag == "number" && _("Received an unexpected object in getComponentNameFromType(). This is likely a bug in React. Please file an issue."), typeof e == "function")
        return e.displayName || e.name || null;
      if (typeof e == "string")
        return e;
      switch (e) {
        case s:
          return "Fragment";
        case n:
          return "Portal";
        case h:
          return "Profiler";
        case v:
          return "StrictMode";
        case C:
          return "Suspense";
        case b:
          return "SuspenseList";
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case x:
            var r = e;
            return re(r) + ".Consumer";
          case y:
            var t = e;
            return re(t._context) + ".Provider";
          case p:
            return Le(e, e.render, "ForwardRef");
          case E:
            var a = e.displayName || null;
            return a !== null ? a : S(e.type) || "Memo";
          case T: {
            var f = e, d = f._payload, c = f._init;
            try {
              return S(c(d));
            } catch {
              return null;
            }
          }
        }
      return null;
    }
    var O = Object.assign, A = 0, te, ne, ae, se, oe, ie, le;
    function ue() {
    }
    ue.__reactDisabledLog = !0;
    function Be() {
      {
        if (A === 0) {
          te = console.log, ne = console.info, ae = console.warn, se = console.error, oe = console.group, ie = console.groupCollapsed, le = console.groupEnd;
          var e = {
            configurable: !0,
            enumerable: !0,
            value: ue,
            writable: !0
          };
          Object.defineProperties(console, {
            info: e,
            log: e,
            warn: e,
            error: e,
            group: e,
            groupCollapsed: e,
            groupEnd: e
          });
        }
        A++;
      }
    }
    function Ve() {
      {
        if (A--, A === 0) {
          var e = {
            configurable: !0,
            enumerable: !0,
            writable: !0
          };
          Object.defineProperties(console, {
            log: O({}, e, {
              value: te
            }),
            info: O({}, e, {
              value: ne
            }),
            warn: O({}, e, {
              value: ae
            }),
            error: O({}, e, {
              value: se
            }),
            group: O({}, e, {
              value: oe
            }),
            groupCollapsed: O({}, e, {
              value: ie
            }),
            groupEnd: O({}, e, {
              value: le
            })
          });
        }
        A < 0 && _("disabledDepth fell below zero. This is a bug in React. Please file an issue.");
      }
    }
    var U = P.ReactCurrentDispatcher, z;
    function B(e, r, t) {
      {
        if (z === void 0)
          try {
            throw Error();
          } catch (f) {
            var a = f.stack.trim().match(/\n( *(at )?)/);
            z = a && a[1] || "";
          }
        return `
` + z + e;
      }
    }
    var K = !1, V;
    {
      var Ye = typeof WeakMap == "function" ? WeakMap : Map;
      V = new Ye();
    }
    function ce(e, r) {
      if (!e || K)
        return "";
      {
        var t = V.get(e);
        if (t !== void 0)
          return t;
      }
      var a;
      K = !0;
      var f = Error.prepareStackTrace;
      Error.prepareStackTrace = void 0;
      var d;
      d = U.current, U.current = null, Be();
      try {
        if (r) {
          var c = function() {
            throw Error();
          };
          if (Object.defineProperty(c.prototype, "props", {
            set: function() {
              throw Error();
            }
          }), typeof Reflect == "object" && Reflect.construct) {
            try {
              Reflect.construct(c, []);
            } catch (j) {
              a = j;
            }
            Reflect.construct(e, [], c);
          } else {
            try {
              c.call();
            } catch (j) {
              a = j;
            }
            e.call(c.prototype);
          }
        } else {
          try {
            throw Error();
          } catch (j) {
            a = j;
          }
          e();
        }
      } catch (j) {
        if (j && a && typeof j.stack == "string") {
          for (var u = j.stack.split(`
`), R = a.stack.split(`
`), g = u.length - 1, m = R.length - 1; g >= 1 && m >= 0 && u[g] !== R[m]; )
            m--;
          for (; g >= 1 && m >= 0; g--, m--)
            if (u[g] !== R[m]) {
              if (g !== 1 || m !== 1)
                do
                  if (g--, m--, m < 0 || u[g] !== R[m]) {
                    var w = `
` + u[g].replace(" at new ", " at ");
                    return e.displayName && w.includes("<anonymous>") && (w = w.replace("<anonymous>", e.displayName)), typeof e == "function" && V.set(e, w), w;
                  }
                while (g >= 1 && m >= 0);
              break;
            }
        }
      } finally {
        K = !1, U.current = d, Ve(), Error.prepareStackTrace = f;
      }
      var D = e ? e.displayName || e.name : "", k = D ? B(D) : "";
      return typeof e == "function" && V.set(e, k), k;
    }
    function Me(e, r, t) {
      return ce(e, !1);
    }
    function Ue(e) {
      var r = e.prototype;
      return !!(r && r.isReactComponent);
    }
    function Y(e, r, t) {
      if (e == null)
        return "";
      if (typeof e == "function")
        return ce(e, Ue(e));
      if (typeof e == "string")
        return B(e);
      switch (e) {
        case C:
          return B("Suspense");
        case b:
          return B("SuspenseList");
      }
      if (typeof e == "object")
        switch (e.$$typeof) {
          case p:
            return Me(e.render);
          case E:
            return Y(e.type, r, t);
          case T: {
            var a = e, f = a._payload, d = a._init;
            try {
              return Y(d(f), r, t);
            } catch {
            }
          }
        }
      return "";
    }
    var $ = Object.prototype.hasOwnProperty, fe = {}, de = P.ReactDebugCurrentFrame;
    function M(e) {
      if (e) {
        var r = e._owner, t = Y(e.type, e._source, r ? r.type : null);
        de.setExtraStackFrame(t);
      } else
        de.setExtraStackFrame(null);
    }
    function ze(e, r, t, a, f) {
      {
        var d = Function.call.bind($);
        for (var c in e)
          if (d(e, c)) {
            var u = void 0;
            try {
              if (typeof e[c] != "function") {
                var R = Error((a || "React class") + ": " + t + " type `" + c + "` is invalid; it must be a function, usually from the `prop-types` package, but received `" + typeof e[c] + "`.This often happens because of typos such as `PropTypes.function` instead of `PropTypes.func`.");
                throw R.name = "Invariant Violation", R;
              }
              u = e[c](r, c, a, t, null, "SECRET_DO_NOT_PASS_THIS_OR_YOU_WILL_BE_FIRED");
            } catch (g) {
              u = g;
            }
            u && !(u instanceof Error) && (M(f), _("%s: type specification of %s `%s` is invalid; the type checker function must return `null` or an `Error` but returned a %s. You may have forgotten to pass an argument to the type checker creator (arrayOf, instanceOf, objectOf, oneOf, oneOfType, and shape all require an argument).", a || "React class", t, c, typeof u), M(null)), u instanceof Error && !(u.message in fe) && (fe[u.message] = !0, M(f), _("Failed %s type: %s", t, u.message), M(null));
          }
      }
    }
    var Ke = Array.isArray;
    function J(e) {
      return Ke(e);
    }
    function Je(e) {
      {
        var r = typeof Symbol == "function" && Symbol.toStringTag, t = r && e[Symbol.toStringTag] || e.constructor.name || "Object";
        return t;
      }
    }
    function qe(e) {
      try {
        return ve(e), !1;
      } catch {
        return !0;
      }
    }
    function ve(e) {
      return "" + e;
    }
    function pe(e) {
      if (qe(e))
        return _("The provided key is an unsupported type %s. This value must be coerced to a string before before using it here.", Je(e)), ve(e);
    }
    var ge = P.ReactCurrentOwner, Ge = {
      key: !0,
      ref: !0,
      __self: !0,
      __source: !0
    }, me, he;
    function He(e) {
      if ($.call(e, "ref")) {
        var r = Object.getOwnPropertyDescriptor(e, "ref").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.ref !== void 0;
    }
    function Xe(e) {
      if ($.call(e, "key")) {
        var r = Object.getOwnPropertyDescriptor(e, "key").get;
        if (r && r.isReactWarning)
          return !1;
      }
      return e.key !== void 0;
    }
    function Ze(e, r) {
      typeof e.ref == "string" && ge.current;
    }
    function Qe(e, r) {
      {
        var t = function() {
          me || (me = !0, _("%s: `key` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        t.isReactWarning = !0, Object.defineProperty(e, "key", {
          get: t,
          configurable: !0
        });
      }
    }
    function er(e, r) {
      {
        var t = function() {
          he || (he = !0, _("%s: `ref` is not a prop. Trying to access it will result in `undefined` being returned. If you need to access the same value within the child component, you should pass it as a different prop. (https://reactjs.org/link/special-props)", r));
        };
        t.isReactWarning = !0, Object.defineProperty(e, "ref", {
          get: t,
          configurable: !0
        });
      }
    }
    var rr = function(e, r, t, a, f, d, c) {
      var u = {
        // This tag allows us to uniquely identify this as a React Element
        $$typeof: o,
        // Built-in properties that belong on the element
        type: e,
        key: r,
        ref: t,
        props: c,
        // Record the component responsible for creating this element.
        _owner: d
      };
      return u._store = {}, Object.defineProperty(u._store, "validated", {
        configurable: !1,
        enumerable: !1,
        writable: !0,
        value: !1
      }), Object.defineProperty(u, "_self", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: a
      }), Object.defineProperty(u, "_source", {
        configurable: !1,
        enumerable: !1,
        writable: !1,
        value: f
      }), Object.freeze && (Object.freeze(u.props), Object.freeze(u)), u;
    };
    function tr(e, r, t, a, f) {
      {
        var d, c = {}, u = null, R = null;
        t !== void 0 && (pe(t), u = "" + t), Xe(r) && (pe(r.key), u = "" + r.key), He(r) && (R = r.ref, Ze(r, f));
        for (d in r)
          $.call(r, d) && !Ge.hasOwnProperty(d) && (c[d] = r[d]);
        if (e && e.defaultProps) {
          var g = e.defaultProps;
          for (d in g)
            c[d] === void 0 && (c[d] = g[d]);
        }
        if (u || R) {
          var m = typeof e == "function" ? e.displayName || e.name || "Unknown" : e;
          u && Qe(c, m), R && er(c, m);
        }
        return rr(e, u, R, f, a, ge.current, c);
      }
    }
    var q = P.ReactCurrentOwner, ye = P.ReactDebugCurrentFrame;
    function N(e) {
      if (e) {
        var r = e._owner, t = Y(e.type, e._source, r ? r.type : null);
        ye.setExtraStackFrame(t);
      } else
        ye.setExtraStackFrame(null);
    }
    var G;
    G = !1;
    function H(e) {
      return typeof e == "object" && e !== null && e.$$typeof === o;
    }
    function xe() {
      {
        if (q.current) {
          var e = S(q.current.type);
          if (e)
            return `

Check the render method of \`` + e + "`.";
        }
        return "";
      }
    }
    function nr(e) {
      return "";
    }
    var be = {};
    function ar(e) {
      {
        var r = xe();
        if (!r) {
          var t = typeof e == "string" ? e : e.displayName || e.name;
          t && (r = `

Check the top-level render call using <` + t + ">.");
        }
        return r;
      }
    }
    function Ee(e, r) {
      {
        if (!e._store || e._store.validated || e.key != null)
          return;
        e._store.validated = !0;
        var t = ar(r);
        if (be[t])
          return;
        be[t] = !0;
        var a = "";
        e && e._owner && e._owner !== q.current && (a = " It was passed a child from " + S(e._owner.type) + "."), N(e), _('Each child in a list should have a unique "key" prop.%s%s See https://reactjs.org/link/warning-keys for more information.', t, a), N(null);
      }
    }
    function _e(e, r) {
      {
        if (typeof e != "object")
          return;
        if (J(e))
          for (var t = 0; t < e.length; t++) {
            var a = e[t];
            H(a) && Ee(a, r);
          }
        else if (H(e))
          e._store && (e._store.validated = !0);
        else if (e) {
          var f = Pe(e);
          if (typeof f == "function" && f !== e.entries)
            for (var d = f.call(e), c; !(c = d.next()).done; )
              H(c.value) && Ee(c.value, r);
        }
      }
    }
    function sr(e) {
      {
        var r = e.type;
        if (r == null || typeof r == "string")
          return;
        var t;
        if (typeof r == "function")
          t = r.propTypes;
        else if (typeof r == "object" && (r.$$typeof === p || // Note: Memo only checks outer props here.
        // Inner props are checked in the reconciler.
        r.$$typeof === E))
          t = r.propTypes;
        else
          return;
        if (t) {
          var a = S(r);
          ze(t, e.props, "prop", a, e);
        } else if (r.PropTypes !== void 0 && !G) {
          G = !0;
          var f = S(r);
          _("Component %s declared `PropTypes` instead of `propTypes`. Did you misspell the property assignment?", f || "Unknown");
        }
        typeof r.getDefaultProps == "function" && !r.getDefaultProps.isReactClassApproved && _("getDefaultProps is only used on classic React.createClass definitions. Use a static property named `defaultProps` instead.");
      }
    }
    function or(e) {
      {
        for (var r = Object.keys(e.props), t = 0; t < r.length; t++) {
          var a = r[t];
          if (a !== "children" && a !== "key") {
            N(e), _("Invalid prop `%s` supplied to `React.Fragment`. React.Fragment can only have `key` and `children` props.", a), N(null);
            break;
          }
        }
        e.ref !== null && (N(e), _("Invalid attribute `ref` supplied to `React.Fragment`."), N(null));
      }
    }
    var Re = {};
    function je(e, r, t, a, f, d) {
      {
        var c = We(e);
        if (!c) {
          var u = "";
          (e === void 0 || typeof e == "object" && e !== null && Object.keys(e).length === 0) && (u += " You likely forgot to export your component from the file it's defined in, or you might have mixed up default and named imports.");
          var R = nr();
          R ? u += R : u += xe();
          var g;
          e === null ? g = "null" : J(e) ? g = "array" : e !== void 0 && e.$$typeof === o ? (g = "<" + (S(e.type) || "Unknown") + " />", u = " Did you accidentally export a JSX literal instead of a component?") : g = typeof e, _("React.jsx: type is invalid -- expected a string (for built-in components) or a class/function (for composite components) but got: %s.%s", g, u);
        }
        var m = tr(e, r, t, f, d);
        if (m == null)
          return m;
        if (c) {
          var w = r.children;
          if (w !== void 0)
            if (a)
              if (J(w)) {
                for (var D = 0; D < w.length; D++)
                  _e(w[D], e);
                Object.freeze && Object.freeze(w);
              } else
                _("React.jsx: Static children should always be an array. You are likely explicitly calling React.jsxs or React.jsxDEV. Use the Babel transform instead.");
            else
              _e(w, e);
        }
        if ($.call(r, "key")) {
          var k = S(e), j = Object.keys(r).filter(function(dr) {
            return dr !== "key";
          }), X = j.length > 0 ? "{key: someKey, " + j.join(": ..., ") + ": ...}" : "{key: someKey}";
          if (!Re[k + X]) {
            var fr = j.length > 0 ? "{" + j.join(": ..., ") + ": ...}" : "{}";
            _(`A props object containing a "key" prop is being spread into JSX:
  let props = %s;
  <%s {...props} />
React keys must be passed directly to JSX without using spread:
  let props = %s;
  <%s key={someKey} {...props} />`, X, k, fr, k), Re[k + X] = !0;
          }
        }
        return e === s ? or(m) : sr(m), m;
      }
    }
    function ir(e, r, t) {
      return je(e, r, t, !0);
    }
    function lr(e, r, t) {
      return je(e, r, t, !1);
    }
    var ur = lr, cr = ir;
    W.Fragment = s, W.jsx = ur, W.jsxs = cr;
  }()), W;
}
process.env.NODE_ENV === "production" ? Z.exports = hr() : Z.exports = yr();
var i = Z.exports;
function Oe(l) {
  var o, n, s = "";
  if (typeof l == "string" || typeof l == "number") s += l;
  else if (typeof l == "object") if (Array.isArray(l)) {
    var v = l.length;
    for (o = 0; o < v; o++) l[o] && (n = Oe(l[o])) && (s && (s += " "), s += n);
  } else for (n in l) l[n] && (s && (s += " "), s += n);
  return s;
}
function F() {
  for (var l, o, n = 0, s = "", v = arguments.length; n < v; n++) (l = arguments[n]) && (o = Oe(l)) && (s && (s += " "), s += o);
  return s;
}
const xr = ({
  variant: l = "primary",
  size: o = "md",
  loading: n = !1,
  disabled: s,
  className: v,
  children: h,
  ...y
}) => {
  const x = "inline-flex items-center justify-center font-medium rounded-lg transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed", p = {
    primary: "bg-orange-600 text-white hover:bg-orange-700 focus:ring-orange-500",
    secondary: "bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500",
    outline: "border border-gray-300 text-gray-700 bg-white hover:bg-gray-50 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
    success: "bg-green-600 text-white hover:bg-green-700 focus:ring-green-500"
  }, C = {
    xs: "px-2 py-1 text-xs",
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base"
  };
  return /* @__PURE__ */ i.jsxs(
    "button",
    {
      className: F(
        x,
        p[l],
        C[o],
        v
      ),
      disabled: s || n,
      ...y,
      children: [
        n && /* @__PURE__ */ i.jsxs(
          "svg",
          {
            className: "w-4 h-4 mr-2 animate-spin",
            xmlns: "http://www.w3.org/2000/svg",
            fill: "none",
            viewBox: "0 0 24 24",
            children: [
              /* @__PURE__ */ i.jsx(
                "circle",
                {
                  className: "opacity-25",
                  cx: "12",
                  cy: "12",
                  r: "10",
                  stroke: "currentColor",
                  strokeWidth: "4"
                }
              ),
              /* @__PURE__ */ i.jsx(
                "path",
                {
                  className: "opacity-75",
                  fill: "currentColor",
                  d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                }
              )
            ]
          }
        ),
        h
      ]
    }
  );
}, br = ({
  children: l,
  className: o,
  padding: n = "md",
  variant: s = "default"
}) => {
  const v = "bg-white rounded-lg", h = {
    default: "shadow",
    elevated: "shadow-lg",
    outlined: "border border-gray-200"
  }, y = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };
  return /* @__PURE__ */ i.jsx(
    "div",
    {
      className: F(
        v,
        h[s],
        y[n],
        o
      ),
      children: l
    }
  );
}, Er = ({
  size: l = "md",
  className: o,
  text: n
}) => {
  const s = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }, v = {
    sm: "text-sm",
    md: "text-base",
    lg: "text-lg",
    xl: "text-xl"
  };
  return /* @__PURE__ */ i.jsx("div", { className: F("flex items-center justify-center", o), children: /* @__PURE__ */ i.jsxs("div", { className: "flex flex-col items-center space-y-2", children: [
    /* @__PURE__ */ i.jsxs(
      "svg",
      {
        className: F(
          "animate-spin text-orange-600",
          s[l]
        ),
        xmlns: "http://www.w3.org/2000/svg",
        fill: "none",
        viewBox: "0 0 24 24",
        children: [
          /* @__PURE__ */ i.jsx(
            "circle",
            {
              className: "opacity-25",
              cx: "12",
              cy: "12",
              r: "10",
              stroke: "currentColor",
              strokeWidth: "4"
            }
          ),
          /* @__PURE__ */ i.jsx(
            "path",
            {
              className: "opacity-75",
              fill: "currentColor",
              d: "M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            }
          )
        ]
      }
    ),
    n && /* @__PURE__ */ i.jsx("p", { className: F(
      "text-gray-600 font-medium",
      v[l]
    ), children: n })
  ] }) });
}, Cr = ({
  status: l,
  variant: o = "default",
  size: n = "md",
  icon: s,
  children: v
}) => {
  const h = "inline-flex items-center font-medium rounded-full", y = {
    default: "bg-gray-100 text-gray-800",
    success: "bg-green-100 text-green-800",
    warning: "bg-yellow-100 text-yellow-800",
    danger: "bg-red-100 text-red-800",
    info: "bg-blue-100 text-blue-800",
    neutral: "bg-gray-100 text-gray-600"
  }, x = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base"
  }, C = o === "default" ? ((b) => {
    const E = b.toLowerCase();
    return ["active", "completed", "ready", "confirmed", "paid", "in_stock"].includes(E) ? "success" : ["preparing", "pending", "low_stock", "reorder_needed"].includes(E) ? "warning" : ["cancelled", "failed", "expired", "out_of_stock", "no_show"].includes(E) ? "danger" : ["created", "new", "info"].includes(E) ? "info" : ["inactive", "disabled"].includes(E) ? "neutral" : o;
  })(l) : o;
  return /* @__PURE__ */ i.jsxs(
    "span",
    {
      className: F(
        h,
        y[C],
        x[n]
      ),
      children: [
        s && /* @__PURE__ */ i.jsx("span", { className: "mr-1", children: s }),
        v
      ]
    }
  );
};
class _r extends gr {
  constructor(n) {
    super(n);
    we(this, "resetErrorBoundary", () => {
      this.setState((n) => ({
        hasError: !1,
        error: void 0,
        errorInfo: void 0,
        errorBoundaryKey: n.errorBoundaryKey + 1
      }));
    });
    this.state = {
      hasError: !1,
      errorBoundaryKey: 0
    };
  }
  static getDerivedStateFromError(n) {
    return {
      hasError: !0,
      error: n,
      errorBoundaryKey: 0
    };
  }
  componentDidCatch(n, s) {
    console.error(`Error caught by ErrorBoundary${this.props.mfeName ? ` in ${this.props.mfeName}` : ""}:`, n, s), this.props.onError && this.props.onError(n, s), this.setState({
      error: n,
      errorInfo: s
    });
  }
  componentDidUpdate(n) {
    const { resetKeys: s, resetOnPropsChange: v } = this.props, { hasError: h } = this.state;
    h && n.resetKeys !== s && s != null && s.some((y, x) => {
      var p;
      return y !== ((p = n.resetKeys) == null ? void 0 : p[x]);
    }) && this.resetErrorBoundary(), h && v && n.children !== this.props.children && this.resetErrorBoundary();
  }
  render() {
    var p;
    const { hasError: n, error: s } = this.state, { fallback: v, children: h, isolate: y, mfeName: x } = this.props;
    return n ? v ? /* @__PURE__ */ i.jsx(i.Fragment, { children: v }) : /* @__PURE__ */ i.jsx("div", { className: "min-h-[400px] flex items-center justify-center p-8", children: /* @__PURE__ */ i.jsx(br, { className: "max-w-2xl w-full", children: /* @__PURE__ */ i.jsxs("div", { className: "text-center space-y-4", children: [
      /* @__PURE__ */ i.jsx("div", { className: "inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4", children: /* @__PURE__ */ i.jsx("svg", { className: "w-8 h-8 text-red-600", fill: "none", stroke: "currentColor", viewBox: "0 0 24 24", children: /* @__PURE__ */ i.jsx("path", { strokeLinecap: "round", strokeLinejoin: "round", strokeWidth: 2, d: "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" }) }) }),
      /* @__PURE__ */ i.jsx("h2", { className: "text-2xl font-bold text-gray-900", children: y ? "Component Error" : "Application Error" }),
      x && /* @__PURE__ */ i.jsxs("p", { className: "text-sm text-gray-600", children: [
        "Error in: ",
        /* @__PURE__ */ i.jsx("span", { className: "font-semibold", children: x })
      ] }),
      /* @__PURE__ */ i.jsx("p", { className: "text-gray-600", children: y ? "This component encountered an error and cannot be displayed." : "We encountered an unexpected error. Please try again." }),
      process.env.NODE_ENV === "development" && s && /* @__PURE__ */ i.jsxs("details", { className: "mt-4 text-left", children: [
        /* @__PURE__ */ i.jsx("summary", { className: "cursor-pointer text-sm text-gray-500 hover:text-gray-700", children: "Error Details" }),
        /* @__PURE__ */ i.jsxs("pre", { className: "mt-2 text-xs bg-gray-100 p-4 rounded overflow-auto", children: [
          s.toString(),
          (p = this.state.errorInfo) == null ? void 0 : p.componentStack
        ] })
      ] }),
      /* @__PURE__ */ i.jsx("div", { className: "pt-4", children: /* @__PURE__ */ i.jsx(
        xr,
        {
          onClick: this.resetErrorBoundary,
          variant: "primary",
          children: "Try Again"
        }
      ) })
    ] }) }) }) : /* @__PURE__ */ i.jsx("div", { children: h }, this.state.errorBoundaryKey);
  }
}
const Rr = ({
  name: l,
  message: o,
  fullScreen: n = !1,
  className: s = ""
}) => {
  const v = n ? "fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50" : "flex items-center justify-center min-h-[200px] p-8", h = o || (l ? `Loading ${l}...` : "Loading...");
  return /* @__PURE__ */ i.jsx("div", { className: `${v} ${s}`, children: /* @__PURE__ */ i.jsxs("div", { className: "text-center space-y-4", children: [
    /* @__PURE__ */ i.jsx(Er, { size: "lg" }),
    /* @__PURE__ */ i.jsx("p", { className: "text-gray-600 font-medium", children: h })
  ] }) });
}, Sr = ({
  children: l,
  name: o,
  loadingFallback: n,
  errorFallback: s,
  onError: v,
  className: h
}) => /* @__PURE__ */ i.jsx(
  _r,
  {
    mfeName: o,
    fallback: s,
    onError: v,
    isolate: !0,
    children: /* @__PURE__ */ i.jsx(mr, { fallback: n || /* @__PURE__ */ i.jsx(Rr, { name: o }), children: /* @__PURE__ */ i.jsx("div", { className: h, "data-mfe": o, children: l }) })
  }
);
export {
  xr as Button,
  br as Card,
  _r as ErrorBoundary,
  Rr as LoadingFallback,
  Er as LoadingSpinner,
  Sr as MfeContainer,
  Cr as StatusBadge
};
