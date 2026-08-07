(function() {
  "use strict";
  const DEFAULT_API_BASE_URL = "https://api.deepseek.com/v1";
  const DEFAULT_MODEL = "deepseek-chat";
  const TRANSLATION_TEMPERATURE = 0.3;
  const MAX_TOKENS = 4096;
  const REQUEST_TIMEOUT_MS = 1e4;
  const MAX_RETRIES = 3;
  const RETRY_BASE_DELAY_MS = 1e3;
  const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1e3;
  const TRANSLATION_SEPARATOR = "|||";
  const TRANSLATION_SYSTEM_PROMPT = `技术文档英译中。规则：1.信达雅；2.保留原样：代码/变量/URL/命令/React/Vue/API/DOM,CSS,HTML,HTTP,JSON,TS,JS,Python,Docker,CI/CD等术语；3.只译自然语言与注释；4.【强制】{{TAG_N}}占位符(链接或代码)原样保留不译。输出：UNIT_ID|||译文`;
  var commonjsGlobal = typeof globalThis !== "undefined" ? globalThis : typeof window !== "undefined" ? window : typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : {};
  function getDefaultExportFromCjs(x) {
    return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, "default") ? x["default"] : x;
  }
  var dexie_min = { exports: {} };
  (function(module, exports) {
    ((e, t) => {
      module.exports = t();
    })(commonjsGlobal, function() {
      var B = function(e2, t2) {
        return (B = Object.setPrototypeOf || ({ __proto__: [] } instanceof Array ? function(e3, t3) {
          e3.__proto__ = t3;
        } : function(e3, t3) {
          for (var n2 in t3) Object.prototype.hasOwnProperty.call(t3, n2) && (e3[n2] = t3[n2]);
        }))(e2, t2);
      };
      var _ = function() {
        return (_ = Object.assign || function(e2) {
          for (var t2, n2 = 1, r2 = arguments.length; n2 < r2; n2++) for (var i2 in t2 = arguments[n2]) Object.prototype.hasOwnProperty.call(t2, i2) && (e2[i2] = t2[i2]);
          return e2;
        }).apply(this, arguments);
      };
      function R(e2, t2, n2) {
        for (var r2, i2 = 0, o2 = t2.length; i2 < o2; i2++) !r2 && i2 in t2 || ((r2 = r2 || Array.prototype.slice.call(t2, 0, i2))[i2] = t2[i2]);
        return e2.concat(r2 || Array.prototype.slice.call(t2));
      }
      var f = "undefined" != typeof globalThis ? globalThis : "undefined" != typeof self ? self : "undefined" != typeof window ? window : commonjsGlobal, O = Object.keys, x = Array.isArray;
      function a(t2, n2) {
        return "object" == typeof n2 && O(n2).forEach(function(e2) {
          t2[e2] = n2[e2];
        }), t2;
      }
      "undefined" == typeof Promise || f.Promise || (f.Promise = Promise);
      var F = Object.getPrototypeOf, N = {}.hasOwnProperty;
      function m(e2, t2) {
        return N.call(e2, t2);
      }
      function M(t2, n2) {
        "function" == typeof n2 && (n2 = n2(F(t2))), ("undefined" == typeof Reflect ? O : Reflect.ownKeys)(n2).forEach(function(e2) {
          u(t2, e2, n2[e2]);
        });
      }
      var L = Object.defineProperty;
      function u(e2, t2, n2, r2) {
        L(e2, t2, a(n2 && m(n2, "get") && "function" == typeof n2.get ? { get: n2.get, set: n2.set, configurable: true } : { value: n2, configurable: true, writable: true }, r2));
      }
      function U(t2) {
        return { from: function(e2) {
          return t2.prototype = Object.create(e2.prototype), u(t2.prototype, "constructor", t2), { extend: M.bind(null, t2.prototype) };
        } };
      }
      var z = Object.getOwnPropertyDescriptor;
      var V = [].slice;
      function W(e2, t2, n2) {
        return V.call(e2, t2, n2);
      }
      function Y(e2, t2) {
        return t2(e2);
      }
      function $(e2) {
        if (!e2) throw new Error("Assertion Failed");
      }
      function Q(e2) {
        f.setImmediate ? setImmediate(e2) : setTimeout(e2, 0);
      }
      function c(e2, t2) {
        if ("string" == typeof t2 && m(e2, t2)) return e2[t2];
        if (!t2) return e2;
        if ("string" != typeof t2) {
          for (var n2 = [], r2 = 0, i2 = t2.length; r2 < i2; ++r2) {
            var o2 = c(e2, t2[r2]);
            n2.push(o2);
          }
          return n2;
        }
        var a2, u2 = t2.indexOf(".");
        return -1 === u2 || null == (a2 = e2[t2.substr(0, u2)]) ? void 0 : c(a2, t2.substr(u2 + 1));
      }
      function b(e2, t2, n2) {
        if (e2 && void 0 !== t2 && !("isFrozen" in Object && Object.isFrozen(e2))) if ("string" != typeof t2 && "length" in t2) {
          $("string" != typeof n2 && "length" in n2);
          for (var r2 = 0, i2 = t2.length; r2 < i2; ++r2) b(e2, t2[r2], n2[r2]);
        } else {
          var o2 = t2.indexOf(".");
          if (-1 !== o2) {
            var a2 = t2.substr(0, o2), o2 = t2.substr(o2 + 1);
            if ("" === o2) void 0 === n2 ? x(e2) && !isNaN(parseInt(a2)) ? e2.splice(a2, 1) : delete e2[a2] : e2[a2] = n2;
            else {
              var u2 = e2[a2];
              if (!u2 || !m(e2, a2)) {
                if (void 0 === n2) return;
                u2 = e2[a2] = {};
              }
              b(u2, o2, n2);
            }
          } else void 0 === n2 ? x(e2) && !isNaN(parseInt(t2)) ? e2.splice(t2, 1) : delete e2[t2] : e2[t2] = n2;
        }
      }
      function G(e2) {
        var t2, n2 = {};
        for (t2 in e2) m(e2, t2) && (n2[t2] = e2[t2]);
        return n2;
      }
      var X = [].concat;
      function H(e2) {
        return X.apply([], e2);
      }
      var e = "BigUint64Array,BigInt64Array,Array,Boolean,String,Date,RegExp,Blob,File,FileList,FileSystemFileHandle,FileSystemDirectoryHandle,ArrayBuffer,DataView,Uint8ClampedArray,ImageBitmap,ImageData,Map,Set,CryptoKey".split(",").concat(H([8, 16, 32, 64].map(function(t2) {
        return ["Int", "Uint", "Float"].map(function(e2) {
          return e2 + t2 + "Array";
        });
      }))).filter(function(e2) {
        return f[e2];
      }), J = new Set(e.map(function(e2) {
        return f[e2];
      }));
      var Z = null;
      function ee(e2) {
        Z = /* @__PURE__ */ new WeakMap();
        e2 = function e3(t2) {
          if (!t2 || "object" != typeof t2) return t2;
          var n2 = Z.get(t2);
          if (n2) return n2;
          if (x(t2)) {
            n2 = [], Z.set(t2, n2);
            for (var r2 = 0, i2 = t2.length; r2 < i2; ++r2) n2.push(e3(t2[r2]));
          } else if (J.has(t2.constructor)) n2 = t2;
          else {
            var o2, a2 = F(t2);
            for (o2 in n2 = a2 === Object.prototype ? {} : Object.create(a2), Z.set(t2, n2), t2) m(t2, o2) && (n2[o2] = e3(t2[o2]));
          }
          return n2;
        }(e2);
        return Z = null, e2;
      }
      var te = {}.toString;
      function ne(e2) {
        return te.call(e2).slice(8, -1);
      }
      var re = "undefined" != typeof Symbol ? Symbol.iterator : "@@iterator", ie = "symbol" == typeof re ? function(e2) {
        var t2;
        return null != e2 && (t2 = e2[re]) && t2.apply(e2);
      } : function() {
        return null;
      };
      function oe(e2, t2) {
        t2 = e2.indexOf(t2);
        0 <= t2 && e2.splice(t2, 1);
      }
      var ae = {};
      function n(e2) {
        var t2, n2, r2, i2;
        if (1 === arguments.length) {
          if (x(e2)) return e2.slice();
          if (this === ae && "string" == typeof e2) return [e2];
          if (i2 = ie(e2)) for (n2 = []; !(r2 = i2.next()).done; ) n2.push(r2.value);
          else {
            if (null == e2) return [e2];
            if ("number" != typeof (t2 = e2.length)) return [e2];
            for (n2 = new Array(t2); t2--; ) n2[t2] = e2[t2];
          }
        } else for (t2 = arguments.length, n2 = new Array(t2); t2--; ) n2[t2] = arguments[t2];
        return n2;
      }
      var ue = "undefined" != typeof Symbol ? function(e2) {
        return "AsyncFunction" === e2[Symbol.toStringTag];
      } : function() {
        return false;
      }, e = ["Unknown", "Constraint", "Data", "TransactionInactive", "ReadOnly", "Version", "NotFound", "InvalidState", "InvalidAccess", "Abort", "Timeout", "QuotaExceeded", "Syntax", "DataClone"], t = ["Modify", "Bulk", "OpenFailed", "VersionChange", "Schema", "Upgrade", "InvalidTable", "MissingAPI", "NoSuchDatabase", "InvalidArgument", "SubTransaction", "Unsupported", "Internal", "DatabaseClosed", "PrematureCommit", "ForeignAwait"].concat(e), se = { VersionChanged: "Database version changed by other database connection", DatabaseClosed: "Database has been closed", Abort: "Transaction aborted", TransactionInactive: "Transaction has already completed or failed", MissingAPI: "IndexedDB API missing. Please visit https://tinyurl.com/y2uuvskb" };
      function ce(e2, t2) {
        this.name = e2, this.message = t2;
      }
      function le(e2, t2) {
        return e2 + ". Errors: " + Object.keys(t2).map(function(e3) {
          return t2[e3].toString();
        }).filter(function(e3, t3, n2) {
          return n2.indexOf(e3) === t3;
        }).join("\n");
      }
      function fe(e2, t2, n2, r2) {
        this.failures = t2, this.failedKeys = r2, this.successCount = n2, this.message = le(e2, t2);
      }
      function he(e2, t2) {
        this.name = "BulkError", this.failures = Object.keys(t2).map(function(e3) {
          return t2[e3];
        }), this.failuresByPos = t2, this.message = le(e2, this.failures);
      }
      U(ce).from(Error).extend({ toString: function() {
        return this.name + ": " + this.message;
      } }), U(fe).from(ce), U(he).from(ce);
      var de = t.reduce(function(e2, t2) {
        return e2[t2] = t2 + "Error", e2;
      }, {}), pe = ce, k = t.reduce(function(e2, n2) {
        var r2 = n2 + "Error";
        function t2(e3, t3) {
          this.name = r2, e3 ? "string" == typeof e3 ? (this.message = "".concat(e3).concat(t3 ? "\n " + t3 : ""), this.inner = t3 || null) : "object" == typeof e3 && (this.message = "".concat(e3.name, " ").concat(e3.message), this.inner = e3) : (this.message = se[n2] || r2, this.inner = null);
        }
        return U(t2).from(pe), e2[n2] = t2, e2;
      }, {}), ye = (k.Syntax = SyntaxError, k.Type = TypeError, k.Range = RangeError, e.reduce(function(e2, t2) {
        return e2[t2 + "Error"] = k[t2], e2;
      }, {}));
      e = t.reduce(function(e2, t2) {
        return -1 === ["Syntax", "Type", "Range"].indexOf(t2) && (e2[t2 + "Error"] = k[t2]), e2;
      }, {});
      function g() {
      }
      function ve(e2) {
        return e2;
      }
      function me(t2, n2) {
        return null == t2 || t2 === ve ? n2 : function(e2) {
          return n2(t2(e2));
        };
      }
      function be(e2, t2) {
        return function() {
          e2.apply(this, arguments), t2.apply(this, arguments);
        };
      }
      function ge(i2, o2) {
        return i2 === g ? o2 : function() {
          var e2 = i2.apply(this, arguments), t2 = (void 0 !== e2 && (arguments[0] = e2), this.onsuccess), n2 = this.onerror, r2 = (this.onsuccess = null, this.onerror = null, o2.apply(this, arguments));
          return t2 && (this.onsuccess = this.onsuccess ? be(t2, this.onsuccess) : t2), n2 && (this.onerror = this.onerror ? be(n2, this.onerror) : n2), void 0 !== r2 ? r2 : e2;
        };
      }
      function we(n2, r2) {
        return n2 === g ? r2 : function() {
          n2.apply(this, arguments);
          var e2 = this.onsuccess, t2 = this.onerror;
          this.onsuccess = this.onerror = null, r2.apply(this, arguments), e2 && (this.onsuccess = this.onsuccess ? be(e2, this.onsuccess) : e2), t2 && (this.onerror = this.onerror ? be(t2, this.onerror) : t2);
        };
      }
      function _e(i2, o2) {
        return i2 === g ? o2 : function(e2) {
          var t2 = i2.apply(this, arguments), e2 = (a(e2, t2), this.onsuccess), n2 = this.onerror, r2 = (this.onsuccess = null, this.onerror = null, o2.apply(this, arguments));
          return e2 && (this.onsuccess = this.onsuccess ? be(e2, this.onsuccess) : e2), n2 && (this.onerror = this.onerror ? be(n2, this.onerror) : n2), void 0 === t2 ? void 0 === r2 ? void 0 : r2 : a(t2, r2);
        };
      }
      function xe(e2, t2) {
        return e2 === g ? t2 : function() {
          return false !== t2.apply(this, arguments) && e2.apply(this, arguments);
        };
      }
      function ke(i2, o2) {
        return i2 === g ? o2 : function() {
          var e2 = i2.apply(this, arguments);
          if (e2 && "function" == typeof e2.then) {
            for (var t2 = this, n2 = arguments.length, r2 = new Array(n2); n2--; ) r2[n2] = arguments[n2];
            return e2.then(function() {
              return o2.apply(t2, r2);
            });
          }
          return o2.apply(this, arguments);
        };
      }
      e.ModifyError = fe, e.DexieError = ce, e.BulkError = he;
      var l = "undefined" != typeof location && /^(http|https):\/\/(localhost|127\.0\.0\.1)/.test(location.href);
      function Oe(e2) {
        l = e2;
      }
      var Pe = {}, Ke = 100, Ee = "undefined" == typeof Promise ? [] : (t = Promise.resolve(), "undefined" != typeof crypto && crypto.subtle ? [Ee = crypto.subtle.digest("SHA-512", new Uint8Array([0])), F(Ee), t] : [t, F(t), t]), t = Ee[0], Se = Ee[1], Se = Se && Se.then, Ae = t && t.constructor, Ce = !!Ee[2];
      var je = function(e2, t2) {
        Re.push([e2, t2]), Ie && (queueMicrotask(Ye), Ie = false);
      }, Te = true, Ie = true, qe = [], De = [], Be = ve, s = { id: "global", global: true, ref: 0, unhandleds: [], onunhandled: g, pgp: false, env: {}, finalize: g }, P = s, Re = [], Fe = 0, Ne = [];
      function K(e2) {
        if ("object" != typeof this) throw new TypeError("Promises must be constructed via new");
        this._listeners = [], this._lib = false;
        var t2 = this._PSD = P;
        if ("function" != typeof e2) {
          if (e2 !== Pe) throw new TypeError("Not a function");
          this._state = arguments[1], this._value = arguments[2], false === this._state && Ue(this, this._value);
        } else this._state = null, this._value = null, ++t2.ref, function t3(r2, e3) {
          try {
            e3(function(n2) {
              if (null === r2._state) {
                if (n2 === r2) throw new TypeError("A promise cannot be resolved with itself.");
                var e4 = r2._lib && $e();
                n2 && "function" == typeof n2.then ? t3(r2, function(e5, t4) {
                  n2 instanceof K ? n2._then(e5, t4) : n2.then(e5, t4);
                }) : (r2._state = true, r2._value = n2, ze(r2)), e4 && Qe();
              }
            }, Ue.bind(null, r2));
          } catch (e4) {
            Ue(r2, e4);
          }
        }(this, e2);
      }
      var Me = { get: function() {
        var u2 = P, t2 = et;
        function e2(n2, r2) {
          var i2 = this, o2 = !u2.global && (u2 !== P || t2 !== et), a2 = o2 && !w(), e3 = new K(function(e4, t3) {
            Ve(i2, new Le(ut(n2, u2, o2, a2), ut(r2, u2, o2, a2), e4, t3, u2));
          });
          return this._consoleTask && (e3._consoleTask = this._consoleTask), e3;
        }
        return e2.prototype = Pe, e2;
      }, set: function(e2) {
        u(this, "then", e2 && e2.prototype === Pe ? Me : { get: function() {
          return e2;
        }, set: Me.set });
      } };
      function Le(e2, t2, n2, r2, i2) {
        this.onFulfilled = "function" == typeof e2 ? e2 : null, this.onRejected = "function" == typeof t2 ? t2 : null, this.resolve = n2, this.reject = r2, this.psd = i2;
      }
      function Ue(e2, t2) {
        var n2, r2;
        De.push(t2), null === e2._state && (n2 = e2._lib && $e(), t2 = Be(t2), e2._state = false, e2._value = t2, r2 = e2, qe.some(function(e3) {
          return e3._value === r2._value;
        }) || qe.push(r2), ze(e2), n2) && Qe();
      }
      function ze(e2) {
        var t2 = e2._listeners;
        e2._listeners = [];
        for (var n2 = 0, r2 = t2.length; n2 < r2; ++n2) Ve(e2, t2[n2]);
        var i2 = e2._PSD;
        --i2.ref || i2.finalize(), 0 === Fe && (++Fe, je(function() {
          0 == --Fe && Ge();
        }, []));
      }
      function Ve(e2, t2) {
        if (null === e2._state) e2._listeners.push(t2);
        else {
          var n2 = e2._state ? t2.onFulfilled : t2.onRejected;
          if (null === n2) return (e2._state ? t2.resolve : t2.reject)(e2._value);
          ++t2.psd.ref, ++Fe, je(We, [n2, e2, t2]);
        }
      }
      function We(e2, t2, n2) {
        try {
          var r2, i2 = t2._value;
          !t2._state && De.length && (De = []), r2 = l && t2._consoleTask ? t2._consoleTask.run(function() {
            return e2(i2);
          }) : e2(i2), t2._state || -1 !== De.indexOf(i2) || ((e3) => {
            for (var t3 = qe.length; t3; ) if (qe[--t3]._value === e3._value) return qe.splice(t3, 1);
          })(t2), n2.resolve(r2);
        } catch (e3) {
          n2.reject(e3);
        } finally {
          0 == --Fe && Ge(), --n2.psd.ref || n2.psd.finalize();
        }
      }
      function Ye() {
        at(s, function() {
          $e() && Qe();
        });
      }
      function $e() {
        var e2 = Te;
        return Ie = Te = false, e2;
      }
      function Qe() {
        var e2, t2, n2;
        do {
          for (; 0 < Re.length; ) for (e2 = Re, Re = [], n2 = e2.length, t2 = 0; t2 < n2; ++t2) {
            var r2 = e2[t2];
            r2[0].apply(null, r2[1]);
          }
        } while (0 < Re.length);
        Ie = Te = true;
      }
      function Ge() {
        for (var e2 = qe, t2 = (qe = [], e2.forEach(function(e3) {
          e3._PSD.onunhandled.call(null, e3._value, e3);
        }), Ne.slice(0)), n2 = t2.length; n2; ) t2[--n2]();
      }
      function Xe(e2) {
        return new K(Pe, false, e2);
      }
      function E(n2, r2) {
        var i2 = P;
        return function() {
          var e2 = $e(), t2 = P;
          try {
            return h(i2, true), n2.apply(this, arguments);
          } catch (e3) {
            r2 && r2(e3);
          } finally {
            h(t2, false), e2 && Qe();
          }
        };
      }
      M(K.prototype, { then: Me, _then: function(e2, t2) {
        Ve(this, new Le(null, null, e2, t2, P));
      }, catch: function(e2) {
        var t2, n2;
        return 1 === arguments.length ? this.then(null, e2) : (t2 = e2, n2 = arguments[1], "function" == typeof t2 ? this.then(null, function(e3) {
          return (e3 instanceof t2 ? n2 : Xe)(e3);
        }) : this.then(null, function(e3) {
          return (e3 && e3.name === t2 ? n2 : Xe)(e3);
        }));
      }, finally: function(t2) {
        return this.then(function(e2) {
          return K.resolve(t2()).then(function() {
            return e2;
          });
        }, function(e2) {
          return K.resolve(t2()).then(function() {
            return Xe(e2);
          });
        });
      }, timeout: function(r2, i2) {
        var o2 = this;
        return r2 < 1 / 0 ? new K(function(e2, t2) {
          var n2 = setTimeout(function() {
            return t2(new k.Timeout(i2));
          }, r2);
          o2.then(e2, t2).finally(clearTimeout.bind(null, n2));
        }) : this;
      } }), "undefined" != typeof Symbol && Symbol.toStringTag && u(K.prototype, Symbol.toStringTag, "Dexie.Promise"), s.env = ot(), M(K, { all: function() {
        var o2 = n.apply(null, arguments).map(rt);
        return new K(function(n2, r2) {
          0 === o2.length && n2([]);
          var i2 = o2.length;
          o2.forEach(function(e2, t2) {
            return K.resolve(e2).then(function(e3) {
              o2[t2] = e3, --i2 || n2(o2);
            }, r2);
          });
        });
      }, resolve: function(n2) {
        return n2 instanceof K ? n2 : n2 && "function" == typeof n2.then ? new K(function(e2, t2) {
          n2.then(e2, t2);
        }) : new K(Pe, true, n2);
      }, reject: Xe, race: function() {
        var e2 = n.apply(null, arguments).map(rt);
        return new K(function(t2, n2) {
          e2.map(function(e3) {
            return K.resolve(e3).then(t2, n2);
          });
        });
      }, PSD: { get: function() {
        return P;
      }, set: function(e2) {
        return P = e2;
      } }, totalEchoes: { get: function() {
        return et;
      } }, newPSD: v, usePSD: at, scheduler: { get: function() {
        return je;
      }, set: function(e2) {
        je = e2;
      } }, rejectionMapper: { get: function() {
        return Be;
      }, set: function(e2) {
        Be = e2;
      } }, follow: function(i2, n2) {
        return new K(function(e2, t2) {
          return v(function(n3, r2) {
            var e3 = P;
            e3.unhandleds = [], e3.onunhandled = r2, e3.finalize = be(function() {
              var t3, e4 = this;
              t3 = function() {
                0 === e4.unhandleds.length ? n3() : r2(e4.unhandleds[0]);
              }, Ne.push(function e5() {
                t3(), Ne.splice(Ne.indexOf(e5), 1);
              }), ++Fe, je(function() {
                0 == --Fe && Ge();
              }, []);
            }, e3.finalize), i2();
          }, n2, e2, t2);
        });
      } }), Ae && (Ae.allSettled && u(K, "allSettled", function() {
        var e2 = n.apply(null, arguments).map(rt);
        return new K(function(n2) {
          0 === e2.length && n2([]);
          var r2 = e2.length, i2 = new Array(r2);
          e2.forEach(function(e3, t2) {
            return K.resolve(e3).then(function(e4) {
              return i2[t2] = { status: "fulfilled", value: e4 };
            }, function(e4) {
              return i2[t2] = { status: "rejected", reason: e4 };
            }).then(function() {
              return --r2 || n2(i2);
            });
          });
        });
      }), Ae.any && "undefined" != typeof AggregateError && u(K, "any", function() {
        var e2 = n.apply(null, arguments).map(rt);
        return new K(function(n2, r2) {
          0 === e2.length && r2(new AggregateError([]));
          var i2 = e2.length, o2 = new Array(i2);
          e2.forEach(function(e3, t2) {
            return K.resolve(e3).then(function(e4) {
              return n2(e4);
            }, function(e4) {
              o2[t2] = e4, --i2 || r2(new AggregateError(o2));
            });
          });
        });
      }), Ae.withResolvers) && (K.withResolvers = Ae.withResolvers);
      var o = { awaits: 0, echoes: 0, id: 0 }, He = 0, Je = [], Ze = 0, et = 0, tt = 0;
      function v(e2, t2, n2, r2) {
        var i2 = P, o2 = Object.create(i2), t2 = (o2.parent = i2, o2.ref = 0, o2.global = false, o2.id = ++tt, s.env, o2.env = Ce ? { Promise: K, PromiseProp: { value: K, configurable: true, writable: true }, all: K.all, race: K.race, allSettled: K.allSettled, any: K.any, resolve: K.resolve, reject: K.reject } : {}, t2 && a(o2, t2), ++i2.ref, o2.finalize = function() {
          --this.parent.ref || this.parent.finalize();
        }, at(o2, e2, n2, r2));
        return 0 === o2.ref && o2.finalize(), t2;
      }
      function nt() {
        return o.id || (o.id = ++He), ++o.awaits, o.echoes += Ke, o.id;
      }
      function w() {
        return !!o.awaits && (0 == --o.awaits && (o.id = 0), o.echoes = o.awaits * Ke, true);
      }
      function rt(e2) {
        return o.echoes && e2 && e2.constructor === Ae ? (nt(), e2.then(function(e3) {
          return w(), e3;
        }, function(e3) {
          return w(), S(e3);
        })) : e2;
      }
      function it() {
        var e2 = Je[Je.length - 1];
        Je.pop(), h(e2, false);
      }
      function h(e2, t2) {
        var n2, r2, i2 = P;
        (t2 ? !o.echoes || Ze++ && e2 === P : !Ze || --Ze && e2 === P) || queueMicrotask(t2 ? (function(e3) {
          ++et, o.echoes && 0 != --o.echoes || (o.echoes = o.awaits = o.id = 0), Je.push(P), h(e3, true);
        }).bind(null, e2) : it), e2 !== P && (P = e2, i2 === s && (s.env = ot()), Ce) && (n2 = s.env.Promise, r2 = e2.env, i2.global || e2.global) && (Object.defineProperty(f, "Promise", r2.PromiseProp), n2.all = r2.all, n2.race = r2.race, n2.resolve = r2.resolve, n2.reject = r2.reject, r2.allSettled && (n2.allSettled = r2.allSettled), r2.any) && (n2.any = r2.any);
      }
      function ot() {
        var e2 = f.Promise;
        return Ce ? { Promise: e2, PromiseProp: Object.getOwnPropertyDescriptor(f, "Promise"), all: e2.all, race: e2.race, allSettled: e2.allSettled, any: e2.any, resolve: e2.resolve, reject: e2.reject } : {};
      }
      function at(e2, t2, n2, r2, i2) {
        var o2 = P;
        try {
          return h(e2, true), t2(n2, r2, i2);
        } finally {
          h(o2, false);
        }
      }
      function ut(t2, n2, r2, i2) {
        return "function" != typeof t2 ? t2 : function() {
          var e2 = P;
          r2 && nt(), h(n2, true);
          try {
            return t2.apply(this, arguments);
          } finally {
            h(e2, false), i2 && queueMicrotask(w);
          }
        };
      }
      function st(e2) {
        Promise === Ae && 0 === o.echoes ? 0 === Ze ? e2() : enqueueNativeMicroTask(e2) : setTimeout(e2, 0);
      }
      -1 === ("" + Se).indexOf("[native code]") && (nt = w = g);
      var S = K.reject;
      var ct = String.fromCharCode(65535), A = "Invalid key provided. Keys must be of type string, number, Date or Array<string | number | Date>.", lt = "String expected.", ft = "__dbnames", ht = "readonly", dt = "readwrite";
      function pt(e2, t2) {
        return e2 ? t2 ? function() {
          return e2.apply(this, arguments) && t2.apply(this, arguments);
        } : e2 : t2;
      }
      var yt = { type: 3, lower: -1 / 0, lowerOpen: false, upper: [[]], upperOpen: false };
      function vt(t2) {
        return "string" != typeof t2 || /\./.test(t2) ? function(e2) {
          return e2;
        } : function(e2) {
          return void 0 === e2[t2] && t2 in e2 && delete (e2 = ee(e2))[t2], e2;
        };
      }
      function mt() {
        throw k.Type("Entity instances must never be new:ed. Instances are generated by the framework bypassing the constructor.");
      }
      function C(e2, t2) {
        try {
          var n2 = bt(e2), r2 = bt(t2);
          if (n2 !== r2) return "Array" === n2 ? 1 : "Array" === r2 ? -1 : "binary" === n2 ? 1 : "binary" === r2 ? -1 : "string" === n2 ? 1 : "string" === r2 ? -1 : "Date" === n2 ? 1 : "Date" !== r2 ? NaN : -1;
          switch (n2) {
            case "number":
            case "Date":
            case "string":
              return t2 < e2 ? 1 : e2 < t2 ? -1 : 0;
            case "binary":
              for (var i2 = gt(e2), o2 = gt(t2), a2 = i2.length, u2 = o2.length, s2 = a2 < u2 ? a2 : u2, c2 = 0; c2 < s2; ++c2) if (i2[c2] !== o2[c2]) return i2[c2] < o2[c2] ? -1 : 1;
              return a2 === u2 ? 0 : a2 < u2 ? -1 : 1;
            case "Array":
              for (var l2 = e2, f2 = t2, h2 = l2.length, d2 = f2.length, p2 = h2 < d2 ? h2 : d2, y2 = 0; y2 < p2; ++y2) {
                var v2 = C(l2[y2], f2[y2]);
                if (0 !== v2) return v2;
              }
              return h2 === d2 ? 0 : h2 < d2 ? -1 : 1;
          }
        } catch (e3) {
        }
        return NaN;
      }
      function bt(e2) {
        var t2 = typeof e2;
        return "object" == t2 && (ArrayBuffer.isView(e2) || "ArrayBuffer" === (t2 = ne(e2))) ? "binary" : t2;
      }
      function gt(e2) {
        return e2 instanceof Uint8Array ? e2 : ArrayBuffer.isView(e2) ? new Uint8Array(e2.buffer, e2.byteOffset, e2.byteLength) : new Uint8Array(e2);
      }
      function wt(t2, n2, r2) {
        var e2 = t2.schema.yProps;
        return e2 ? (n2 && 0 < r2.numFailures && (n2 = n2.filter(function(e3, t3) {
          return !r2.failures[t3];
        })), Promise.all(e2.map(function(e3) {
          e3 = e3.updatesTable;
          return n2 ? t2.db.table(e3).where("k").anyOf(n2).delete() : t2.db.table(e3).clear();
        })).then(function() {
          return r2;
        })) : r2;
      }
      xt.prototype.execute = function(e2) {
        var t2 = this["@@propmod"];
        if (void 0 !== t2.add) {
          var n2 = t2.add;
          if (x(n2)) return R(R([], x(e2) ? e2 : [], true), n2).sort();
          if ("number" == typeof n2) return (Number(e2) || 0) + n2;
          if ("bigint" == typeof n2) try {
            return BigInt(e2) + n2;
          } catch (e3) {
            return BigInt(0) + n2;
          }
          throw new TypeError("Invalid term ".concat(n2));
        }
        if (void 0 !== t2.remove) {
          var r2 = t2.remove;
          if (x(r2)) return x(e2) ? e2.filter(function(e3) {
            return !r2.includes(e3);
          }).sort() : [];
          if ("number" == typeof r2) return Number(e2) - r2;
          if ("bigint" == typeof r2) try {
            return BigInt(e2) - r2;
          } catch (e3) {
            return BigInt(0) - r2;
          }
          throw new TypeError("Invalid subtrahend ".concat(r2));
        }
        n2 = null == (n2 = t2.replacePrefix) ? void 0 : n2[0];
        return n2 && "string" == typeof e2 && e2.startsWith(n2) ? t2.replacePrefix[1] + e2.substring(n2.length) : e2;
      };
      var _t = xt;
      function xt(e2) {
        this["@@propmod"] = e2;
      }
      function kt(e2, t2) {
        for (var n2 = O(t2), r2 = n2.length, i2 = false, o2 = 0; o2 < r2; ++o2) {
          var a2 = n2[o2], u2 = t2[a2], s2 = c(e2, a2);
          u2 instanceof _t ? (b(e2, a2, u2.execute(s2)), i2 = true) : s2 !== u2 && (b(e2, a2, u2), i2 = true);
        }
        return i2;
      }
      r.prototype._trans = function(e2, r2, t2) {
        var n2 = this._tx || P.trans, i2 = this.name, o2 = l && "undefined" != typeof console && console.createTask && console.createTask("Dexie: ".concat("readonly" === e2 ? "read" : "write", " ").concat(this.name));
        function a2(e3, t3, n3) {
          if (n3.schema[i2]) return r2(n3.idbtrans, n3);
          throw new k.NotFound("Table " + i2 + " not part of transaction");
        }
        var u2 = $e();
        try {
          var s2 = n2 && n2.db._novip === this.db._novip ? n2 === P.trans ? n2._promise(e2, a2, t2) : v(function() {
            return n2._promise(e2, a2, t2);
          }, { trans: n2, transless: P.transless || P }) : function t3(n3, r3, i3, o3) {
            if (n3.idbdb && (n3._state.openComplete || P.letThrough || n3._vip)) {
              var a3 = n3._createTransaction(r3, i3, n3._dbSchema);
              try {
                a3.create(), n3._state.PR1398_maxLoop = 3;
              } catch (e3) {
                return e3.name === de.InvalidState && n3.isOpen() && 0 < --n3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), n3.close({ disableAutoOpen: false }), n3.open().then(function() {
                  return t3(n3, r3, i3, o3);
                })) : S(e3);
              }
              return a3._promise(r3, function(e3, t4) {
                return v(function() {
                  return P.trans = a3, o3(e3, t4, a3);
                });
              }).then(function(e3) {
                if ("readwrite" === r3) try {
                  a3.idbtrans.commit();
                } catch (e4) {
                }
                return "readonly" === r3 ? e3 : a3._completion.then(function() {
                  return e3;
                });
              });
            }
            if (n3._state.openComplete) return S(new k.DatabaseClosed(n3._state.dbOpenError));
            if (!n3._state.isBeingOpened) {
              if (!n3._state.autoOpen) return S(new k.DatabaseClosed());
              n3.open().catch(g);
            }
            return n3._state.dbReadyPromise.then(function() {
              return t3(n3, r3, i3, o3);
            });
          }(this.db, e2, [this.name], a2);
          return o2 && (s2._consoleTask = o2, s2 = s2.catch(function(e3) {
            return console.trace(e3), S(e3);
          })), s2;
        } finally {
          u2 && Qe();
        }
      }, r.prototype.get = function(t2, e2) {
        var n2 = this;
        return t2 && t2.constructor === Object ? this.where(t2).first(e2) : null == t2 ? S(new k.Type("Invalid argument to Table.get()")) : this._trans("readonly", function(e3) {
          return n2.core.get({ trans: e3, key: t2 }).then(function(e4) {
            return n2.hook.reading.fire(e4);
          });
        }).then(e2);
      }, r.prototype.where = function(o2) {
        if ("string" == typeof o2) return new this.db.WhereClause(this, o2);
        if (x(o2)) return new this.db.WhereClause(this, "[".concat(o2.join("+"), "]"));
        var n2 = O(o2);
        if (1 === n2.length) return this.where(n2[0]).equals(o2[n2[0]]);
        var e2 = this.schema.indexes.concat(this.schema.primKey).filter(function(t3) {
          if (t3.compound && n2.every(function(e4) {
            return 0 <= t3.keyPath.indexOf(e4);
          })) {
            for (var e3 = 0; e3 < n2.length; ++e3) if (-1 === n2.indexOf(t3.keyPath[e3])) return false;
            return true;
          }
          return false;
        }).sort(function(e3, t3) {
          return e3.keyPath.length - t3.keyPath.length;
        })[0];
        if (e2 && this.db._maxKey !== ct) return t2 = e2.keyPath.slice(0, n2.length), this.where(t2).equals(t2.map(function(e3) {
          return o2[e3];
        }));
        !e2 && l && console.warn("The query ".concat(JSON.stringify(o2), " on ").concat(this.name, " would benefit from a ") + "compound index [".concat(n2.join("+"), "]"));
        var a2 = this.schema.idxByName;
        function u2(e3, t3) {
          return 0 === C(e3, t3);
        }
        var t2 = n2.reduce(function(e3, t3) {
          var n3 = e3[0], e3 = e3[1], r3 = a2[t3], i2 = o2[t3];
          return [n3 || r3, n3 || !r3 ? pt(e3, r3 && r3.multi ? function(e4) {
            e4 = c(e4, t3);
            return x(e4) && e4.some(function(e5) {
              return u2(i2, e5);
            });
          } : function(e4) {
            return u2(i2, c(e4, t3));
          }) : e3];
        }, [null, null]), r2 = t2[0], t2 = t2[1];
        return r2 ? this.where(r2.name).equals(o2[r2.keyPath]).filter(t2) : e2 ? this.filter(t2) : this.where(n2).equals("");
      }, r.prototype.filter = function(e2) {
        return this.toCollection().and(e2);
      }, r.prototype.count = function(e2) {
        return this.toCollection().count(e2);
      }, r.prototype.offset = function(e2) {
        return this.toCollection().offset(e2);
      }, r.prototype.limit = function(e2) {
        return this.toCollection().limit(e2);
      }, r.prototype.each = function(e2) {
        return this.toCollection().each(e2);
      }, r.prototype.toArray = function(e2) {
        return this.toCollection().toArray(e2);
      }, r.prototype.toCollection = function() {
        return new this.db.Collection(new this.db.WhereClause(this));
      }, r.prototype.orderBy = function(e2) {
        return new this.db.Collection(new this.db.WhereClause(this, x(e2) ? "[".concat(e2.join("+"), "]") : e2));
      }, r.prototype.reverse = function() {
        return this.toCollection().reverse();
      }, r.prototype.mapToClass = function(r2) {
        for (var o2 = this.db, a2 = this.name, i2 = ((this.schema.mappedClass = r2).prototype instanceof mt && (r2 = ((e3) => {
          var t3 = i3, n2 = e3;
          if ("function" != typeof n2 && null !== n2) throw new TypeError("Class extends value " + String(n2) + " is not a constructor or null");
          function r3() {
            this.constructor = t3;
          }
          function i3() {
            return null !== e3 && e3.apply(this, arguments) || this;
          }
          return B(t3, n2), t3.prototype = null === n2 ? Object.create(n2) : (r3.prototype = n2.prototype, new r3()), Object.defineProperty(i3.prototype, "db", { get: function() {
            return o2;
          }, enumerable: false, configurable: true }), i3.prototype.table = function() {
            return a2;
          }, i3;
        })(r2)), /* @__PURE__ */ new Set()), e2 = r2.prototype; e2; e2 = F(e2)) Object.getOwnPropertyNames(e2).forEach(function(e3) {
          return i2.add(e3);
        });
        function t2(e3) {
          if (!e3) return e3;
          var t3, n2 = Object.create(r2.prototype);
          for (t3 in e3) if (!i2.has(t3)) try {
            n2[t3] = e3[t3];
          } catch (e4) {
          }
          return n2;
        }
        return this.schema.readHook && this.hook.reading.unsubscribe(this.schema.readHook), this.schema.readHook = t2, this.hook("reading", t2), r2;
      }, r.prototype.defineClass = function() {
        return this.mapToClass(function(e2) {
          a(this, e2);
        });
      }, r.prototype.add = function(t2, n2) {
        var r2 = this, e2 = this.schema.primKey, i2 = e2.auto, o2 = e2.keyPath, a2 = t2;
        return o2 && i2 && (a2 = vt(o2)(t2)), this._trans("readwrite", function(e3) {
          return r2.core.mutate({ trans: e3, type: "add", keys: null != n2 ? [n2] : null, values: [a2] });
        }).then(function(e3) {
          return e3.numFailures ? K.reject(e3.failures[0]) : e3.lastResult;
        }).then(function(e3) {
          if (o2) try {
            b(t2, o2, e3);
          } catch (e4) {
          }
          return e3;
        });
      }, r.prototype.upsert = function(r2, i2) {
        var o2 = this, a2 = this.schema.primKey.keyPath;
        return this._trans("readwrite", function(n2) {
          return o2.core.get({ trans: n2, key: r2 }).then(function(t2) {
            var e2 = null != t2 ? t2 : {};
            return kt(e2, i2), a2 && b(e2, a2, r2), o2.core.mutate({ trans: n2, type: "put", values: [e2], keys: [r2], upsert: true, updates: { keys: [r2], changeSpecs: [i2] } }).then(function(e3) {
              return e3.numFailures ? K.reject(e3.failures[0]) : !!t2;
            });
          });
        });
      }, r.prototype.update = function(e2, t2) {
        return "object" != typeof e2 || x(e2) ? this.where(":id").equals(e2).modify(t2) : void 0 === (e2 = c(e2, this.schema.primKey.keyPath)) ? S(new k.InvalidArgument("Given object does not contain its primary key")) : this.where(":id").equals(e2).modify(t2);
      }, r.prototype.put = function(t2, n2) {
        var r2 = this, e2 = this.schema.primKey, i2 = e2.auto, o2 = e2.keyPath, a2 = t2;
        return o2 && i2 && (a2 = vt(o2)(t2)), this._trans("readwrite", function(e3) {
          return r2.core.mutate({ trans: e3, type: "put", values: [a2], keys: null != n2 ? [n2] : null });
        }).then(function(e3) {
          return e3.numFailures ? K.reject(e3.failures[0]) : e3.lastResult;
        }).then(function(e3) {
          if (o2) try {
            b(t2, o2, e3);
          } catch (e4) {
          }
          return e3;
        });
      }, r.prototype.delete = function(t2) {
        var n2 = this;
        return this._trans("readwrite", function(e2) {
          return n2.core.mutate({ trans: e2, type: "delete", keys: [t2] }).then(function(e3) {
            return wt(n2, [t2], e3);
          }).then(function(e3) {
            return e3.numFailures ? K.reject(e3.failures[0]) : void 0;
          });
        });
      }, r.prototype.clear = function() {
        var t2 = this;
        return this._trans("readwrite", function(e2) {
          return t2.core.mutate({ trans: e2, type: "deleteRange", range: yt }).then(function(e3) {
            return wt(t2, null, e3);
          });
        }).then(function(e2) {
          return e2.numFailures ? K.reject(e2.failures[0]) : void 0;
        });
      }, r.prototype.bulkGet = function(t2) {
        var n2 = this;
        return this._trans("readonly", function(e2) {
          return n2.core.getMany({ keys: t2, trans: e2 }).then(function(e3) {
            return e3.map(function(e4) {
              return n2.hook.reading.fire(e4);
            });
          });
        });
      }, r.prototype.bulkAdd = function(i2, e2, t2) {
        var o2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
        return this._trans("readwrite", function(e3) {
          var t3 = o2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
          if (t3 && a2) throw new k.InvalidArgument("bulkAdd(): keys argument invalid on tables with inbound keys");
          if (a2 && a2.length !== i2.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
          var r2 = i2.length, n2 = t3 && n2 ? i2.map(vt(t3)) : i2;
          return o2.core.mutate({ trans: e3, type: "add", keys: a2, values: n2, wantResults: u2 }).then(function(e4) {
            var t4 = e4.numFailures, n3 = e4.failures;
            if (0 === t4) return u2 ? e4.results : e4.lastResult;
            throw new he("".concat(o2.name, ".bulkAdd(): ").concat(t4, " of ").concat(r2, " operations failed"), n3);
          });
        });
      }, r.prototype.bulkPut = function(i2, e2, t2) {
        var o2 = this, a2 = Array.isArray(e2) ? e2 : void 0, u2 = (t2 = t2 || (a2 ? void 0 : e2)) ? t2.allKeys : void 0;
        return this._trans("readwrite", function(e3) {
          var t3 = o2.schema.primKey, n2 = t3.auto, t3 = t3.keyPath;
          if (t3 && a2) throw new k.InvalidArgument("bulkPut(): keys argument invalid on tables with inbound keys");
          if (a2 && a2.length !== i2.length) throw new k.InvalidArgument("Arguments objects and keys must have the same length");
          var r2 = i2.length, n2 = t3 && n2 ? i2.map(vt(t3)) : i2;
          return o2.core.mutate({ trans: e3, type: "put", keys: a2, values: n2, wantResults: u2 }).then(function(e4) {
            var t4 = e4.numFailures, n3 = e4.failures;
            if (0 === t4) return u2 ? e4.results : e4.lastResult;
            throw new he("".concat(o2.name, ".bulkPut(): ").concat(t4, " of ").concat(r2, " operations failed"), n3);
          });
        });
      }, r.prototype.bulkUpdate = function(t2) {
        var h2 = this, n2 = this.core, r2 = t2.map(function(e2) {
          return e2.key;
        }), i2 = t2.map(function(e2) {
          return e2.changes;
        }), d2 = [];
        return this._trans("readwrite", function(e2) {
          return n2.getMany({ trans: e2, keys: r2, cache: "clone" }).then(function(c2) {
            var l2 = [], f2 = [], s2 = (t2.forEach(function(e3, t3) {
              var n3 = e3.key, r3 = e3.changes, i3 = c2[t3];
              if (i3) {
                for (var o2 = 0, a2 = Object.keys(r3); o2 < a2.length; o2++) {
                  var u2 = a2[o2], s3 = r3[u2];
                  if (u2 === h2.schema.primKey.keyPath) {
                    if (0 !== C(s3, n3)) throw new k.Constraint("Cannot update primary key in bulkUpdate()");
                  } else b(i3, u2, s3);
                }
                d2.push(t3), l2.push(n3), f2.push(i3);
              }
            }), l2.length);
            return n2.mutate({ trans: e2, type: "put", keys: l2, values: f2, updates: { keys: r2, changeSpecs: i2 } }).then(function(e3) {
              var t3 = e3.numFailures, n3 = e3.failures;
              if (0 === t3) return s2;
              for (var r3 = 0, i3 = Object.keys(n3); r3 < i3.length; r3++) {
                var o2, a2 = i3[r3], u2 = d2[Number(a2)];
                null != u2 && (o2 = n3[a2], delete n3[a2], n3[u2] = o2);
              }
              throw new he("".concat(h2.name, ".bulkUpdate(): ").concat(t3, " of ").concat(s2, " operations failed"), n3);
            });
          });
        });
      }, r.prototype.bulkDelete = function(t2) {
        var r2 = this, i2 = t2.length;
        return this._trans("readwrite", function(e2) {
          return r2.core.mutate({ trans: e2, type: "delete", keys: t2 }).then(function(e3) {
            return wt(r2, t2, e3);
          });
        }).then(function(e2) {
          var t3 = e2.numFailures, n2 = e2.failures;
          if (0 === t3) return e2.lastResult;
          throw new he("".concat(r2.name, ".bulkDelete(): ").concat(t3, " of ").concat(i2, " operations failed"), n2);
        });
      };
      var Ot = r;
      function r() {
      }
      function Pt(i2) {
        function t2(e3, t3) {
          if (t3) {
            for (var n3 = arguments.length, r2 = new Array(n3 - 1); --n3; ) r2[n3 - 1] = arguments[n3];
            return a2[e3].subscribe.apply(null, r2), i2;
          }
          if ("string" == typeof e3) return a2[e3];
        }
        var a2 = {};
        t2.addEventType = u2;
        for (var e2 = 1, n2 = arguments.length; e2 < n2; ++e2) u2(arguments[e2]);
        return t2;
        function u2(e3, n3, r2) {
          var i3, o2;
          if ("object" != typeof e3) return n3 = n3 || xe, o2 = { subscribers: [], fire: r2 = r2 || g, subscribe: function(e4) {
            -1 === o2.subscribers.indexOf(e4) && (o2.subscribers.push(e4), o2.fire = n3(o2.fire, e4));
          }, unsubscribe: function(t3) {
            o2.subscribers = o2.subscribers.filter(function(e4) {
              return e4 !== t3;
            }), o2.fire = o2.subscribers.reduce(n3, r2);
          } }, a2[e3] = t2[e3] = o2;
          O(i3 = e3).forEach(function(e4) {
            var t3 = i3[e4];
            if (x(t3)) u2(e4, i3[e4][0], i3[e4][1]);
            else {
              if ("asap" !== t3) throw new k.InvalidArgument("Invalid event config");
              var n4 = u2(e4, ve, function() {
                for (var e5 = arguments.length, t4 = new Array(e5); e5--; ) t4[e5] = arguments[e5];
                n4.subscribers.forEach(function(e6) {
                  Q(function() {
                    e6.apply(null, t4);
                  });
                });
              });
            }
          });
        }
      }
      function Kt(e2, t2) {
        return U(t2).from({ prototype: e2 }), t2;
      }
      function Et(e2, t2) {
        return !(e2.filter || e2.algorithm || e2.or) && (t2 ? e2.justLimit : !e2.replayFilter);
      }
      function St(e2, t2) {
        e2.filter = pt(e2.filter, t2);
      }
      function At(e2, t2, n2) {
        var r2 = e2.replayFilter;
        e2.replayFilter = r2 ? function() {
          return pt(r2(), t2());
        } : t2, e2.justLimit = n2 && !r2;
      }
      function Ct(e2, t2) {
        if (e2.isPrimKey) return t2.primaryKey;
        var n2 = t2.getIndexByKeyPath(e2.index);
        if (n2) return n2;
        throw new k.Schema("KeyPath " + e2.index + " on object store " + t2.name + " is not indexed");
      }
      function jt(e2, t2, n2) {
        var r2 = Ct(e2, t2.schema);
        return t2.openCursor({ trans: n2, values: !e2.keysOnly, reverse: "prev" === e2.dir, unique: !!e2.unique, query: { index: r2, range: e2.range } });
      }
      function Tt(e2, o2, t2, n2) {
        var a2, r2, u2 = e2.replayFilter ? pt(e2.filter, e2.replayFilter()) : e2.filter;
        return e2.or ? (a2 = {}, r2 = function(e3, t3, n3) {
          var r3, i2;
          u2 && !u2(t3, n3, function(e4) {
            return t3.stop(e4);
          }, function(e4) {
            return t3.fail(e4);
          }) || ("[object ArrayBuffer]" === (i2 = "" + (r3 = t3.primaryKey)) && (i2 = "" + new Uint8Array(r3)), m(a2, i2)) || (a2[i2] = true, o2(e3, t3, n3));
        }, Promise.all([e2.or._iterate(r2, t2), It(jt(e2, n2, t2), e2.algorithm, r2, !e2.keysOnly && e2.valueMapper)])) : It(jt(e2, n2, t2), pt(e2.algorithm, u2), o2, !e2.keysOnly && e2.valueMapper);
      }
      function It(e2, r2, i2, o2) {
        var a2 = E(o2 ? function(e3, t2, n2) {
          return i2(o2(e3), t2, n2);
        } : i2);
        return e2.then(function(n2) {
          if (n2) return n2.start(function() {
            var t2 = function() {
              return n2.continue();
            };
            r2 && !r2(n2, function(e3) {
              return t2 = e3;
            }, function(e3) {
              n2.stop(e3), t2 = g;
            }, function(e3) {
              n2.fail(e3), t2 = g;
            }) || a2(n2.value, n2, function(e3) {
              return t2 = e3;
            }), t2();
          });
        });
      }
      i.prototype._read = function(e2, t2) {
        var n2 = this._ctx;
        return n2.error ? n2.table._trans(null, S.bind(null, n2.error)) : n2.table._trans("readonly", e2).then(t2);
      }, i.prototype._write = function(e2) {
        var t2 = this._ctx;
        return t2.error ? t2.table._trans(null, S.bind(null, t2.error)) : t2.table._trans("readwrite", e2, "locked");
      }, i.prototype._addAlgorithm = function(e2) {
        var t2 = this._ctx;
        t2.algorithm = pt(t2.algorithm, e2);
      }, i.prototype._iterate = function(e2, t2) {
        return Tt(this._ctx, e2, t2, this._ctx.table.core);
      }, i.prototype.clone = function(e2) {
        var t2 = Object.create(this.constructor.prototype), n2 = Object.create(this._ctx);
        return e2 && a(n2, e2), t2._ctx = n2, t2;
      }, i.prototype.raw = function() {
        return this._ctx.valueMapper = null, this;
      }, i.prototype.each = function(t2) {
        var n2 = this._ctx;
        return this._read(function(e2) {
          return Tt(n2, t2, e2, n2.table.core);
        });
      }, i.prototype.count = function(e2) {
        var i2 = this;
        return this._read(function(e3) {
          var t2, n2 = i2._ctx, r2 = n2.table.core;
          return Et(n2, true) ? r2.count({ trans: e3, query: { index: Ct(n2, r2.schema), range: n2.range } }).then(function(e4) {
            return Math.min(e4, n2.limit);
          }) : (t2 = 0, Tt(n2, function() {
            return ++t2, false;
          }, e3, r2).then(function() {
            return t2;
          }));
        }).then(e2);
      }, i.prototype.sortBy = function(e2, t2) {
        var n2 = e2.split(".").reverse(), r2 = n2[0], i2 = n2.length - 1;
        function o2(e3, t3) {
          return t3 ? o2(e3[n2[t3]], t3 - 1) : e3[r2];
        }
        var a2 = "next" === this._ctx.dir ? 1 : -1;
        function u2(e3, t3) {
          return C(o2(e3, i2), o2(t3, i2)) * a2;
        }
        return this.toArray(function(e3) {
          return e3.slice().sort(u2);
        }).then(t2);
      }, i.prototype.toArray = function(e2) {
        var o2 = this;
        return this._read(function(e3) {
          var t2, n2, r2, i2 = o2._ctx;
          return Et(i2, true) && 0 < i2.limit ? (t2 = i2.valueMapper, n2 = Ct(i2, i2.table.core.schema), i2.table.core.query({ trans: e3, limit: i2.limit, values: true, direction: "prev" === i2.dir ? "prev" : void 0, query: { index: n2, range: i2.range } }).then(function(e4) {
            e4 = e4.result;
            return t2 ? e4.map(t2) : e4;
          })) : (r2 = [], Tt(i2, function(e4) {
            return r2.push(e4);
          }, e3, i2.table.core).then(function() {
            return r2;
          }));
        }, e2);
      }, i.prototype.offset = function(t2) {
        var e2 = this._ctx;
        return t2 <= 0 || (e2.offset += t2, Et(e2) ? At(e2, function() {
          var n2 = t2;
          return function(e3, t3) {
            return 0 === n2 || (1 === n2 ? --n2 : t3(function() {
              e3.advance(n2), n2 = 0;
            }), false);
          };
        }) : At(e2, function() {
          var e3 = t2;
          return function() {
            return --e3 < 0;
          };
        })), this;
      }, i.prototype.limit = function(e2) {
        return this._ctx.limit = Math.min(this._ctx.limit, e2), At(this._ctx, function() {
          var r2 = e2;
          return function(e3, t2, n2) {
            return --r2 <= 0 && t2(n2), 0 <= r2;
          };
        }, true), this;
      }, i.prototype.until = function(r2, i2) {
        return St(this._ctx, function(e2, t2, n2) {
          return !r2(e2.value) || (t2(n2), i2);
        }), this;
      }, i.prototype.first = function(e2) {
        return this.limit(1).toArray(function(e3) {
          return e3[0];
        }).then(e2);
      }, i.prototype.last = function(e2) {
        return this.reverse().first(e2);
      }, i.prototype.filter = function(t2) {
        var e2;
        return St(this._ctx, function(e3) {
          return t2(e3.value);
        }), (e2 = this._ctx).isMatch = pt(e2.isMatch, t2), this;
      }, i.prototype.and = function(e2) {
        return this.filter(e2);
      }, i.prototype.or = function(e2) {
        return new this.db.WhereClause(this._ctx.table, e2, this);
      }, i.prototype.reverse = function() {
        return this._ctx.dir = "prev" === this._ctx.dir ? "next" : "prev", this._ondirectionchange && this._ondirectionchange(this._ctx.dir), this;
      }, i.prototype.desc = function() {
        return this.reverse();
      }, i.prototype.eachKey = function(n2) {
        var e2 = this._ctx;
        return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
          n2(t2.key, t2);
        });
      }, i.prototype.eachUniqueKey = function(e2) {
        return this._ctx.unique = "unique", this.eachKey(e2);
      }, i.prototype.eachPrimaryKey = function(n2) {
        var e2 = this._ctx;
        return e2.keysOnly = !e2.isMatch, this.each(function(e3, t2) {
          n2(t2.primaryKey, t2);
        });
      }, i.prototype.keys = function(e2) {
        var t2 = this._ctx, n2 = (t2.keysOnly = !t2.isMatch, []);
        return this.each(function(e3, t3) {
          n2.push(t3.key);
        }).then(function() {
          return n2;
        }).then(e2);
      }, i.prototype.primaryKeys = function(e2) {
        var n2 = this._ctx;
        if (Et(n2, true) && 0 < n2.limit) return this._read(function(e3) {
          var t2 = Ct(n2, n2.table.core.schema);
          return n2.table.core.query({ trans: e3, values: false, limit: n2.limit, direction: "prev" === n2.dir ? "prev" : void 0, query: { index: t2, range: n2.range } });
        }).then(function(e3) {
          return e3.result;
        }).then(e2);
        n2.keysOnly = !n2.isMatch;
        var r2 = [];
        return this.each(function(e3, t2) {
          r2.push(t2.primaryKey);
        }).then(function() {
          return r2;
        }).then(e2);
      }, i.prototype.uniqueKeys = function(e2) {
        return this._ctx.unique = "unique", this.keys(e2);
      }, i.prototype.firstKey = function(e2) {
        return this.limit(1).keys(function(e3) {
          return e3[0];
        }).then(e2);
      }, i.prototype.lastKey = function(e2) {
        return this.reverse().firstKey(e2);
      }, i.prototype.distinct = function() {
        var n2, e2 = this._ctx, e2 = e2.index && e2.table.schema.idxByName[e2.index];
        return e2 && e2.multi && (n2 = {}, St(this._ctx, function(e3) {
          var e3 = e3.primaryKey.toString(), t2 = m(n2, e3);
          return n2[e3] = true, !t2;
        })), this;
      }, i.prototype.modify = function(x2) {
        var n2 = this, k2 = this._ctx;
        return this._write(function(p2) {
          function y2(e3, t3) {
            var n3 = t3.failures;
            u2 += e3 - t3.numFailures;
            for (var r2 = 0, i2 = O(n3); r2 < i2.length; r2++) {
              var o2 = i2[r2];
              a2.push(n3[o2]);
            }
          }
          var v2 = "function" == typeof x2 ? x2 : function(e3) {
            return kt(e3, x2);
          }, m2 = k2.table.core, e2 = m2.schema.primaryKey, b2 = e2.outbound, g2 = e2.extractKey, w2 = 200, e2 = n2.db._options.modifyChunkSize, a2 = (e2 && (w2 = "object" == typeof e2 ? e2[m2.name] || e2["*"] || 200 : e2), []), u2 = 0, t2 = [], _2 = x2 === Dt;
          return n2.clone().primaryKeys().then(function(f2) {
            function h2(s2) {
              var c2 = Math.min(w2, f2.length - s2), l2 = f2.slice(s2, s2 + c2);
              return (_2 ? Promise.resolve([]) : m2.getMany({ trans: p2, keys: l2, cache: "immutable" })).then(function(e3) {
                var n3 = [], t3 = [], r2 = b2 ? [] : null, i2 = _2 ? l2 : [];
                if (!_2) for (var o2 = 0; o2 < c2; ++o2) {
                  var a3 = e3[o2], u3 = { value: ee(a3), primKey: f2[s2 + o2] };
                  false !== v2.call(u3, u3.value, u3) && (null == u3.value ? i2.push(f2[s2 + o2]) : b2 || 0 === C(g2(a3), g2(u3.value)) ? (t3.push(u3.value), b2 && r2.push(f2[s2 + o2])) : (i2.push(f2[s2 + o2]), n3.push(u3.value)));
                }
                return Promise.resolve(0 < n3.length && m2.mutate({ trans: p2, type: "add", values: n3 }).then(function(e4) {
                  for (var t4 in e4.failures) i2.splice(parseInt(t4), 1);
                  y2(n3.length, e4);
                })).then(function() {
                  return (0 < t3.length || d2 && "object" == typeof x2) && m2.mutate({ trans: p2, type: "put", keys: r2, values: t3, criteria: d2, changeSpec: "function" != typeof x2 && x2, isAdditionalChunk: 0 < s2 }).then(function(e4) {
                    return y2(t3.length, e4);
                  });
                }).then(function() {
                  return (0 < i2.length || d2 && _2) && m2.mutate({ trans: p2, type: "delete", keys: i2, criteria: d2, isAdditionalChunk: 0 < s2 }).then(function(e4) {
                    return wt(k2.table, i2, e4);
                  }).then(function(e4) {
                    return y2(i2.length, e4);
                  });
                }).then(function() {
                  return f2.length > s2 + c2 && h2(s2 + w2);
                });
              });
            }
            var d2 = Et(k2) && k2.limit === 1 / 0 && ("function" != typeof x2 || _2) && { index: k2.index, range: k2.range };
            return h2(0).then(function() {
              if (0 < a2.length) throw new fe("Error modifying one or more objects", a2, u2, t2);
              return f2.length;
            });
          });
        });
      }, i.prototype.delete = function() {
        var i2 = this._ctx, n2 = i2.range;
        return !Et(i2) || i2.table.schema.yProps || !i2.isPrimKey && 3 !== n2.type ? this.modify(Dt) : this._write(function(e2) {
          var t2 = i2.table.core.schema.primaryKey, r2 = n2;
          return i2.table.core.count({ trans: e2, query: { index: t2, range: r2 } }).then(function(n3) {
            return i2.table.core.mutate({ trans: e2, type: "deleteRange", range: r2 }).then(function(e3) {
              var t3 = e3.failures, e3 = e3.numFailures;
              if (e3) throw new fe("Could not delete some values", Object.keys(t3).map(function(e4) {
                return t3[e4];
              }), n3 - e3);
              return n3 - e3;
            });
          });
        });
      };
      var qt = i;
      function i() {
      }
      var Dt = function(e2, t2) {
        return t2.value = null;
      };
      function Bt(e2, t2) {
        return e2 < t2 ? -1 : e2 === t2 ? 0 : 1;
      }
      function Rt(e2, t2) {
        return t2 < e2 ? -1 : e2 === t2 ? 0 : 1;
      }
      function j(e2, t2, n2) {
        e2 = e2 instanceof Lt ? new e2.Collection(e2) : e2;
        return e2._ctx.error = new (n2 || TypeError)(t2), e2;
      }
      function Ft(e2) {
        return new e2.Collection(e2, function() {
          return Mt("");
        }).limit(0);
      }
      function Nt(e2, s2, n2, r2) {
        var i2, c2, l2, f2, h2, d2, p2, y2 = n2.length;
        if (!n2.every(function(e3) {
          return "string" == typeof e3;
        })) return j(e2, lt);
        function t2(e3) {
          i2 = "next" === e3 ? function(e4) {
            return e4.toUpperCase();
          } : function(e4) {
            return e4.toLowerCase();
          }, c2 = "next" === e3 ? function(e4) {
            return e4.toLowerCase();
          } : function(e4) {
            return e4.toUpperCase();
          }, l2 = "next" === e3 ? Bt : Rt;
          var t3 = n2.map(function(e4) {
            return { lower: c2(e4), upper: i2(e4) };
          }).sort(function(e4, t4) {
            return l2(e4.lower, t4.lower);
          });
          f2 = t3.map(function(e4) {
            return e4.upper;
          }), h2 = t3.map(function(e4) {
            return e4.lower;
          }), p2 = "next" === (d2 = e3) ? "" : r2;
        }
        t2("next");
        var e2 = new e2.Collection(e2, function() {
          return T(f2[0], h2[y2 - 1] + r2);
        }), v2 = (e2._ondirectionchange = function(e3) {
          t2(e3);
        }, 0);
        return e2._addAlgorithm(function(e3, t3, n3) {
          var r3 = e3.key;
          if ("string" == typeof r3) {
            var i3 = c2(r3);
            if (s2(i3, h2, v2)) return true;
            for (var o2 = null, a2 = v2; a2 < y2; ++a2) {
              var u2 = ((e4, t4, n4, r4, i4, o3) => {
                for (var a3 = Math.min(e4.length, r4.length), u3 = -1, s3 = 0; s3 < a3; ++s3) {
                  var c3 = t4[s3];
                  if (c3 !== r4[s3]) return i4(e4[s3], n4[s3]) < 0 ? e4.substr(0, s3) + n4[s3] + n4.substr(s3 + 1) : i4(e4[s3], r4[s3]) < 0 ? e4.substr(0, s3) + r4[s3] + n4.substr(s3 + 1) : 0 <= u3 ? e4.substr(0, u3) + t4[u3] + n4.substr(u3 + 1) : null;
                  i4(e4[s3], c3) < 0 && (u3 = s3);
                }
                return a3 < r4.length && "next" === o3 ? e4 + n4.substr(e4.length) : a3 < e4.length && "prev" === o3 ? e4.substr(0, n4.length) : u3 < 0 ? null : e4.substr(0, u3) + r4[u3] + n4.substr(u3 + 1);
              })(r3, i3, f2[a2], h2[a2], l2, d2);
              null === u2 && null === o2 ? v2 = a2 + 1 : (null === o2 || 0 < l2(o2, u2)) && (o2 = u2);
            }
            t3(null !== o2 ? function() {
              e3.continue(o2 + p2);
            } : n3);
          }
          return false;
        }), e2;
      }
      function T(e2, t2, n2, r2) {
        return { type: 2, lower: e2, upper: t2, lowerOpen: n2, upperOpen: r2 };
      }
      function Mt(e2) {
        return { type: 1, lower: e2, upper: e2 };
      }
      Object.defineProperty(d.prototype, "Collection", { get: function() {
        return this._ctx.table.db.Collection;
      }, enumerable: false, configurable: true }), d.prototype.between = function(e2, t2, n2, r2) {
        n2 = false !== n2, r2 = true === r2;
        try {
          return 0 < this._cmp(e2, t2) || 0 === this._cmp(e2, t2) && (n2 || r2) && (!n2 || !r2) ? Ft(this) : new this.Collection(this, function() {
            return T(e2, t2, !n2, !r2);
          });
        } catch (e3) {
          return j(this, A);
        }
      }, d.prototype.equals = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return Mt(e2);
        });
      }, d.prototype.above = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(e2, void 0, true);
        });
      }, d.prototype.aboveOrEqual = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(e2, void 0, false);
        });
      }, d.prototype.below = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(void 0, e2, false, true);
        });
      }, d.prototype.belowOrEqual = function(e2) {
        return null == e2 ? j(this, A) : new this.Collection(this, function() {
          return T(void 0, e2);
        });
      }, d.prototype.startsWith = function(e2) {
        return "string" != typeof e2 ? j(this, lt) : this.between(e2, e2 + ct, true, true);
      }, d.prototype.startsWithIgnoreCase = function(e2) {
        return "" === e2 ? this.startsWith(e2) : Nt(this, function(e3, t2) {
          return 0 === e3.indexOf(t2[0]);
        }, [e2], ct);
      }, d.prototype.equalsIgnoreCase = function(e2) {
        return Nt(this, function(e3, t2) {
          return e3 === t2[0];
        }, [e2], "");
      }, d.prototype.anyOfIgnoreCase = function() {
        var e2 = n.apply(ae, arguments);
        return 0 === e2.length ? Ft(this) : Nt(this, function(e3, t2) {
          return -1 !== t2.indexOf(e3);
        }, e2, "");
      }, d.prototype.startsWithAnyOfIgnoreCase = function() {
        var e2 = n.apply(ae, arguments);
        return 0 === e2.length ? Ft(this) : Nt(this, function(t2, e3) {
          return e3.some(function(e4) {
            return 0 === t2.indexOf(e4);
          });
        }, e2, ct);
      }, d.prototype.anyOf = function() {
        var e2, i2, t2 = this, o2 = n.apply(ae, arguments), a2 = this._cmp;
        try {
          o2.sort(a2);
        } catch (e3) {
          return j(this, A);
        }
        return 0 === o2.length ? Ft(this) : ((e2 = new this.Collection(this, function() {
          return T(o2[0], o2[o2.length - 1]);
        }))._ondirectionchange = function(e3) {
          a2 = "next" === e3 ? t2._ascending : t2._descending, o2.sort(a2);
        }, i2 = 0, e2._addAlgorithm(function(e3, t3, n2) {
          for (var r2 = e3.key; 0 < a2(r2, o2[i2]); ) if (++i2 === o2.length) return t3(n2), false;
          return 0 === a2(r2, o2[i2]) || (t3(function() {
            e3.continue(o2[i2]);
          }), false);
        }), e2);
      }, d.prototype.notEqual = function(e2) {
        return this.inAnyRange([[-1 / 0, e2], [e2, this.db._maxKey]], { includeLowers: false, includeUppers: false });
      }, d.prototype.noneOf = function() {
        var e2 = n.apply(ae, arguments);
        if (0 === e2.length) return new this.Collection(this);
        try {
          e2.sort(this._ascending);
        } catch (e3) {
          return j(this, A);
        }
        var t2 = e2.reduce(function(e3, t3) {
          return e3 ? e3.concat([[e3[e3.length - 1][1], t3]]) : [[-1 / 0, t3]];
        }, null);
        return t2.push([e2[e2.length - 1], this.db._maxKey]), this.inAnyRange(t2, { includeLowers: false, includeUppers: false });
      }, d.prototype.inAnyRange = function(e2, t2) {
        var o2 = this, a2 = this._cmp, u2 = this._ascending, n2 = this._descending, s2 = this._min, c2 = this._max;
        if (0 === e2.length) return Ft(this);
        if (!e2.every(function(e3) {
          return void 0 !== e3[0] && void 0 !== e3[1] && u2(e3[0], e3[1]) <= 0;
        })) return j(this, "First argument to inAnyRange() must be an Array of two-value Arrays [lower,upper] where upper must not be lower than lower", k.InvalidArgument);
        var r2 = !t2 || false !== t2.includeLowers, i2 = t2 && true === t2.includeUppers;
        var l2, f2 = u2;
        function h2(e3, t3) {
          return f2(e3[0], t3[0]);
        }
        try {
          (l2 = e2.reduce(function(e3, t3) {
            for (var n3 = 0, r3 = e3.length; n3 < r3; ++n3) {
              var i3 = e3[n3];
              if (a2(t3[0], i3[1]) < 0 && 0 < a2(t3[1], i3[0])) {
                i3[0] = s2(i3[0], t3[0]), i3[1] = c2(i3[1], t3[1]);
                break;
              }
            }
            return n3 === r3 && e3.push(t3), e3;
          }, [])).sort(h2);
        } catch (e3) {
          return j(this, A);
        }
        var d2 = 0, p2 = i2 ? function(e3) {
          return 0 < u2(e3, l2[d2][1]);
        } : function(e3) {
          return 0 <= u2(e3, l2[d2][1]);
        }, y2 = r2 ? function(e3) {
          return 0 < n2(e3, l2[d2][0]);
        } : function(e3) {
          return 0 <= n2(e3, l2[d2][0]);
        };
        var v2 = p2, t2 = new this.Collection(this, function() {
          return T(l2[0][0], l2[l2.length - 1][1], !r2, !i2);
        });
        return t2._ondirectionchange = function(e3) {
          f2 = "next" === e3 ? (v2 = p2, u2) : (v2 = y2, n2), l2.sort(h2);
        }, t2._addAlgorithm(function(e3, t3, n3) {
          for (var r3, i3 = e3.key; v2(i3); ) if (++d2 === l2.length) return t3(n3), false;
          return !p2(r3 = i3) && !y2(r3) || (0 === o2._cmp(i3, l2[d2][1]) || 0 === o2._cmp(i3, l2[d2][0]) || t3(function() {
            f2 === u2 ? e3.continue(l2[d2][0]) : e3.continue(l2[d2][1]);
          }), false);
        }), t2;
      }, d.prototype.startsWithAnyOf = function() {
        var e2 = n.apply(ae, arguments);
        return e2.every(function(e3) {
          return "string" == typeof e3;
        }) ? 0 === e2.length ? Ft(this) : this.inAnyRange(e2.map(function(e3) {
          return [e3, e3 + ct];
        })) : j(this, "startsWithAnyOf() only works with strings");
      };
      var Lt = d;
      function d() {
      }
      function I(t2) {
        return E(function(e2) {
          return Ut(e2), t2(e2.target.error), false;
        });
      }
      function Ut(e2) {
        e2.stopPropagation && e2.stopPropagation(), e2.preventDefault && e2.preventDefault();
      }
      var zt = "storagemutated", Vt = "x-storagemutated-1", Wt = Pt(null, zt), Yt = (p.prototype._lock = function() {
        return $(!P.global), ++this._reculock, 1 !== this._reculock || P.global || (P.lockOwnerFor = this), this;
      }, p.prototype._unlock = function() {
        if ($(!P.global), 0 == --this._reculock) for (P.global || (P.lockOwnerFor = null); 0 < this._blockedFuncs.length && !this._locked(); ) {
          var e2 = this._blockedFuncs.shift();
          try {
            at(e2[1], e2[0]);
          } catch (e3) {
          }
        }
        return this;
      }, p.prototype._locked = function() {
        return this._reculock && P.lockOwnerFor !== this;
      }, p.prototype.create = function(t2) {
        var n2 = this;
        if (this.mode) {
          var e2 = this.db.idbdb, r2 = this.db._state.dbOpenError;
          if ($(!this.idbtrans), !t2 && !e2) switch (r2 && r2.name) {
            case "DatabaseClosedError":
              throw new k.DatabaseClosed(r2);
            case "MissingAPIError":
              throw new k.MissingAPI(r2.message, r2);
            default:
              throw new k.OpenFailed(r2);
          }
          if (!this.active) throw new k.TransactionInactive();
          $(null === this._completion._state), (t2 = this.idbtrans = t2 || (this.db.core || e2).transaction(this.storeNames, this.mode, { durability: this.chromeTransactionDurability })).onerror = E(function(e3) {
            Ut(e3), n2._reject(t2.error);
          }), t2.onabort = E(function(e3) {
            Ut(e3), n2.active && n2._reject(new k.Abort(t2.error)), n2.active = false, n2.on("abort").fire(e3);
          }), t2.oncomplete = E(function() {
            n2.active = false, n2._resolve(), "mutatedParts" in t2 && Wt.storagemutated.fire(t2.mutatedParts);
          });
        }
        return this;
      }, p.prototype._promise = function(n2, r2, i2) {
        var e2, o2 = this;
        return "readwrite" === n2 && "readwrite" !== this.mode ? S(new k.ReadOnly("Transaction is readonly")) : this.active ? this._locked() ? new K(function(e3, t2) {
          o2._blockedFuncs.push([function() {
            o2._promise(n2, r2, i2).then(e3, t2);
          }, P]);
        }) : i2 ? v(function() {
          var e3 = new K(function(e4, t2) {
            o2._lock();
            var n3 = r2(e4, t2, o2);
            n3 && n3.then && n3.then(e4, t2);
          });
          return e3.finally(function() {
            return o2._unlock();
          }), e3._lib = true, e3;
        }) : ((e2 = new K(function(e3, t2) {
          var n3 = r2(e3, t2, o2);
          n3 && n3.then && n3.then(e3, t2);
        }))._lib = true, e2) : S(new k.TransactionInactive());
      }, p.prototype._root = function() {
        return this.parent ? this.parent._root() : this;
      }, p.prototype.waitFor = function(e2) {
        var t2, r2 = this._root(), i2 = K.resolve(e2), o2 = (r2._waitingFor ? r2._waitingFor = r2._waitingFor.then(function() {
          return i2;
        }) : (r2._waitingFor = i2, r2._waitingQueue = [], t2 = r2.idbtrans.objectStore(r2.storeNames[0]), function e3() {
          for (++r2._spinCount; r2._waitingQueue.length; ) r2._waitingQueue.shift()();
          r2._waitingFor && (t2.get(-1 / 0).onsuccess = e3);
        }()), r2._waitingFor);
        return new K(function(t3, n2) {
          i2.then(function(e3) {
            return r2._waitingQueue.push(E(t3.bind(null, e3)));
          }, function(e3) {
            return r2._waitingQueue.push(E(n2.bind(null, e3)));
          }).finally(function() {
            r2._waitingFor === o2 && (r2._waitingFor = null);
          });
        });
      }, p.prototype.abort = function() {
        this.active && (this.active = false, this.idbtrans && this.idbtrans.abort(), this._reject(new k.Abort()));
      }, p.prototype.table = function(e2) {
        var t2 = this._memoizedTables || (this._memoizedTables = {});
        if (m(t2, e2)) return t2[e2];
        var n2 = this.schema[e2];
        if (n2) return (n2 = new this.db.Table(e2, n2, this)).core = this.db.core.table(e2), t2[e2] = n2;
        throw new k.NotFound("Table " + e2 + " not part of transaction");
      }, p);
      function p() {
      }
      function $t(e2, t2, n2, r2, i2, o2, a2, u2) {
        return { name: e2, keyPath: t2, unique: n2, multi: r2, auto: i2, compound: o2, src: (n2 && !a2 ? "&" : "") + (r2 ? "*" : "") + (i2 ? "++" : "") + Qt(t2), type: u2 };
      }
      function Qt(e2) {
        return "string" == typeof e2 ? e2 : e2 ? "[" + [].join.call(e2, "+") + "]" : "";
      }
      function Gt(e2, t2, n2) {
        return { name: e2, primKey: t2, indexes: n2, mappedClass: null, idxByName: (r2 = function(e3) {
          return [e3.name, e3];
        }, n2.reduce(function(e3, t3, n3) {
          t3 = r2(t3, n3);
          return t3 && (e3[t3[0]] = t3[1]), e3;
        }, {})) };
        var r2;
      }
      var Xt = function(e2) {
        try {
          return e2.only([[]]), Xt = function() {
            return [[]];
          }, [[]];
        } catch (e3) {
          return Xt = function() {
            return ct;
          }, ct;
        }
      };
      function Ht(t2) {
        return null == t2 ? function() {
        } : "string" == typeof t2 ? 1 === (n2 = t2).split(".").length ? function(e2) {
          return e2[n2];
        } : function(e2) {
          return c(e2, n2);
        } : function(e2) {
          return c(e2, t2);
        };
        var n2;
      }
      function Jt(e2) {
        return [].slice.call(e2);
      }
      var Zt = 0;
      function en(e2) {
        return null == e2 ? ":id" : "string" == typeof e2 ? e2 : "[".concat(e2.join("+"), "]");
      }
      function tn(e2, i2, t2) {
        function _2(e3) {
          if (3 === e3.type) return null;
          if (4 === e3.type) throw new Error("Cannot convert never type to IDBKeyRange");
          var t3 = e3.lower, n3 = e3.upper, r3 = e3.lowerOpen, e3 = e3.upperOpen;
          return void 0 === t3 ? void 0 === n3 ? null : i2.upperBound(n3, !!e3) : void 0 === n3 ? i2.lowerBound(t3, !!r3) : i2.bound(t3, n3, !!r3, !!e3);
        }
        function n2(e3) {
          var p2, y2, w2 = e3.name;
          return { name: w2, schema: e3, mutate: function(e4) {
            var y3 = e4.trans, v2 = e4.type, m2 = e4.keys, b2 = e4.values, g2 = e4.range;
            return new Promise(function(t3, e5) {
              t3 = E(t3);
              var n3 = y3.objectStore(w2), r3 = null == n3.keyPath, i3 = "put" === v2 || "add" === v2;
              if (!i3 && "delete" !== v2 && "deleteRange" !== v2) throw new Error("Invalid operation type: " + v2);
              var o3, a3 = (m2 || b2 || { length: 1 }).length;
              if (m2 && b2 && m2.length !== b2.length) throw new Error("Given keys array must have same length as given values array.");
              if (0 === a3) return t3({ numFailures: 0, failures: {}, results: [], lastResult: void 0 });
              function u3(e6) {
                ++l2, Ut(e6);
              }
              var s3 = [], c3 = [], l2 = 0;
              if ("deleteRange" === v2) {
                if (4 === g2.type) return t3({ numFailures: l2, failures: c3, results: [], lastResult: void 0 });
                3 === g2.type ? s3.push(o3 = n3.clear()) : s3.push(o3 = n3.delete(_2(g2)));
              } else {
                var r3 = i3 ? r3 ? [b2, m2] : [b2, null] : [m2, null], f2 = r3[0], h2 = r3[1];
                if (i3) for (var d2 = 0; d2 < a3; ++d2) s3.push(o3 = h2 && void 0 !== h2[d2] ? n3[v2](f2[d2], h2[d2]) : n3[v2](f2[d2])), o3.onerror = u3;
                else for (d2 = 0; d2 < a3; ++d2) s3.push(o3 = n3[v2](f2[d2])), o3.onerror = u3;
              }
              function p3(e6) {
                e6 = e6.target.result, s3.forEach(function(e7, t4) {
                  return null != e7.error && (c3[t4] = e7.error);
                }), t3({ numFailures: l2, failures: c3, results: "delete" === v2 ? m2 : s3.map(function(e7) {
                  return e7.result;
                }), lastResult: e6 });
              }
              o3.onerror = function(e6) {
                u3(e6), p3(e6);
              }, o3.onsuccess = p3;
            });
          }, getMany: function(e4) {
            var f2 = e4.trans, h2 = e4.keys;
            return new Promise(function(t3, e5) {
              t3 = E(t3);
              for (var n3, r3 = f2.objectStore(w2), i3 = h2.length, o3 = new Array(i3), a3 = 0, u3 = 0, s3 = function(e6) {
                e6 = e6.target;
                o3[e6._pos] = e6.result, ++u3 === a3 && t3(o3);
              }, c3 = I(e5), l2 = 0; l2 < i3; ++l2) null != h2[l2] && ((n3 = r3.get(h2[l2]))._pos = l2, n3.onsuccess = s3, n3.onerror = c3, ++a3);
              0 === a3 && t3(o3);
            });
          }, get: function(e4) {
            var r3 = e4.trans, i3 = e4.key;
            return new Promise(function(t3, e5) {
              t3 = E(t3);
              var n3 = r3.objectStore(w2).get(i3);
              n3.onsuccess = function(e6) {
                return t3(e6.target.result);
              }, n3.onerror = I(e5);
            });
          }, query: (p2 = a2, y2 = u2, function(d2) {
            return new Promise(function(t3, e4) {
              t3 = E(t3);
              var n3, r3, i3, o3, a3 = d2.trans, u3 = d2.values, s3 = d2.limit, c3 = d2.query, l2 = null != (l2 = d2.direction) ? l2 : "next", f2 = s3 === 1 / 0 ? void 0 : s3, h2 = c3.index, c3 = c3.range, a3 = a3.objectStore(w2), a3 = h2.isPrimaryKey ? a3 : a3.index(h2.name), h2 = _2(c3);
              if (0 === s3) return t3({ result: [] });
              y2 ? (c3 = { query: h2, count: f2, direction: l2 }, (n3 = u3 ? a3.getAll(c3) : a3.getAllKeys(c3)).onsuccess = function(e5) {
                return t3({ result: e5.target.result });
              }, n3.onerror = I(e4)) : p2 && "next" === l2 ? ((n3 = u3 ? a3.getAll(h2, f2) : a3.getAllKeys(h2, f2)).onsuccess = function(e5) {
                return t3({ result: e5.target.result });
              }, n3.onerror = I(e4)) : (r3 = 0, i3 = !u3 && "openKeyCursor" in a3 ? a3.openKeyCursor(h2, l2) : a3.openCursor(h2, l2), o3 = [], i3.onsuccess = function() {
                var e5 = i3.result;
                return !e5 || (o3.push(u3 ? e5.value : e5.primaryKey), ++r3 === s3) ? t3({ result: o3 }) : void e5.continue();
              }, i3.onerror = I(e4));
            });
          }), openCursor: function(e4) {
            var c3 = e4.trans, o3 = e4.values, a3 = e4.query, u3 = e4.reverse, l2 = e4.unique;
            return new Promise(function(t3, n3) {
              t3 = E(t3);
              var e5 = a3.index, r3 = a3.range, i3 = c3.objectStore(w2), i3 = e5.isPrimaryKey ? i3 : i3.index(e5.name), e5 = u3 ? l2 ? "prevunique" : "prev" : l2 ? "nextunique" : "next", s3 = !o3 && "openKeyCursor" in i3 ? i3.openKeyCursor(_2(r3), e5) : i3.openCursor(_2(r3), e5);
              s3.onerror = I(n3), s3.onsuccess = E(function(e6) {
                var r4, i4, o4, a4, u4 = s3.result;
                u4 ? (u4.___id = ++Zt, u4.done = false, r4 = u4.continue.bind(u4), i4 = (i4 = u4.continuePrimaryKey) && i4.bind(u4), o4 = u4.advance.bind(u4), a4 = function() {
                  throw new Error("Cursor not stopped");
                }, u4.trans = c3, u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = function() {
                  throw new Error("Cursor not started");
                }, u4.fail = E(n3), u4.next = function() {
                  var e7 = this, t4 = 1;
                  return this.start(function() {
                    return t4-- ? e7.continue() : e7.stop();
                  }).then(function() {
                    return e7;
                  });
                }, u4.start = function(e7) {
                  function t4() {
                    if (s3.result) try {
                      e7();
                    } catch (e8) {
                      u4.fail(e8);
                    }
                    else u4.done = true, u4.start = function() {
                      throw new Error("Cursor behind last entry");
                    }, u4.stop();
                  }
                  var n4 = new Promise(function(t5, e8) {
                    t5 = E(t5), s3.onerror = I(e8), u4.fail = e8, u4.stop = function(e9) {
                      u4.stop = u4.continue = u4.continuePrimaryKey = u4.advance = a4, t5(e9);
                    };
                  });
                  return s3.onsuccess = E(function(e8) {
                    s3.onsuccess = t4, t4();
                  }), u4.continue = r4, u4.continuePrimaryKey = i4, u4.advance = o4, t4(), n4;
                }, t3(u4)) : t3(null);
              }, n3);
            });
          }, count: function(e4) {
            var t3 = e4.query, i3 = e4.trans, o3 = t3.index, a3 = t3.range;
            return new Promise(function(t4, e5) {
              var n3 = i3.objectStore(w2), n3 = o3.isPrimaryKey ? n3 : n3.index(o3.name), r3 = _2(a3), r3 = r3 ? n3.count(r3) : n3.count();
              r3.onsuccess = E(function(e6) {
                return t4(e6.target.result);
              }), r3.onerror = I(e5);
            });
          } };
        }
        r2 = t2, o2 = Jt((t2 = e2).objectStoreNames), s2 = 0 < o2.length ? r2.objectStore(o2[0]) : {};
        var r2, t2 = { schema: { name: t2.name, tables: o2.map(function(e3) {
          return r2.objectStore(e3);
        }).map(function(t3) {
          var e3 = t3.keyPath, n3 = t3.autoIncrement, r3 = x(e3), i3 = {}, r3 = { name: t3.name, primaryKey: { name: null, isPrimaryKey: true, outbound: null == e3, compound: r3, keyPath: e3, autoIncrement: n3, unique: true, extractKey: Ht(e3) }, indexes: Jt(t3.indexNames).map(function(e4) {
            return t3.index(e4);
          }).map(function(e4) {
            var t4 = e4.name, n4 = e4.unique, r4 = e4.multiEntry, e4 = e4.keyPath, t4 = { name: t4, compound: x(e4), keyPath: e4, unique: n4, multiEntry: r4, extractKey: Ht(e4) };
            return i3[en(e4)] = t4;
          }), getIndexByKeyPath: function(e4) {
            return i3[en(e4)];
          } };
          return i3[":id"] = r3.primaryKey, null != e3 && (i3[en(e3)] = r3.primaryKey), r3;
        }) }, hasGetAll: 0 < o2.length && "getAll" in s2 && !("undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604), hasIdb3Features: "getAllRecords" in s2 }, o2 = t2.schema, a2 = t2.hasGetAll, u2 = t2.hasIdb3Features, s2 = o2.tables.map(n2), c2 = {};
        return s2.forEach(function(e3) {
          return c2[e3.name] = e3;
        }), { stack: "dbcore", transaction: e2.transaction.bind(e2), table: function(e3) {
          if (c2[e3]) return c2[e3];
          throw new Error("Table '".concat(e3, "' not found"));
        }, MIN_KEY: -1 / 0, MAX_KEY: Xt(i2), schema: o2 };
      }
      function nn(e2, t2, n2, r2) {
        n2 = n2.IDBKeyRange;
        return t2 = tn(t2, n2, r2), { dbcore: e2.dbcore.reduce(function(e3, t3) {
          t3 = t3.create;
          return _(_({}, e3), t3(e3));
        }, t2) };
      }
      function rn(n2, e2) {
        var t2 = e2.db, t2 = nn(n2._middlewares, t2, n2._deps, e2);
        n2.core = t2.dbcore, n2.tables.forEach(function(e3) {
          var t3 = e3.name;
          n2.core.schema.tables.some(function(e4) {
            return e4.name === t3;
          }) && (e3.core = n2.core.table(t3), n2[t3] instanceof n2.Table) && (n2[t3].core = e3.core);
        });
      }
      function on(i2, e2, t2, o2) {
        t2.forEach(function(n2) {
          var r2 = o2[n2];
          e2.forEach(function(e3) {
            var t3 = function e4(t4, n3) {
              return z(t4, n3) || (t4 = F(t4)) && e4(t4, n3);
            }(e3, n2);
            (!t3 || "value" in t3 && void 0 === t3.value) && (e3 === i2.Transaction.prototype || e3 instanceof i2.Transaction ? u(e3, n2, { get: function() {
              return this.table(n2);
            }, set: function(e4) {
              L(this, n2, { value: e4, writable: true, configurable: true, enumerable: true });
            } }) : e3[n2] = new i2.Table(n2, r2));
          });
        });
      }
      function an(n2, e2) {
        e2.forEach(function(e3) {
          for (var t2 in e3) e3[t2] instanceof n2.Table && delete e3[t2];
        });
      }
      function un(e2, t2) {
        return e2._cfg.version - t2._cfg.version;
      }
      function sn(n2, r2, i2, e2) {
        var o2 = n2._dbSchema, a2 = (i2.objectStoreNames.contains("$meta") && !o2.$meta && (o2.$meta = Gt("$meta", vn("")[0], []), n2._storeNames.push("$meta")), n2._createTransaction("readwrite", n2._storeNames, o2)), u2 = (a2.create(i2), a2._completion.catch(e2), a2._reject.bind(a2)), s2 = P.transless || P;
        v(function() {
          if (P.trans = a2, P.transless = s2, 0 !== r2) return rn(n2, i2), t2 = r2, ((e3 = a2).storeNames.includes("$meta") ? e3.table("$meta").get("version").then(function(e4) {
            return null != e4 ? e4 : t2;
          }) : K.resolve(t2)).then(function(e4) {
            var s3 = n2, c2 = e4, l2 = a2, f2 = i2, t3 = [], e4 = s3._versions, h2 = s3._dbSchema = pn(0, s3.idbdb, f2);
            return 0 === (e4 = e4.filter(function(e5) {
              return e5._cfg.version >= c2;
            })).length ? K.resolve() : (e4.forEach(function(u3) {
              t3.push(function() {
                var t4, n3, r3, i3 = h2, e5 = u3._cfg.dbschema, o3 = (yn(s3, i3, f2), yn(s3, e5, f2), h2 = s3._dbSchema = e5, ln(i3, e5)), a3 = (o3.add.forEach(function(e6) {
                  fn(f2, e6[0], e6[1].primKey, e6[1].indexes);
                }), o3.change.forEach(function(e6) {
                  if (e6.recreate) throw new k.Upgrade("Not yet support for changing primary key");
                  var t5 = f2.objectStore(e6.name);
                  e6.add.forEach(function(e7) {
                    return dn(t5, e7);
                  }), e6.change.forEach(function(e7) {
                    t5.deleteIndex(e7.name), dn(t5, e7);
                  }), e6.del.forEach(function(e7) {
                    return t5.deleteIndex(e7);
                  });
                }), u3._cfg.contentUpgrade);
                if (a3 && u3._cfg.version > c2) return rn(s3, f2), l2._memoizedTables = {}, t4 = G(e5), o3.del.forEach(function(e6) {
                  t4[e6] = i3[e6];
                }), an(s3, [s3.Transaction.prototype]), on(s3, [s3.Transaction.prototype], O(t4), t4), l2.schema = t4, (n3 = ue(a3)) && nt(), e5 = K.follow(function() {
                  var e6;
                  (r3 = a3(l2)) && n3 && (e6 = w.bind(null, null), r3.then(e6, e6));
                }), r3 && "function" == typeof r3.then ? K.resolve(r3) : e5.then(function() {
                  return r3;
                });
              }), t3.push(function(e5) {
                var t4, n3, r3 = u3._cfg.dbschema;
                t4 = r3, n3 = e5, [].slice.call(n3.db.objectStoreNames).forEach(function(e6) {
                  return null == t4[e6] && n3.db.deleteObjectStore(e6);
                }), an(s3, [s3.Transaction.prototype]), on(s3, [s3.Transaction.prototype], s3._storeNames, s3._dbSchema), l2.schema = s3._dbSchema;
              }), t3.push(function(e5) {
                s3.idbdb.objectStoreNames.contains("$meta") && (Math.ceil(s3.idbdb.version / 10) === u3._cfg.version ? (s3.idbdb.deleteObjectStore("$meta"), delete s3._dbSchema.$meta, s3._storeNames = s3._storeNames.filter(function(e6) {
                  return "$meta" !== e6;
                })) : e5.objectStore("$meta").put(u3._cfg.version, "version"));
              });
            }), function e5() {
              return t3.length ? K.resolve(t3.shift()(l2.idbtrans)).then(e5) : K.resolve();
            }().then(function() {
              hn(h2, f2);
            }));
          }).catch(u2);
          var e3, t2;
          O(o2).forEach(function(e4) {
            fn(i2, e4, o2[e4].primKey, o2[e4].indexes);
          }), rn(n2, i2), K.follow(function() {
            return n2.on.populate.fire(a2);
          }).catch(u2);
        });
      }
      function cn(e2, r2) {
        hn(e2._dbSchema, r2), r2.db.version % 10 != 0 || r2.objectStoreNames.contains("$meta") || r2.db.createObjectStore("$meta").add(Math.ceil(r2.db.version / 10 - 1), "version");
        var t2 = pn(0, e2.idbdb, r2);
        yn(e2, e2._dbSchema, r2);
        for (var n2 = 0, i2 = ln(t2, e2._dbSchema).change; n2 < i2.length; n2++) {
          var o2 = ((t3) => {
            if (t3.change.length || t3.recreate) return console.warn("Unable to patch indexes of table ".concat(t3.name, " because it has changes on the type of index or primary key.")), { value: void 0 };
            var n3 = r2.objectStore(t3.name);
            t3.add.forEach(function(e3) {
              l && console.debug("Dexie upgrade patch: Creating missing index ".concat(t3.name, ".").concat(e3.src)), dn(n3, e3);
            });
          })(i2[n2]);
          if ("object" == typeof o2) return o2.value;
        }
      }
      function ln(e2, t2) {
        var n2, r2 = { del: [], add: [], change: [] };
        for (n2 in e2) t2[n2] || r2.del.push(n2);
        for (n2 in t2) {
          var i2 = e2[n2], o2 = t2[n2];
          if (i2) {
            var a2 = { name: n2, def: o2, recreate: false, del: [], add: [], change: [] };
            if ("" + (i2.primKey.keyPath || "") != "" + (o2.primKey.keyPath || "") || i2.primKey.auto !== o2.primKey.auto) a2.recreate = true, r2.change.push(a2);
            else {
              var u2 = i2.idxByName, s2 = o2.idxByName, c2 = void 0;
              for (c2 in u2) s2[c2] || a2.del.push(c2);
              for (c2 in s2) {
                var l2 = u2[c2], f2 = s2[c2];
                l2 ? l2.src !== f2.src && a2.change.push(f2) : a2.add.push(f2);
              }
              (0 < a2.del.length || 0 < a2.add.length || 0 < a2.change.length) && r2.change.push(a2);
            }
          } else r2.add.push([n2, o2]);
        }
        return r2;
      }
      function fn(e2, t2, n2, r2) {
        var i2 = e2.db.createObjectStore(t2, n2.keyPath ? { keyPath: n2.keyPath, autoIncrement: n2.auto } : { autoIncrement: n2.auto });
        r2.forEach(function(e3) {
          return dn(i2, e3);
        });
      }
      function hn(t2, n2) {
        O(t2).forEach(function(e2) {
          n2.db.objectStoreNames.contains(e2) || (l && console.debug("Dexie: Creating missing table", e2), fn(n2, e2, t2[e2].primKey, t2[e2].indexes));
        });
      }
      function dn(e2, t2) {
        e2.createIndex(t2.name, t2.keyPath, { unique: t2.unique, multiEntry: t2.multi });
      }
      function pn(e2, t2, u2) {
        var s2 = {};
        return W(t2.objectStoreNames, 0).forEach(function(e3) {
          for (var t3 = u2.objectStore(e3), n2 = $t(Qt(a2 = t3.keyPath), a2 || "", true, false, !!t3.autoIncrement, a2 && "string" != typeof a2, true), r2 = [], i2 = 0; i2 < t3.indexNames.length; ++i2) {
            var o2 = t3.index(t3.indexNames[i2]), a2 = o2.keyPath, o2 = $t(o2.name, a2, !!o2.unique, !!o2.multiEntry, false, a2 && "string" != typeof a2, false);
            r2.push(o2);
          }
          s2[e3] = Gt(e3, n2, r2);
        }), s2;
      }
      function yn(e2, t2, n2) {
        for (var r2 = n2.db.objectStoreNames, i2 = 0; i2 < r2.length; ++i2) {
          var o2 = r2[i2], a2 = n2.objectStore(o2);
          e2._hasGetAll = "getAll" in a2;
          for (var u2 = 0; u2 < a2.indexNames.length; ++u2) {
            var s2, c2 = a2.indexNames[u2], l2 = a2.index(c2).keyPath, l2 = "string" == typeof l2 ? l2 : "[" + W(l2).join("+") + "]";
            t2[o2] && (s2 = t2[o2].idxByName[l2]) && (s2.name = c2, delete t2[o2].idxByName[l2], t2[o2].idxByName[c2] = s2);
          }
        }
        "undefined" != typeof navigator && /Safari/.test(navigator.userAgent) && !/(Chrome\/|Edge\/)/.test(navigator.userAgent) && f.WorkerGlobalScope && f instanceof f.WorkerGlobalScope && [].concat(navigator.userAgent.match(/Safari\/(\d*)/))[1] < 604 && (e2._hasGetAll = false);
      }
      function vn(e2) {
        return e2.split(",").map(function(e3, t2) {
          var n2 = e3.split(":"), r2 = null == (r2 = n2[1]) ? void 0 : r2.trim(), n2 = (e3 = n2[0].trim()).replace(/([&*]|\+\+)/g, ""), i2 = /^\[/.test(n2) ? n2.match(/^\[(.*)\]$/)[1].split("+") : n2;
          return $t(n2, i2 || null, /\&/.test(e3), /\*/.test(e3), /\+\+/.test(e3), x(i2), 0 === t2, r2);
        });
      }
      bn.prototype._createTableSchema = Gt, bn.prototype._parseIndexSyntax = vn, bn.prototype._parseStoresSpec = function(r2, i2) {
        var o2 = this;
        O(r2).forEach(function(e2) {
          if (null !== r2[e2]) {
            var t2 = o2._parseIndexSyntax(r2[e2]), n2 = t2.shift();
            if (!n2) throw new k.Schema("Invalid schema for table " + e2 + ": " + r2[e2]);
            if (n2.unique = true, n2.multi) throw new k.Schema("Primary key cannot be multiEntry*");
            t2.forEach(function(e3) {
              if (e3.auto) throw new k.Schema("Only primary key can be marked as autoIncrement (++)");
              if (!e3.keyPath) throw new k.Schema("Index must have a name and cannot be an empty string");
            });
            n2 = o2._createTableSchema(e2, n2, t2);
            i2[e2] = n2;
          }
        });
      }, bn.prototype.stores = function(e2) {
        var t2 = this.db, e2 = (this._cfg.storesSource = this._cfg.storesSource ? a(this._cfg.storesSource, e2) : e2, t2._versions), n2 = {}, r2 = {};
        return e2.forEach(function(e3) {
          a(n2, e3._cfg.storesSource), r2 = e3._cfg.dbschema = {}, e3._parseStoresSpec(n2, r2);
        }), t2._dbSchema = r2, an(t2, [t2._allTables, t2, t2.Transaction.prototype]), on(t2, [t2._allTables, t2, t2.Transaction.prototype, this._cfg.tables], O(r2), r2), t2._storeNames = O(r2), this;
      }, bn.prototype.upgrade = function(e2) {
        return this._cfg.contentUpgrade = ke(this._cfg.contentUpgrade || g, e2), this;
      };
      var mn = bn;
      function bn() {
      }
      var gn = (() => {
        var i2, o2, t2;
        return "undefined" != typeof FinalizationRegistry && "undefined" != typeof WeakRef ? (i2 = /* @__PURE__ */ new Set(), o2 = new FinalizationRegistry(function(e2) {
          i2.delete(e2);
        }), { toArray: function() {
          return Array.from(i2).map(function(e2) {
            return e2.deref();
          }).filter(function(e2) {
            return void 0 !== e2;
          });
        }, add: function(e2) {
          var t3 = new WeakRef(e2._novip);
          i2.add(t3), o2.register(e2._novip, t3, t3), i2.size > e2._options.maxConnections && (t3 = i2.values().next().value, i2.delete(t3), o2.unregister(t3));
        }, remove: function(e2) {
          if (e2) for (var t3 = i2.values(), n2 = t3.next(); !n2.done; ) {
            var r2 = n2.value;
            if (r2.deref() === e2._novip) return i2.delete(r2), void o2.unregister(r2);
            n2 = t3.next();
          }
        } }) : (t2 = [], { toArray: function() {
          return t2;
        }, add: function(e2) {
          t2.push(e2._novip);
        }, remove: function(e2) {
          e2 && -1 !== (e2 = t2.indexOf(e2._novip)) && t2.splice(e2, 1);
        } });
      })();
      function wn(e2, t2) {
        var n2 = e2._dbNamesDB;
        return n2 || (n2 = e2._dbNamesDB = new y(ft, { addons: [], indexedDB: e2, IDBKeyRange: t2 })).version(1).stores({ dbnames: "name" }), n2.table("dbnames");
      }
      function _n(e2) {
        return e2 && "function" == typeof e2.databases;
      }
      function xn(e2) {
        return v(function() {
          return P.letThrough = true, e2();
        });
      }
      function kn(e2) {
        return !("from" in e2);
      }
      var q = function(e2, t2) {
        var n2;
        if (!this) return n2 = new q(), e2 && "d" in e2 && a(n2, e2), n2;
        a(this, arguments.length ? { d: 1, from: e2, to: 1 < arguments.length ? t2 : e2 } : { d: 0 });
      };
      function On(e2, t2, n2) {
        var r2 = C(t2, n2);
        if (!isNaN(r2)) {
          if (0 < r2) throw RangeError();
          if (kn(e2)) return a(e2, { from: t2, to: n2, d: 1 });
          var r2 = e2.l, i2 = e2.r;
          if (C(n2, e2.from) < 0) return r2 ? On(r2, t2, n2) : e2.l = { from: t2, to: n2, d: 1, l: null, r: null }, Sn(e2);
          if (0 < C(t2, e2.to)) return i2 ? On(i2, t2, n2) : e2.r = { from: t2, to: n2, d: 1, l: null, r: null }, Sn(e2);
          C(t2, e2.from) < 0 && (e2.from = t2, e2.l = null, e2.d = i2 ? i2.d + 1 : 1), 0 < C(n2, e2.to) && (e2.to = n2, e2.r = null, e2.d = e2.l ? e2.l.d + 1 : 1);
          t2 = !e2.r;
          r2 && !e2.l && Pn(e2, r2), i2 && t2 && Pn(e2, i2);
        }
      }
      function Pn(e2, t2) {
        kn(t2) || function e3(t3, n2) {
          var r2 = n2.from, i2 = n2.l, o2 = n2.r;
          On(t3, r2, n2.to), i2 && e3(t3, i2), o2 && e3(t3, o2);
        }(e2, t2);
      }
      function Kn(e2, t2) {
        var n2 = En(t2), r2 = n2.next();
        if (!r2.done) for (var i2 = r2.value, o2 = En(e2), a2 = o2.next(i2.from), u2 = a2.value; !r2.done && !a2.done; ) {
          if (C(u2.from, i2.to) <= 0 && 0 <= C(u2.to, i2.from)) return true;
          C(i2.from, u2.from) < 0 ? i2 = (r2 = n2.next(u2.from)).value : u2 = (a2 = o2.next(i2.from)).value;
        }
        return false;
      }
      function En(e2) {
        var n2 = kn(e2) ? null : { s: 0, n: e2 };
        return { next: function(e3) {
          for (var t2 = 0 < arguments.length; n2; ) switch (n2.s) {
            case 0:
              if (n2.s = 1, t2) for (; n2.n.l && C(e3, n2.n.from) < 0; ) n2 = { up: n2, n: n2.n.l, s: 1 };
              else for (; n2.n.l; ) n2 = { up: n2, n: n2.n.l, s: 1 };
            case 1:
              if (n2.s = 2, !t2 || C(e3, n2.n.to) <= 0) return { value: n2.n, done: false };
            case 2:
              if (n2.n.r) {
                n2.s = 3, n2 = { up: n2, n: n2.n.r, s: 0 };
                continue;
              }
            case 3:
              n2 = n2.up;
          }
          return { done: true };
        } };
      }
      function Sn(e2) {
        var t2, n2, r2, i2 = ((null == (i2 = e2.r) ? void 0 : i2.d) || 0) - ((null == (i2 = e2.l) ? void 0 : i2.d) || 0), i2 = 1 < i2 ? "r" : i2 < -1 ? "l" : "";
        i2 && (t2 = "r" == i2 ? "l" : "r", n2 = _({}, e2), r2 = e2[i2], e2.from = r2.from, e2.to = r2.to, e2[i2] = r2[i2], n2[i2] = r2[t2], (e2[t2] = n2).d = An(n2)), e2.d = An(e2);
      }
      function An(e2) {
        var t2 = e2.r, e2 = e2.l;
        return (t2 ? e2 ? Math.max(t2.d, e2.d) : t2.d : e2 ? e2.d : 0) + 1;
      }
      function Cn(t2, n2) {
        return O(n2).forEach(function(e2) {
          t2[e2] ? Pn(t2[e2], n2[e2]) : t2[e2] = function e3(t3) {
            var n3, r2, i2 = {};
            for (n3 in t3) m(t3, n3) && (r2 = t3[n3], i2[n3] = !r2 || "object" != typeof r2 || J.has(r2.constructor) ? r2 : e3(r2));
            return i2;
          }(n2[e2]);
        }), t2;
      }
      function jn(t2, n2) {
        return t2.all || n2.all || Object.keys(t2).some(function(e2) {
          return n2[e2] && Kn(n2[e2], t2[e2]);
        });
      }
      M(q.prototype, ((t = { add: function(e2) {
        return Pn(this, e2), this;
      }, addKey: function(e2) {
        return On(this, e2, e2), this;
      }, addKeys: function(e2) {
        var t2 = this;
        return e2.forEach(function(e3) {
          return On(t2, e3, e3);
        }), this;
      }, hasKey: function(e2) {
        var t2 = En(this).next(e2).value;
        return t2 && C(t2.from, e2) <= 0 && 0 <= C(t2.to, e2);
      } })[re] = function() {
        return En(this);
      }, t));
      var Tn = {}, In = {}, qn = false;
      function Dn(e2) {
        Cn(In, e2), qn || (qn = true, setTimeout(function() {
          qn = false, Bn(In, !(In = {}));
        }, 0));
      }
      function Bn(e2, t2) {
        void 0 === t2 && (t2 = false);
        var n2 = /* @__PURE__ */ new Set();
        if (e2.all) for (var r2 = 0, i2 = Object.values(Tn); r2 < i2.length; r2++) Rn(u2 = i2[r2], e2, n2, t2);
        else for (var o2 in e2) {
          var a2, u2, o2 = /^idb\:\/\/(.*)\/(.*)\//.exec(o2);
          o2 && (a2 = o2[1], o2 = o2[2], u2 = Tn["idb://".concat(a2, "/").concat(o2)]) && Rn(u2, e2, n2, t2);
        }
        n2.forEach(function(e3) {
          return e3();
        });
      }
      function Rn(e2, t2, n2, r2) {
        for (var i2 = [], o2 = 0, a2 = Object.entries(e2.queries.query); o2 < a2.length; o2++) {
          for (var u2 = a2[o2], s2 = u2[0], c2 = [], l2 = 0, f2 = u2[1]; l2 < f2.length; l2++) {
            var h2 = f2[l2];
            jn(t2, h2.obsSet) ? h2.subscribers.forEach(function(e3) {
              return n2.add(e3);
            }) : r2 && c2.push(h2);
          }
          r2 && i2.push([s2, c2]);
        }
        if (r2) for (var d2 = 0, p2 = i2; d2 < p2.length; d2++) {
          var y2 = p2[d2], s2 = y2[0], c2 = y2[1];
          e2.queries.query[s2] = c2;
        }
      }
      function Fn(h2) {
        var d2 = h2._state, r2 = h2._deps.indexedDB;
        if (d2.isBeingOpened || h2.idbdb) return d2.dbReadyPromise.then(function() {
          return d2.dbOpenError ? S(d2.dbOpenError) : h2;
        });
        d2.isBeingOpened = true, d2.dbOpenError = null, d2.openComplete = false;
        var t2 = d2.openCanceller, p2 = Math.round(10 * h2.verno), y2 = false;
        function e2() {
          if (d2.openCanceller !== t2) throw new k.DatabaseClosed("db.open() was cancelled");
        }
        function v2() {
          return new K(function(c2, n3) {
            if (e2(), !r2) throw new k.MissingAPI();
            var l2 = h2.name, f2 = d2.autoSchema || !p2 ? r2.open(l2) : r2.open(l2, p2);
            if (!f2) throw new k.MissingAPI();
            f2.onerror = I(n3), f2.onblocked = E(h2._fireOnBlocked), f2.onupgradeneeded = E(function(e3) {
              var t3;
              m2 = f2.transaction, d2.autoSchema && !h2._options.allowEmptyDB ? (f2.onerror = Ut, m2.abort(), f2.result.close(), (t3 = r2.deleteDatabase(l2)).onsuccess = t3.onerror = E(function() {
                n3(new k.NoSuchDatabase("Database ".concat(l2, " doesnt exist")));
              })) : (m2.onerror = I(n3), t3 = e3.oldVersion > Math.pow(2, 62) ? 0 : e3.oldVersion, b2 = t3 < 1, h2.idbdb = f2.result, y2 && cn(h2, m2), sn(h2, t3 / 10, m2, n3));
            }, n3), f2.onsuccess = E(function() {
              m2 = null;
              var e3, t3, n4, r3, i3, o2, a2 = h2.idbdb = f2.result, u2 = W(a2.objectStoreNames);
              if (0 < u2.length) try {
                var s2 = a2.transaction(1 === (i3 = u2).length ? i3[0] : i3, "readonly");
                if (d2.autoSchema) o2 = a2, r3 = s2, (n4 = h2).verno = o2.version / 10, r3 = n4._dbSchema = pn(0, o2, r3), n4._storeNames = W(o2.objectStoreNames, 0), on(n4, [n4._allTables], O(r3), r3);
                else if (yn(h2, h2._dbSchema, s2), t3 = s2, ((t3 = ln(pn(0, (e3 = h2).idbdb, t3), e3._dbSchema)).add.length || t3.change.some(function(e4) {
                  return e4.add.length || e4.change.length;
                })) && !y2) return console.warn("Dexie SchemaDiff: Schema was extended without increasing the number passed to db.version(). Dexie will add missing parts and increment native version number to workaround this."), a2.close(), p2 = a2.version + 1, y2 = true, c2(v2());
                rn(h2, s2);
              } catch (e4) {
              }
              gn.add(h2), a2.onversionchange = E(function(e4) {
                d2.vcFired = true, h2.on("versionchange").fire(e4);
              }), a2.onclose = E(function() {
                h2.close({ disableAutoOpen: false });
              }), b2 && (u2 = h2._deps, i3 = l2, _n(o2 = u2.indexedDB) || i3 === ft || wn(o2, u2.IDBKeyRange).put({ name: i3 }).catch(g)), c2();
            }, n3);
          }).catch(function(e3) {
            switch (null == e3 ? void 0 : e3.name) {
              case "UnknownError":
                if (0 < d2.PR1398_maxLoop) return d2.PR1398_maxLoop--, console.warn("Dexie: Workaround for Chrome UnknownError on open()"), v2();
                break;
              case "VersionError":
                if (0 < p2) return p2 = 0, v2();
            }
            return K.reject(e3);
          });
        }
        var n2, i2 = d2.dbReadyResolve, m2 = null, b2 = false;
        return K.race([t2, ("undefined" == typeof navigator ? K.resolve() : !navigator.userAgentData && /Safari\//.test(navigator.userAgent) && !/Chrom(e|ium)\//.test(navigator.userAgent) && indexedDB.databases ? new Promise(function(e3) {
          function t3() {
            return indexedDB.databases().finally(e3);
          }
          n2 = setInterval(t3, 100), t3();
        }).finally(function() {
          return clearInterval(n2);
        }) : Promise.resolve()).then(v2)]).then(function() {
          return e2(), d2.onReadyBeingFired = [], K.resolve(xn(function() {
            return h2.on.ready.fire(h2.vip);
          })).then(function e3() {
            var t3;
            if (0 < d2.onReadyBeingFired.length) return t3 = d2.onReadyBeingFired.reduce(ke, g), d2.onReadyBeingFired = [], K.resolve(xn(function() {
              return t3(h2.vip);
            })).then(e3);
          });
        }).finally(function() {
          d2.openCanceller === t2 && (d2.onReadyBeingFired = null, d2.isBeingOpened = false);
        }).catch(function(e3) {
          d2.dbOpenError = e3;
          try {
            m2 && m2.abort();
          } catch (e4) {
          }
          return t2 === d2.openCanceller && h2._close(), S(e3);
        }).finally(function() {
          d2.openComplete = true, i2();
        }).then(function() {
          var n3;
          return b2 && (n3 = {}, h2.tables.forEach(function(t3) {
            t3.schema.indexes.forEach(function(e3) {
              e3.name && (n3["idb://".concat(h2.name, "/").concat(t3.name, "/").concat(e3.name)] = new q(-1 / 0, [[[]]]));
            }), n3["idb://".concat(h2.name, "/").concat(t3.name, "/")] = n3["idb://".concat(h2.name, "/").concat(t3.name, "/:dels")] = new q(-1 / 0, [[[]]]);
          }), Wt(zt).fire(n3), Bn(n3, true)), h2;
        });
      }
      function Nn(t2) {
        function e2(e3) {
          return t2.next(e3);
        }
        var r2 = n2(e2), i2 = n2(function(e3) {
          return t2.throw(e3);
        });
        function n2(n3) {
          return function(e3) {
            var e3 = n3(e3), t3 = e3.value;
            return e3.done ? t3 : t3 && "function" == typeof t3.then ? t3.then(r2, i2) : x(t3) ? Promise.all(t3).then(r2, i2) : r2(t3);
          };
        }
        return n2(e2)();
      }
      function Mn(e2, t2, n2) {
        for (var r2 = x(e2) ? e2.slice() : [e2], i2 = 0; i2 < n2; ++i2) r2.push(t2);
        return r2;
      }
      var Ln = { stack: "dbcore", name: "VirtualIndexMiddleware", level: 1, create: function(l2) {
        return _(_({}, l2), { table: function(e2) {
          var o2 = l2.table(e2), e2 = o2.schema, u2 = {}, s2 = [];
          function c2(e3, t3, n3) {
            var r3 = en(e3), i3 = u2[r3] = u2[r3] || [], o3 = null == e3 ? 0 : "string" == typeof e3 ? 1 : e3.length, a3 = 0 < t3, r3 = _(_({}, n3), { name: a3 ? "".concat(r3, "(virtual-from:").concat(n3.name, ")") : n3.name, lowLevelIndex: n3, isVirtual: a3, keyTail: t3, keyLength: o3, extractKey: Ht(e3), unique: !a3 && n3.unique });
            return i3.push(r3), r3.isPrimaryKey || s2.push(r3), 1 < o3 && c2(2 === o3 ? e3[0] : e3.slice(0, o3 - 1), t3 + 1, n3), i3.sort(function(e4, t4) {
              return e4.keyTail - t4.keyTail;
            }), r3;
          }
          var t2 = c2(e2.primaryKey.keyPath, 0, e2.primaryKey);
          u2[":id"] = [t2];
          for (var n2 = 0, r2 = e2.indexes; n2 < r2.length; n2++) {
            var i2 = r2[n2];
            c2(i2.keyPath, 0, i2);
          }
          function a2(e3) {
            var t3, n3 = e3.query.index;
            return n3.isVirtual ? _(_({}, e3), { query: { index: n3.lowLevelIndex, range: (t3 = e3.query.range, n3 = n3.keyTail, { type: 1 === t3.type ? 2 : t3.type, lower: Mn(t3.lower, t3.lowerOpen ? l2.MAX_KEY : l2.MIN_KEY, n3), lowerOpen: true, upper: Mn(t3.upper, t3.upperOpen ? l2.MIN_KEY : l2.MAX_KEY, n3), upperOpen: true }) } }) : e3;
          }
          return _(_({}, o2), { schema: _(_({}, e2), { primaryKey: t2, indexes: s2, getIndexByKeyPath: function(e3) {
            return (e3 = u2[en(e3)]) && e3[0];
          } }), count: function(e3) {
            return o2.count(a2(e3));
          }, query: function(e3) {
            return o2.query(a2(e3));
          }, openCursor: function(t3) {
            var e3 = t3.query.index, r3 = e3.keyTail, i3 = e3.keyLength;
            return e3.isVirtual ? o2.openCursor(a2(t3)).then(function(e4) {
              return e4 && n3(e4);
            }) : o2.openCursor(t3);
            function n3(n4) {
              return Object.create(n4, { continue: { value: function(e4) {
                null != e4 ? n4.continue(Mn(e4, t3.reverse ? l2.MAX_KEY : l2.MIN_KEY, r3)) : t3.unique ? n4.continue(n4.key.slice(0, i3).concat(t3.reverse ? l2.MIN_KEY : l2.MAX_KEY, r3)) : n4.continue();
              } }, continuePrimaryKey: { value: function(e4, t4) {
                n4.continuePrimaryKey(Mn(e4, l2.MAX_KEY, r3), t4);
              } }, primaryKey: { get: function() {
                return n4.primaryKey;
              } }, key: { get: function() {
                var e4 = n4.key;
                return 1 === i3 ? e4[0] : e4.slice(0, i3);
              } }, value: { get: function() {
                return n4.value;
              } } });
            }
          } });
        } });
      } };
      function Un(i2, o2, a2, u2) {
        return a2 = a2 || {}, u2 = u2 || "", O(i2).forEach(function(e2) {
          var t2, n2, r2;
          m(o2, e2) ? (t2 = i2[e2], n2 = o2[e2], "object" == typeof t2 && "object" == typeof n2 && t2 && n2 ? (r2 = ne(t2)) !== ne(n2) ? a2[u2 + e2] = o2[e2] : "Object" === r2 ? Un(t2, n2, a2, u2 + e2 + ".") : t2 !== n2 && (a2[u2 + e2] = o2[e2]) : t2 !== n2 && (a2[u2 + e2] = o2[e2])) : a2[u2 + e2] = void 0;
        }), O(o2).forEach(function(e2) {
          m(i2, e2) || (a2[u2 + e2] = o2[e2]);
        }), a2;
      }
      function zn(e2, t2) {
        return "delete" === t2.type ? t2.keys : t2.keys || t2.values.map(e2.extractKey);
      }
      var Vn = { stack: "dbcore", name: "HooksMiddleware", level: 2, create: function(e2) {
        return _(_({}, e2), { table: function(r2) {
          var y2 = e2.table(r2), v2 = y2.schema.primaryKey;
          return _(_({}, y2), { mutate: function(e3) {
            var t2 = P.trans, n2 = t2.table(r2).hook, h2 = n2.deleting, d2 = n2.creating, p2 = n2.updating;
            switch (e3.type) {
              case "add":
                if (d2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "put":
                if (d2.fire === g && p2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "delete":
                if (h2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return a2(e3);
                }, true);
              case "deleteRange":
                if (h2.fire === g) break;
                return t2._promise("readwrite", function() {
                  return function n3(r3, i2, o2) {
                    return y2.query({ trans: r3, values: false, query: { index: v2, range: i2 }, limit: o2 }).then(function(e4) {
                      var t3 = e4.result;
                      return a2({ type: "delete", keys: t3, trans: r3 }).then(function(e5) {
                        return 0 < e5.numFailures ? Promise.reject(e5.failures[0]) : t3.length < o2 ? { failures: [], numFailures: 0, lastResult: void 0 } : n3(r3, _(_({}, i2), { lower: t3[t3.length - 1], lowerOpen: true }), o2);
                      });
                    });
                  }(e3.trans, e3.range, 1e4);
                }, true);
            }
            return y2.mutate(e3);
            function a2(c2) {
              var e4, t3, n3, l2 = P.trans, f2 = c2.keys || zn(v2, c2);
              if (f2) return "delete" !== (c2 = "add" === c2.type || "put" === c2.type ? _(_({}, c2), { keys: f2 }) : _({}, c2)).type && (c2.values = R([], c2.values)), c2.keys && (c2.keys = R([], c2.keys)), e4 = y2, n3 = f2, ("add" === (t3 = c2).type ? Promise.resolve([]) : e4.getMany({ trans: t3.trans, keys: n3, cache: "immutable" })).then(function(u2) {
                var s2 = f2.map(function(e5, t4) {
                  var n4, r3, i2, o2 = u2[t4], a3 = { onerror: null, onsuccess: null };
                  return "delete" === c2.type ? h2.fire.call(a3, e5, o2, l2) : "add" === c2.type || void 0 === o2 ? (n4 = d2.fire.call(a3, e5, c2.values[t4], l2), null == e5 && null != n4 && (c2.keys[t4] = e5 = n4, v2.outbound || b(c2.values[t4], v2.keyPath, e5))) : (n4 = Un(o2, c2.values[t4]), (r3 = p2.fire.call(a3, n4, e5, o2, l2)) && (i2 = c2.values[t4], Object.keys(r3).forEach(function(e6) {
                    m(i2, e6) ? i2[e6] = r3[e6] : b(i2, e6, r3[e6]);
                  }))), a3;
                });
                return y2.mutate(c2).then(function(e5) {
                  for (var t4 = e5.failures, n4 = e5.results, r3 = e5.numFailures, e5 = e5.lastResult, i2 = 0; i2 < f2.length; ++i2) {
                    var o2 = (n4 || f2)[i2], a3 = s2[i2];
                    null == o2 ? a3.onerror && a3.onerror(t4[i2]) : a3.onsuccess && a3.onsuccess("put" === c2.type && u2[i2] ? c2.values[i2] : o2);
                  }
                  return { failures: t4, results: n4, numFailures: r3, lastResult: e5 };
                }).catch(function(t4) {
                  return s2.forEach(function(e5) {
                    return e5.onerror && e5.onerror(t4);
                  }), Promise.reject(t4);
                });
              });
              throw new Error("Keys missing");
            }
          } });
        } });
      } };
      function Wn(e2, t2, n2) {
        try {
          if (!t2) return null;
          if (t2.keys.length < e2.length) return null;
          for (var r2 = [], i2 = 0, o2 = 0; i2 < t2.keys.length && o2 < e2.length; ++i2) 0 === C(t2.keys[i2], e2[o2]) && (r2.push(n2 ? ee(t2.values[i2]) : t2.values[i2]), ++o2);
          return r2.length === e2.length ? r2 : null;
        } catch (e3) {
          return null;
        }
      }
      var Yn = { stack: "dbcore", level: -1, create: function(t2) {
        return { table: function(e2) {
          var n2 = t2.table(e2);
          return _(_({}, n2), { getMany: function(t3) {
            var e3;
            return t3.cache ? (e3 = Wn(t3.keys, t3.trans._cache, "clone" === t3.cache)) ? K.resolve(e3) : n2.getMany(t3).then(function(e4) {
              return t3.trans._cache = { keys: t3.keys, values: "clone" === t3.cache ? ee(e4) : e4 }, e4;
            }) : n2.getMany(t3);
          }, mutate: function(e3) {
            return "add" !== e3.type && (e3.trans._cache = null), n2.mutate(e3);
          } });
        } };
      } };
      function $n(e2, t2) {
        return "readonly" === e2.trans.mode && !!e2.subscr && !e2.trans.explicit && "disabled" !== e2.trans.db._options.cache && !t2.schema.primaryKey.outbound;
      }
      function Qn(e2, t2) {
        switch (e2) {
          case "query":
            return t2.values && !t2.unique;
          case "get":
          case "getMany":
          case "count":
          case "openCursor":
            return false;
        }
      }
      var Gn = { stack: "dbcore", level: 0, name: "Observability", create: function(b2) {
        var g2 = b2.schema.name, w2 = new q(b2.MIN_KEY, b2.MAX_KEY);
        return _(_({}, b2), { transaction: function(e2, t2, n2) {
          if (P.subscr && "readonly" !== t2) throw new k.ReadOnly("Readwrite transaction in liveQuery context. Querier source: ".concat(P.querier));
          return b2.transaction(e2, t2, n2);
        }, table: function(d2) {
          function e2(e3) {
            var t3, e3 = e3.query;
            return [t3 = e3.index, new q(null != (t3 = (e3 = e3.range).lower) ? t3 : b2.MIN_KEY, null != (t3 = e3.upper) ? t3 : b2.MAX_KEY)];
          }
          var p2 = b2.table(d2), y2 = p2.schema, v2 = y2.primaryKey, t2 = y2.indexes, c2 = v2.extractKey, l2 = v2.outbound, m2 = v2.autoIncrement && t2.filter(function(e3) {
            return e3.compound && e3.keyPath.includes(v2.keyPath);
          }), n2 = _(_({}, p2), { mutate: function(a2) {
            function u2(e4) {
              return e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4), n3[e4] || (n3[e4] = new q());
            }
            var e3, o2, s2, t3 = a2.trans, n3 = a2.mutatedParts || (a2.mutatedParts = {}), r2 = u2(""), i2 = u2(":dels"), c3 = a2.type, l3 = "deleteRange" === a2.type ? [a2.range] : "delete" === a2.type ? [a2.keys] : a2.values.length < 50 ? [zn(v2, a2).filter(function(e4) {
              return e4;
            }), a2.values] : [], f3 = l3[0], l3 = l3[1], h2 = a2.trans._cache;
            return x(f3) ? (r2.addKeys(f3), (c3 = "delete" === c3 || f3.length === l3.length ? Wn(f3, h2) : null) || i2.addKeys(f3), (c3 || l3) && (e3 = u2, o2 = c3, s2 = l3, y2.indexes.forEach(function(t4) {
              var n4 = e3(t4.name || "");
              function r3(e4) {
                return null != e4 ? t4.extractKey(e4) : null;
              }
              function i3(e4) {
                t4.multiEntry && x(e4) ? e4.forEach(function(e5) {
                  return n4.addKey(e5);
                }) : n4.addKey(e4);
              }
              (o2 || s2).forEach(function(e4, t5) {
                var n5 = o2 && r3(o2[t5]), t5 = s2 && r3(s2[t5]);
                0 !== C(n5, t5) && (null != n5 && i3(n5), null != t5) && i3(t5);
              });
            }))) : f3 ? (l3 = { from: null != (h2 = f3.lower) ? h2 : b2.MIN_KEY, to: null != (c3 = f3.upper) ? c3 : b2.MAX_KEY }, i2.add(l3), r2.add(l3)) : (r2.add(w2), i2.add(w2), y2.indexes.forEach(function(e4) {
              return u2(e4.name).add(w2);
            })), p2.mutate(a2).then(function(o3) {
              return !f3 || "add" !== a2.type && "put" !== a2.type || (r2.addKeys(o3.results), m2 && m2.forEach(function(t4) {
                for (var e4 = a2.values.map(function(e5) {
                  return t4.extractKey(e5);
                }), n4 = t4.keyPath.findIndex(function(e5) {
                  return e5 === v2.keyPath;
                }), r3 = 0, i3 = o3.results.length; r3 < i3; ++r3) e4[r3][n4] = o3.results[r3];
                u2(t4.name).addKeys(e4);
              })), t3.mutatedParts = Cn(t3.mutatedParts || {}, n3), o3;
            });
          } }), f2 = { get: function(e3) {
            return [v2, new q(e3.key)];
          }, getMany: function(e3) {
            return [v2, new q().addKeys(e3.keys)];
          }, count: e2, query: e2, openCursor: e2 };
          return O(f2).forEach(function(s2) {
            n2[s2] = function(i2) {
              var e3 = P.subscr, t3 = !!e3, n3 = $n(P, p2) && Qn(s2, i2) ? i2.obsSet = {} : e3;
              if (t3) {
                var o2, e3 = function(e4) {
                  e4 = "idb://".concat(g2, "/").concat(d2, "/").concat(e4);
                  return n3[e4] || (n3[e4] = new q());
                }, a2 = e3(""), u2 = e3(":dels"), t3 = f2[s2](i2), r2 = t3[0], t3 = t3[1];
                if (("query" === s2 && r2.isPrimaryKey && !i2.values ? u2 : e3(r2.name || "")).add(t3), !r2.isPrimaryKey) {
                  if ("count" !== s2) return o2 = "query" === s2 && l2 && i2.values && p2.query(_(_({}, i2), { values: false })), p2[s2].apply(this, arguments).then(function(t4) {
                    if ("query" === s2) {
                      if (l2 && i2.values) return o2.then(function(e5) {
                        e5 = e5.result;
                        return a2.addKeys(e5), t4;
                      });
                      var e4 = i2.values ? t4.result.map(c2) : t4.result;
                      (i2.values ? a2 : u2).addKeys(e4);
                    } else {
                      var n4, r3;
                      if ("openCursor" === s2) return r3 = i2.values, (n4 = t4) && Object.create(n4, { key: { get: function() {
                        return u2.addKey(n4.primaryKey), n4.key;
                      } }, primaryKey: { get: function() {
                        var e5 = n4.primaryKey;
                        return u2.addKey(e5), e5;
                      } }, value: { get: function() {
                        return r3 && a2.addKey(n4.primaryKey), n4.value;
                      } } });
                    }
                    return t4;
                  });
                  u2.add(w2);
                }
              }
              return p2[s2].apply(this, arguments);
            };
          }), n2;
        } });
      } };
      function Xn(e2, t2, n2) {
        var r2;
        return 0 === n2.numFailures ? t2 : "deleteRange" === t2.type || (r2 = t2.keys ? t2.keys.length : "values" in t2 && t2.values ? t2.values.length : 1, n2.numFailures === r2) ? null : (r2 = _({}, t2), x(r2.keys) && (r2.keys = r2.keys.filter(function(e3, t3) {
          return !(t3 in n2.failures);
        })), "values" in r2 && x(r2.values) && (r2.values = r2.values.filter(function(e3, t3) {
          return !(t3 in n2.failures);
        })), r2);
      }
      function Hn(e2, t2) {
        return n2 = e2, (void 0 === (r2 = t2).lower || (r2.lowerOpen ? 0 < C(n2, r2.lower) : 0 <= C(n2, r2.lower))) && (n2 = e2, void 0 === (r2 = t2).upper || (r2.upperOpen ? C(n2, r2.upper) < 0 : C(n2, r2.upper) <= 0));
        var n2, r2;
      }
      function Jn(e2, d2, t2, n2, r2, i2) {
        var o2, p2, y2, v2, m2, a2, u2;
        return !t2 || 0 === t2.length || (o2 = d2.query.index, p2 = o2.multiEntry, y2 = d2.query.range, v2 = n2.schema.primaryKey.extractKey, m2 = o2.extractKey, a2 = (o2.lowLevelIndex || o2).extractKey, (n2 = t2.reduce(function(e3, t3) {
          var n3 = e3, r3 = [];
          if ("add" === t3.type || "put" === t3.type) for (var i3 = new q(), o3 = t3.values.length - 1; 0 <= o3; --o3) {
            var a3, u3 = t3.values[o3], s2 = v2(u3);
            !i3.hasKey(s2) && (a3 = m2(u3), p2 && x(a3) ? a3.some(function(e4) {
              return Hn(e4, y2);
            }) : Hn(a3, y2)) && (i3.addKey(s2), r3.push(u3));
          }
          switch (t3.type) {
            case "add":
              var c2 = new q().addKeys(d2.values ? e3.map(function(e4) {
                return v2(e4);
              }) : e3), n3 = e3.concat(d2.values ? r3.filter(function(e4) {
                e4 = v2(e4);
                return !c2.hasKey(e4) && (c2.addKey(e4), true);
              }) : r3.map(function(e4) {
                return v2(e4);
              }).filter(function(e4) {
                return !c2.hasKey(e4) && (c2.addKey(e4), true);
              }));
              break;
            case "put":
              var l2 = new q().addKeys(t3.values.map(function(e4) {
                return v2(e4);
              }));
              n3 = e3.filter(function(e4) {
                return !l2.hasKey(d2.values ? v2(e4) : e4);
              }).concat(d2.values ? r3 : r3.map(function(e4) {
                return v2(e4);
              }));
              break;
            case "delete":
              var f2 = new q().addKeys(t3.keys);
              n3 = e3.filter(function(e4) {
                return !f2.hasKey(d2.values ? v2(e4) : e4);
              });
              break;
            case "deleteRange":
              var h2 = t3.range;
              n3 = e3.filter(function(e4) {
                return !Hn(v2(e4), h2);
              });
          }
          return n3;
        }, e2)) === e2) ? e2 : (u2 = function(e3, t3) {
          return C(a2(e3), a2(t3)) || C(v2(e3), v2(t3));
        }, n2.sort("prev" === d2.direction || "prevunique" === d2.direction ? function(e3, t3) {
          return u2(t3, e3);
        } : u2), d2.limit && d2.limit < 1 / 0 && (n2.length > d2.limit ? n2.length = d2.limit : e2.length === d2.limit && n2.length < d2.limit && (r2.dirty = true)), i2 ? Object.freeze(n2) : n2);
      }
      function Zn(e2, t2) {
        return 0 === C(e2.lower, t2.lower) && 0 === C(e2.upper, t2.upper) && !!e2.lowerOpen == !!t2.lowerOpen && !!e2.upperOpen == !!t2.upperOpen;
      }
      function er(e2, t2) {
        return ((e3, t3, n2, r2) => {
          if (void 0 === e3) return void 0 !== t3 ? -1 : 0;
          if (void 0 === t3) return 1;
          if (0 === (e3 = C(e3, t3))) {
            if (n2 && r2) return 0;
            if (n2) return 1;
            if (r2) return -1;
          }
          return e3;
        })(e2.lower, t2.lower, e2.lowerOpen, t2.lowerOpen) <= 0 && 0 <= ((e3, t3, n2, r2) => {
          if (void 0 === e3) return void 0 !== t3 ? 1 : 0;
          if (void 0 === t3) return -1;
          if (0 === (e3 = C(e3, t3))) {
            if (n2 && r2) return 0;
            if (n2) return -1;
            if (r2) return 1;
          }
          return e3;
        })(e2.upper, t2.upper, e2.upperOpen, t2.upperOpen);
      }
      function tr(n2, r2, i2, e2) {
        n2.subscribers.add(i2), e2.addEventListener("abort", function() {
          var e3, t2;
          n2.subscribers.delete(i2), 0 === n2.subscribers.size && (e3 = n2, t2 = r2, setTimeout(function() {
            0 === e3.subscribers.size && oe(t2, e3);
          }, 3e3));
        });
      }
      var nr = { stack: "dbcore", level: 0, name: "Cache", create: function(k2) {
        var O2 = k2.schema.name;
        return _(_({}, k2), { transaction: function(g2, w2, e2) {
          var _2, t2, x2 = k2.transaction(g2, w2, e2);
          return "readwrite" === w2 && (e2 = (_2 = new AbortController()).signal, x2.addEventListener("abort", (t2 = function(b2) {
            return function() {
              if (_2.abort(), "readwrite" === w2) {
                for (var t3 = /* @__PURE__ */ new Set(), e3 = 0, n2 = g2; e3 < n2.length; e3++) {
                  var r2 = n2[e3], i2 = Tn["idb://".concat(O2, "/").concat(r2)];
                  if (i2) {
                    var o2 = k2.table(r2), a2 = i2.optimisticOps.filter(function(e4) {
                      return e4.trans === x2;
                    });
                    if (x2._explicit && b2 && x2.mutatedParts) for (var u2 = 0, s2 = Object.values(i2.queries.query); u2 < s2.length; u2++) for (var c2 = 0, l2 = (d2 = s2[u2]).slice(); c2 < l2.length; c2++) jn((p2 = l2[c2]).obsSet, x2.mutatedParts) && (oe(d2, p2), p2.subscribers.forEach(function(e4) {
                      return t3.add(e4);
                    }));
                    else if (0 < a2.length) {
                      i2.optimisticOps = i2.optimisticOps.filter(function(e4) {
                        return e4.trans !== x2;
                      });
                      for (var f2 = 0, h2 = Object.values(i2.queries.query); f2 < h2.length; f2++) for (var d2, p2, y2, v2 = 0, m2 = (d2 = h2[f2]).slice(); v2 < m2.length; v2++) null != (p2 = m2[v2]).res && x2.mutatedParts && (b2 && !p2.dirty ? (y2 = Object.isFrozen(p2.res), y2 = Jn(p2.res, p2.req, a2, o2, p2, y2), p2.dirty ? (oe(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      })) : y2 !== p2.res && (p2.res = y2, p2.promise = K.resolve({ result: y2 }))) : (p2.dirty && oe(d2, p2), p2.subscribers.forEach(function(e4) {
                        return t3.add(e4);
                      })));
                    }
                  }
                }
                t3.forEach(function(e4) {
                  return e4();
                });
              }
            };
          })(false), { signal: e2 }), x2.addEventListener("error", t2(false), { signal: e2 }), x2.addEventListener("complete", t2(true), { signal: e2 })), x2;
        }, table: function(s2) {
          var c2 = k2.table(s2), i2 = c2.schema.primaryKey;
          return _(_({}, c2), { mutate: function(t2) {
            var n2, e2 = P.trans;
            return !i2.outbound && "disabled" !== e2.db._options.cache && !e2.explicit && "readwrite" === e2.idbtrans.mode && (n2 = Tn["idb://".concat(O2, "/").concat(s2)]) ? (e2 = c2.mutate(t2), "add" !== t2.type && "put" !== t2.type || !(50 <= t2.values.length || zn(i2, t2).some(function(e3) {
              return null == e3;
            })) ? (n2.optimisticOps.push(t2), t2.mutatedParts && Dn(t2.mutatedParts), e2.then(function(e3) {
              0 < e3.numFailures && (oe(n2.optimisticOps, t2), (e3 = Xn(0, t2, e3)) && n2.optimisticOps.push(e3), t2.mutatedParts) && Dn(t2.mutatedParts);
            }), e2.catch(function() {
              oe(n2.optimisticOps, t2), t2.mutatedParts && Dn(t2.mutatedParts);
            })) : e2.then(function(r2) {
              var e3 = Xn(0, _(_({}, t2), { values: t2.values.map(function(e4, t3) {
                var n3;
                return r2.failures[t3] ? e4 : (b(n3 = null != (n3 = i2.keyPath) && n3.includes(".") ? ee(e4) : _({}, e4), i2.keyPath, r2.results[t3]), n3);
              }) }), r2);
              n2.optimisticOps.push(e3), queueMicrotask(function() {
                return t2.mutatedParts && Dn(t2.mutatedParts);
              });
            }), e2) : c2.mutate(t2);
          }, query: function(t2) {
            var i3, e2, n2, r2, o2, a2, u2;
            return $n(P, c2) && Qn("query", t2) ? (i3 = "immutable" === (null == (n2 = P.trans) ? void 0 : n2.db._options.cache), e2 = (n2 = P).requery, n2 = n2.signal, a2 = ((e3, t3, n3, r3) => {
              var i4 = Tn["idb://".concat(e3, "/").concat(t3)];
              if (!i4) return [];
              if (!(e3 = i4.queries[n3])) return [null, false, i4, null];
              var o3 = e3[(r3.query ? r3.query.index.name : null) || ""];
              if (!o3) return [null, false, i4, null];
              switch (n3) {
                case "query":
                  var a3 = null != (u3 = r3.direction) ? u3 : "next", u3 = o3.find(function(e4) {
                    var t4;
                    return e4.req.limit === r3.limit && e4.req.values === r3.values && (null != (t4 = e4.req.direction) ? t4 : "next") === a3 && Zn(e4.req.query.range, r3.query.range);
                  });
                  return u3 ? [u3, true, i4, o3] : [o3.find(function(e4) {
                    var t4;
                    return ("limit" in e4.req ? e4.req.limit : 1 / 0) >= r3.limit && (null != (t4 = e4.req.direction) ? t4 : "next") === a3 && (!r3.values || e4.req.values) && er(e4.req.query.range, r3.query.range);
                  }), false, i4, o3];
                case "count":
                  u3 = o3.find(function(e4) {
                    return Zn(e4.req.query.range, r3.query.range);
                  });
                  return [u3, !!u3, i4, o3];
              }
            })(O2, s2, "query", t2), u2 = a2[0], r2 = a2[2], o2 = a2[3], u2 && a2[1] ? u2.obsSet = t2.obsSet : (a2 = c2.query(t2).then(function(e3) {
              var t3 = e3.result;
              if (u2 && (u2.res = t3), i3) {
                for (var n3 = 0, r3 = t3.length; n3 < r3; ++n3) Object.freeze(t3[n3]);
                Object.freeze(t3);
              }
              return e3;
            }).catch(function(e3) {
              return o2 && u2 && oe(o2, u2), Promise.reject(e3);
            }), u2 = { obsSet: t2.obsSet, promise: a2, subscribers: /* @__PURE__ */ new Set(), type: "query", req: t2, dirty: false }, o2 ? o2.push(u2) : (o2 = [u2], (r2 = r2 || (Tn["idb://".concat(O2, "/").concat(s2)] = { queries: { query: {}, count: {} }, objs: /* @__PURE__ */ new Map(), optimisticOps: [], unsignaledParts: {} })).queries.query[t2.query.index.name || ""] = o2)), tr(u2, o2, e2, n2), u2.promise.then(function(e3) {
              e3 = Jn(e3.result, t2, null == r2 ? void 0 : r2.optimisticOps, c2, u2, i3);
              return { result: i3 ? e3 : ee(e3) };
            })) : c2.query(t2);
          } });
        } });
      } };
      function rr(e2, r2) {
        return new Proxy(e2, { get: function(e3, t2, n2) {
          return "db" === t2 ? r2 : Reflect.get(e3, t2, n2);
        } });
      }
      D.prototype.version = function(t2) {
        if (isNaN(t2) || t2 < 0.1) throw new k.Type("Given version is not a positive number");
        if (t2 = Math.round(10 * t2) / 10, this.idbdb || this._state.isBeingOpened) throw new k.Schema("Cannot add version when database is open");
        this.verno = Math.max(this.verno, t2);
        var e2 = this._versions, n2 = e2.filter(function(e3) {
          return e3._cfg.version === t2;
        })[0];
        return n2 || (n2 = new this.Version(t2), e2.push(n2), e2.sort(un), n2.stores({}), this._state.autoSchema = false), n2;
      }, D.prototype._whenReady = function(e2) {
        var n2 = this;
        return this.idbdb && (this._state.openComplete || P.letThrough || this._vip) ? e2() : new K(function(e3, t2) {
          if (n2._state.openComplete) return t2(new k.DatabaseClosed(n2._state.dbOpenError));
          if (!n2._state.isBeingOpened) {
            if (!n2._state.autoOpen) return void t2(new k.DatabaseClosed());
            n2.open().catch(g);
          }
          n2._state.dbReadyPromise.then(e3, t2);
        }).then(e2);
      }, D.prototype.use = function(e2) {
        var t2 = e2.stack, n2 = e2.create, r2 = e2.level, e2 = e2.name, i2 = (e2 && this.unuse({ stack: t2, name: e2 }), this._middlewares[t2] || (this._middlewares[t2] = []));
        return i2.push({ stack: t2, create: n2, level: null == r2 ? 10 : r2, name: e2 }), i2.sort(function(e3, t3) {
          return e3.level - t3.level;
        }), this;
      }, D.prototype.unuse = function(e2) {
        var t2 = e2.stack, n2 = e2.name, r2 = e2.create;
        return t2 && this._middlewares[t2] && (this._middlewares[t2] = this._middlewares[t2].filter(function(e3) {
          return r2 ? e3.create !== r2 : !!n2 && e3.name !== n2;
        })), this;
      }, D.prototype.open = function() {
        var e2 = this;
        return at(s, function() {
          return Fn(e2);
        });
      }, D.prototype._close = function() {
        this.on.close.fire(new CustomEvent("close"));
        var n2 = this._state;
        if (gn.remove(this), this.idbdb) {
          try {
            this.idbdb.close();
          } catch (e2) {
          }
          this.idbdb = null;
        }
        n2.isBeingOpened || (n2.dbReadyPromise = new K(function(e2) {
          n2.dbReadyResolve = e2;
        }), n2.openCanceller = new K(function(e2, t2) {
          n2.cancelOpen = t2;
        }));
      }, D.prototype.close = function(e2) {
        var e2 = (void 0 === e2 ? { disableAutoOpen: true } : e2).disableAutoOpen, t2 = this._state;
        e2 ? (t2.isBeingOpened && t2.cancelOpen(new k.DatabaseClosed()), this._close(), t2.autoOpen = false, t2.dbOpenError = new k.DatabaseClosed()) : (this._close(), t2.autoOpen = this._options.autoOpen || t2.isBeingOpened, t2.openComplete = false, t2.dbOpenError = null);
      }, D.prototype.delete = function(n2) {
        var i2 = this, o2 = (void 0 === n2 && (n2 = { disableAutoOpen: true }), 0 < arguments.length && "object" != typeof arguments[0]), a2 = this._state;
        return new K(function(r2, t2) {
          function e2() {
            i2.close(n2);
            var e3 = i2._deps.indexedDB.deleteDatabase(i2.name);
            e3.onsuccess = E(function() {
              var e4, t3, n3;
              e4 = i2._deps, t3 = i2.name, _n(n3 = e4.indexedDB) || t3 === ft || wn(n3, e4.IDBKeyRange).delete(t3).catch(g), r2();
            }), e3.onerror = I(t2), e3.onblocked = i2._fireOnBlocked;
          }
          if (o2) throw new k.InvalidArgument("Invalid closeOptions argument to db.delete()");
          a2.isBeingOpened ? a2.dbReadyPromise.then(e2) : e2();
        });
      }, D.prototype.backendDB = function() {
        return this.idbdb;
      }, D.prototype.isOpen = function() {
        return null !== this.idbdb;
      }, D.prototype.hasBeenClosed = function() {
        var e2 = this._state.dbOpenError;
        return e2 && "DatabaseClosed" === e2.name;
      }, D.prototype.hasFailed = function() {
        return null !== this._state.dbOpenError;
      }, D.prototype.dynamicallyOpened = function() {
        return this._state.autoSchema;
      }, Object.defineProperty(D.prototype, "tables", { get: function() {
        var t2 = this;
        return O(this._allTables).map(function(e2) {
          return t2._allTables[e2];
        });
      }, enumerable: false, configurable: true }), D.prototype.transaction = function() {
        var e2 = (function(e3, t2, n2) {
          var r2 = arguments.length;
          if (r2 < 2) throw new k.InvalidArgument("Too few arguments");
          for (var i2 = new Array(r2 - 1); --r2; ) i2[r2 - 1] = arguments[r2];
          return n2 = i2.pop(), [e3, H(i2), n2];
        }).apply(this, arguments);
        return this._transaction.apply(this, e2);
      }, D.prototype._transaction = function(e2, t2, n2) {
        var r2, i2, o2 = this, a2 = P.trans, u2 = (a2 && a2.db === this && -1 === e2.indexOf("!") || (a2 = null), -1 !== e2.indexOf("?"));
        e2 = e2.replace("!", "").replace("?", "");
        try {
          if (i2 = t2.map(function(e3) {
            e3 = e3 instanceof o2.Table ? e3.name : e3;
            if ("string" != typeof e3) throw new TypeError("Invalid table argument to Dexie.transaction(). Only Table or String are allowed");
            return e3;
          }), "r" == e2 || e2 === ht) r2 = ht;
          else {
            if ("rw" != e2 && e2 != dt) throw new k.InvalidArgument("Invalid transaction mode: " + e2);
            r2 = dt;
          }
          if (a2) {
            if (a2.mode === ht && r2 === dt) {
              if (!u2) throw new k.SubTransaction("Cannot enter a sub-transaction with READWRITE mode when parent transaction is READONLY");
              a2 = null;
            }
            a2 && i2.forEach(function(e3) {
              if (a2 && -1 === a2.storeNames.indexOf(e3)) {
                if (!u2) throw new k.SubTransaction("Table " + e3 + " not included in parent transaction.");
                a2 = null;
              }
            }), u2 && a2 && !a2.active && (a2 = null);
          }
        } catch (n3) {
          return a2 ? a2._promise(null, function(e3, t3) {
            t3(n3);
          }) : S(n3);
        }
        var s2 = (function i3(o3, a3, u3, s3, c2) {
          return K.resolve().then(function() {
            var e3 = P.transless || P, t3 = o3._createTransaction(a3, u3, o3._dbSchema, s3), e3 = (t3.explicit = true, { trans: t3, transless: e3 });
            if (s3) t3.idbtrans = s3.idbtrans;
            else try {
              t3.create(), t3.idbtrans._explicit = true, o3._state.PR1398_maxLoop = 3;
            } catch (e4) {
              return e4.name === de.InvalidState && o3.isOpen() && 0 < --o3._state.PR1398_maxLoop ? (console.warn("Dexie: Need to reopen db"), o3.close({ disableAutoOpen: false }), o3.open().then(function() {
                return i3(o3, a3, u3, null, c2);
              })) : S(e4);
            }
            var n3, r3 = ue(c2), e3 = (r3 && nt(), K.follow(function() {
              var e4;
              (n3 = c2.call(t3, t3)) && (r3 ? (e4 = w.bind(null, null), n3.then(e4, e4)) : "function" == typeof n3.next && "function" == typeof n3.throw && (n3 = Nn(n3)));
            }, e3));
            return (n3 && "function" == typeof n3.then ? K.resolve(n3).then(function(e4) {
              return t3.active ? e4 : S(new k.PrematureCommit("Transaction committed too early. See http://bit.ly/2kdckMn"));
            }) : e3.then(function() {
              return n3;
            })).then(function(e4) {
              return s3 && t3._resolve(), t3._completion.then(function() {
                return e4;
              });
            }).catch(function(e4) {
              return t3._reject(e4), S(e4);
            });
          });
        }).bind(null, this, r2, i2, a2, n2);
        return a2 ? a2._promise(r2, s2, "lock") : P.trans ? at(P.transless, function() {
          return o2._whenReady(s2);
        }) : this._whenReady(s2);
      }, D.prototype.table = function(e2) {
        if (m(this._allTables, e2)) return this._allTables[e2];
        throw new k.InvalidTable("Table ".concat(e2, " does not exist"));
      };
      var y = D;
      function D(e2, t2) {
        var o2, r2, a2, n2, i2, u2 = this, s2 = (this._middlewares = {}, this.verno = 0, D.dependencies), s2 = (this._options = t2 = _({ addons: D.addons, autoOpen: true, indexedDB: s2.indexedDB, IDBKeyRange: s2.IDBKeyRange, cache: "cloned", maxConnections: 1e3 }, t2), this._deps = { indexedDB: t2.indexedDB, IDBKeyRange: t2.IDBKeyRange }, t2.addons), c2 = (this._dbSchema = {}, this._versions = [], this._storeNames = [], this._allTables = {}, this.idbdb = null, this._novip = this, { dbOpenError: null, isBeingOpened: false, onReadyBeingFired: null, openComplete: false, dbReadyResolve: g, dbReadyPromise: null, cancelOpen: g, openCanceller: null, autoSchema: true, PR1398_maxLoop: 3, autoOpen: t2.autoOpen }), l2 = (c2.dbReadyPromise = new K(function(e3) {
          c2.dbReadyResolve = e3;
        }), c2.openCanceller = new K(function(e3, t3) {
          c2.cancelOpen = t3;
        }), this._state = c2, this.name = e2, this.on = Pt(this, "populate", "blocked", "versionchange", "close", { ready: [ke, g] }), this.once = function(n3, r3) {
          var i3 = function() {
            for (var e3 = [], t3 = 0; t3 < arguments.length; t3++) e3[t3] = arguments[t3];
            u2.on(n3).unsubscribe(i3), r3.apply(u2, e3);
          };
          return u2.on(n3, i3);
        }, this.on.ready.subscribe = Y(this.on.ready.subscribe, function(i3) {
          return function(n3, r3) {
            D.vip(function() {
              var t3, e3 = u2._state;
              e3.openComplete ? (e3.dbOpenError || K.resolve().then(n3), r3 && i3(n3)) : e3.onReadyBeingFired ? (e3.onReadyBeingFired.push(n3), r3 && i3(n3)) : (i3(n3), t3 = u2, r3 || i3(function e4() {
                t3.on.ready.unsubscribe(n3), t3.on.ready.unsubscribe(e4);
              }));
            });
          };
        }), this.Collection = (o2 = this, Kt(qt.prototype, function(e3, t3) {
          this.db = o2;
          var n3 = yt, r3 = null;
          if (t3) try {
            n3 = t3();
          } catch (e4) {
            r3 = e4;
          }
          var t3 = e3._ctx, e3 = t3.table, i3 = e3.hook.reading.fire;
          this._ctx = { table: e3, index: t3.index, isPrimKey: !t3.index || e3.schema.primKey.keyPath && t3.index === e3.schema.primKey.name, range: n3, keysOnly: false, dir: "next", unique: "", algorithm: null, filter: null, replayFilter: null, justLimit: true, isMatch: null, offset: 0, limit: 1 / 0, error: r3, or: t3.or, valueMapper: i3 !== ve ? i3 : null };
        })), this.Table = (r2 = this, Kt(Ot.prototype, function(e3, t3, n3) {
          this.db = r2, this._tx = n3, this.name = e3, this.schema = t3, this.hook = r2._allTables[e3] ? r2._allTables[e3].hook : Pt(null, { creating: [ge, g], reading: [me, ve], updating: [_e, g], deleting: [we, g] });
        })), this.Transaction = (a2 = this, Kt(Yt.prototype, function(e3, t3, n3, r3, i3) {
          var o3 = this;
          "readonly" !== e3 && t3.forEach(function(e4) {
            e4 = null == (e4 = n3[e4]) ? void 0 : e4.yProps;
            e4 && (t3 = t3.concat(e4.map(function(e5) {
              return e5.updatesTable;
            })));
          }), this.db = a2, this.mode = e3, this.storeNames = t3, this.schema = n3, this.chromeTransactionDurability = r3, this.idbtrans = null, this.on = Pt(this, "complete", "error", "abort"), this.parent = i3 || null, this.active = true, this._reculock = 0, this._blockedFuncs = [], this._resolve = null, this._reject = null, this._waitingFor = null, this._waitingQueue = null, this._spinCount = 0, this._completion = new K(function(e4, t4) {
            o3._resolve = e4, o3._reject = t4;
          }), this._completion.then(function() {
            o3.active = false, o3.on.complete.fire();
          }, function(e4) {
            var t4 = o3.active;
            return o3.active = false, o3.on.error.fire(e4), o3.parent ? o3.parent._reject(e4) : t4 && o3.idbtrans && o3.idbtrans.abort(), S(e4);
          });
        })), this.Version = (n2 = this, Kt(mn.prototype, function(e3) {
          this.db = n2, this._cfg = { version: e3, storesSource: null, dbschema: {}, tables: {}, contentUpgrade: null };
        })), this.WhereClause = (i2 = this, Kt(Lt.prototype, function(e3, t3, n3) {
          if (this.db = i2, this._ctx = { table: e3, index: ":id" === t3 ? null : t3, or: n3 }, this._cmp = this._ascending = C, this._descending = function(e4, t4) {
            return C(t4, e4);
          }, this._max = function(e4, t4) {
            return 0 < C(e4, t4) ? e4 : t4;
          }, this._min = function(e4, t4) {
            return C(e4, t4) < 0 ? e4 : t4;
          }, this._IDBKeyRange = i2._deps.IDBKeyRange, !this._IDBKeyRange) throw new k.MissingAPI();
        })), this.on("versionchange", function(e3) {
          0 < e3.newVersion ? console.warn("Another connection wants to upgrade database '".concat(u2.name, "'. Closing db now to resume the upgrade.")) : console.warn("Another connection wants to delete database '".concat(u2.name, "'. Closing db now to resume the delete request.")), u2.close({ disableAutoOpen: false });
        }), this.on("blocked", function(e3) {
          !e3.newVersion || e3.newVersion < e3.oldVersion ? console.warn("Dexie.delete('".concat(u2.name, "') was blocked")) : console.warn("Upgrade '".concat(u2.name, "' blocked by other connection holding version ").concat(e3.oldVersion / 10));
        }), this._maxKey = Xt(t2.IDBKeyRange), this._createTransaction = function(e3, t3, n3, r3) {
          return new u2.Transaction(e3, t3, n3, u2._options.chromeTransactionDurability, r3);
        }, this._fireOnBlocked = function(t3) {
          u2.on("blocked").fire(t3), gn.toArray().filter(function(e3) {
            return e3.name === u2.name && e3 !== u2 && !e3._state.vcFired;
          }).map(function(e3) {
            return e3.on("versionchange").fire(t3);
          });
        }, this.use(Yn), this.use(nr), this.use(Gn), this.use(Ln), this.use(Vn), new Proxy(this, { get: function(e3, t3, n3) {
          var r3;
          return "_vip" === t3 || ("table" === t3 ? function(e4) {
            return rr(u2.table(e4), l2);
          } : (r3 = Reflect.get(e3, t3, n3)) instanceof Ot ? rr(r3, l2) : "tables" === t3 ? r3.map(function(e4) {
            return rr(e4, l2);
          }) : "_createTransaction" === t3 ? function() {
            return rr(r3.apply(this, arguments), l2);
          } : r3);
        } }));
        this.vip = l2, s2.forEach(function(e3) {
          return e3(u2);
        });
      }
      var ir, Se = "undefined" != typeof Symbol && "observable" in Symbol ? Symbol.observable : "@@observable", or = (ar.prototype.subscribe = function(e2, t2, n2) {
        return this._subscribe(e2 && "function" != typeof e2 ? e2 : { next: e2, error: t2, complete: n2 });
      }, ar.prototype[Se] = function() {
        return this;
      }, ar);
      function ar(e2) {
        this._subscribe = e2;
      }
      try {
        ir = { indexedDB: f.indexedDB || f.mozIndexedDB || f.webkitIndexedDB || f.msIndexedDB, IDBKeyRange: f.IDBKeyRange || f.webkitIDBKeyRange };
      } catch (e2) {
        ir = { indexedDB: null, IDBKeyRange: null };
      }
      function ur(d2) {
        var p2, y2 = false, e2 = new or(function(r2) {
          var i2 = ue(d2);
          var o2, a2 = false, u2 = {}, s2 = {}, e3 = { get closed() {
            return a2;
          }, unsubscribe: function() {
            a2 || (a2 = true, o2 && o2.abort(), c2 && Wt.storagemutated.unsubscribe(h2));
          } }, c2 = (r2.start && r2.start(e3), false), l2 = function() {
            return st(t2);
          };
          function f2() {
            return jn(s2, u2);
          }
          var h2 = function(e4) {
            Cn(u2, e4), f2() && l2();
          }, t2 = function() {
            var t3, n2, e4;
            !a2 && ir.indexedDB && (u2 = {}, t3 = {}, o2 && o2.abort(), o2 = new AbortController(), e4 = ((e5) => {
              var t4 = $e();
              try {
                i2 && nt();
                var n3 = v(d2, e5);
                return n3 = i2 ? n3.finally(w) : n3;
              } finally {
                t4 && Qe();
              }
            })(n2 = { subscr: t3, signal: o2.signal, requery: l2, querier: d2, trans: null }), c2 || (Wt.storagemutated.subscribe(h2), c2 = true), Promise.resolve(e4).then(function(e5) {
              y2 = true, p2 = e5, a2 || n2.signal.aborted || (f2() || (s2 = t3, f2()) ? l2() : (u2 = {}, st(function() {
                return !a2 && r2.next && r2.next(e5);
              })));
            }, function(e5) {
              y2 = false, ["DatabaseClosedError", "AbortError"].includes(null == e5 ? void 0 : e5.name) || a2 || st(function() {
                a2 || r2.error && r2.error(e5);
              });
            }));
          };
          return setTimeout(l2, 0), e3;
        });
        return e2.hasValue = function() {
          return y2;
        }, e2.getValue = function() {
          return p2;
        }, e2;
      }
      var sr = y;
      function cr(e2) {
        var t2 = fr;
        try {
          fr = true, Wt.storagemutated.fire(e2), Bn(e2, true);
        } finally {
          fr = t2;
        }
      }
      M(sr, _(_({}, e), { delete: function(e2) {
        return new sr(e2, { addons: [] }).delete();
      }, exists: function(e2) {
        return new sr(e2, { addons: [] }).open().then(function(e3) {
          return e3.close(), true;
        }).catch("NoSuchDatabaseError", function() {
          return false;
        });
      }, getDatabaseNames: function(e2) {
        try {
          return t2 = sr.dependencies, n2 = t2.indexedDB, t2 = t2.IDBKeyRange, (_n(n2) ? Promise.resolve(n2.databases()).then(function(e3) {
            return e3.map(function(e4) {
              return e4.name;
            }).filter(function(e4) {
              return e4 !== ft;
            });
          }) : wn(n2, t2).toCollection().primaryKeys()).then(e2);
        } catch (e3) {
          return S(new k.MissingAPI());
        }
        var t2, n2;
      }, defineClass: function() {
        return function(e2) {
          a(this, e2);
        };
      }, ignoreTransaction: function(e2) {
        return P.trans ? at(P.transless || s, e2) : e2();
      }, vip: xn, async: function(t2) {
        return function() {
          try {
            var e2 = Nn(t2.apply(this, arguments));
            return e2 && "function" == typeof e2.then ? e2 : K.resolve(e2);
          } catch (e3) {
            return S(e3);
          }
        };
      }, spawn: function(e2, t2, n2) {
        try {
          var r2 = Nn(e2.apply(n2, t2 || []));
          return r2 && "function" == typeof r2.then ? r2 : K.resolve(r2);
        } catch (e3) {
          return S(e3);
        }
      }, currentTransaction: { get: function() {
        return P.trans || null;
      } }, waitFor: function(e2, t2) {
        e2 = K.resolve("function" == typeof e2 ? sr.ignoreTransaction(e2) : e2).timeout(t2 || 6e4);
        return P.trans ? P.trans.waitFor(e2) : e2;
      }, Promise: K, debug: { get: function() {
        return l;
      }, set: function(e2) {
        Oe(e2);
      } }, derive: U, extend: a, props: M, override: Y, Events: Pt, on: Wt, liveQuery: ur, extendObservabilitySet: Cn, getByKeyPath: c, setByKeyPath: b, delByKeyPath: function(t2, e2) {
        "string" == typeof e2 ? b(t2, e2, void 0) : "length" in e2 && [].map.call(e2, function(e3) {
          b(t2, e3, void 0);
        });
      }, shallowClone: G, deepClone: ee, getObjectDiff: Un, cmp: C, asap: Q, minKey: -1 / 0, addons: [], connections: { get: gn.toArray }, errnames: de, dependencies: ir, cache: Tn, semVer: "4.4.4", version: "4.4.4".split(".").map(function(e2) {
        return parseInt(e2);
      }).reduce(function(e2, t2, n2) {
        return e2 + t2 / Math.pow(10, 2 * n2);
      }) })), sr.maxKey = Xt(sr.dependencies.IDBKeyRange), "undefined" != typeof dispatchEvent && "undefined" != typeof addEventListener && (Wt(zt, function(e2) {
        fr || (e2 = new CustomEvent(Vt, { detail: e2 }), fr = true, dispatchEvent(e2), fr = false);
      }), addEventListener(Vt, function(e2) {
        e2 = e2.detail;
        fr || cr(e2);
      }));
      var lr, fr = false, hr = function() {
      };
      return "undefined" != typeof BroadcastChannel && ((hr = function() {
        (lr = new BroadcastChannel(Vt)).onmessage = function(e2) {
          return e2.data && cr(e2.data);
        };
      })(), "function" == typeof lr.unref && lr.unref(), Wt(zt, function(e2) {
        fr || lr.postMessage(e2);
      })), "undefined" != typeof addEventListener && (addEventListener("pagehide", function(e2) {
        if (!y.disableBfCache && e2.persisted) {
          l && console.debug("Dexie: handling persisted pagehide"), null != lr && lr.close();
          for (var t2 = 0, n2 = gn.toArray(); t2 < n2.length; t2++) n2[t2].close({ disableAutoOpen: false });
        }
      }), addEventListener("pageshow", function(e2) {
        !y.disableBfCache && e2.persisted && (l && console.debug("Dexie: handling persisted pageshow"), hr(), cr({ all: new q(-1 / 0, [[]]) }));
      })), K.rejectionMapper = function(e2, t2) {
        return !e2 || e2 instanceof ce || e2 instanceof TypeError || e2 instanceof SyntaxError || !e2.name || !ye[e2.name] ? e2 : (t2 = new ye[e2.name](t2 || e2.message, e2), "stack" in e2 && u(t2, "stack", { get: function() {
          return this.inner.stack;
        } }), t2);
      }, Oe(l), _(y, Object.freeze({ __proto__: null, DEFAULT_MAX_CONNECTIONS: 1e3, Dexie: y, Entity: mt, PropModification: _t, RangeSet: q, add: function(e2) {
        return new _t({ add: e2 });
      }, cmp: C, default: y, liveQuery: ur, mergeRanges: Pn, rangesOverlap: Kn, remove: function(e2) {
        return new _t({ remove: e2 });
      }, replacePrefix: function(e2, t2) {
        return new _t({ replacePrefix: [e2, t2] });
      } }), { default: y }), y;
    });
  })(dexie_min);
  var dexie_minExports = dexie_min.exports;
  const _Dexie = /* @__PURE__ */ getDefaultExportFromCjs(dexie_minExports);
  const DexieSymbol = Symbol.for("Dexie");
  const Dexie = globalThis[DexieSymbol] || (globalThis[DexieSymbol] = _Dexie);
  if (_Dexie.semVer !== Dexie.semVer) {
    throw new Error(`Two different versions of Dexie loaded in the same app: ${_Dexie.semVer} and ${Dexie.semVer}`);
  }
  const {
    liveQuery,
    mergeRanges,
    rangesOverlap,
    RangeSet,
    cmp,
    Entity,
    PropModification,
    replacePrefix,
    add,
    remove,
    DexieYProvider
  } = Dexie;
  class DocBridgeDB extends Dexie {
    constructor() {
      super("DocBridgeDB");
      this.version(1).stores({
        translations: "++id, originalHash, provider, timestamp",
        glossary: "++id, term, domain"
      });
    }
  }
  const db = new DocBridgeDB();
  class CacheManager {
    /**
     * 根据原文哈希查询缓存
     * @param originalHash - 原文 SHA 哈希
     * @returns 缓存条目或 null
     */
    static async getCache(originalHash) {
      try {
        const entry = await db.translations.where("originalHash").equals(originalHash).first();
        if (!entry) return null;
        if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
          await db.translations.delete(entry.id);
          return null;
        }
        return entry;
      } catch (error) {
        console.error("[DocBridge Cache] 查询缓存失败:", error);
        return null;
      }
    }
    /**
     * 批量查询缓存
     * @param hashes - 原文哈希数组
     * @returns 缓存条目数组
     */
    static async getCacheBatch(hashes) {
      try {
        const entries = await db.translations.where("originalHash").anyOf(hashes).toArray();
        const result = /* @__PURE__ */ new Map();
        const now = Date.now();
        for (const entry of entries) {
          if (now - entry.timestamp <= CACHE_TTL_MS) {
            result.set(entry.originalHash, entry);
          } else {
            db.translations.delete(entry.id).catch(() => {
            });
          }
        }
        return result;
      } catch (error) {
        console.error("[DocBridge Cache] 批量查询缓存失败:", error);
        return /* @__PURE__ */ new Map();
      }
    }
    /**
     * 写入翻译缓存
     * @param originalHash - 原文哈希
     * @param translatedText - 译文
     * @param provider - 翻译提供商
     */
    static async setCache(originalHash, translatedText, provider) {
      try {
        const existing = await db.translations.where("originalHash").equals(originalHash).first();
        if (existing) {
          await db.translations.update(existing.id, {
            translatedText,
            provider,
            timestamp: Date.now()
          });
        } else {
          await db.translations.add({
            originalHash,
            translatedText,
            provider,
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error("[DocBridge Cache] 写入缓存失败:", error);
      }
    }
    /**
     * 批量写入缓存
     * @param entries - 缓存条目数组
     */
    static async setCacheBatch(entries) {
      try {
        await db.transaction("rw", db.translations, async () => {
          for (const entry of entries) {
            const existing = await db.translations.where("originalHash").equals(entry.originalHash).first();
            if (existing) {
              await db.translations.update(existing.id, {
                translatedText: entry.translatedText,
                provider: entry.provider,
                timestamp: Date.now()
              });
            } else {
              await db.translations.add({
                originalHash: entry.originalHash,
                translatedText: entry.translatedText,
                provider: entry.provider,
                timestamp: Date.now()
              });
            }
          }
        });
      } catch (error) {
        console.error("[DocBridge Cache] 批量写入缓存失败:", error);
      }
    }
    /**
     * 清理过期缓存
     * @returns 删除的条目数
     */
    static async cleanExpiredCache() {
      try {
        const cutoff = Date.now() - CACHE_TTL_MS;
        const expired = await db.translations.where("timestamp").below(cutoff).toArray();
        if (expired.length > 0) {
          await db.translations.bulkDelete(expired.map((e) => e.id));
        }
        return expired.length;
      } catch (error) {
        console.error("[DocBridge Cache] 清理过期缓存失败:", error);
        return 0;
      }
    }
    /** 获取缓存统计 */
    static async getStats() {
      try {
        const total = await db.translations.count();
        return { total, size: 0 };
      } catch {
        return { total: 0, size: 0 };
      }
    }
  }
  class DeepSeekProvider {
    constructor() {
      this.name = "deepseek";
      this.maxBatchSize = 50;
      this.supportsContext = true;
      this.apiKey = "";
      this.baseURL = DEFAULT_API_BASE_URL;
    }
    /**
     * 从 chrome.storage 加载 API 配置
     */
    async loadConfig() {
      try {
        const result = await chrome.storage.local.get(["apiKey", "apiBaseURL"]);
        this.apiKey = result.apiKey || "";
        this.baseURL = result.apiBaseURL || DEFAULT_API_BASE_URL;
      } catch (error) {
        console.error("[DocBridge DeepSeek] 加载配置失败:", error);
      }
    }
    /**
     * 计算字符串的简单哈希
     */
    hashString(str) {
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
      }
      return "h" + Math.abs(hash).toString(16);
    }
    /**
     * 执行翻译请求
     */
    async translate(request) {
      var _a, _b, _c;
      await this.loadConfig();
      if (!this.apiKey) {
        throw new Error("API Key 未配置，请在设置页面配置 DeepSeek API Key");
      }
      const cachedUnits = [];
      const uncachedUnits = [];
      for (const unit of request.units) {
        const hash = this.hashString(unit.text);
        const cached = await CacheManager.getCache(hash);
        if (cached) {
          const originalUnit = {
            id: unit.id,
            type: "paragraph",
            element: null,
            originalText: unit.text,
            htmlContext: "",
            contextChain: unit.contextChain,
            isInShadowDOM: false,
            isInIframe: false,
            priority: 0
          };
          cachedUnits.push({
            id: unit.id,
            translatedText: cached.translatedText,
            originalUnit
          });
        } else {
          uncachedUnits.push(unit);
        }
      }
      if (uncachedUnits.length === 0) {
        return cachedUnits;
      }
      const userContent = uncachedUnits.map((u) => `${u.id}${TRANSLATION_SEPARATOR}${u.text}`).join("\n\n");
      const reqBody = {
        model: DEFAULT_MODEL,
        messages: [
          { role: "system", content: TRANSLATION_SYSTEM_PROMPT },
          { role: "user", content: userContent }
        ],
        temperature: TRANSLATION_TEMPERATURE,
        max_tokens: MAX_TOKENS
      };
      let lastError = null;
      for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
          const response = await fetch(`${this.baseURL}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(reqBody),
            signal: controller.signal
          });
          clearTimeout(timeoutId);
          if (response.status === 401) {
            throw new Error("API Key 无效，请检查设置");
          }
          if (response.status === 429) {
            const retryAfter = response.headers.get("Retry-After");
            const delay = retryAfter ? parseInt(retryAfter) * 1e3 : RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            console.warn(`[DocBridge DeepSeek] 429 限流，${delay}ms 后重试 (${attempt + 1}/${MAX_RETRIES})`);
            await new Promise((r) => setTimeout(r, delay));
            continue;
          }
          if (!response.ok) {
            const errorText = await response.text().catch(() => "Unknown error");
            throw new Error(`API 请求失败 (${response.status}): ${errorText}`);
          }
          const data = await response.json();
          const content = (_c = (_b = (_a = data.choices) == null ? void 0 : _a[0]) == null ? void 0 : _b.message) == null ? void 0 : _c.content;
          if (!content) {
            throw new Error("API 返回内容为空");
          }
          const parsed = this.parseResponse(content);
          const resultMap = new Map(parsed.map((p) => [p.id, p.translatedText]));
          const results = [];
          for (const unit of uncachedUnits) {
            const translatedText = resultMap.get(unit.id) || unit.text;
            const originalUnit = {
              id: unit.id,
              type: "paragraph",
              element: null,
              originalText: unit.text,
              htmlContext: "",
              contextChain: unit.contextChain,
              isInShadowDOM: false,
              isInIframe: false,
              priority: 0
            };
            results.push({ id: unit.id, translatedText, originalUnit });
            const hash = this.hashString(unit.text);
            CacheManager.setCache(hash, translatedText, this.name).catch(() => {
            });
          }
          return [...cachedUnits, ...results];
        } catch (error) {
          lastError = error instanceof Error ? error : new Error(String(error));
          if (error instanceof Error && error.name === "AbortError") {
            console.warn(`[DocBridge DeepSeek] 请求超时 (${attempt + 1}/${MAX_RETRIES})`);
          } else {
            console.error(`[DocBridge DeepSeek] 请求失败 (${attempt + 1}/${MAX_RETRIES}):`, lastError.message);
          }
          if (attempt < MAX_RETRIES) {
            const delay = RETRY_BASE_DELAY_MS * Math.pow(2, attempt);
            await new Promise((r) => setTimeout(r, delay));
          }
        }
      }
      throw lastError || new Error("翻译请求失败");
    }
    /**
     * 解析 API 响应文本，提取 UNIT_ID|||译文 格式
     */
    parseResponse(content) {
      const results = [];
      const lines = content.split("\n").filter((l) => l.trim());
      for (const line of lines) {
        const separatorIndex = line.indexOf(TRANSLATION_SEPARATOR);
        if (separatorIndex === -1) continue;
        const id = line.substring(0, separatorIndex).trim();
        const translatedText = line.substring(separatorIndex + TRANSLATION_SEPARATOR.length).trim();
        if (id && translatedText) {
          results.push({ id, translatedText });
        }
      }
      return results;
    }
  }
  const deepseekProvider = new DeepSeekProvider();
  chrome.runtime.onMessage.addListener(
    (message, _sender, sendResponse) => {
      const { type, payload } = message;
      if (type === "TRANSLATE") {
        handleTranslate(payload).then((result) => sendResponse(result)).catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }));
        return true;
      }
      if (type === "GET_CACHE") {
        handleGetCache(payload).then((result) => sendResponse(result)).catch(() => sendResponse(null));
        return true;
      }
      if (type === "SET_CACHE") {
        handleSetCache(payload).then(() => sendResponse({ success: true })).catch((err) => sendResponse({ success: false, error: err instanceof Error ? err.message : String(err) }));
        return true;
      }
      return false;
    }
  );
  async function handleTranslate(payload) {
    try {
      const units = await deepseekProvider.translate(payload);
      return { units, success: true };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      return { units: [], success: false, error: message };
    }
  }
  async function handleGetCache(payload) {
    try {
      const cached = await CacheManager.getCache(payload);
      return cached ? { ...cached } : null;
    } catch {
      return null;
    }
  }
  async function handleSetCache(payload) {
    await CacheManager.setCache(payload.originalHash, payload.translatedText, "deepseek");
  }
  chrome.runtime.onInstalled.addListener(() => {
    console.log("[DocBridge] Service Worker 已安装");
    CacheManager.cleanExpiredCache().then((count) => {
      if (count > 0) {
        console.log(`[DocBridge] 清理了 ${count} 条过期缓存`);
      }
    });
  });
  console.log("[DocBridge] Background Service Worker 已启动");
})();
