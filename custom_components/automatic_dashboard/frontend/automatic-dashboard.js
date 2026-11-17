// node_modules/@lit/reactive-element/css-tag.js
/**
* @license
* Copyright 2019 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$3 = globalThis;
var e$3 = t$3.ShadowRoot && (void 0 === t$3.ShadyCSS || t$3.ShadyCSS.nativeShadow) && "adoptedStyleSheets" in Document.prototype && "replace" in CSSStyleSheet.prototype;
var s$2 = Symbol();
var o$4 = /* @__PURE__ */ new WeakMap();
var n$3 = class {
	constructor(t, e, o) {
		if (this._$cssResult$ = !0, o !== s$2) throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");
		this.cssText = t, this.t = e;
	}
	get styleSheet() {
		let t = this.o;
		const s = this.t;
		if (e$3 && void 0 === t) {
			const e = void 0 !== s && 1 === s.length;
			e && (t = o$4.get(s)), void 0 === t && ((this.o = t = new CSSStyleSheet()).replaceSync(this.cssText), e && o$4.set(s, t));
		}
		return t;
	}
	toString() {
		return this.cssText;
	}
};
var r$2 = (t) => new n$3("string" == typeof t ? t : t + "", void 0, s$2);
var i$5 = (t, ...e) => {
	return new n$3(1 === t.length ? t[0] : e.reduce((e, s, o) => e + ((t) => {
		if (!0 === t._$cssResult$) return t.cssText;
		if ("number" == typeof t) return t;
		throw Error("Value passed to 'css' function must be a 'css' function result: " + t + ". Use 'unsafeCSS' to pass non-literal values, but take care to ensure page security.");
	})(s) + t[o + 1], t[0]), t, s$2);
};
var S$1 = (s, o) => {
	if (e$3) s.adoptedStyleSheets = o.map((t) => t instanceof CSSStyleSheet ? t : t.styleSheet);
	else for (const e of o) {
		const o = document.createElement("style"), n = t$3.litNonce;
		void 0 !== n && o.setAttribute("nonce", n), o.textContent = e.cssText, s.appendChild(o);
	}
};
var c$2 = e$3 ? (t) => t : (t) => t instanceof CSSStyleSheet ? ((t) => {
	let e = "";
	for (const s of t.cssRules) e += s.cssText;
	return r$2(e);
})(t) : t;
// node_modules/@lit/reactive-element/reactive-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var { is: i$4, defineProperty: e$2, getOwnPropertyDescriptor: h$1, getOwnPropertyNames: r$1, getOwnPropertySymbols: o$3, getPrototypeOf: n$2 } = Object, a$1 = globalThis, c$1 = a$1.trustedTypes, l$1 = c$1 ? c$1.emptyScript : "", p$1 = a$1.reactiveElementPolyfillSupport, d$1 = (t, s) => t, u$1 = {
	toAttribute(t, s) {
		switch (s) {
			case Boolean:
				t = t ? l$1 : null;
				break;
			case Object:
			case Array: t = null == t ? t : JSON.stringify(t);
		}
		return t;
	},
	fromAttribute(t, s) {
		let i = t;
		switch (s) {
			case Boolean:
				i = null !== t;
				break;
			case Number:
				i = null === t ? null : Number(t);
				break;
			case Object:
			case Array: try {
				i = JSON.parse(t);
			} catch (t) {
				i = null;
			}
		}
		return i;
	}
}, f$1 = (t, s) => !i$4(t, s), b$1 = {
	attribute: !0,
	type: String,
	converter: u$1,
	reflect: !1,
	useDefault: !1,
	hasChanged: f$1
};
Symbol.metadata ??= Symbol("metadata"), a$1.litPropertyMetadata ??= /* @__PURE__ */ new WeakMap();
var y$1 = class extends HTMLElement {
	static addInitializer(t) {
		this._$Ei(), (this.l ??= []).push(t);
	}
	static get observedAttributes() {
		return this.finalize(), this._$Eh && [...this._$Eh.keys()];
	}
	static createProperty(t, s = b$1) {
		if (s.state && (s.attribute = !1), this._$Ei(), this.prototype.hasOwnProperty(t) && ((s = Object.create(s)).wrapped = !0), this.elementProperties.set(t, s), !s.noAccessor) {
			const i = Symbol(), h = this.getPropertyDescriptor(t, i, s);
			void 0 !== h && e$2(this.prototype, t, h);
		}
	}
	static getPropertyDescriptor(t, s, i) {
		const { get: e, set: r } = h$1(this.prototype, t) ?? {
			get() {
				return this[s];
			},
			set(t) {
				this[s] = t;
			}
		};
		return {
			get: e,
			set(s) {
				const h = e?.call(this);
				r?.call(this, s), this.requestUpdate(t, h, i);
			},
			configurable: !0,
			enumerable: !0
		};
	}
	static getPropertyOptions(t) {
		return this.elementProperties.get(t) ?? b$1;
	}
	static _$Ei() {
		if (this.hasOwnProperty(d$1("elementProperties"))) return;
		const t = n$2(this);
		t.finalize(), void 0 !== t.l && (this.l = [...t.l]), this.elementProperties = new Map(t.elementProperties);
	}
	static finalize() {
		if (this.hasOwnProperty(d$1("finalized"))) return;
		if (this.finalized = !0, this._$Ei(), this.hasOwnProperty(d$1("properties"))) {
			const t = this.properties, s = [...r$1(t), ...o$3(t)];
			for (const i of s) this.createProperty(i, t[i]);
		}
		const t = this[Symbol.metadata];
		if (null !== t) {
			const s = litPropertyMetadata.get(t);
			if (void 0 !== s) for (const [t, i] of s) this.elementProperties.set(t, i);
		}
		this._$Eh = /* @__PURE__ */ new Map();
		for (const [t, s] of this.elementProperties) {
			const i = this._$Eu(t, s);
			void 0 !== i && this._$Eh.set(i, t);
		}
		this.elementStyles = this.finalizeStyles(this.styles);
	}
	static finalizeStyles(s) {
		const i = [];
		if (Array.isArray(s)) {
			const e = new Set(s.flat(1 / 0).reverse());
			for (const s of e) i.unshift(c$2(s));
		} else void 0 !== s && i.push(c$2(s));
		return i;
	}
	static _$Eu(t, s) {
		const i = s.attribute;
		return !1 === i ? void 0 : "string" == typeof i ? i : "string" == typeof t ? t.toLowerCase() : void 0;
	}
	constructor() {
		super(), this._$Ep = void 0, this.isUpdatePending = !1, this.hasUpdated = !1, this._$Em = null, this._$Ev();
	}
	_$Ev() {
		this._$ES = new Promise((t) => this.enableUpdating = t), this._$AL = /* @__PURE__ */ new Map(), this._$E_(), this.requestUpdate(), this.constructor.l?.forEach((t) => t(this));
	}
	addController(t) {
		(this._$EO ??= /* @__PURE__ */ new Set()).add(t), void 0 !== this.renderRoot && this.isConnected && t.hostConnected?.();
	}
	removeController(t) {
		this._$EO?.delete(t);
	}
	_$E_() {
		const t = /* @__PURE__ */ new Map(), s = this.constructor.elementProperties;
		for (const i of s.keys()) this.hasOwnProperty(i) && (t.set(i, this[i]), delete this[i]);
		t.size > 0 && (this._$Ep = t);
	}
	createRenderRoot() {
		const t = this.shadowRoot ?? this.attachShadow(this.constructor.shadowRootOptions);
		return S$1(t, this.constructor.elementStyles), t;
	}
	connectedCallback() {
		this.renderRoot ??= this.createRenderRoot(), this.enableUpdating(!0), this._$EO?.forEach((t) => t.hostConnected?.());
	}
	enableUpdating(t) {}
	disconnectedCallback() {
		this._$EO?.forEach((t) => t.hostDisconnected?.());
	}
	attributeChangedCallback(t, s, i) {
		this._$AK(t, i);
	}
	_$ET(t, s) {
		const i = this.constructor.elementProperties.get(t), e = this.constructor._$Eu(t, i);
		if (void 0 !== e && !0 === i.reflect) {
			const h = (void 0 !== i.converter?.toAttribute ? i.converter : u$1).toAttribute(s, i.type);
			this._$Em = t, null == h ? this.removeAttribute(e) : this.setAttribute(e, h), this._$Em = null;
		}
	}
	_$AK(t, s) {
		const i = this.constructor, e = i._$Eh.get(t);
		if (void 0 !== e && this._$Em !== e) {
			const t = i.getPropertyOptions(e), h = "function" == typeof t.converter ? { fromAttribute: t.converter } : void 0 !== t.converter?.fromAttribute ? t.converter : u$1;
			this._$Em = e;
			const r = h.fromAttribute(s, t.type);
			this[e] = r ?? this._$Ej?.get(e) ?? r, this._$Em = null;
		}
	}
	requestUpdate(t, s, i, e = !1, h) {
		if (void 0 !== t) {
			const r = this.constructor;
			if (!1 === e && (h = this[t]), i ??= r.getPropertyOptions(t), !((i.hasChanged ?? f$1)(h, s) || i.useDefault && i.reflect && h === this._$Ej?.get(t) && !this.hasAttribute(r._$Eu(t, i)))) return;
			this.C(t, s, i);
		}
		!1 === this.isUpdatePending && (this._$ES = this._$EP());
	}
	C(t, s, { useDefault: i, reflect: e, wrapped: h }, r) {
		i && !(this._$Ej ??= /* @__PURE__ */ new Map()).has(t) && (this._$Ej.set(t, r ?? s ?? this[t]), !0 !== h || void 0 !== r) || (this._$AL.has(t) || (this.hasUpdated || i || (s = void 0), this._$AL.set(t, s)), !0 === e && this._$Em !== t && (this._$Eq ??= /* @__PURE__ */ new Set()).add(t));
	}
	async _$EP() {
		this.isUpdatePending = !0;
		try {
			await this._$ES;
		} catch (t) {
			Promise.reject(t);
		}
		const t = this.scheduleUpdate();
		return null != t && await t, !this.isUpdatePending;
	}
	scheduleUpdate() {
		return this.performUpdate();
	}
	performUpdate() {
		if (!this.isUpdatePending) return;
		if (!this.hasUpdated) {
			if (this.renderRoot ??= this.createRenderRoot(), this._$Ep) {
				for (const [t, s] of this._$Ep) this[t] = s;
				this._$Ep = void 0;
			}
			const t = this.constructor.elementProperties;
			if (t.size > 0) for (const [s, i] of t) {
				const { wrapped: t } = i, e = this[s];
				!0 !== t || this._$AL.has(s) || void 0 === e || this.C(s, void 0, i, e);
			}
		}
		let t = !1;
		const s = this._$AL;
		try {
			t = this.shouldUpdate(s), t ? (this.willUpdate(s), this._$EO?.forEach((t) => t.hostUpdate?.()), this.update(s)) : this._$EM();
		} catch (s) {
			throw t = !1, this._$EM(), s;
		}
		t && this._$AE(s);
	}
	willUpdate(t) {}
	_$AE(t) {
		this._$EO?.forEach((t) => t.hostUpdated?.()), this.hasUpdated || (this.hasUpdated = !0, this.firstUpdated(t)), this.updated(t);
	}
	_$EM() {
		this._$AL = /* @__PURE__ */ new Map(), this.isUpdatePending = !1;
	}
	get updateComplete() {
		return this.getUpdateComplete();
	}
	getUpdateComplete() {
		return this._$ES;
	}
	shouldUpdate(t) {
		return !0;
	}
	update(t) {
		this._$Eq &&= this._$Eq.forEach((t) => this._$ET(t, this[t])), this._$EM();
	}
	updated(t) {}
	firstUpdated(t) {}
};
y$1.elementStyles = [], y$1.shadowRootOptions = { mode: "open" }, y$1[d$1("elementProperties")] = /* @__PURE__ */ new Map(), y$1[d$1("finalized")] = /* @__PURE__ */ new Map(), p$1?.({ ReactiveElement: y$1 }), (a$1.reactiveElementVersions ??= []).push("2.1.2");
// node_modules/lit-html/lit-html.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t$2 = globalThis;
var i$3 = (t) => t;
var s$1 = t$2.trustedTypes;
var e$1 = s$1 ? s$1.createPolicy("lit-html", { createHTML: (t) => t }) : void 0;
var h = "$lit$";
var o$2 = `lit$${Math.random().toFixed(9).slice(2)}$`;
var n$1 = "?" + o$2;
var r = `<${n$1}>`;
var l = document;
var c = () => l.createComment("");
var a = (t) => null === t || "object" != typeof t && "function" != typeof t;
var u = Array.isArray;
var d = (t) => u(t) || "function" == typeof t?.[Symbol.iterator];
var f = "[ 	\n\f\r]";
var v = /<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g;
var _ = /-->/g;
var m = />/g;
var p = RegExp(`>|${f}(?:([^\\s"'>=/]+)(${f}*=${f}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`, "g");
var g = /'/g;
var $ = /"/g;
var y = /^(?:script|style|textarea|title)$/i;
var x = (t) => (i, ...s) => ({
	_$litType$: t,
	strings: i,
	values: s
});
var b = x(1);
var w = x(2);
var E = Symbol.for("lit-noChange");
var A = Symbol.for("lit-nothing");
var C = /* @__PURE__ */ new WeakMap();
var P = l.createTreeWalker(l, 129);
function V(t, i) {
	if (!u(t) || !t.hasOwnProperty("raw")) throw Error("invalid template strings array");
	return void 0 !== e$1 ? e$1.createHTML(i) : i;
}
var N = (t, i) => {
	const s = t.length - 1, e = [];
	let n, l = 2 === i ? "<svg>" : 3 === i ? "<math>" : "", c = v;
	for (let i = 0; i < s; i++) {
		const s = t[i];
		let a, u, d = -1, f = 0;
		for (; f < s.length && (c.lastIndex = f, u = c.exec(s), null !== u);) f = c.lastIndex, c === v ? "!--" === u[1] ? c = _ : void 0 !== u[1] ? c = m : void 0 !== u[2] ? (y.test(u[2]) && (n = RegExp("</" + u[2], "g")), c = p) : void 0 !== u[3] && (c = p) : c === p ? ">" === u[0] ? (c = n ?? v, d = -1) : void 0 === u[1] ? d = -2 : (d = c.lastIndex - u[2].length, a = u[1], c = void 0 === u[3] ? p : "\"" === u[3] ? $ : g) : c === $ || c === g ? c = p : c === _ || c === m ? c = v : (c = p, n = void 0);
		const x = c === p && t[i + 1].startsWith("/>") ? " " : "";
		l += c === v ? s + r : d >= 0 ? (e.push(a), s.slice(0, d) + h + s.slice(d) + o$2 + x) : s + o$2 + (-2 === d ? i : x);
	}
	return [V(t, l + (t[s] || "<?>") + (2 === i ? "</svg>" : 3 === i ? "</math>" : "")), e];
};
var S = class S {
	constructor({ strings: t, _$litType$: i }, e) {
		let r;
		this.parts = [];
		let l = 0, a = 0;
		const u = t.length - 1, d = this.parts, [f, v] = N(t, i);
		if (this.el = S.createElement(f, e), P.currentNode = this.el.content, 2 === i || 3 === i) {
			const t = this.el.content.firstChild;
			t.replaceWith(...t.childNodes);
		}
		for (; null !== (r = P.nextNode()) && d.length < u;) {
			if (1 === r.nodeType) {
				if (r.hasAttributes()) for (const t of r.getAttributeNames()) if (t.endsWith(h)) {
					const i = v[a++], s = r.getAttribute(t).split(o$2), e = /([.?@])?(.*)/.exec(i);
					d.push({
						type: 1,
						index: l,
						name: e[2],
						strings: s,
						ctor: "." === e[1] ? I : "?" === e[1] ? L : "@" === e[1] ? z : H
					}), r.removeAttribute(t);
				} else t.startsWith(o$2) && (d.push({
					type: 6,
					index: l
				}), r.removeAttribute(t));
				if (y.test(r.tagName)) {
					const t = r.textContent.split(o$2), i = t.length - 1;
					if (i > 0) {
						r.textContent = s$1 ? s$1.emptyScript : "";
						for (let s = 0; s < i; s++) r.append(t[s], c()), P.nextNode(), d.push({
							type: 2,
							index: ++l
						});
						r.append(t[i], c());
					}
				}
			} else if (8 === r.nodeType) if (r.data === n$1) d.push({
				type: 2,
				index: l
			});
			else {
				let t = -1;
				for (; -1 !== (t = r.data.indexOf(o$2, t + 1));) d.push({
					type: 7,
					index: l
				}), t += o$2.length - 1;
			}
			l++;
		}
	}
	static createElement(t, i) {
		const s = l.createElement("template");
		return s.innerHTML = t, s;
	}
};
function M(t, i, s = t, e) {
	if (i === E) return i;
	let h = void 0 !== e ? s._$Co?.[e] : s._$Cl;
	const o = a(i) ? void 0 : i._$litDirective$;
	return h?.constructor !== o && (h?._$AO?.(!1), void 0 === o ? h = void 0 : (h = new o(t), h._$AT(t, s, e)), void 0 !== e ? (s._$Co ??= [])[e] = h : s._$Cl = h), void 0 !== h && (i = M(t, h._$AS(t, i.values), h, e)), i;
}
var R = class {
	constructor(t, i) {
		this._$AV = [], this._$AN = void 0, this._$AD = t, this._$AM = i;
	}
	get parentNode() {
		return this._$AM.parentNode;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	u(t) {
		const { el: { content: i }, parts: s } = this._$AD, e = (t?.creationScope ?? l).importNode(i, !0);
		P.currentNode = e;
		let h = P.nextNode(), o = 0, n = 0, r = s[0];
		for (; void 0 !== r;) {
			if (o === r.index) {
				let i;
				2 === r.type ? i = new k(h, h.nextSibling, this, t) : 1 === r.type ? i = new r.ctor(h, r.name, r.strings, this, t) : 6 === r.type && (i = new Z(h, this, t)), this._$AV.push(i), r = s[++n];
			}
			o !== r?.index && (h = P.nextNode(), o++);
		}
		return P.currentNode = l, e;
	}
	p(t) {
		let i = 0;
		for (const s of this._$AV) void 0 !== s && (void 0 !== s.strings ? (s._$AI(t, s, i), i += s.strings.length - 2) : s._$AI(t[i])), i++;
	}
};
var k = class k {
	get _$AU() {
		return this._$AM?._$AU ?? this._$Cv;
	}
	constructor(t, i, s, e) {
		this.type = 2, this._$AH = A, this._$AN = void 0, this._$AA = t, this._$AB = i, this._$AM = s, this.options = e, this._$Cv = e?.isConnected ?? !0;
	}
	get parentNode() {
		let t = this._$AA.parentNode;
		const i = this._$AM;
		return void 0 !== i && 11 === t?.nodeType && (t = i.parentNode), t;
	}
	get startNode() {
		return this._$AA;
	}
	get endNode() {
		return this._$AB;
	}
	_$AI(t, i = this) {
		t = M(this, t, i), a(t) ? t === A || null == t || "" === t ? (this._$AH !== A && this._$AR(), this._$AH = A) : t !== this._$AH && t !== E && this._(t) : void 0 !== t._$litType$ ? this.$(t) : void 0 !== t.nodeType ? this.T(t) : d(t) ? this.k(t) : this._(t);
	}
	O(t) {
		return this._$AA.parentNode.insertBefore(t, this._$AB);
	}
	T(t) {
		this._$AH !== t && (this._$AR(), this._$AH = this.O(t));
	}
	_(t) {
		this._$AH !== A && a(this._$AH) ? this._$AA.nextSibling.data = t : this.T(l.createTextNode(t)), this._$AH = t;
	}
	$(t) {
		const { values: i, _$litType$: s } = t, e = "number" == typeof s ? this._$AC(t) : (void 0 === s.el && (s.el = S.createElement(V(s.h, s.h[0]), this.options)), s);
		if (this._$AH?._$AD === e) this._$AH.p(i);
		else {
			const t = new R(e, this), s = t.u(this.options);
			t.p(i), this.T(s), this._$AH = t;
		}
	}
	_$AC(t) {
		let i = C.get(t.strings);
		return void 0 === i && C.set(t.strings, i = new S(t)), i;
	}
	k(t) {
		u(this._$AH) || (this._$AH = [], this._$AR());
		const i = this._$AH;
		let s, e = 0;
		for (const h of t) e === i.length ? i.push(s = new k(this.O(c()), this.O(c()), this, this.options)) : s = i[e], s._$AI(h), e++;
		e < i.length && (this._$AR(s && s._$AB.nextSibling, e), i.length = e);
	}
	_$AR(t = this._$AA.nextSibling, s) {
		for (this._$AP?.(!1, !0, s); t !== this._$AB;) {
			const s = i$3(t).nextSibling;
			i$3(t).remove(), t = s;
		}
	}
	setConnected(t) {
		void 0 === this._$AM && (this._$Cv = t, this._$AP?.(t));
	}
};
var H = class {
	get tagName() {
		return this.element.tagName;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	constructor(t, i, s, e, h) {
		this.type = 1, this._$AH = A, this._$AN = void 0, this.element = t, this.name = i, this._$AM = e, this.options = h, s.length > 2 || "" !== s[0] || "" !== s[1] ? (this._$AH = Array(s.length - 1).fill(/* @__PURE__ */ new String()), this.strings = s) : this._$AH = A;
	}
	_$AI(t, i = this, s, e) {
		const h = this.strings;
		let o = !1;
		if (void 0 === h) t = M(this, t, i, 0), o = !a(t) || t !== this._$AH && t !== E, o && (this._$AH = t);
		else {
			const e = t;
			let n, r;
			for (t = h[0], n = 0; n < h.length - 1; n++) r = M(this, e[s + n], i, n), r === E && (r = this._$AH[n]), o ||= !a(r) || r !== this._$AH[n], r === A ? t = A : t !== A && (t += (r ?? "") + h[n + 1]), this._$AH[n] = r;
		}
		o && !e && this.j(t);
	}
	j(t) {
		t === A ? this.element.removeAttribute(this.name) : this.element.setAttribute(this.name, t ?? "");
	}
};
var I = class extends H {
	constructor() {
		super(...arguments), this.type = 3;
	}
	j(t) {
		this.element[this.name] = t === A ? void 0 : t;
	}
};
var L = class extends H {
	constructor() {
		super(...arguments), this.type = 4;
	}
	j(t) {
		this.element.toggleAttribute(this.name, !!t && t !== A);
	}
};
var z = class extends H {
	constructor(t, i, s, e, h) {
		super(t, i, s, e, h), this.type = 5;
	}
	_$AI(t, i = this) {
		if ((t = M(this, t, i, 0) ?? A) === E) return;
		const s = this._$AH, e = t === A && s !== A || t.capture !== s.capture || t.once !== s.once || t.passive !== s.passive, h = t !== A && (s === A || e);
		e && this.element.removeEventListener(this.name, this, s), h && this.element.addEventListener(this.name, this, t), this._$AH = t;
	}
	handleEvent(t) {
		"function" == typeof this._$AH ? this._$AH.call(this.options?.host ?? this.element, t) : this._$AH.handleEvent(t);
	}
};
var Z = class {
	constructor(t, i, s) {
		this.element = t, this.type = 6, this._$AN = void 0, this._$AM = i, this.options = s;
	}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AI(t) {
		M(this, t);
	}
};
var B = t$2.litHtmlPolyfillSupport;
B?.(S, k), (t$2.litHtmlVersions ??= []).push("3.3.3");
var D = (t, i, s) => {
	const e = s?.renderBefore ?? i;
	let h = e._$litPart$;
	if (void 0 === h) {
		const t = s?.renderBefore ?? null;
		e._$litPart$ = h = new k(i.insertBefore(c(), t), t, void 0, s ?? {});
	}
	return h._$AI(t), h;
};
// node_modules/lit-element/lit-element.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var s = globalThis;
var i$2 = class extends y$1 {
	constructor() {
		super(...arguments), this.renderOptions = { host: this }, this._$Do = void 0;
	}
	createRenderRoot() {
		const t = super.createRenderRoot();
		return this.renderOptions.renderBefore ??= t.firstChild, t;
	}
	update(t) {
		const r = this.render();
		this.hasUpdated || (this.renderOptions.isConnected = this.isConnected), super.update(t), this._$Do = D(r, this.renderRoot, this.renderOptions);
	}
	connectedCallback() {
		super.connectedCallback(), this._$Do?.setConnected(!0);
	}
	disconnectedCallback() {
		super.disconnectedCallback(), this._$Do?.setConnected(!1);
	}
	render() {
		return E;
	}
};
i$2._$litElement$ = !0, i$2["finalized"] = !0, s.litElementHydrateSupport?.({ LitElement: i$2 });
var o$1 = s.litElementPolyfillSupport;
o$1?.({ LitElement: i$2 });
(s.litElementVersions ??= []).push("4.2.2");
// src/donnees/historique.ts
var TRANCHES = 32;
var JOUR$1 = 864e5;
var historiques = /* @__PURE__ */ new Map();
function historique(hass, cle, ids) {
	const deja = historiques.get(cle);
	if (deja && Date.now() - deja.quand < 9e5) return deja.promesse;
	const debut = (/* @__PURE__ */ new Date(Date.now() - JOUR$1)).toISOString();
	const promesse = hass.callWS({
		type: "recorder/statistics_during_period",
		start_time: debut,
		statistic_ids: ids,
		period: "5minute",
		types: ["mean"]
	}).then((stats) => {
		const listes = Object.fromEntries(Object.entries(stats ?? {}).filter(([, l]) => l.length > 1).map(([id, l]) => [id, l.map((p) => ({
			s: p.mean,
			lu: p.start > 0xe8d4a51000 ? p.start / 1e3 : p.start
		}))]));
		if (Object.keys(listes).length) return listes;
		return hass.callWS({
			type: "history/history_during_period",
			start_time: debut,
			entity_ids: ids,
			minimal_response: true,
			no_attributes: true,
			significant_changes_only: false
		});
	}).then((r) => enTranches(r)).catch(() => []);
	historiques.set(cle, {
		quand: Date.now(),
		promesse
	});
	return promesse;
}
/** 32 tranches entre le premier point connu (24 h au plus, 2 h au moins) et maintenant : moyenne de toutes les séries. */
function enTranches(r) {
	const maintenant = Date.now();
	const listes = Object.values(r ?? {});
	const premiers = listes.flatMap((l) => l.length ? [(l[0].lu ?? l[0].lc ?? 0) * 1e3] : []);
	const origine = Math.min(Math.max(Math.min(...premiers, maintenant), maintenant - JOUR$1), maintenant - 72e5);
	const pas = (maintenant - origine) / TRANCHES;
	const tranches = Array.from({ length: TRANCHES }, () => []);
	for (const liste of listes) {
		let dernier = null;
		for (const p of liste) {
			const v = Number.parseFloat(String(p.s));
			const quand = (p.lu ?? p.lc ?? 0) * 1e3;
			if (Number.isNaN(v)) continue;
			const i = Math.max(0, Math.min(31, Math.floor((quand - origine) / pas)));
			if (dernier) for (let k = dernier.i + 1; k < i; k++) tranches[k].push(dernier.v);
			tranches[i].push(v);
			dernier = {
				i,
				v
			};
		}
		if (dernier) for (let k = dernier.i + 1; k < TRANCHES; k++) tranches[k].push(dernier.v);
	}
	let precedent = null;
	return tranches.map((l) => l.length ? precedent = l.reduce((a, b) => a + b, 0) / l.length : precedent);
}
var statistiques = /* @__PURE__ */ new Map();
/** Variation d'un compteur d'énergie sur la journée (ou la veille, `decalage` -1), par les statistiques. */
function variationJour(hass, ids, decalage = 0) {
	const cle = `${ids.join()}|${decalage}`;
	const deja = statistiques.get(cle);
	if (deja && Date.now() - deja.quand < 3e5) return deja.promesse;
	const promesse = Promise.all(ids.map((id) => hass.callWS({
		type: "recorder/statistic_during_period",
		statistic_id: id,
		calendar: {
			period: "day",
			offset: decalage
		},
		types: ["change"]
	}).then((r) => r?.change ?? null).catch(() => null))).then((valeurs) => valeurs.every((v) => v === null) ? null : valeurs.reduce((a, b) => a + (b || 0), 0));
	statistiques.set(cle, {
		quand: Date.now(),
		promesse
	});
	return promesse;
}
// src/mise-en-page/courbes.ts
/** Moyenne de chaque point avec ses deux voisins : adoucit les marches de l'historique. */
function lisser(valeurs) {
	return valeurs.map((v, i) => {
		if (v === null) return null;
		const voisins = [
			valeurs[i - 1],
			v,
			valeurs[i + 1]
		].filter((x) => x !== null && x !== void 0);
		return voisins.reduce((a, b) => a + b, 0) / voisins.length;
	});
}
var pointsConnus = (valeurs) => valeurs.flatMap((v, i) => v === null ? [] : [[i, v]]);
/** Une courbe seule, avec son aire, sur toute la largeur de la carte. */
function courbe(valeurs, largeur = 120, hauteur = 34) {
	const points = pointsConnus(valeurs);
	if (points.length < 2) return A;
	const vs = points.map(([, v]) => v);
	const min = Math.min(...vs), ecart = Math.max(...vs) - min || 1;
	const x = (i) => i / (valeurs.length - 1) * largeur;
	const y = (v) => hauteur - 3 - (v - min) / ecart * (hauteur - 6);
	const ligne = points.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
	return b`<svg class="courbe" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="none" aria-hidden="true">${w`
    <path d=${`${ligne} L${x(points[points.length - 1][0]).toFixed(1)} ${hauteur} L${x(points[0][0]).toFixed(1)} ${hauteur} Z`} fill="var(--primary-color)" fill-opacity=".10"/><path d=${ligne} fill="none" stroke="var(--primary-color)" stroke-width="1.6" vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`}</svg>`;
}
/** Plusieurs courbes sur la même échelle (dedans et dehors, par exemple) : la première pleine, les autres en pointillé. */
function courbes(series, largeur = 300, hauteur = 92) {
	const lissees = series.map((s) => ({
		...s,
		valeurs: lisser(s.valeurs)
	}));
	const toutes = lissees.flatMap((s) => s.valeurs.filter((v) => v !== null));
	if (toutes.length < 2) return A;
	const min = Math.min(...toutes), ecart = Math.max(...toutes) - min || 1;
	return b`<svg class="graphe" viewBox="0 0 ${largeur} ${hauteur}" preserveAspectRatio="none" aria-hidden="true">${lissees.map((s, n) => {
		const pts = pointsConnus(s.valeurs);
		if (pts.length < 2) return A;
		const x = (i) => i / (s.valeurs.length - 1) * largeur;
		const y = (v) => hauteur - 6 - (v - min) / ecart * (hauteur - 14);
		const ligne = pts.map(([i, v], k) => `${k ? "L" : "M"}${x(i).toFixed(1)} ${y(v).toFixed(1)}`).join(" ");
		return w`${n === 0 ? w`<path d=${`${ligne} L${x(pts[pts.length - 1][0])} ${hauteur} L${x(pts[0][0])} ${hauteur} Z`} fill=${s.couleur} fill-opacity=".10"/>` : A}<path d=${ligne} fill="none" stroke=${s.couleur} stroke-width=${n === 0 ? 2 : 1.6} stroke-dasharray=${n ? "4 4" : A} vector-effect="non-scaling-stroke" stroke-linejoin="round"/>`;
	})}</svg>`;
}
// src/textes.ts
var TEXTES$1 = {
	fr: {
		bonjour: "Bonjour",
		apresmidi: "Bon après-midi",
		bonsoir: "Bonsoir",
		nuit: "Bonne nuit",
		accueil: "Accueil",
		favoris: "Favoris",
		pieces: "Pièces",
		votreMaison: "Votre maison",
		aujourdhui: "Aujourd'hui",
		climat: "Climat",
		energie: "Énergie",
		securite: "Sécurité",
		systeme: "Système",
		aRanger: "À ranger",
		meteo: "Météo",
		lumieres: "Lumières",
		volets: "Volets",
		appareils: "Appareils",
		capteurs: "Capteurs",
		medias: "Musique et télé",
		thermostats: "Chauffage et climatisation",
		temperatures: "Températures",
		sauvegardes: "Sauvegardes",
		misesAJour: "Mises à jour",
		piles: "Piles",
		machine: "La machine",
		ouvertures: "Portes et fenêtres",
		alertes: "Détecteurs",
		toutVaBien: "Tout va bien à la maison.",
		reveiller: "Toucher pour rallumer l'écran",
		bilan: "Bilan de la semaine",
		bilanPret: "Le bilan de la semaine est prêt",
		bilanPretDetail: "Énergie, températures et ouvertures.",
		bilanPhrase: (du, au) => `Du ${du} au ${au}.`,
		bilanVide: "Pas encore assez d'historique : le bilan se remplira tout seul au fil des semaines.",
		bilanSansEnergie: "Pas de compteur d'énergie pour la maison.",
		bilanSansTemperature: "Pas de température suivie.",
		bilanEcart: (v) => `${v} par rapport à la semaine d'avant`,
		bilanBarres: "Consommation jour par jour",
		bilanFois: (n) => n > 1 ? "ouvertures" : "ouverture",
		absenceCalme: "Personne à la maison, tout est fermé et éteint.",
		absenceReste: (liste) => `Personne à la maison : ${liste}.`,
		absOuverts: (n) => n > 1 ? `${n} ouvertures` : "1 ouverture",
		absSerrures: (n) => n > 1 ? `${n} serrures ouvertes` : "1 serrure ouverte",
		absLumieres: (n) => n > 1 ? `${n} lumières allumées` : "1 lumière allumée",
		absAlarme: "l'alarme désarmée",
		verrouiller: (quoi) => `Verrouillez ${quoi}`,
		verrouillerSans: "À verrouiller",
		armer: "Armez l'alarme",
		eteindre: "Éteignez les lumières",
		personneLa: "Personne n'est à la maison.",
		lumieresOubliees: (n, pieces) => `${n > 1 ? `${n} allumées` : "1 allumée"}${pieces ? ` : ${pieces}` : ""}.`,
		points: (n) => n > 1 ? `${n} points à regarder, le reste va bien.` : "1 point à regarder, le reste va bien.",
		alerteGrave: (q) => `${q}.`,
		ouverte: "Ouverte",
		fuite: "Fuite détectée",
		fumee: "Fumée détectée",
		alarme: "Alarme déclenchée",
		pileFaible: "Pile faible",
		serviceEnPanne: "Service hors ligne",
		fermer: (quoi) => `Fermez ${quoi}`,
		fermerSans: "À fermer",
		chauffageOuvert: "Le chauffage tourne pendant que c'est ouvert.",
		aerer: (piece) => `Aérez ${piece}`,
		aererSans: "À aérer",
		co2: (v) => `${v} ppm de CO₂ : quelques minutes de fenêtre ouverte suffisent.`,
		humidite: (v) => `${v} % d'humidité : aérez pour éviter la moisissure.`,
		majs: (n) => n > 1 ? `${n} mises à jour disponibles` : "1 mise à jour disponible",
		majsDetail: "Système, applications et appareils",
		sauvegardeAucune: "Aucune sauvegarde automatique",
		sauvegardeAucuneDetail: "À régler dans les sauvegardes",
		sauvegardeEchec: "La dernière sauvegarde a échoué",
		sauvegardeEchecDetail: "Ouvrir les sauvegardes",
		vigilance: (c) => `Vigilance ${c}`,
		autres: (n) => `et ${n} autre${n > 1 ? "s" : ""}`,
		ignorer: "Ignorer jusqu'à demain",
		prevenir: "Me prévenir la prochaine fois",
		prevenu: "Vous serez prévenu : voir l'automatisme",
		automatismeCree: (nom) => `Automatisme créé : ${nom}.`,
		automatismeEchec: "L'automatisme n'a pas pu être créé.",
		voir: "Voir",
		ignores: (n) => `${n} point${n > 1 ? "s" : ""} ignoré${n > 1 ? "s" : ""} jusqu'à demain.`,
		remontrer: "Remontrer",
		allumees: (n) => n > 1 ? `${n} allumées` : n === 1 ? "1 allumée" : "Éteintes",
		dedans: "dedans",
		dehors: "Dehors",
		moyenne: "en moyenne",
		toutFerme: "Tout est fermé",
		ouverts: (n) => n > 1 ? `${n} ouvertures` : "1 ouverture",
		aJour: "À jour",
		enCeMoment: "en ce moment",
		sansPiece: (n) => n > 1 ? `${n} appareils sans pièce` : "1 appareil sans pièce",
		choisirPieces: "Choisir leur pièce",
		toutEteindre: "Tout éteindre",
		toutFermer: "Tout fermer",
		alarmeEtat: {
			disarmed: "Alarme désactivée",
			armed_home: "Alarme activée (présence)",
			armed_away: "Alarme activée",
			armed_night: "Alarme de nuit",
			triggered: "Alarme déclenchée"
		},
		aucuneFuite: "aucune fuite",
		sauvegardeIlYa: (q) => `Sauvegarde ${q}`,
		sauvegardeNon: "Sauvegardes à régler",
		lever: "Lever",
		coucher: "Coucher",
		deJour: "de jour",
		soleil: "Soleil",
		ferie: "Prochain jour férié",
		ferieAujourdhui: "Aujourd'hui, férié",
		dansJours: (n) => n === 1 ? "demain" : `dans ${n} jours`,
		premiersPas: "Premiers pas",
		premiersPasDetail: "Pour profiter d'Automatic Dashboard dès aujourd'hui.",
		etapes: {
			emplacement: "Indiquer où est la maison",
			meteoFrance: "Ajouter Météo-France : pluie dans l'heure et vigilance",
			meteo: "Ajouter la météo",
			feries: "Afficher les jours fériés",
			sauvegardes: "Activer les sauvegardes automatiques",
			pieces: "Ranger vos appareils dans des pièces",
			appli: "Installer l'application sur votre téléphone",
			appareil: "Ajouter un appareil"
		},
		phraseMeteo: (cond, temp) => `${cond}, ${temp}.`,
		pasDePluie: "Pas de pluie dans l'heure.",
		pluieDansPhrase: (n) => `Pluie dans ${n} min.`,
		pluieEnCours: "Il pleut.",
		piecePhrase: (morceaux) => morceaux.join(", ") + ".",
		lumieresAllumees: (n) => n > 1 ? `${n} lumières allumées` : "1 lumière allumée",
		voletsOuverts: (n) => n > 1 ? `${n} volets ouverts` : "volet ouvert",
		chauffe: "chauffage en marche",
		clim: "climatisation en marche",
		toutEteint: "Tout est éteint",
		climatPhrase: (d, e) => [d, e].filter(Boolean).join(", ") + ".",
		energiePhrase: (w) => `${w} en ce moment.`,
		pieceSurtitre: "Pièce",
		etagePrefixe: "",
		enCeMomentTitre: "En ce moment",
		mediasEnLecture: (n) => `${n} médias en lecture`,
		pauseMedia: "Mettre en pause",
		aLaMaison: (noms) => `À la maison : ${noms.join(", ")}`,
		personnesALaMaison: (n) => n > 1 ? `${n} personnes à la maison` : "1 personne à la maison",
		personne: "Personne à la maison",
		ailleurs: (nom, zone) => `${nom} : ${zone ?? "ailleurs"}`,
		enCours: "En cours",
		demain: "Demain",
		toutLeJour: "Aujourd'hui",
		enMarche: (nom) => `${nom} en marche`,
		minuteur: (nom, min) => `${nom} : ${min} min`,
		enPause: (nom) => `${nom} : en pause`,
		articles: (n) => n > 1 ? `${n} articles à acheter` : "1 article à acheter",
		pluieTitre: "Pluie dans l'heure",
		pluieAucune: "Pas de pluie dans l'heure",
		pluieDans: (type, n) => `${type} dans ${n} min`,
		pluieFin: (n) => `Il pleut, fin prévue dans ${n} min`,
		pluieContinue: "Pluie pendant toute l'heure",
		pluieSource: (h) => `Météo-France, ${h}`,
		maintenant: "maintenant",
		dans1h: "dans 1 h",
		pluieTypes: {},
		couleurs: [
			"vert",
			"jaune",
			"orange",
			"rouge"
		],
		vigilanceVerte: "Pas de vigilance météo aujourd'hui",
		conseils: [
			"",
			"Soyez attentif : des phénomènes habituels mais parfois dangereux sont prévus.",
			"Soyez très vigilant : des phénomènes dangereux sont prévus. Suivez les consignes des autorités.",
			"Vigilance absolue : des phénomènes dangereux d'une intensité exceptionnelle sont prévus. Respectez les consignes des autorités."
		],
		vigilanceCarte: "Voir la carte de Météo-France"
	},
	en: {
		bonjour: "Good morning",
		apresmidi: "Good afternoon",
		bonsoir: "Good evening",
		nuit: "Good night",
		accueil: "Home",
		favoris: "Favorites",
		pieces: "Rooms",
		votreMaison: "Your home",
		aujourdhui: "Today",
		climat: "Climate",
		energie: "Energy",
		securite: "Security",
		systeme: "System",
		aRanger: "To sort",
		meteo: "Weather",
		lumieres: "Lights",
		volets: "Shutters",
		appareils: "Devices",
		capteurs: "Sensors",
		medias: "Music and TV",
		thermostats: "Heating and cooling",
		temperatures: "Temperatures",
		sauvegardes: "Backups",
		misesAJour: "Updates",
		piles: "Batteries",
		machine: "The machine",
		ouvertures: "Doors and windows",
		alertes: "Detectors",
		toutVaBien: "All is well at home.",
		reveiller: "Touch to wake the screen",
		bilan: "Weekly report",
		bilanPret: "The weekly report is ready",
		bilanPretDetail: "Energy, temperatures and openings.",
		bilanPhrase: (du, au) => `From ${du} to ${au}.`,
		bilanVide: "Not enough history yet: the report will fill in by itself over the weeks.",
		bilanSansEnergie: "No energy meter for the home.",
		bilanSansTemperature: "No temperature tracked.",
		bilanEcart: (v) => `${v} vs the week before`,
		bilanBarres: "Consumption day by day",
		bilanFois: (n) => n > 1 ? "openings" : "opening",
		absenceCalme: "Nobody home, everything is closed and off.",
		absenceReste: (liste) => `Nobody home: ${liste}.`,
		absOuverts: (n) => n > 1 ? `${n} openings` : "1 opening",
		absSerrures: (n) => n > 1 ? `${n} locks open` : "1 lock open",
		absLumieres: (n) => n > 1 ? `${n} lights on` : "1 light on",
		absAlarme: "the alarm disarmed",
		verrouiller: (quoi) => `Lock ${quoi}`,
		verrouillerSans: "To lock",
		armer: "Arm the alarm",
		eteindre: "Turn off the lights",
		personneLa: "Nobody is home.",
		lumieresOubliees: (n, pieces) => `${n} on${pieces ? `: ${pieces}` : ""}.`,
		points: (n) => n > 1 ? `${n} things to check, the rest is fine.` : "1 thing to check, the rest is fine.",
		alerteGrave: (q) => `${q}.`,
		ouverte: "Open",
		fuite: "Leak detected",
		fumee: "Smoke detected",
		alarme: "Alarm triggered",
		pileFaible: "Low battery",
		serviceEnPanne: "Service offline",
		fermer: (quoi) => `Close ${quoi}`,
		fermerSans: "To close",
		chauffageOuvert: "The heating is on while it's open.",
		aerer: (piece) => `Air out ${piece}`,
		aererSans: "To air out",
		co2: (v) => `${v} ppm of CO₂: a few minutes with the window open is enough.`,
		humidite: (v) => `${v}% humidity: air it out to prevent mould.`,
		majs: (n) => n > 1 ? `${n} updates available` : "1 update available",
		majsDetail: "System, apps and devices",
		sauvegardeAucune: "No automatic backup",
		sauvegardeAucuneDetail: "Set it up in backups",
		sauvegardeEchec: "The last backup failed",
		sauvegardeEchecDetail: "Open backups",
		vigilance: (c) => `${c} warning`,
		autres: (n) => `and ${n} more`,
		ignorer: "Ignore until tomorrow",
		prevenir: "Notify me next time",
		prevenu: "You will be notified: see the automation",
		automatismeCree: (nom) => `Automation created: ${nom}.`,
		automatismeEchec: "The automation could not be created.",
		voir: "See",
		ignores: (n) => `${n} item${n > 1 ? "s" : ""} ignored until tomorrow.`,
		remontrer: "Show again",
		allumees: (n) => n > 1 ? `${n} on` : n === 1 ? "1 on" : "Off",
		dedans: "inside",
		dehors: "Outside",
		moyenne: "on average",
		toutFerme: "Everything is closed",
		ouverts: (n) => n > 1 ? `${n} open` : "1 open",
		aJour: "Up to date",
		enCeMoment: "right now",
		sansPiece: (n) => n > 1 ? `${n} devices without a room` : "1 device without a room",
		choisirPieces: "Choose their room",
		toutEteindre: "All off",
		toutFermer: "Close all",
		alarmeEtat: {
			disarmed: "Alarm off",
			armed_home: "Alarm on (home)",
			armed_away: "Alarm on",
			armed_night: "Night alarm",
			triggered: "Alarm triggered"
		},
		aucuneFuite: "no leak",
		sauvegardeIlYa: (q) => `Backup ${q}`,
		sauvegardeNon: "Backups to set up",
		lever: "Sunrise",
		coucher: "Sunset",
		deJour: "of daylight",
		soleil: "Sun",
		ferie: "Next public holiday",
		ferieAujourdhui: "Public holiday today",
		dansJours: (n) => n === 1 ? "tomorrow" : `in ${n} days`,
		premiersPas: "First steps",
		premiersPasDetail: "To get the most out of Automatic Dashboard today.",
		etapes: {
			emplacement: "Tell Home Assistant where your home is",
			meteoFrance: "Add Météo-France: rain in the next hour and warnings",
			meteo: "Add the weather",
			feries: "Show public holidays",
			sauvegardes: "Turn on automatic backups",
			pieces: "Put your devices in rooms",
			appli: "Install the app on your phone",
			appareil: "Add a device"
		},
		phraseMeteo: (cond, temp) => `${cond}, ${temp}.`,
		pasDePluie: "No rain in the next hour.",
		pluieDansPhrase: (n) => `Rain in ${n} min.`,
		pluieEnCours: "It is raining.",
		piecePhrase: (morceaux) => morceaux.join(", ") + ".",
		lumieresAllumees: (n) => n > 1 ? `${n} lights on` : "1 light on",
		voletsOuverts: (n) => n > 1 ? `${n} shutters open` : "shutter open",
		chauffe: "heating on",
		clim: "cooling on",
		toutEteint: "Everything is off",
		climatPhrase: (d, e) => [d, e].filter(Boolean).join(", ") + ".",
		energiePhrase: (w) => `${w} right now.`,
		pieceSurtitre: "Room",
		etagePrefixe: "",
		enCeMomentTitre: "Right now",
		mediasEnLecture: (n) => `${n} players on`,
		pauseMedia: "Pause",
		aLaMaison: (noms) => `Home: ${noms.join(", ")}`,
		personnesALaMaison: (n) => n > 1 ? `${n} people home` : "1 person home",
		personne: "Nobody home",
		ailleurs: (nom, zone) => `${nom}: ${zone ?? "away"}`,
		enCours: "Now",
		demain: "Tomorrow",
		toutLeJour: "Today",
		enMarche: (nom) => `${nom} running`,
		minuteur: (nom, min) => `${nom}: ${min} min`,
		enPause: (nom) => `${nom}: paused`,
		articles: (n) => n > 1 ? `${n} items to buy` : "1 item to buy",
		pluieTitre: "Rain in the next hour",
		pluieAucune: "No rain in the next hour",
		pluieDans: (type, n) => `${type} in ${n} min`,
		pluieFin: (n) => `Raining now, should stop in ${n} min`,
		pluieContinue: "Rain for the whole hour",
		pluieSource: (h) => `Météo-France, ${h}`,
		maintenant: "now",
		dans1h: "in 1 h",
		pluieTypes: {
			"Pluie faible": "Light rain",
			"Pluie modérée": "Moderate rain",
			"Pluie forte": "Heavy rain"
		},
		couleurs: [
			"Green",
			"Yellow",
			"Orange",
			"Red"
		],
		vigilanceVerte: "No weather warning today",
		conseils: [
			"",
			"Be aware: usual but occasionally dangerous weather is expected.",
			"Be very careful: dangerous weather is expected. Follow the advice of the authorities.",
			"Take extreme care: exceptionally dangerous weather is expected. Follow the instructions of the authorities."
		],
		vigilanceCarte: "See the Météo-France map"
	}
};
var METEO = {
	"clear-night": [
		"mdi:weather-night",
		"Nuit claire",
		"Clear night"
	],
	cloudy: [
		"mdi:weather-cloudy",
		"Nuageux",
		"Cloudy"
	],
	fog: [
		"mdi:weather-fog",
		"Brouillard",
		"Fog"
	],
	hail: [
		"mdi:weather-hail",
		"Grêle",
		"Hail"
	],
	lightning: [
		"mdi:weather-lightning",
		"Orage",
		"Lightning"
	],
	"lightning-rainy": [
		"mdi:weather-lightning-rainy",
		"Orage et pluie",
		"Thunderstorm"
	],
	partlycloudy: [
		"mdi:weather-partly-cloudy",
		"Éclaircies",
		"Partly cloudy"
	],
	pouring: [
		"mdi:weather-pouring",
		"Averses",
		"Pouring"
	],
	rainy: [
		"mdi:weather-rainy",
		"Pluie",
		"Rainy"
	],
	snowy: [
		"mdi:weather-snowy",
		"Neige",
		"Snowy"
	],
	"snowy-rainy": [
		"mdi:weather-snowy-rainy",
		"Pluie et neige",
		"Sleet"
	],
	sunny: [
		"mdi:weather-sunny",
		"Ensoleillé",
		"Sunny"
	],
	windy: [
		"mdi:weather-windy",
		"Venteux",
		"Windy"
	],
	"windy-variant": [
		"mdi:weather-windy-variant",
		"Venteux",
		"Windy"
	],
	exceptional: [
		"mdi:alert-circle-outline",
		"Exceptionnel",
		"Exceptional"
	]
};
var MOTS_HEROS = {
	fr: {
		dedans: "dedans",
		dehors: "dehors",
		humidite: "humidité",
		maintenant: "maintenant",
		aujourdhui: "aujourd'hui",
		hier: "hier",
		production: "production",
		ouvertures: (n, total) => `${n > 1 ? "ouvertes" : "ouverte"} sur ${total}`,
		serrures: (n) => n > 1 ? "déverrouillées" : "déverrouillée",
		detecteurs: (n) => n > 1 ? "alertes" : "alerte",
		toutFerme: "Tout est fermé",
		ouvert: "ouverte",
		gerer: "Gérer",
		voir: "Voir",
		regler: "Régler",
		majs: (n) => n > 1 ? `${n} mises à jour disponibles` : "1 mise à jour disponible",
		aJour: "Tout est à jour",
		sauvegarde: "sauvegarde",
		prochaine: "prochaine",
		taille: "taille",
		version: "Home Assistant",
		jamais: "jamais",
		nonPrevue: "non prévue",
		reussie: "réussie",
		echouee: "échouée",
		sansSauvegarde: "Aucune sauvegarde automatique",
		sansSauvegardeDetail: "Sans elle, une panne peut tout effacer.",
		ranges: (n) => `${n} appareil${n > 1 ? "s" : ""} rangé${n > 1 ? "s" : ""}`,
		aRanger: (n) => `${n} à ranger`,
		rangerTout: "Ranger mes appareils",
		creerPiece: "Créer une pièce",
		legende24: "24 dernières heures",
		puissance: "puissance",
		alarme: "Alarme"
	},
	en: {
		dedans: "inside",
		dehors: "outside",
		humidite: "humidity",
		maintenant: "now",
		aujourdhui: "today",
		hier: "yesterday",
		production: "production",
		ouvertures: (_n, total) => `open of ${total}`,
		serrures: () => "unlocked",
		detecteurs: (n) => n === 1 ? "alert" : "alerts",
		toutFerme: "Everything is closed",
		ouvert: "open",
		gerer: "Manage",
		voir: "See",
		regler: "Set up",
		majs: (n) => n > 1 ? `${n} updates available` : "1 update available",
		aJour: "Everything is up to date",
		sauvegarde: "backup",
		prochaine: "next",
		taille: "size",
		version: "Home Assistant",
		jamais: "never",
		nonPrevue: "not scheduled",
		reussie: "succeeded",
		echouee: "failed",
		sansSauvegarde: "No automatic backup",
		sansSauvegardeDetail: "Without it, a failure can erase everything.",
		ranges: (n) => `${n} device${n > 1 ? "s" : ""} sorted`,
		aRanger: (n) => `${n} to sort`,
		rangerTout: "Sort my devices",
		creerPiece: "Create a room",
		legende24: "last 24 hours",
		puissance: "power",
		alarme: "Alarm"
	}
};
/** Les textes de l'éditeur des réglages (Modifier le tableau de bord). */
var EDITEUR = {
	fr: {
		mode: "Mode",
		modes: {
			auto: ["Automatique", "Choisi d'après votre maison, et revu quand elle change."],
			decouverte: ["Découverte", "Peu d'appareils : la météo et chaque appareil en grand."],
			maison: ["Maison", "Points à regarder, favoris, pièces et aperçus."],
			complet: ["Complet", "Beaucoup d'appareils : pièces par étage, tuiles compactes."]
		},
		nomsModes: {
			decouverte: "Découverte",
			maison: "Maison",
			complet: "Complet"
		},
		detecte: (mode, u, d, p) => `D'après votre maison : mode ${mode} (${u} entité${u > 1 ? "s" : ""} utile${u > 1 ? "s" : ""}, ${d} appareil${d > 1 ? "s" : ""}, ${p} pièce${p > 1 ? "s" : ""}).`,
		favoris: "Favoris",
		favorisAide: "Vos favoris d'abord, dans l'ordre choisi : faites-les glisser pour le changer.",
		completer: "Compléter avec les appareils que vous utilisez le plus",
		completerAide: "Home Assistant les propose selon l'heure : ils changent au fil de la journée.",
		propose: "Proposé",
		epingler: "Épingler",
		retirer: "Retirer",
		deplacer: (nom) => `Déplacer ${nom} (glisser, ou flèches du clavier)`,
		ajouterFavori: "Ajouter un favori",
		aucunFavori: "Aucun favori : la rangée n'apparaîtra pas.",
		favorisDecouverte: "En mode Découverte, l'accueil montre déjà chaque appareil en grand : les favoris apparaîtront en mode Maison ou Complet.",
		masques: "Masqués",
		masquesAide: "Ce qu'Automatic Dashboard ne montre nulle part. Le reste de Home Assistant n'en est pas changé.",
		masquer: "Masquer un appareil ou une entité",
		aucunMasque: "Rien n'est masqué.",
		masquesEtiquette: (n) => `Et ${n} entité${n > 1 ? "s" : ""} par l'étiquette « Automatic Dashboard : masquer », posée dans Home Assistant sur des entités, des appareils ou des pièces.`,
		parEtiquette: "Par étiquette",
		parEtiquetteAide: "Épinglé par l'étiquette « Automatic Dashboard : favori », posée dans Home Assistant",
		noms: "Noms",
		nomsAide: "Le nom affiché dans Automatic Dashboard. Celui de Home Assistant (et des assistants vocaux) ne change pas.",
		renommer: "Renommer un appareil ou une entité",
		nomTableau: "Nom dans Automatic Dashboard",
		nomDansHA: (nom) => `Dans Home Assistant : ${nom}`,
		pieces: "Pièces",
		piecesAide: "Les pièces et les étages suivent l'ordre choisi dans Home Assistant.",
		changerOrdre: "Changer l'ordre",
		enregistrerDabord: "Enregistrez d'abord vos réglages pour changer l'ordre des pièces.",
		tablette: "Tablette murale",
		tabletteAide: (page) => `Sur la tablette, ouvrez ${page} : l'heure en grand, la phrase d'état, les points à regarder et, la nuit, un écran de veille.`,
		ouvrirTablette: "Ouvrir la page",
		signaler: "Signaler un problème",
		signalerAide: "Un appareil mal rangé, absent ou en trop ? Choisissez-le, puis joignez le diagnostic à votre ticket. Il décrit votre maison sans aucun nom ni valeur, et devient un cas de test pour que l'erreur ne revienne jamais.",
		signalerChoisir: "Choisir l'appareil concerné",
		telecharger: "Télécharger le diagnostic",
		copier: "Copier",
		ouvrirTicket: "Ouvrir un ticket",
		copie: "Diagnostic copié : collez-le dans le ticket.",
		copieEchec: "La copie n'a pas marché : téléchargez le diagnostic et joignez le fichier au ticket.",
		tropLong: "Diagnostic copié, mais trop long pour être collé dans un ticket : téléchargez-le et joignez le fichier."
	},
	en: {
		mode: "Mode",
		modes: {
			auto: ["Automatic", "Chosen from your home, and reviewed when it changes."],
			decouverte: ["Discovery", "Few devices: the weather and each device shown large."],
			maison: ["Home", "Things to check, favorites, rooms and overviews."],
			complet: ["Complete", "Many devices: rooms by floor, compact tiles."]
		},
		nomsModes: {
			decouverte: "Discovery",
			maison: "Home",
			complet: "Complete"
		},
		detecte: (mode, u, d, p) => `From your home: ${mode} mode (${u} useful entit${u > 1 ? "ies" : "y"}, ${d} device${d > 1 ? "s" : ""}, ${p} room${p > 1 ? "s" : ""}).`,
		favoris: "Favorites",
		favorisAide: "Your favorites first, in the order you choose: drag them to change it.",
		completer: "Fill in with the devices you use most",
		completerAide: "Home Assistant suggests them by time of day: they change throughout the day.",
		propose: "Suggested",
		epingler: "Pin",
		retirer: "Remove",
		deplacer: (nom) => `Move ${nom} (drag, or arrow keys)`,
		ajouterFavori: "Add a favorite",
		aucunFavori: "No favorites: the row won't appear.",
		favorisDecouverte: "In Discovery mode, the home page already shows each device large: favorites will appear in Home or Complete mode.",
		masques: "Hidden",
		masquesAide: "What Automatic Dashboard never shows. The rest of Home Assistant is not affected.",
		masquer: "Hide a device or entity",
		aucunMasque: "Nothing is hidden.",
		masquesEtiquette: (n) => `And ${n} entit${n > 1 ? "ies" : "y"} by the "Automatic Dashboard: hide" label, set in Home Assistant on entities, devices or areas.`,
		parEtiquette: "By label",
		parEtiquetteAide: "Pinned by the \"Automatic Dashboard: favorite\" label, set in Home Assistant",
		noms: "Names",
		nomsAide: "The name shown in Automatic Dashboard. The Home Assistant name (and voice assistants) stays the same.",
		renommer: "Rename a device or entity",
		nomTableau: "Name in Automatic Dashboard",
		nomDansHA: (nom) => `In Home Assistant: ${nom}`,
		pieces: "Rooms",
		piecesAide: "Rooms and floors follow the order chosen in Home Assistant.",
		changerOrdre: "Change the order",
		enregistrerDabord: "Save your settings first to change the order of rooms.",
		tablette: "Wall tablet",
		tabletteAide: (page) => `On the tablet, open ${page}: the time shown large, the status sentence, things to check and, at night, a screen saver.`,
		ouvrirTablette: "Open the page",
		signaler: "Report a problem",
		signalerAide: "A device misplaced, missing or shown by mistake? Pick it, then attach the diagnostic to your issue. It describes your home without any name or value, and becomes a test case so the mistake never comes back.",
		signalerChoisir: "Pick the device involved",
		telecharger: "Download the diagnostic",
		copier: "Copy",
		ouvrirTicket: "Open an issue",
		copie: "Diagnostic copied: paste it into the issue.",
		copieEchec: "Copying failed: download the diagnostic and attach the file to the issue.",
		tropLong: "Diagnostic copied, but too long to paste into an issue: download it and attach the file."
	}
};
// src/outils.ts
var langue = (hass) => (hass?.locale?.language || hass?.language || "fr").slice(0, 2);
var estFrancais = (hass) => langue(hass) === "fr";
var t$1 = (hass) => estFrancais(hass) ? TEXTES$1.fr : TEXTES$1.en;
var mh = (hass) => estFrancais(hass) ? MOTS_HEROS.fr : MOTS_HEROS.en;
var nombre = (hass, v, chiffres = 1) => new Intl.NumberFormat(hass?.locale?.language || "fr", {
	maximumFractionDigits: chiffres,
	minimumFractionDigits: chiffres
}).format(v);
var degres = (hass, v) => `${nombre(hass, v, 1)}°`;
var heure = (hass, date) => new Intl.DateTimeFormat(hass?.locale?.language || "fr", {
	hour: "2-digit",
	minute: "2-digit"
}).format(date);
var majuscule = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
var valide = (etat) => Boolean(etat) && !["unknown", "unavailable"].includes(etat.state);
/** « il y a 3 heures », « dans 2 jours »… dans la langue de l'utilisateur. */
function ilYa(hass, date) {
	const rtf = new Intl.RelativeTimeFormat(langue(hass), { numeric: "auto" });
	const minutes = Math.round((date.getTime() - Date.now()) / 6e4);
	if (Math.abs(minutes) < 60) return rtf.format(minutes, "minute");
	const heures = Math.round(minutes / 60);
	return Math.abs(heures) < 36 ? rtf.format(heures, "hour") : rtf.format(Math.round(heures / 24), "day");
}
function conditionMeteo(hass, etat) {
	const [icone, fr, en] = METEO[etat?.state ?? ""] ?? [
		"mdi:weather-cloudy",
		etat?.state ?? "",
		etat?.state ?? ""
	];
	return {
		icone,
		texte: estFrancais(hass) ? fr : en
	};
}
/** Navigue dans Home Assistant. Un chemin relatif reste dans le tableau courant. */
function naviguer(chemin) {
	const cible = chemin.startsWith("/") ? chemin : `/${location.pathname.split("/")[1]}/${chemin}`;
	history.pushState(null, "", cible);
	window.dispatchEvent(new CustomEvent("location-changed", { detail: { replace: false } }));
}
/** Ouvre la fenêtre « plus d'infos » native d'une entité. */
function plusDInfos(element, entityId) {
	element.dispatchEvent(new CustomEvent("hass-more-info", {
		detail: { entityId },
		bubbles: true,
		composed: true
	}));
}
/** Nom d'affichage court : celui choisi dans les réglages, sinon celui de l'appareil quand l'entité en a un. */
function nomCourt(hass, entityId, noms = {}) {
	if (noms[entityId]) return noms[entityId];
	const appareil = hass.devices?.[hass.entities[entityId]?.device_id ?? ""];
	return appareil?.name_by_user || appareil?.name || hass.states[entityId]?.attributes.friendly_name || entityId;
}
/** Noms d'intégrations quand Home Assistant ne fournit pas leur traduction (elle n'est chargée qu'à la demande). */
var NOMS_INTEGRATIONS = {
	demo: ["Démonstration", "Demo"],
	mqtt: ["MQTT", "MQTT"],
	template: ["Modèles", "Templates"],
	zha: ["Zigbee (ZHA)", "Zigbee (ZHA)"],
	matter: ["Matter", "Matter"],
	hue: ["Philips Hue", "Philips Hue"],
	esphome: ["ESPHome", "ESPHome"],
	systemmonitor: ["Moniteur système", "System monitor"],
	hassio: ["Supervisor", "Supervisor"],
	glances: ["Glances", "Glances"],
	uptime_kuma: ["Uptime Kuma", "Uptime Kuma"],
	adguard: ["AdGuard Home", "AdGuard Home"],
	pi_hole: ["Pi-hole", "Pi-hole"],
	speedtestdotnet: ["Speedtest", "Speedtest"],
	proxmoxve: ["Proxmox VE", "Proxmox VE"],
	synology_dsm: ["Synology DSM", "Synology DSM"],
	unifi: ["UniFi Network", "UniFi Network"],
	truenas: ["TrueNAS", "TrueNAS"],
	fritz: ["FRITZ!Box", "FRITZ!Box"],
	netdata: ["Netdata", "Netdata"]
};
/** Le nom d'une intégration, dans la langue de l'utilisateur. */
function nomIntegration(hass, plateforme) {
	const connu = NOMS_INTEGRATIONS[plateforme];
	return hass.localize?.(`component.${plateforme}.title`) || (connu ? connu[estFrancais(hass) ? 0 : 1] : majuscule(plateforme.replace(/_/g, " ")));
}
/** La trame de la marque : petits carrés de 2,8 px tous les 22 px, en image CSS. */
function trame(hass) {
	return `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='22' height='22'%3E%3Crect width='2.8' height='2.8' fill='${hass?.themes?.darkMode ? "%23FFFFFF" : "%230277BD"}' fill-opacity='${hass?.themes?.darkMode ? "0.12" : "0.30"}'/%3E%3C/svg%3E")`;
}
/** Phase de la lune, calculée sans internet (cycle moyen de 29,53 jours ; précision d'environ un jour). */
function phaseLune(date, lg) {
	const cycle = 29.530588853;
	const age = ((date.getTime() - Date.UTC(2e3, 0, 6, 18, 14)) / 864e5 % cycle + cycle) % cycle;
	const [icone, fr, en] = [
		[
			"mdi:moon-new",
			"Nouvelle lune",
			"New moon"
		],
		[
			"mdi:moon-waxing-crescent",
			"Premier croissant",
			"Waxing crescent"
		],
		[
			"mdi:moon-first-quarter",
			"Premier quartier",
			"First quarter"
		],
		[
			"mdi:moon-waxing-gibbous",
			"Gibbeuse croissante",
			"Waxing gibbous"
		],
		[
			"mdi:moon-full",
			"Pleine lune",
			"Full moon"
		],
		[
			"mdi:moon-waning-gibbous",
			"Gibbeuse décroissante",
			"Waning gibbous"
		],
		[
			"mdi:moon-last-quarter",
			"Dernier quartier",
			"Last quarter"
		],
		[
			"mdi:moon-waning-crescent",
			"Dernier croissant",
			"Waning crescent"
		]
	][Math.floor((age + cycle / 16) % cycle / (cycle / 8))];
	const jours = Math.round(((cycle / 2 - age) % cycle + cycle) % cycle);
	const pleine = lg === "fr" ? jours === 0 ? "pleine lune ce soir" : `pleine lune dans ${jours} jour${jours > 1 ? "s" : ""}` : jours === 0 ? "full moon tonight" : `full moon in ${jours} day${jours > 1 ? "s" : ""}`;
	return {
		icone,
		nom: lg === "fr" ? fr : en,
		pleine
	};
}
// src/moteur/valeurs.ts
/** Première valeur numérique disponible parmi des candidats ordonnés. */
function premiereValeur(hass, candidats) {
	for (const id of candidats ?? []) {
		const v = Number.parseFloat(hass.states[id]?.state ?? "");
		if (!Number.isNaN(v)) return v;
	}
	return null;
}
function moyenneInterieure(hass, m) {
	const valeurs = m.temperaturesInterieures.map((c) => premiereValeur(hass, c)).filter((v) => v !== null);
	return valeurs.length ? valeurs.reduce((a, b) => a + b, 0) / valeurs.length : null;
}
/** Dehors : un capteur d'une pièce extérieure, sinon la météo. */
function temperatureDehors(hass, m) {
	const capteur = premiereValeur(hass, m.temperaturesExterieures);
	if (capteur !== null) return capteur;
	const meteo = m.meteo ? hass.states[m.meteo] : void 0;
	return valide(meteo) && typeof meteo.attributes.temperature === "number" ? meteo.attributes.temperature : null;
}
/**
* Les compteurs d'énergie de toute la maison : ceux de l'appareil qui donne la puissance
* du réseau, sinon le capteur d'énergie sans pièce dont le nom évoque la maison.
* Jamais la somme des prises.
*/
function energiesMaison(hass, m) {
	const reseau = m.puissanceReseau ? hass.entities[m.puissanceReseau]?.device_id : null;
	const energies = m.energie.filter((e) => e.classe === "energy");
	if (reseau) {
		const duCompteur = energies.filter((e) => e.appareil === reseau);
		if (duCompteur.length) return duCompteur.map((e) => e.id);
	}
	const maison = energies.find((e) => !e.piece && /maison|home|total|linky|compteur|index|r(é|e)seau|grid/i.test(e.etat.attributes.friendly_name ?? ""));
	return maison ? [maison.id] : [];
}
// src/donnees/ignores.ts
var CLE = "automatic_dashboard_ignores";
var EVENEMENT = "automatic-dashboard-ignores";
/** Point → jour où il a été ignoré (AAAA-MM-JJ, heure locale). */
var ignores = {};
var suivi = false;
var deux = (n) => String(n).padStart(2, "0");
var aujourdhui = (d = /* @__PURE__ */ new Date()) => `${d.getFullYear()}-${deux(d.getMonth() + 1)}-${deux(d.getDate())}`;
var estIgnore = (cle) => ignores[cle] === aujourdhui();
function publier(valeur) {
	ignores = valeur && typeof valeur === "object" ? valeur : {};
	window.dispatchEvent(new Event(EVENEMENT));
}
function lireNavigateur() {
	try {
		publier(JSON.parse(localStorage.getItem(CLE) ?? "{}"));
	} catch {
		publier({});
	}
}
/** S'abonne une fois aux points ignorés de l'utilisateur : chaque écran suit les autres. */
function suivreIgnores(hass) {
	if (suivi) return;
	suivi = true;
	const connexion = hass.connection;
	if (!connexion) return lireNavigateur();
	connexion.subscribeMessage((message) => publier(message.value), {
		type: "frontend/subscribe_user_data",
		key: CLE
	}).catch(lireNavigateur);
}
/** Ignore un point jusqu'à demain (ou le remontre). Les jours passés sont oubliés. */
async function ignorer(hass, cles, oui) {
	const jour = aujourdhui();
	const suivant = Object.fromEntries(Object.entries(ignores).filter(([, j]) => j === jour));
	for (const cle of cles) if (oui) suivant[cle] = jour;
	else delete suivant[cle];
	publier(suivant);
	try {
		await hass.callWS({
			type: "frontend/set_user_data",
			key: CLE,
			value: suivant
		});
	} catch {
		localStorage.setItem(CLE, JSON.stringify(suivant));
	}
}
// src/moteur/regles.ts
var DOMAINES_TECHNIQUES = /* @__PURE__ */ new Set([
	"ai_task",
	"assist_satellite",
	"automation",
	"configurator",
	"conversation",
	"device_tracker",
	"event",
	"geo_location",
	"image_processing",
	"notify",
	"persistent_notification",
	"stt",
	"tag",
	"tts",
	"wake_word",
	"zone",
	"sun",
	"person"
]);
var AIDES = /* @__PURE__ */ new Set([
	"input_boolean",
	"input_button",
	"input_number",
	"input_select",
	"input_text",
	"input_datetime",
	"counter",
	"timer",
	"schedule",
	"script"
]);
var PLATEFORMES_SYSTEME = /* @__PURE__ */ new Set([
	"backup",
	"hassio",
	"systemmonitor",
	"glances",
	"uptime_kuma",
	"adguard",
	"pi_hole",
	"speedtestdotnet",
	"proxmoxve",
	"synology_dsm",
	"unifi",
	"truenas",
	"fritz",
	"netdata"
]);
/** Intégrations installées d'office ou de données publiques : jamais comptées comme équipement, jamais « à ranger ». */
var PLATEFORMES_OFFICE = /* @__PURE__ */ new Set([
	"sun",
	"backup",
	"met",
	"person",
	"shopping_list",
	"google_translate",
	"radio_browser",
	"go2rtc",
	"analytics",
	"marketplace",
	"meteo_france",
	"holiday",
	"moon",
	"open_meteo",
	"mobile_app",
	"local_calendar",
	"local_todo",
	"workday",
	"season"
]);
var CLASSES_TECHNIQUES = /* @__PURE__ */ new Set([
	"signal_strength",
	"timestamp",
	"date",
	"duration",
	"data_rate",
	"data_size",
	"enum"
]);
var UNITES_TECHNIQUES = /* @__PURE__ */ new Set([
	"lqi",
	"dBm",
	"dB",
	"ms",
	"B",
	"kB",
	"MB",
	"GB",
	"bit/s",
	"kbit/s",
	"Mbit/s"
]);
var MESURES = /* @__PURE__ */ new Set([
	"temperature",
	"humidity",
	"carbon_dioxide",
	"pm25",
	"pm10",
	"pm1",
	"volatile_organic_compounds",
	"aqi",
	"nitrogen_dioxide",
	"ozone",
	"carbon_monoxide"
]);
var MESURES_SECONDAIRES = /* @__PURE__ */ new Set([
	"illuminance",
	"atmospheric_pressure",
	"pressure",
	"sound_pressure",
	"moisture",
	"distance",
	"speed",
	"wind_speed",
	"precipitation",
	"irradiance",
	"weight"
]);
var ENERGIE = /* @__PURE__ */ new Set([
	"power",
	"apparent_power",
	"energy",
	"gas",
	"water"
]);
var ENERGIE_SECONDAIRE = /* @__PURE__ */ new Set([
	"current",
	"voltage",
	"power_factor",
	"reactive_power",
	"frequency",
	"volume_flow_rate",
	"energy_storage",
	"monetary"
]);
var OUVRANTS = /* @__PURE__ */ new Set([
	"door",
	"window",
	"garage_door",
	"opening"
]);
var ALERTES = /* @__PURE__ */ new Set([
	"moisture",
	"smoke",
	"gas",
	"carbon_monoxide",
	"safety",
	"tamper",
	"glass_break",
	"heat",
	"cold"
]);
var PRESENCES = /* @__PURE__ */ new Set([
	"motion",
	"occupancy",
	"presence"
]);
var NOM_TECHNIQUE = /signal|rssi|lqi|qualit(é|e) du lien|link ?quality|uptime|derni(è|e)re vue|last seen|adresse ip|ip address|wi-?fi|micrologiciel|firmware/i;
var ICONES_PIECES = [
	[/salle (à|a) manger|dining/i, "mdi:silverware-fork-knife"],
	[/salle de bain|bathroom|douche|sdb/i, "mdi:shower"],
	[/salon|s(é|e)jour|living|lounge/i, "mdi:sofa-outline"],
	[/cuisine|kitchen/i, "mdi:stove"],
	[/enfant|b(é|e)b(é|e)|kid|nursery/i, "mdi:teddy-bear"],
	[/chambre|bedroom/i, "mdi:bed-outline"],
	[/\bwc\b|toilette|toilet/i, "mdi:toilet"],
	[/bureau|office|study/i, "mdi:desk"],
	[/entr(é|e)e|hall\b|entrance/i, "mdi:door-open"],
	[/couloir|palier|hallway|corridor/i, "mdi:stairs"],
	[/garage/i, "mdi:garage"],
	[/jardin|terrasse|balcon|cour\b|garden|terrace|patio|ext(é|e)rieur|outside/i, "mdi:flower-outline"],
	[/buanderie|laundry/i, "mdi:washing-machine"],
	[/cave|cellier|cellar|basement/i, "mdi:stairs-down"],
	[/grenier|combles|attic/i, "mdi:home-roof"],
	[/dressing|closet/i, "mdi:hanger"]
];
/** Icône d'une pièce d'après son nom, quand l'utilisateur n'en a pas choisi. */
var iconePiece = (nom) => ICONES_PIECES.find(([motif]) => motif.test(nom))?.[1] ?? "mdi:home-outline";
var PIECES_EXTERIEURES = /jardin|terrasse|balcon|cour\b|garden|terrace|patio|ext(é|e)rieur|outside|piscine|pool/i;
var PIECES_ANNEXES = /garage|cave|cellier|grenier|combles|abri|cellar|basement|attic|shed/i;
/**
* Les étiquettes de réglage en masse, créées par l'intégration dans la langue de Home Assistant :
* l'identifiant vient du nom à la création, les deux langues sont reconnues.
*/
var ETIQUETTES = {
	masquer: ["automatic_dashboard_masquer", "automatic_dashboard_hide"],
	favori: ["automatic_dashboard_favori", "automatic_dashboard_favorite"],
	exterieur: ["automatic_dashboard_exterieur", "automatic_dashboard_outdoor"]
};
/** L'une de ces étiquettes est-elle posée ? */
var porte = (etiquettes, cle) => Boolean(etiquettes?.some((l) => ETIQUETTES[cle].includes(l)));
/** Classe d'un capteur, déduite de son unité quand l'intégration n'en donne pas. */
function classeDe(etat) {
	const a = etat?.attributes ?? {};
	if (a.device_class) return a.device_class;
	const u = a.unit_of_measurement;
	const nom = String(a.friendly_name ?? "");
	if (u === "°C" || u === "°F") return "temperature";
	if (u === "W" || u === "kW") return "power";
	if (u === "kWh" || u === "Wh" || u === "MWh") return "energy";
	if (u === "VA") return "apparent_power";
	if (u === "lx") return "illuminance";
	if (u === "%" && /humid/i.test(nom)) return "humidity";
	if (u === "ppm" && /co2|co₂/i.test(nom)) return "carbon_dioxide";
}
/** Juge une entité : l'écarte (avec sa raison) ou lui donne un rôle et une section. */
function juger(e, en, masquer) {
	const { domaine, classe } = e;
	if (en.hidden) {
		e.ecart = "masquee";
		return;
	}
	if (masquer.has(e.id)) {
		e.ecart = "masquee_reglage";
		return;
	}
	if (DOMAINES_TECHNIQUES.has(domaine)) {
		e.ecart = "domaine_technique";
		return;
	}
	if (domaine === "update") {
		e.role = "maintenance";
		e.section = "systeme";
		return;
	}
	if ((domaine === "sensor" || domaine === "binary_sensor") && classe === "battery") {
		if (e.mobile) {
			e.ecart = "pile_telephone";
			return;
		}
		e.role = "maintenance";
		e.section = "systeme";
		return;
	}
	if (PLATEFORMES_SYSTEME.has(e.plateforme)) {
		e.role = "systeme";
		e.section = "systeme";
		return;
	}
	if (e.categorie) {
		e.ecart = `categorie_${e.categorie}`;
		return;
	}
	if (domaine === "button" && classe && [
		"identify",
		"restart",
		"update"
	].includes(classe)) {
		e.ecart = "technique";
		return;
	}
	if (domaine === "sensor" && (classe && CLASSES_TECHNIQUES.has(classe) || e.unite && UNITES_TECHNIQUES.has(e.unite) || NOM_TECHNIQUE.test(e.nomPropre))) {
		e.ecart = "technique";
		return;
	}
	if (AIDES.has(domaine) && !e.piece) {
		e.ecart = "aide_sans_piece";
		return;
	}
	const donner = (role, section, secondaire = false) => {
		e.role = role;
		e.section = section;
		e.secondaire = secondaire;
	};
	if ([
		"light",
		"switch",
		"fan",
		"vacuum",
		"lawn_mower",
		"valve",
		"siren",
		"remote",
		"input_boolean"
	].includes(domaine)) donner("commande", "pieces");
	else if (domaine === "cover") donner("commande", classe && [
		"door",
		"garage",
		"gate"
	].includes(classe) ? "securite" : "pieces");
	else if (domaine === "scene" || domaine === "script" || domaine === "button") donner("commande", "pieces", true);
	else if ([
		"climate",
		"water_heater",
		"humidifier"
	].includes(domaine)) donner("commande", "climat");
	else if (domaine === "media_player") donner("commande", "medias");
	else if (domaine === "lock" || domaine === "alarm_control_panel") donner("commande", "securite");
	else if (domaine === "camera") donner("camera", "securite");
	else if (domaine === "binary_sensor") {
		if (classe && OUVRANTS.has(classe)) donner("ouvrant", "securite");
		else if (classe && ALERTES.has(classe)) donner("alerte", "securite");
		else if (classe && PRESENCES.has(classe)) donner("presence", "securite", true);
		else donner("info", "pieces", true);
	} else if (domaine === "sensor") {
		if (classe && MESURES.has(classe)) donner("mesure", "climat");
		else if (classe && ENERGIE.has(classe)) donner("energie", "energie");
		else if (classe && ENERGIE_SECONDAIRE.has(classe)) donner("energie", "energie", true);
		else if (classe && MESURES_SECONDAIRES.has(classe)) donner("mesure", "pieces", true);
		else donner("info", "pieces", true);
	} else if (domaine === "weather") donner("meteo", "accueil");
	else if ([
		"number",
		"select",
		"text",
		"date",
		"time",
		"datetime"
	].includes(domaine)) donner("reglage", "pieces", true);
	else donner("info", "pieces", true);
}
// src/moteur/ranger.ts
/** Minuscules, sans accents : « Entrée » et « entree » se valent. */
var normaliser = (s) => s.normalize("NFD").replace(/\p{Diacritic}/gu, "").toLowerCase().trim();
var echapper = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
/** Le mot (ou groupe de mots) apparaît-il en entier dans le nom ? */
var contient = (nom, mot) => mot.length >= 2 && new RegExp(`(^|[^\\p{L}\\p{N}])${echapper(mot)}($|[^\\p{L}\\p{N}])`, "u").test(nom);
/** La pièce proposée pour un nom d'appareil, ou null si rien n'est sûr. */
function proposerPiece(nom, pieces) {
	if (!nom || !pieces.length) return null;
	const n = normaliser(nom);
	let meilleure = null;
	for (const p of pieces) for (const nomPiece of [p.name, ...p.aliases ?? []]) {
		const m = normaliser(nomPiece ?? "");
		if (contient(n, m) && (!meilleure || m.length > meilleure.longueur)) meilleure = {
			id: p.area_id,
			longueur: m.length
		};
	}
	if (meilleure) return meilleure.id;
	for (const [source] of ICONES_PIECES) {
		const motif = new RegExp(`(^|[^\\p{L}])(?:${source.source})($|[^\\p{L}])`, "iu");
		if (!motif.test(nom)) continue;
		const candidates = pieces.filter((p) => motif.test(p.name) || (p.aliases ?? []).some((a) => motif.test(a)));
		if (candidates.length === 1) return candidates[0].area_id;
	}
	return null;
}
// src/moteur/analyser.ts
var ROLES_UTILES = /* @__PURE__ */ new Set([
	"commande",
	"ouvrant",
	"alerte",
	"camera",
	"mesure",
	"energie"
]);
var ORDRE_METEO = [
	"meteo_france",
	"met",
	"open_meteo"
];
var AGENDAS_ECARTES = /* @__PURE__ */ new Set([
	"holiday",
	"workday",
	"demo"
]);
/** Écartée du tri pour une raison technique, mais pas masquée par l'utilisateur. */
var visible = (e) => e.ecart !== "masquee" && e.ecart !== "masquee_reglage";
/** Le mode, d'après les compteurs structurels (jamais d'après une valeur du moment). */
function choisirMode(U, D, P, T) {
	if (D <= 5 && U <= 15) return "decouverte";
	if (U >= 100 || U >= 60 && (T >= 250 || P >= 12)) return "complet";
	return "maison";
}
function analyser(maison, reglages = {}) {
	const appareils = maison.devices ?? {};
	const masquer = new Set(reglages.masquer ?? []);
	const pieceAppareil = (id) => {
		const a = id ? appareils[id] : void 0;
		if (!a) return null;
		return a.area_id || (a.parent_device_id ? appareils[a.parent_device_id]?.area_id || null : null);
	};
	const racine = (id) => appareils[id]?.parent_device_id || id;
	const zones = maison.areas ?? {};
	const toutes = [];
	for (const en of Object.values(maison.entities ?? {})) {
		const etat = maison.states[en.entity_id];
		if (!etat) continue;
		const appareil = en.device_id ? appareils[en.device_id] : void 0;
		const e = {
			id: en.entity_id,
			domaine: en.entity_id.split(".")[0],
			etat,
			classe: classeDe(etat),
			unite: etat.attributes.unit_of_measurement,
			piece: en.area_id || pieceAppareil(en.device_id),
			appareil: en.device_id || null,
			plateforme: en.platform,
			categorie: en.entity_category ?? null,
			principale: Boolean(en.device_id && !en.name),
			service: appareil?.entry_type === "service",
			mobile: en.platform === "mobile_app",
			nomPropre: en.name ?? "",
			ecart: null,
			role: null,
			section: null,
			secondaire: false
		};
		if (porte(en.labels, "masquer") || porte(appareil?.labels, "masquer") || porte(e.piece ? zones[e.piece]?.labels : null, "masquer")) masquer.add(e.id);
		juger(e, en, masquer);
		toutes.push(e);
	}
	const gardees = toutes.filter((e) => !e.ecart);
	const favorisEtiquette = [];
	for (const e of gardees) if (porte(maison.entities[e.id]?.labels, "favori")) favorisEtiquette.push(e.id);
	for (const [id, appareil] of Object.entries(appareils)) {
		if (!porte(appareil.labels, "favori")) continue;
		const siennes = gardees.filter((e) => e.appareil === id);
		const choisie = siennes.find((e) => e.principale) ?? siennes.find((e) => e.role === "commande") ?? siennes[0];
		if (choisie && !favorisEtiquette.includes(choisie.id)) favorisEtiquette.push(choisie.id);
	}
	const parAppareil = /* @__PURE__ */ new Map();
	for (const e of gardees) {
		if (!e.appareil) continue;
		if (!parAppareil.has(e.appareil)) parAppareil.set(e.appareil, []);
		parAppareil.get(e.appareil).push(e);
	}
	const dedie = /* @__PURE__ */ new Set();
	for (const [id, liste] of parAppareil) {
		const hors = liste.filter((e) => e.role !== "maintenance");
		if (hors.length && hors.every((e) => e.role === "mesure")) dedie.add(id);
	}
	const avecPuissance = new Set(gardees.filter((e) => e.role === "energie" && (e.classe === "power" || e.classe === "apparent_power")).map((e) => e.appareil).filter(Boolean));
	const utiles = gardees.filter((e) => e.role && ROLES_UTILES.has(e.role) && !e.secondaire && !e.service && !PLATEFORMES_OFFICE.has(e.plateforme) && ![
		"scene",
		"script",
		"group"
	].includes(e.domaine) && !(e.classe === "energy" && e.appareil && avecPuissance.has(e.appareil)));
	const appareilsUtiles = /* @__PURE__ */ new Set();
	let sansAppareil = 0;
	for (const e of utiles) e.appareil ? appareilsUtiles.add(racine(e.appareil)) : sansAppareil++;
	const U = utiles.length;
	const D = appareilsUtiles.size + sansAppareil;
	const P = new Set(utiles.map((e) => e.piece).filter(Boolean)).size;
	const T = Object.values(maison.entities ?? {}).filter((en) => !en.hidden).length;
	const mode = reglages.mode && reglages.mode !== "auto" ? reglages.mode : choisirMode(U, D, P, T);
	const etages = Object.values(maison.floors ?? {}).sort((a, b) => (a.level ?? 0) - (b.level ?? 0));
	const ordreEtage = new Map(etages.map((f, i) => [f.floor_id, i]));
	const pieces = Object.values(zones).filter((a) => !porte(a.labels, "masquer")).map((a, ordre) => {
		const entites = gardees.filter((e) => e.piece === a.area_id && e.role !== "maintenance" && e.role !== "systeme" && e.role !== "meteo");
		const rang = (e) => a.temperature_entity_id === e.id || a.humidity_entity_id === e.id ? 0 : e.appareil && (dedie.has(e.appareil) || e.principale) ? 1 : !e.appareil ? 2 : 3;
		const representants = (classe) => entites.filter((e) => e.role === "mesure" && e.classe === classe).sort((x, y) => rang(x) - rang(y)).map((e) => e.id);
		return {
			...a,
			ordre,
			icon: a.icon || iconePiece(a.name),
			exterieur: PIECES_EXTERIEURES.test(a.name) || porte(a.labels, "exterieur"),
			annexe: PIECES_ANNEXES.test(a.name),
			etage: a.floor_id && ordreEtage.has(a.floor_id) ? a.floor_id : null,
			entites,
			utiles: utiles.filter((e) => e.piece === a.area_id).length,
			temperatures: representants("temperature"),
			humidites: representants("humidity")
		};
	}).sort((a, b) => (ordreEtage.get(a.etage ?? "") ?? 99) - (ordreEtage.get(b.etage ?? "") ?? 99) || a.ordre - b.ordre);
	const parRole = (role) => gardees.filter((e) => e.role === role);
	const aRanger = gardees.filter((e) => !e.piece && !e.service && !PLATEFORMES_OFFICE.has(e.plateforme) && e.role !== null && [
		"commande",
		"ouvrant",
		"alerte",
		"mesure",
		"presence",
		"camera"
	].includes(e.role) && (e.principale || !e.appareil));
	const propositions = {};
	for (const e of aRanger) {
		const appareil = e.appareil ? appareils[e.appareil] : void 0;
		const piece = proposerPiece(appareil?.name_by_user, pieces) ?? proposerPiece(appareil?.name, pieces) ?? proposerPiece(String(e.etat.attributes.friendly_name ?? ""), pieces);
		if (piece) propositions[e.id] = piece;
	}
	const meteos = gardees.filter((e) => e.domaine === "weather").sort((a, b) => {
		const rang = (x) => ORDRE_METEO.includes(x.plateforme) ? ORDRE_METEO.indexOf(x.plateforme) : ORDRE_METEO.length;
		return rang(a) - rang(b);
	});
	const energie = parRole("energie");
	return {
		toutes,
		gardees,
		utiles,
		pieces,
		etages,
		mode,
		compteurs: {
			U,
			D,
			P,
			T
		},
		favorisEtiquette,
		meteo: meteos[0]?.id ?? null,
		meteoFrance: toutes.find((e) => e.plateforme === "meteo_france" && visible(e) && (e.id.endsWith("_next_rain") || e.etat.attributes["1_hour_forecast"]))?.id ?? null,
		vigilance: gardees.find((e) => e.plateforme === "meteo_france" && (e.id.endsWith("_weather_alert") || [
			"Vert",
			"Jaune",
			"Orange",
			"Rouge"
		].includes(e.etat.state)))?.id ?? null,
		ferie: gardees.find((e) => e.domaine === "calendar" && e.plateforme === "holiday")?.id ?? null,
		lune: gardees.find((e) => e.plateforme === "moon")?.id ?? null,
		lumieres: gardees.filter((e) => e.domaine === "light" && e.piece),
		climats: gardees.filter((e) => [
			"climate",
			"water_heater",
			"humidifier"
		].includes(e.domaine)),
		temperaturesInterieures: pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length).map((p) => p.temperatures),
		temperaturesExterieures: pieces.filter((p) => p.exterieur).flatMap((p) => p.temperatures),
		energie: energie.filter((e) => !e.secondaire),
		puissanceReseau: choisirReseau(energie),
		securite: gardees.filter((e) => e.role && [
			"ouvrant",
			"alerte",
			"camera"
		].includes(e.role) || e.domaine === "lock" || e.domaine === "alarm_control_panel"),
		ouvrants: parRole("ouvrant"),
		alertes: parRole("alerte"),
		majs: toutes.filter((e) => e.domaine === "update" && !e.ecart),
		piles: toutes.filter((e) => e.role === "maintenance" && e.classe === "battery"),
		systeme: parRole("systeme"),
		aRanger,
		propositions,
		medias: gardees.filter((e) => e.domaine === "media_player" && !Array.isArray(e.etat.attributes.entity_id)),
		personnes: toutes.filter((e) => e.domaine === "person" && visible(e)).map((e) => e.id),
		agendas: gardees.filter((e) => e.domaine === "calendar" && !AGENDAS_ECARTES.has(e.plateforme)).map((e) => e.id),
		enMarche: [...gardees.filter((e) => ["vacuum", "lawn_mower"].includes(e.domaine) || e.domaine === "binary_sensor" && e.classe === "running"), ...toutes.filter((e) => e.domaine === "timer" && visible(e))].map((e) => e.id),
		courses: toutes.find((e) => e.domaine === "todo" && e.plateforme === "shopping_list" && visible(e))?.id ?? null,
		noms: Object.fromEntries(Object.entries(reglages.noms ?? {}).filter(([, nom]) => typeof nom === "string" && nom.trim()).map(([id, nom]) => [id, nom.trim()]))
	};
}
/** Puissance de toute la maison : celle du compteur, jamais la somme des prises (double compte). */
function choisirReseau(energie) {
	const puissances = energie.filter((e) => e.classe === "power" || e.classe === "apparent_power");
	return (puissances.find((e) => e.classe === "apparent_power" || /linky|compteur|tic\b|meter|grid|r(é|e)seau|maison|home/i.test(e.etat.attributes.friendly_name ?? "")) ?? puissances.find((e) => !e.piece))?.id ?? null;
}
var memoire$1 = null;
/** Version mémorisée : ne recalcule que si un registre ou un réglage a changé (les états ne changent pas le tri). */
function analyserMemo(maison, reglages = {}) {
	const cle = [
		maison.entities,
		maison.devices,
		maison.areas,
		maison.floors,
		reglages.mode,
		(reglages.masquer ?? []).join(),
		JSON.stringify(reglages.noms ?? {})
	];
	if (memoire$1 && cle.every((v, i) => v === memoire$1.cle[i])) return memoire$1.resultat;
	const resultat = analyser(maison, reglages);
	memoire$1 = {
		cle,
		resultat
	};
	return resultat;
}
// src/cartes/styles.ts
var STYLE_COMMUN = i$5`
  :host{display:block;height:100%;font-family:var(--ha-font-family-body, Inter, sans-serif);container-type:inline-size}
  ha-card{height:100%;box-sizing:border-box;overflow:hidden}
  .ico{display:grid;place-items:center;width:40px;height:40px;border-radius:12px;flex:none;
    background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));color:var(--secondary-text-color)}
  .ico.actif{background:var(--automatic-dashboard-accent-pale, rgba(2,119,189,.12));color:var(--primary-color)}
  .ico.chaud{background:rgba(233,162,59,.16);color:var(--state-light-active-color, #E9A23B)}
  .ico ha-icon{--mdc-icon-size:22px}
  .doux{color:var(--secondary-text-color)}
  .sur{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color)}
  button{all:unset;cursor:pointer;box-sizing:border-box}
  button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px;border-radius:12px}
  .chiffre{font-variant-numeric:tabular-nums}
  .courbe{display:block;width:100%;height:34px}
  /* En attendant les données : une forme pâle qui respire, à la place de ce qui va arriver. */
  .attente{display:block;border-radius:10px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));
    animation:automatic-dashboard-attente 1.4s ease-in-out infinite}
  @keyframes automatic-dashboard-attente{0%,100%{opacity:1}50%{opacity:.45}}
  @media (prefers-reduced-motion: reduce){ .attente{animation:none} }
`;
// src/cartes/base.ts
/** Garde les identifiants présents d'une liste qui peut contenir des trous. */
var definis = (ids) => ids.filter((id) => Boolean(id));
var CarteAutomatic = class extends i$2 {
	constructor(..._args) {
		super(..._args);
		this._cache = false;
		this._vide = false;
		this._surIgnores = () => this.requestUpdate();
	}
	static {
		this.properties = {
			hass: { attribute: false },
			_config: { state: true }
		};
	}
	static {
		this.styles = STYLE_COMMUN;
	}
	setConfig(config) {
		this._config = config ?? {};
	}
	connectedCallback() {
		super.connectedCallback();
		window.addEventListener(EVENEMENT, this._surIgnores);
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		window.removeEventListener(EVENEMENT, this._surIgnores);
	}
	getCardSize() {
		return 2;
	}
	/** La maison triée par le moteur (mémorisée : recalculée seulement quand un registre change). */
	get maison() {
		return analyserMemo(this.hass, this._config?.reglages ?? {});
	}
	/** Les entités dont la carte dépend : elle ne se redessine que si l'une d'elles change. */
	suivies(_m) {
		return [];
	}
	/** Ce que la carte doit montrer, ou `null` pour se masquer. */
	rendu(_hass, _m) {
		return null;
	}
	/** Autre raison de redessiner, propre à une carte (l'heure, la configuration de Home Assistant…). */
	autresChangements(_ancien) {
		return false;
	}
	shouldUpdate(changes) {
		const hass = this.hass;
		if (!hass || !this._config) return false;
		for (const cle of changes.keys()) if (cle !== "hass") return true;
		const ancien = changes.get("hass");
		if (!ancien) return true;
		if (ancien.themes?.darkMode !== hass.themes?.darkMode || langue(ancien) !== langue(hass)) return true;
		if (ancien.entities !== hass.entities || ancien.devices !== hass.devices || ancien.areas !== hass.areas || ancien.floors !== hass.floors) return true;
		if (this.autresChangements(ancien)) return true;
		return this.suivies(this.maison).some((id) => ancien.states[id] !== hass.states[id]);
	}
	render() {
		if (!this.hass || !this._config) return A;
		suivreIgnores(this.hass);
		const contenu = this.rendu(this.hass, this.maison);
		this._vide = contenu === null;
		return contenu ?? A;
	}
	updated(changes) {
		super.updated(changes);
		this.cacher(this._vide);
	}
	cacher(cache) {
		if (this._cache === cache) return;
		this._cache = cache;
		this.style.display = cache ? "none" : "";
		this.toggleAttribute("hidden", cache);
		this.dispatchEvent(new CustomEvent("card-visibility-changed", {
			detail: { value: !cache },
			bubbles: true,
			composed: true
		}));
	}
};
// src/cartes/apercu.ts
var AutomaticApercu = class extends CarteAutomatic {
	static {
		this.properties = { _courbe: { state: true } };
	}
	static {
		this.styles = [STYLE_COMMUN, i$5`
    button.carte{display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;padding:13px 15px 12px;border-radius:var(--ha-card-border-radius)}
    .valeur{font-size:25px;font-weight:650;letter-spacing:-.02em;line-height:1.1;color:var(--primary-text-color);margin-top:4px}
    .valeur small{font-size:14px;font-weight:600;color:var(--secondary-text-color);margin-left:3px}
    .detail{font-size:12.5px;line-height:1.35}
    .detail{white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:2px}
    .bas{display:block;margin:0 -15px -12px}
    .courbe{height:30px}
    .lignes{display:grid;gap:7px;margin-top:6px}
    .ligne{display:flex;align-items:center;gap:9px;font-size:14px;font-weight:550;color:var(--primary-text-color)}
    .ligne ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .ligne .doux{font-weight:500}
    .tete{display:flex;align-items:center;justify-content:space-between}
    .tete ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    @container (max-width: 150px){ .bas{display:none} }
  `];
	}
	getGridOptions() {
		return {
			columns: 6,
			rows: 2,
			min_columns: 4,
			max_columns: 12,
			min_rows: 2,
			max_rows: 2
		};
	}
	suivies(m) {
		const s = this._config?.sorte;
		if (s === "climat") return definis([...m.temperaturesInterieures.flat(), m.meteo]);
		if (s === "energie") return definis([m.puissanceReseau]);
		if (s === "ephemeride") return definis([
			"sun.sun",
			m.ferie,
			m.lune
		]);
		if (s === "humidite") return m.pieces.flatMap((p) => p.humidites);
		return [];
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const s = this._config?.sorte;
		const etat = (id) => id ? hass.states[id] : void 0;
		if (s === "climat") {
			const d = moyenneInterieure(hass, m);
			if (d === null) return null;
			const e = temperatureDehors(hass, m);
			const enMarche = m.climats.filter((x) => !["off", "unavailable"].includes(etat(x.id)?.state ?? "")).length;
			this.chargerCourbe("climat", m.temperaturesInterieures.map((c) => c[0]).slice(0, 8));
			return this.gabarit("mdi:home-thermometer-outline", tx.climat, b`${nombre(hass, d, 1)}<small>° ${tx.dedans}</small>`, [e !== null ? `${tx.dehors} ${degres(hass, e)}` : "", enMarche ? estFrancais(hass) ? `${enMarche} en marche` : `${enMarche} running` : ""].filter(Boolean).join(" · "));
		}
		if (s === "energie") {
			const ent = etat(m.puissanceReseau);
			const w = Number.parseFloat(ent?.state ?? "");
			if (Number.isNaN(w)) return null;
			this.chargerCourbe("energie", [m.puissanceReseau]);
			return this.gabarit("mdi:lightning-bolt-outline", tx.energie, b`${nombre(hass, w, 0)}<small>${ent.attributes.unit_of_measurement || "W"}</small>`, tx.enCeMoment);
		}
		if (s === "humidite") {
			const ids = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.humidites.length).map((p) => p.humidites[0]);
			const valeurs = ids.map((id) => Number.parseFloat(etat(id)?.state ?? "")).filter((v) => !Number.isNaN(v));
			if (!valeurs.length) return null;
			const h = valeurs.reduce((a, b) => a + b, 0) / valeurs.length;
			this.chargerCourbe("humidite", ids.slice(0, 8));
			const fr = estFrancais(hass);
			const avis = h < 35 ? fr ? "Air sec" : "Dry air" : h > 65 ? fr ? "Air humide : aérez" : "Humid air: ventilate" : fr ? "Confortable" : "Comfortable";
			return this.gabarit("mdi:water-percent", fr ? "Humidité" : "Humidity", b`${nombre(hass, h, 0)}<small>%</small>`, avis);
		}
		if (s === "a-ranger") {
			if (!m.aRanger.length) return null;
			const noms = m.aRanger.slice(0, 3).map((e) => m.noms[e.id] || e.etat.attributes.friendly_name).join(", ");
			return this.gabarit("mdi:tray-arrow-down", tx.aRanger, tx.sansPiece(m.aRanger.length), `${noms} · ${tx.choisirPieces} ›`);
		}
		if (s === "ephemeride") {
			const soleil = etat("sun.sun");
			const lignes = [];
			if (soleil) {
				const lever = new Date(soleil.attributes.next_rising), coucher = new Date(soleil.attributes.next_setting);
				let duree = (coucher.getTime() - lever.getTime()) / 6e4;
				if (duree < 0) duree += 1440;
				lignes.push(b`<div class="ligne"><ha-icon icon="mdi:weather-sunset-up"></ha-icon>${heure(hass, lever)}
          <ha-icon icon="mdi:weather-sunset-down"></ha-icon>${heure(hass, coucher)}
          <span class="doux">· ${Math.floor(duree / 60)} h ${String(Math.round(duree % 60)).padStart(2, "0")} ${tx.deJour}</span></div>`);
			}
			const ferie = etat(m.ferie);
			if (ferie?.attributes.message) {
				const jours = Math.round((new Date(ferie.attributes.start_time).getTime() - (/* @__PURE__ */ new Date()).setHours(0, 0, 0, 0)) / 864e5);
				lignes.push(b`<div class="ligne"><ha-icon icon="mdi:calendar-star"></ha-icon>${ferie.state === "on" ? tx.ferieAujourdhui : ferie.attributes.message}
          <span class="doux">· ${ferie.state === "on" ? ferie.attributes.message : tx.dansJours(jours)}</span></div>`);
			}
			const lune = etat(m.lune);
			if (valide(lune)) lignes.push(b`<div class="ligne"><ha-icon icon="mdi:moon-waxing-crescent"></ha-icon>${hass.formatEntityState?.(lune) || lune.state}</div>`);
			else {
				const l = phaseLune(/* @__PURE__ */ new Date(), langue(hass));
				lignes.push(b`<div class="ligne"><ha-icon icon=${l.icone}></ha-icon>${l.nom}<span class="doux">· ${l.pleine}</span></div>`);
			}
			if (!lignes.length) return null;
			return b`<ha-card><button class="carte" data-entite="sun.sun" @click=${this._clic}><span class="tete"><span class="sur">${tx.aujourdhui}</span>
        <ha-icon icon="mdi:white-balance-sunny"></ha-icon></span><span class="lignes">${lignes}</span></button></ha-card>`;
		}
		return null;
	}
	gabarit(icone, sur, valeur, detail) {
		const valeurs = this._courbe ?? [];
		return b`<ha-card><button class="carte" @click=${this._clic}><span class="tete"><span class="sur">${sur}</span><ha-icon icon=${icone}></ha-icon></span>
      <span><span class="valeur chiffre">${valeur}</span><span class="detail doux" style="display:block">${detail}</span></span>
      ${valeurs.length ? b`<span class="bas">${courbe(valeurs, 200, 30)}</span>` : this._demande && this._courbe === void 0 ? b`<span class="bas" aria-busy="true"><span class="attente" style="height:22px;margin:0 15px 8px"></span></span>` : A}
      </button></ha-card>`;
	}
	chargerCourbe(cle, ids) {
		const utiles = definis(ids);
		if (this._demande === cle || !utiles.length) return;
		this._demande = cle;
		historique(this.hass, cle, utiles).then((valeurs) => {
			this._courbe = valeurs;
		});
	}
	_clic() {
		const s = this._config?.sorte;
		if (!s) return;
		if (s === "ephemeride") plusDInfos(this, "sun.sun");
		else naviguer(s === "humidite" ? "climat" : s);
	}
};
// src/cartes/a-ranger.ts
var ICONES_DOMAINES = {
	light: "mdi:lightbulb-outline",
	switch: "mdi:toggle-switch-variant",
	fan: "mdi:fan",
	cover: "mdi:window-shutter",
	climate: "mdi:thermostat",
	sensor: "mdi:eye-outline",
	binary_sensor: "mdi:checkbox-blank-circle-outline",
	lock: "mdi:lock-outline",
	alarm_control_panel: "mdi:shield-home-outline",
	media_player: "mdi:speaker",
	vacuum: "mdi:robot-vacuum",
	camera: "mdi:cctv"
};
var DUREE_ANNULER = 3e5;
var recents = [];
var AutomaticARanger = class extends CarteAutomatic {
	static {
		this.properties = {
			...CarteAutomatic.properties,
			_version: { state: true },
			_enCours: { state: true }
		};
	}
	constructor() {
		super();
		this._version = 0;
		this._enCours = null;
	}
	get ranges() {
		recents = recents.filter((r) => Date.now() - r.quand < DUREE_ANNULER);
		return recents;
	}
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:6px 18px 10px}
    .groupe{font-size:11.5px;font-weight:650;letter-spacing:.08em;text-transform:uppercase;color:var(--secondary-text-color);padding:12px 0 4px}
    .ligne{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:12px;min-height:54px;border-top:1px solid var(--divider-color)}
    .groupe + .ligne{border-top:0}
    .nom{font-weight:600;font-size:14.5px;color:var(--primary-text-color)}
    .nom small{display:block;font-weight:500;font-size:12.5px;color:var(--secondary-text-color);margin-top:2px}
    .choisir{display:inline-flex;align-items:center;gap:2px;font-size:14px;font-weight:650;color:var(--primary-color)}
    .choisir ha-icon{--mdc-icon-size:18px}
    .actions{display:flex;align-items:center;gap:14px}
    .proposer{display:inline-flex;align-items:center;gap:6px;height:34px;padding:0 14px 0 10px;border-radius:17px;font-size:14px;font-weight:650;
      background:color-mix(in srgb, var(--primary-color) 13%, transparent);color:var(--primary-color);transition:background-color .15s}
    .proposer:hover{background:color-mix(in srgb, var(--primary-color) 22%, transparent)}
    .proposer:disabled{opacity:.5;cursor:default}
    .proposer ha-icon{--mdc-icon-size:18px}
    .choisir.discret{font-weight:600;color:var(--secondary-text-color)}
    .range{display:flex;align-items:center;gap:10px;margin:8px 0 2px;padding:10px 12px;border-radius:12px;font-size:14px;
      background:color-mix(in srgb, var(--success-color, #2e7d32) 11%, transparent);color:var(--primary-text-color)}
    .range > ha-icon{--mdc-icon-size:20px;color:var(--success-color, #2e7d32);flex:none}
    .range span{flex:1}
    .range button{font-weight:650;color:var(--primary-color)}
    @media (max-width: 520px){
      .ligne{grid-template-columns:auto 1fr;padding:8px 0}
      .actions{grid-column:2;justify-content:flex-start;flex-wrap:wrap}
    }
    @media (prefers-reduced-motion: reduce){.proposer{transition:none}}
  `];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: "auto"
		};
	}
	rendu(hass, m) {
		const ranges = this.ranges;
		if (!m.aRanger.length && !ranges.length) return null;
		const fr = estFrancais(hass);
		const admin = Boolean(hass.user?.is_admin);
		const groupes = /* @__PURE__ */ new Map();
		for (const e of m.aRanger) {
			if (!groupes.has(e.plateforme)) groupes.set(e.plateforme, []);
			groupes.get(e.plateforme).push(e);
		}
		const nbEntites = (deviceId) => Object.values(hass.entities).filter((x) => x.device_id === deviceId && !x.hidden).length;
		const contenu = [];
		for (const [plateforme, liste] of groupes) {
			const titre = nomIntegration(hass, plateforme);
			contenu.push(b`<div class="groupe">${titre}</div>`);
			for (const e of liste) {
				const appareil = e.appareil ? hass.devices[e.appareil] : void 0;
				const nom = m.noms[e.id] || appareil?.name_by_user || appareil?.name || e.etat.attributes.friendly_name;
				const n = appareil ? nbEntites(e.appareil) : 1;
				const detail = appareil ? fr ? `${n} entité${n > 1 ? "s" : ""}` : `${n} entit${n > 1 ? "ies" : "y"}` : fr ? "sans appareil" : "no device";
				const proposee = admin ? m.pieces.find((p) => p.area_id === m.propositions[e.id]) : void 0;
				contenu.push(b`<div class="ligne"><span class="ico"><ha-icon icon=${ICONES_DOMAINES[e.domaine] || "mdi:devices"}></ha-icon></span>
          <span class="nom">${nom}<small>${detail}</small></span>
          <span class="actions">
            ${proposee ? b`<button class="proposer" ?disabled=${this._enCours === e.id} @click=${() => this.ranger(e, String(nom), proposee.area_id)}
                  title=${fr ? `Ranger dans ${proposee.name}` : `Put in ${proposee.name}`}><ha-icon icon=${proposee.icon}></ha-icon>${proposee.name} ?</button>` : A}
            <button class=${proposee ? "choisir discret" : "choisir"} @click=${() => this.choisir(e)}>
              ${proposee ? fr ? "Autre" : "Other" : fr ? "Choisir" : "Choose"}<ha-icon icon="mdi:chevron-right"></ha-icon></button>
          </span></div>`);
			}
		}
		return b`<ha-card>${ranges.map((r) => {
			const piece = hass.areas[r.piece]?.name ?? r.piece;
			return b`<div class="range" role="status"><ha-icon icon="mdi:check-circle"></ha-icon>
        <span>${fr ? `${r.nom} : rangé dans ${piece}.` : `${r.nom}: put in ${piece}.`}</span>
        <button @click=${() => this.annuler(r)}>${fr ? "Annuler" : "Undo"}</button></div>`;
		})}${contenu}</ha-card>`;
	}
	/** Range l'appareil (ou l'entité seule) dans la pièce proposée. */
	async ranger(e, nom, piece) {
		this._enCours = e.id;
		try {
			recents = [...recents, {
				id: e.id,
				appareil: e.appareil,
				nom,
				piece,
				quand: Date.now()
			}];
			await this.changerPiece(e.id, e.appareil, piece).catch((erreur) => {
				recents = recents.filter((r) => r.id !== e.id);
				throw erreur;
			});
			this._version++;
		} finally {
			this._enCours = null;
		}
	}
	/** Remet l'appareil « à ranger », comme avant le clic. */
	async annuler(r) {
		recents = recents.filter((x) => x !== r);
		this._version++;
		await this.changerPiece(r.id, r.appareil, null);
	}
	changerPiece(id, appareil, piece) {
		return appareil ? this.hass.callWS({
			type: "config/device_registry/update",
			device_id: appareil,
			area_id: piece
		}) : this.hass.callWS({
			type: "config/entity_registry/update",
			entity_id: id,
			area_id: piece
		});
	}
	choisir(e) {
		if (e.appareil && this.hass?.user?.is_admin) naviguer(`/config/devices/device/${e.appareil}`);
		else plusDInfos(this, e.id);
	}
};
// src/donnees/bilan.ts
var JOUR = 864e5;
/** La dernière semaine entière : du lundi minuit au lundi minuit, et le lundi d'avant pour comparer. */
function semainePassee(maintenant = /* @__PURE__ */ new Date()) {
	const fin = new Date(maintenant);
	fin.setHours(0, 0, 0, 0);
	fin.setDate(fin.getDate() - (fin.getDay() + 6) % 7);
	const debut = new Date(fin);
	debut.setDate(debut.getDate() - 7);
	const avant = new Date(fin);
	avant.setDate(avant.getDate() - 14);
	return {
		debut,
		fin,
		avant
	};
}
var ms = (t) => typeof t === "string" ? Date.parse(t) : t > 0xe8d4a51000 ? t : t * 1e3;
/** Somme, jour par jour depuis `debut`, des variations de plusieurs compteurs. */
function sommeParJour(stats, debut, jours) {
	const resultat = Array.from({ length: jours }, () => null);
	for (const liste of Object.values(stats ?? {})) for (const p of liste) {
		if (p.change === null || p.change === void 0) continue;
		const i = Math.round((ms(p.start) - debut.getTime()) / JOUR);
		if (i >= 0 && i < jours) resultat[i] = (resultat[i] ?? 0) + p.change;
	}
	return resultat;
}
/** Moyenne des moyennes, plus bas des minimums, plus haut des maximums, sur tous les capteurs. */
function resumerTemperatures(stats) {
	const points = Object.values(stats ?? {}).flat();
	const moyennes = points.map((p) => p.mean).filter((v) => typeof v === "number");
	if (!moyennes.length) return null;
	const mins = points.map((p) => p.min ?? p.mean).filter((v) => typeof v === "number");
	const maxs = points.map((p) => p.max ?? p.mean).filter((v) => typeof v === "number");
	return {
		moyenne: moyennes.reduce((a, b) => a + b, 0) / moyennes.length,
		min: Math.min(...mins),
		max: Math.max(...maxs)
	};
}
/** Combien de fois chaque ouverture s'est ouverte : les passages à « on » après le premier état connu. */
function compterOuvertures(historique) {
	return Object.entries(historique ?? {}).map(([id, liste]) => [id, liste.slice(1).filter((p, i) => p.s === "on" && liste[i].s !== "on").length]).filter(([, n]) => n > 0).sort((a, b) => b[1] - a[1]);
}
/** La maison a-t-elle de quoi faire un bilan ? */
var aUnBilan = (hass, m) => energiesMaison(hass, m).length > 0 || m.temperaturesInterieures.length > 0 || m.ouvrants.length > 0;
var memoire = /* @__PURE__ */ new Map();
function chargerBilan(hass, m, maintenant = /* @__PURE__ */ new Date()) {
	const { debut, fin, avant } = semainePassee(maintenant);
	const energies = energiesMaison(hass, m);
	const dedans = m.temperaturesInterieures.map((c) => c[0]).filter(Boolean);
	const dehors = m.temperaturesExterieures.slice(0, 1);
	const ouvrants = m.ouvrants.slice(0, 40).map((e) => e.id);
	const cle = [
		debut.getTime(),
		energies,
		dedans,
		dehors,
		ouvrants
	].join("|");
	const deja = memoire.get(cle);
	if (deja && Date.now() - deja.quand < 36e5) return deja.promesse;
	const statistiques = (ids, depuis, types) => ids.length ? hass.callWS({
		type: "recorder/statistics_during_period",
		start_time: depuis.toISOString(),
		end_time: fin.toISOString(),
		statistic_ids: ids,
		period: "day",
		types
	}).catch(() => ({})) : Promise.resolve({});
	const promesse = Promise.all([
		statistiques(energies, avant, ["change"]),
		statistiques(dedans, debut, [
			"mean",
			"min",
			"max"
		]),
		statistiques(dehors, debut, [
			"mean",
			"min",
			"max"
		]),
		ouvrants.length ? hass.callWS({
			type: "history/history_during_period",
			start_time: debut.toISOString(),
			end_time: fin.toISOString(),
			entity_ids: ouvrants,
			minimal_response: true,
			no_attributes: true,
			significant_changes_only: false
		}).catch(() => null) : Promise.resolve(null)
	]).then(([stEnergie, stDedans, stDehors, histoire]) => {
		const quatorze = sommeParJour(stEnergie, avant, 14);
		const semaine = quatorze.slice(7);
		const somme = (l) => l.some((v) => v !== null) ? l.reduce((a, b) => a + (b ?? 0), 0) : null;
		const total = somme(semaine);
		const parEntite = histoire ? compterOuvertures(histoire) : [];
		return {
			debut,
			fin,
			energie: total === null ? null : {
				jours: semaine,
				total,
				precedent: somme(quatorze.slice(0, 7))
			},
			dedans: resumerTemperatures(stDedans),
			dehors: resumerTemperatures(stDehors),
			ouvertures: histoire ? {
				total: parEntite.reduce((a, [, n]) => a + n, 0),
				parEntite
			} : null
		};
	});
	memoire.set(cle, {
		quand: Date.now(),
		promesse
	});
	return promesse;
}
// src/cartes/bilan.ts
var AutomaticBilan = class extends CarteAutomatic {
	constructor(..._args) {
		super(..._args);
		this._demande = false;
	}
	static {
		this.properties = { _bilan: { state: true } };
	}
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:18px 20px 16px;display:grid;gap:18px 28px;grid-template-columns:minmax(0,1.35fr) minmax(0,1fr);
      grid-template-areas:"energie temperatures" "ouvertures ouvertures"}
    .energie{grid-area:energie}
    .temperatures{grid-area:temperatures;display:grid;gap:16px;align-content:start}
    .ouvertures{grid-area:ouvertures;padding-top:16px;border-top:1px solid var(--divider-color)}
    .grand{display:flex;align-items:baseline;flex-wrap:wrap;gap:6px 10px;margin-top:6px}
    .valeur{font-size:32px;font-weight:680;letter-spacing:-.025em;line-height:1;color:var(--primary-text-color)}
    .valeur small{font-size:15px;font-weight:600;color:var(--secondary-text-color);margin-left:3px;letter-spacing:0}
    .ecart{font-size:12.5px;font-weight:650;padding:3px 9px;border-radius:11px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color))}
    .ecart.baisse{background:color-mix(in srgb, var(--success-color, #2e7d32) 14%, transparent);color:var(--success-color, #2e7d32)}
    .ecart.hausse{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .barres{display:grid;grid-template-columns:repeat(7,1fr);gap:8px;align-items:end;height:92px;margin-top:16px}
    .barre{display:flex;flex-direction:column;align-items:center;gap:6px;height:100%;justify-content:flex-end}
    .barre span{display:block;width:100%;max-width:34px;border-radius:7px 7px 3px 3px;min-height:3px;
      background:color-mix(in srgb, var(--primary-color) 32%, transparent)}
    .barre.haut span{background:var(--primary-color)}
    .barre small{font-size:11.5px;font-weight:600;color:var(--secondary-text-color);text-transform:uppercase}
    .ligne{display:grid;grid-template-columns:auto 1fr;gap:2px 12px;align-items:center}
    .ligne .nom{font-size:13px;font-weight:600;color:var(--secondary-text-color)}
    .ligne .moy{grid-row:span 2;font-size:26px;font-weight:680;letter-spacing:-.02em;color:var(--primary-text-color);min-width:76px}
    .plage{position:relative;height:8px;border-radius:4px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color))}
    .plage span{position:absolute;top:0;bottom:0;border-radius:4px;background:linear-gradient(90deg, #4FA3D9, #E9A23B)}
    .bornes{display:flex;justify-content:space-between;font-size:12px;color:var(--secondary-text-color)}
    .ouvertures .grand{margin:4px 0 10px}
    .ouvertures .valeur{font-size:24px}
    .liste{display:flex;flex-wrap:wrap;gap:8px}
    .liste button{display:inline-flex;align-items:center;gap:8px;height:34px;padding:0 12px;border-radius:17px;font-size:13.5px;
      background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));color:var(--primary-text-color)}
    .liste b{font-variant-numeric:tabular-nums;color:var(--primary-color)}
    .vide{font-size:13.5px;color:var(--secondary-text-color);margin-top:8px}
    .attente.e{height:150px}
    .attente.t{height:120px}
    @container (max-width: 560px){
      ha-card{grid-template-columns:1fr;grid-template-areas:"energie" "temperatures" "ouvertures"}
    }
  `];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: "auto"
		};
	}
	rendu(hass, m) {
		if (!this._demande) {
			this._demande = true;
			chargerBilan(hass, m).then((b) => this._bilan = b);
		}
		const b$2 = this._bilan;
		if (!b$2) return b`<ha-card><span class="attente e"></span><span class="attente t"></span></ha-card>`;
		if (!b$2.energie && !b$2.dedans && !b$2.ouvertures?.total) return b`<ha-card><p class="vide" style="grid-column:1/-1">${t$1(hass).bilanVide}</p></ha-card>`;
		return b`<ha-card>${this.energie(hass, b$2)}${this.temperatures(hass, b$2)}${this.ouvertures(hass, m, b$2)}</ha-card>`;
	}
	energie(hass, b$3) {
		const tx = t$1(hass);
		if (!b$3.energie) return b`<div class="energie"><div class="sur">${tx.energie}</div><p class="vide">${tx.bilanSansEnergie}</p></div>`;
		const { jours, total, precedent } = b$3.energie;
		const plus = Math.max(...jours.map((v) => v ?? 0), .001);
		const jour = new Intl.DateTimeFormat(langue(hass), { weekday: "narrow" });
		const ecart = precedent ? Math.round((total - precedent) / precedent * 100) : null;
		return b`<div class="energie">
      <div class="sur">${tx.energie}</div>
      <div class="grand"><span class="valeur chiffre">${nombre(hass, total, total < 100 ? 1 : 0)}<small>kWh</small></span>
        ${ecart !== null && ecart !== 0 ? b`<span class=${`ecart ${ecart < 0 ? "baisse" : "hausse"}`}>${tx.bilanEcart(`${ecart > 0 ? "+" : "−"}${Math.abs(ecart)} %`)}</span>` : A}</div>
      <div class="barres" role="img" aria-label=${tx.bilanBarres}>
        ${jours.map((v, i) => {
			const date = new Date(b$3.debut.getTime() + i * 864e5 + 432e5);
			return b`<div class=${`barre${v !== null && v === plus ? " haut" : ""}`} title=${v === null ? "" : `${nombre(hass, v, 1)} kWh`}>
            <span style=${`height:${v === null ? 0 : Math.max(3, v / plus * 100)}%`}></span><small>${jour.format(date)}</small></div>`;
		})}
      </div></div>`;
	}
	temperatures(hass, b$4) {
		const tx = t$1(hass);
		const plages = [[majuscule(tx.dedans), b$4.dedans], [tx.dehors, b$4.dehors]].filter((x) => Boolean(x[1]));
		if (!plages.length) return b`<div class="temperatures"><div class="sur">${tx.temperatures}</div><p class="vide">${tx.bilanSansTemperature}</p></div>`;
		const bas = Math.min(...plages.map(([, p]) => p.min)) - 1;
		const haut = Math.max(...plages.map(([, p]) => p.max)) + 1;
		const pos = (v) => (v - bas) / (haut - bas) * 100;
		return b`<div class="temperatures"><div class="sur">${tx.temperatures}</div>
      ${plages.map(([nom, p]) => b`<div class="ligne">
        <span class="moy chiffre">${degres(hass, p.moyenne)}</span><span class="nom">${nom} · ${tx.moyenne}</span>
        <div><div class="plage"><span style=${`left:${pos(p.min)}%;right:${100 - pos(p.max)}%`}></span></div>
          <div class="bornes chiffre"><span>${degres(hass, p.min)}</span><span>${degres(hass, p.max)}</span></div></div>
      </div>`)}</div>`;
	}
	ouvertures(hass, m, b$5) {
		const tx = t$1(hass);
		if (!b$5.ouvertures || !m.ouvrants.length) return A;
		const { total, parEntite } = b$5.ouvertures;
		return b`<div class="ouvertures"><div class="sur">${tx.ouvertures}</div>
      <div class="grand"><span class="valeur chiffre">${total}<small>${tx.bilanFois(total)}</small></span></div>
      ${parEntite.length ? b`<div class="liste">${parEntite.slice(0, 4).map(([id, n]) => b`<button @click=${() => plusDInfos(this, id)}>
            ${nomCourt(hass, id, m.noms)}<b>${n}</b></button>`)}</div>` : b`<p class="vide">${estFrancais(hass) ? "Rien ne s'est ouvert." : "Nothing was opened."}</p>`}</div>`;
	}
};
// node_modules/lit-html/directive.js
/**
* @license
* Copyright 2017 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/
var t = {
	ATTRIBUTE: 1,
	CHILD: 2,
	PROPERTY: 3,
	BOOLEAN_ATTRIBUTE: 4,
	EVENT: 5,
	ELEMENT: 6
};
var e = (t) => (...e) => ({
	_$litDirective$: t,
	values: e
});
var i$1 = class {
	constructor(t) {}
	get _$AU() {
		return this._$AM._$AU;
	}
	_$AT(t, e, i) {
		this._$Ct = t, this._$AM = e, this._$Ci = i;
	}
	_$AS(t, e) {
		return this.update(t, e);
	}
	update(t, e) {
		return this.render(...e);
	}
};
// node_modules/lit-html/directives/style-map.js
/**
* @license
* Copyright 2018 Google LLC
* SPDX-License-Identifier: BSD-3-Clause
*/ var n = "important";
var i = " !" + n;
var o = e(class extends i$1 {
	constructor(t$4) {
		if (super(t$4), t$4.type !== t.ATTRIBUTE || "style" !== t$4.name || t$4.strings?.length > 2) throw Error("The `styleMap` directive must be used in the `style` attribute and must be the only part in the attribute.");
	}
	render(t) {
		return Object.keys(t).reduce((e, r) => {
			const s = t[r];
			return null == s ? e : e + `${r = r.includes("-") ? r : r.replace(/(?:^(webkit|moz|ms|o)|)(?=[A-Z])/g, "-$&").toLowerCase()}:${s};`;
		}, "");
	}
	update(e, [r]) {
		const { style: s } = e.element;
		if (void 0 === this.ft) return this.ft = new Set(Object.keys(r)), this.render(r);
		for (const t of this.ft) r[t] ?? (this.ft.delete(t), t.includes("-") ? s.removeProperty(t) : s[t] = null);
		for (const t in r) {
			const e = r[t];
			if (null != e) {
				this.ft.add(t);
				const r = "string" == typeof e && e.endsWith(i);
				t.includes("-") || r ? s.setProperty(t, r ? e.slice(0, -11) : e, r ? n : "") : s[t] = e;
			}
		}
		return E;
	}
});
// src/cartes/confort.ts
var MIN = 14;
var MAX = 28;
var BAS = 19;
var HAUT = 22;
var AutomaticConfort = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:8px 18px}
    .ligne{display:grid;grid-template-columns:minmax(90px,1.1fr) 62px minmax(90px,2.4fr) 48px 22px;align-items:center;gap:12px;min-height:44px;
      border-top:1px solid var(--divider-color);cursor:pointer}
    .ligne:first-child{border-top:0}
    .nom{font-weight:600;font-size:14.5px;color:var(--primary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .temp{font-size:16px;font-weight:650;text-align:right;color:var(--primary-text-color)}
    .echelle{position:relative;height:8px;border-radius:999px;background:var(--automatic-dashboard-fond-alt)}
    .zone{position:absolute;top:0;bottom:0;border-radius:999px;background:var(--automatic-dashboard-vert-pale);box-shadow:inset 0 0 0 1px color-mix(in srgb, var(--automatic-dashboard-vert) 30%, transparent)}
    .point{position:absolute;top:50%;width:14px;height:14px;margin:-7px 0 0 -7px;border-radius:50%;border:2px solid var(--ha-card-background);background:var(--primary-color)}
    .point.froid{background:var(--state-climate-cool-color)} .point.chaud{background:var(--state-climate-heat-color)}
    .hum{font-size:12.5px;text-align:right}
    .etat ha-icon{--mdc-icon-size:18px}
    .chauffe{color:var(--state-climate-heat-color)} .refroidit{color:var(--state-climate-cool-color)}
    .graduations{display:grid;grid-template-columns:minmax(90px,1.1fr) 62px minmax(90px,2.4fr) 48px 22px;gap:12px;font-size:11px;color:var(--secondary-text-color);padding:2px 0 6px}
    .graduations .g{display:flex;justify-content:space-between}
    @container (max-width: 520px){
      .ligne,.graduations{grid-template-columns:minmax(70px,1fr) 52px minmax(70px,1.6fr) 22px}
      .hum{display:none}
    }
  `];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: "auto"
		};
	}
	suivies(m) {
		return m.pieces.flatMap((p) => [
			...p.temperatures,
			...p.humidites,
			...p.entites.filter((e) => e.domaine === "climate").map((e) => e.id)
		]);
	}
	rendu(hass, m) {
		const etat = (id) => hass.states[id]?.state ?? "";
		const lignes = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length).map((p) => {
			const temp = premiereValeur(hass, p.temperatures);
			return {
				p,
				temp,
				hum: premiereValeur(hass, p.humidites),
				chauffe: p.entites.some((e) => e.domaine === "climate" && [
					"heat",
					"heat_cool",
					"auto"
				].includes(etat(e.id))),
				froid: p.entites.some((e) => e.domaine === "climate" && etat(e.id) === "cool"),
				ecart: temp === null ? -1 : temp < BAS ? BAS - temp : temp > HAUT ? temp - HAUT : 0
			};
		}).filter((l) => l.temp !== null);
		if (lignes.length < 2) return null;
		lignes.sort((a, b) => b.ecart - a.ecart);
		const pos = (v) => `${(Math.max(MIN, Math.min(MAX, v)) - MIN) / 14 * 100}%`;
		return b`<ha-card>${lignes.map((l) => b`<div class="ligne" @click=${() => naviguer(l.p.area_id)}>
      <span class="nom">${l.p.name}</span><span class="temp chiffre">${degres(hass, l.temp)}</span>
      <span class="echelle"><span class="zone" style=${o({
			left: pos(BAS),
			right: `calc(100% - ${pos(HAUT)})`
		})}></span>
        <span class="point ${l.temp < BAS ? "froid" : l.temp > HAUT ? "chaud" : ""}" style=${o({ left: pos(l.temp) })}></span></span>
      <span class="hum doux chiffre">${l.hum !== null ? `${nombre(hass, l.hum, 0)} %` : A}</span>
      <span class="etat">${l.chauffe ? b`<ha-icon class="chauffe" icon="mdi:radiator"></ha-icon>` : l.froid ? b`<ha-icon class="refroidit" icon="mdi:snowflake"></ha-icon>` : A}</span></div>`)}<div class="graduations"><span></span><span></span><span class="g"><span>${MIN}°</span><span>${BAS}°</span><span>${HAUT}°</span><span>${MAX}°</span></span><span></span><span></span></div></ha-card>`;
	}
};
// src/cartes/heros.ts
var AutomaticHeros = class extends CarteAutomatic {
	static {
		this.properties = { _donnees: { state: true } };
	}
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{position:relative;padding:22px 26px;border-radius:28px;box-shadow:var(--automatic-dashboard-ombre, var(--ha-card-box-shadow))}
    .trame{position:absolute;inset:0 0 auto auto;width:55%;height:100%;background-size:22px 22px;pointer-events:none;
      -webkit-mask-image:linear-gradient(225deg,#000 0%,transparent 65%);mask-image:linear-gradient(225deg,#000 0%,transparent 65%)}
    .contenu{position:relative;display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px 36px;height:100%;align-items:center}
    @container (max-width: 600px){ .contenu{grid-template-columns:1fr;grid-template-rows:auto 1fr;align-items:stretch} }
    .chiffres{display:flex;flex-wrap:wrap;gap:16px 28px;align-content:center;max-width:560px}
    .v{font-size:40px;font-weight:650;letter-spacing:-.03em;line-height:1;color:var(--primary-text-color);white-space:nowrap}
    .v small{font-size:18px;font-weight:600;color:var(--secondary-text-color);margin-left:2px;letter-spacing:0}
    .l{font-size:13px;color:var(--secondary-text-color);margin-top:7px;display:flex;align-items:center;gap:6px}
    .l .trait{width:14px;height:0;border-top:2px solid var(--primary-color)}
    .l .trait.pointille{border-top:2px dashed var(--secondary-text-color)}
    @container (max-width: 460px){ .v{font-size:30px} .chiffres{gap:12px 22px} }
    .visuel{display:flex;flex-direction:column;justify-content:flex-end;height:100%;min-height:0}
    .graphe{display:block;width:100%;height:100%;min-height:70px;max-height:150px}
    .axe{display:flex;justify-content:space-between;font-size:11.5px;color:var(--secondary-text-color);margin-top:4px}
    .ligne{display:flex;align-items:center;gap:12px;font-size:17px;font-weight:650;color:var(--primary-text-color)}
    .ligne .ico{width:44px;height:44px;border-radius:14px}
    .ligne .detail{font-size:13.5px;font-weight:500;color:var(--secondary-text-color);margin-top:2px}
    .bouton{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 16px;border-radius:999px;font-size:14px;font-weight:650;
      background:var(--primary-color);color:var(--text-primary-color, #fff);cursor:pointer;white-space:nowrap}
    .bouton.second{background:transparent;color:var(--primary-color);border:1.5px solid var(--primary-color)}
    .bouton ha-icon{--mdc-icon-size:18px}
    .boutons{display:flex;flex-wrap:wrap;gap:10px}
    .liste{display:grid;gap:8px;align-content:center}
    .item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;background:var(--automatic-dashboard-fond-alt);font-size:14px;font-weight:550;color:var(--primary-text-color)}
    .item ha-icon{--mdc-icon-size:18px;color:var(--warning-color)}
    .item.ok ha-icon{color:var(--automatic-dashboard-vert)}
    .alerte{background:var(--automatic-dashboard-alerte-pale)} .alerte .ico{background:var(--automatic-dashboard-alerte);color:#fff}
    .barre{height:12px;border-radius:999px;background:var(--automatic-dashboard-fond-alt);overflow:hidden;margin:12px 0 6px}
    .barre span{display:block;height:100%;border-radius:999px;background:var(--automatic-dashboard-vert)}
    .legende{display:flex;justify-content:space-between;gap:16px;font-size:13px;color:var(--secondary-text-color)}
    .colonne{display:flex;flex-direction:column;gap:16px;justify-content:center;height:100%}
  `];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: this._config?.page === "a-ranger" ? 3 : 4
		};
	}
	suivies(m) {
		const p = this._config?.page;
		if (p === "climat") return definis([
			...m.temperaturesInterieures.flat(),
			...m.temperaturesExterieures,
			m.meteo,
			...m.pieces.flatMap((x) => x.humidites)
		]);
		if (p === "energie") return definis([m.puissanceReseau, ...m.energie.map((e) => e.id)]);
		if (p === "securite") return m.securite.map((e) => e.id);
		if (p === "systeme") return [...m.majs.map((e) => e.id), ...m.systeme.map((e) => e.id)];
		return [];
	}
	rendu(hass, m) {
		switch (this._config?.page) {
			case "climat": return this.climat(hass, m);
			case "energie": return this.energie(hass, m);
			case "securite": return this.securite(hass, m);
			case "systeme": return this.systeme(hass, m);
			case "a-ranger": return this.aRanger(hass, m);
			default: return null;
		}
	}
	chiffre(valeur, unite, legende, trait = "") {
		return b`<div><div class="v chiffre">${valeur}${unite ? b`<small>${unite}</small>` : A}</div>
      <div class="l">${trait ? b`<span class="trait ${trait}"></span>` : A}${legende}</div></div>`;
	}
	enveloppe(hass, gauche, droite, classe = "") {
		return b`<ha-card class=${classe}><div class="trame" style=${o({ "background-image": trame(hass) })}></div>
      <div class="contenu">${gauche}${droite}</div></ha-card>`;
	}
	charger(cle, demande) {
		if (this._charge === cle) return;
		this._charge = cle;
		this._donnees = void 0;
		demande().then((d) => {
			if (this._charge === cle) this._donnees = d;
		});
	}
	/** Les données sont-elles encore en route ? */
	get enAttente() {
		return this._donnees === void 0;
	}
	/** La place de la courbe, le temps qu'elle arrive. */
	courbeEnAttente() {
		return b`<div class="visuel" aria-busy="true"><span class="attente graphe"></span><div class="axe"><span class="attente" style="width:120px;height:11px"></span></div></div>`;
	}
	/** Un chiffre dont la valeur n'est pas encore arrivée : sa légende, et une forme à la place du nombre. */
	chiffreEnAttente(legende) {
		return b`<div aria-busy="true"><div class="v"><span class="attente" style="width:96px;height:36px"></span></div><div class="l">${legende}</div></div>`;
	}
	climat(hass, m) {
		const w = mh(hass);
		const d = moyenneInterieure(hass, m), e = temperatureDehors(hass, m);
		if (d === null && e === null) return null;
		const hums = m.pieces.filter((x) => !x.exterieur && !x.annexe).map((x) => premiereValeur(hass, x.humidites)).filter((v) => v !== null);
		const h = hums.length ? hums.reduce((a, b) => a + b, 0) / hums.length : null;
		const pieces = m.temperaturesInterieures.length;
		const chiffres = [];
		if (d !== null) chiffres.push(this.chiffre(nombre(hass, d, 1), "°", pieces === 1 ? m.pieces.find((x) => x.temperatures.length && !x.exterieur)?.name || w.dedans : w.dedans, "plein"));
		if (e !== null) chiffres.push(this.chiffre(nombre(hass, e, 1), "°", w.dehors, m.temperaturesExterieures.length ? "pointille" : ""));
		if (h !== null) chiffres.push(this.chiffre(nombre(hass, h, 0), "%", w.humidite));
		const ids = m.temperaturesInterieures.map((c) => c[0]).slice(0, 8);
		const dehorsId = m.temperaturesExterieures[0];
		this.charger(`climat|${ids.join()}|${dehorsId}`, () => Promise.all([ids.length ? historique(hass, "climat", ids) : Promise.resolve([]), dehorsId ? historique(hass, `dehors|${dehorsId}`, [dehorsId]) : Promise.resolve([])]));
		if (this.enAttente) return this.enveloppe(hass, b`<div class="chiffres">${chiffres}</div>`, this.courbeEnAttente());
		const [dedansV = [], dehorsV = []] = this._donnees ?? [];
		const graphe = courbes([{
			valeurs: dedansV,
			couleur: "var(--primary-color)"
		}, {
			valeurs: dehorsV,
			couleur: "var(--secondary-text-color)"
		}]);
		return this.enveloppe(hass, b`<div class="chiffres">${chiffres}</div>`, b`<div class="visuel">${graphe}${graphe !== A ? b`<div class="axe"><span>${w.legende24}</span><span>${w.maintenant}</span></div>` : A}</div>`);
	}
	energie(hass, m) {
		const w = mh(hass);
		const ent = m.puissanceReseau ? hass.states[m.puissanceReseau] : void 0;
		const puissance = Number.parseFloat(ent?.state ?? "");
		const compteurs = energiesMaison(hass, m);
		const solaire = m.energie.find((e) => e.classe === "power" && /solaire|solar|pv|onduleur|inverter|production/i.test(e.etat.attributes.friendly_name || ""));
		const reseau = m.puissanceReseau;
		this.charger(`energie|${compteurs.join()}`, () => Promise.all([
			reseau ? historique(hass, "energie", [reseau]) : Promise.resolve([]),
			compteurs.length ? variationJour(hass, compteurs, 0) : Promise.resolve(null),
			compteurs.length ? variationJour(hass, compteurs, -1) : Promise.resolve(null)
		]));
		const [courbeP = [], jour = null, veille = null] = this._donnees ?? [];
		const attente = this.enAttente;
		const chiffres = [];
		if (!Number.isNaN(puissance)) chiffres.push(this.chiffre(nombre(hass, puissance, 0), ent.attributes.unit_of_measurement || "W", w.maintenant));
		if (attente && compteurs.length) chiffres.push(this.chiffreEnAttente(w.aujourdhui));
		if (jour !== null) chiffres.push(this.chiffre(nombre(hass, jour, jour < 10 ? 2 : 1), "kWh", w.aujourdhui));
		if (veille !== null && veille > 0) chiffres.push(this.chiffre(nombre(hass, veille, veille < 10 ? 2 : 1), "kWh", w.hier));
		if (solaire && m.mode === "complet") {
			const s = Number.parseFloat(hass.states[solaire.id]?.state ?? "");
			if (!Number.isNaN(s)) chiffres.push(this.chiffre(nombre(hass, s, 0), "W", w.production));
		}
		if (!chiffres.length) return null;
		if (attente && reseau) return this.enveloppe(hass, b`<div class="chiffres">${chiffres}</div>`, this.courbeEnAttente());
		const graphe = courbes([{
			valeurs: courbeP,
			couleur: "var(--primary-color)"
		}]);
		return this.enveloppe(hass, b`<div class="chiffres">${chiffres}</div>`, b`<div class="visuel">${graphe}${graphe !== A ? b`<div class="axe"><span>${w.puissance}, ${w.legende24}</span><span>${w.maintenant}</span></div>` : A}</div>`);
	}
	securite(hass, m) {
		const w = mh(hass);
		const tx = t$1(hass);
		const etat = (id) => hass.states[id];
		const nom = (e) => nomCourt(hass, e.id, m.noms);
		const ouverts = m.ouvrants.filter((e) => etat(e.id)?.state === "on");
		const serrures = m.gardees.filter((e) => e.domaine === "lock");
		const ouvertes = serrures.filter((e) => etat(e.id)?.state === "unlocked");
		const alertes = m.alertes.filter((e) => etat(e.id)?.state === "on");
		const alarme = m.gardees.find((e) => e.domaine === "alarm_control_panel");
		const gauche = [];
		if (alarme) {
			const s = etat(alarme.id)?.state;
			const libelle = (s ? tx.alarmeEtat[s] : void 0) || `${w.alarme} : ${s}`;
			gauche.push(b`<div class="ligne"><span class="ico ${s && s !== "disarmed" ? "actif" : ""}"><ha-icon icon="mdi:shield-home-outline"></ha-icon></span>
        <span>${libelle}</span><button class="bouton second" @click=${() => plusDInfos(this, alarme.id)}>${w.gerer}</button></div>`);
		}
		const chiffres = [];
		if (m.ouvrants.length) chiffres.push(this.chiffre(String(ouverts.length), "", w.ouvertures(ouverts.length, m.ouvrants.length)));
		if (serrures.length) chiffres.push(this.chiffre(String(ouvertes.length), "", w.serrures(ouvertes.length)));
		if (m.alertes.length) chiffres.push(this.chiffre(String(alertes.length), "", w.detecteurs(alertes.length)));
		if (!chiffres.length && !alarme) return null;
		gauche.push(b`<div class="chiffres">${chiffres}</div>`);
		const items = [
			...alertes.map((e) => b`<div class="item"><ha-icon icon="mdi:water-alert"></ha-icon>${nom(e)}</div>`),
			...ouverts.slice(0, 4).map((e) => b`<div class="item"><ha-icon icon="mdi:window-open-variant"></ha-icon>${nom(e)} · ${w.ouvert}</div>`),
			...ouvertes.map((e) => b`<div class="item"><ha-icon icon="mdi:lock-open-variant-outline"></ha-icon>${nom(e)}</div>`)
		];
		const droite = items.length ? b`<div class="liste">${items}</div>` : b`<div class="liste"><div class="item ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${w.toutFerme}</div></div>`;
		return this.enveloppe(hass, b`<div class="colonne">${gauche}</div>`, droite, alertes.length ? "alerte" : "");
	}
	systeme(hass, m) {
		const w = mh(hass);
		const etat = (id) => hass.states[id];
		const parCle = (cle) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle);
		const reussie = parCle("last_successful_automatic_backup"), tentee = parCle("last_attempted_automatic_backup");
		const prochaine = parCle("next_scheduled_automatic_backup"), taille = parCle("last_successful_automatic_backup_size");
		const majs = m.majs.filter((e) => etat(e.id)?.state === "on").length;
		const date = (e) => e ? new Date(etat(e.id)?.state ?? "") : void 0;
		const dReussie = date(reussie), dTentee = date(tentee), dProchaine = date(prochaine);
		const ok = (d) => Boolean(d) && !Number.isNaN(d.getTime());
		const gauche = b`<div class="ligne"><span class="ico ${majs ? "" : "actif"}"><ha-icon icon=${majs ? "mdi:package-up" : "mdi:check-decagram-outline"}></ha-icon></span>
      <span>${majs ? w.majs(majs) : w.aJour}<div class="detail">${w.version} ${hass.config.version ?? ""}</div></span>
      ${majs ? b`<button class="bouton" @click=${() => naviguer("/config/updates")}>${w.voir}</button>` : A}</div>`;
		let droite;
		if (!ok(dReussie) && !ok(dProchaine)) droite = b`<div class="colonne"><div class="ligne"><span class="ico" style="background:var(--automatic-dashboard-alerte-pale);color:var(--automatic-dashboard-alerte)"><ha-icon icon="mdi:backup-restore"></ha-icon></span>
        <span>${w.sansSauvegarde}<div class="detail">${w.sansSauvegardeDetail}</div></span></div>
        <div class="boutons"><button class="bouton" @click=${() => naviguer("/config/backup")}>${w.regler}</button></div></div>`;
		else {
			const echec = ok(dTentee) && (!ok(dReussie) || dTentee > dReussie);
			const chiffres = [this.chiffre(ok(dReussie) ? ilYa(hass, dReussie) : w.jamais, "", `${w.sauvegarde} ${echec ? w.echouee : w.reussie}`), this.chiffre(ok(dProchaine) ? ilYa(hass, dProchaine) : w.nonPrevue, "", w.prochaine)];
			const poids = taille ? Number.parseFloat(etat(taille.id)?.state ?? "") : NaN;
			if (poids && !Number.isNaN(poids)) chiffres.push(this.chiffre(nombre(hass, poids >= 1024 ? poids / 1024 : poids, 1), poids >= 1024 ? "Go" : "Mo", w.taille));
			droite = b`<div class="chiffres">${chiffres}</div>`;
		}
		return this.enveloppe(hass, b`<div class="colonne">${gauche}</div>`, droite);
	}
	aRanger(hass, m) {
		const w = mh(hass);
		const appareils = new Set(m.utiles.filter((e) => e.appareil && e.piece).map((e) => hass.devices[e.appareil]?.parent_device_id || e.appareil));
		const sansAppareil = m.utiles.filter((e) => !e.appareil && e.piece).length;
		const ranges = appareils.size + sansAppareil;
		const reste = m.aRanger.length;
		if (!reste) return null;
		const part = Math.round(ranges / Math.max(1, ranges + reste) * 100);
		const gauche = b`<div class="colonne"><div style="width:min(100%, 360px)"><div class="v chiffre">${ranges}<small>/ ${ranges + reste}</small></div>
      <div class="barre"><span style=${o({ width: `${part}%` })}></span></div>
      <div class="legende"><span>${w.ranges(ranges)}</span><span>${w.aRanger(reste)}</span></div></div></div>`;
		const droite = b`<div class="boutons" style="justify-content:flex-end">
      <button class="bouton" @click=${() => naviguer("/config/devices/dashboard")}><ha-icon icon="mdi:sofa-outline"></ha-icon>${w.rangerTout}</button>
      <button class="bouton second" @click=${() => naviguer("/config/areas/dashboard")}><ha-icon icon="mdi:plus"></ha-icon>${w.creerPiece}</button></div>`;
		return this.enveloppe(hass, gauche, droite);
	}
};
// src/moteur/meteo-france.ts
var INTENSITES = {
	"Temps sec": 0,
	"Pluie faible": 1,
	"Pluie modérée": 2,
	"Pluie forte": 3
};
/**
* La pluie dans l'heure, d'après l'attribut `1_hour_forecast` (« 0 min » … « 55 min »,
* par 5 minutes puis par 10). L'état du capteur est « unknown » quand l'heure est sèche :
* seul l'attribut compte. `null` si le capteur est indisponible ou sans prévision.
*/
function lirePluie(etat) {
	if (!etat || etat.state === "unavailable") return null;
	const prevision = etat.attributes["1_hour_forecast"];
	if (!prevision || typeof prevision !== "object") return null;
	const points = Object.entries(prevision).map(([cle, texte]) => ({
		debut: Number.parseInt(cle, 10),
		texte: String(texte ?? "")
	})).filter((p) => !Number.isNaN(p.debut)).sort((a, b) => a.debut - b.debut);
	if (!points.length) return null;
	const tranches = points.map((p, i) => ({
		debut: p.debut,
		duree: Math.max(1, (points[i + 1]?.debut ?? 60) - p.debut),
		intensite: INTENSITES[p.texte] ?? (p.texte ? 1 : 0),
		texte: p.texte
	}));
	const premiere = tranches.find((t) => t.intensite > 0);
	const pleutMaintenant = tranches[0].intensite > 0;
	const seche = pleutMaintenant ? tranches.find((t) => t.intensite === 0) : void 0;
	const reference = new Date(String(etat.attributes.forecast_time_ref ?? ""));
	return {
		tranches,
		dans: premiere ? premiere.debut : null,
		type: premiere ? premiere.texte : null,
		fin: seche ? seche.debut : null,
		continue: pleutMaintenant && !seche,
		reference: Number.isNaN(reference.getTime()) ? null : reference
	};
}
/** Les couleurs de vigilance, du vert (0) au rouge (3). */
var COULEURS_VIGILANCE$1 = [
	"Vert",
	"Jaune",
	"Orange",
	"Rouge"
];
/** Les phénomènes tels que Météo-France les nomme, et leur nom affiché. */
var PHENOMENES = {
	"Vent violent": ["Vent violent", "Strong wind"],
	"Pluie-inondation": ["Pluie et inondation", "Rain and flooding"],
	Orages: ["Orages", "Thunderstorms"],
	Inondation: ["Crues", "River flooding"],
	"Neige-verglas": ["Neige et verglas", "Snow and ice"],
	Canicule: ["Canicule", "Heatwave"],
	"Grand-froid": ["Grand froid", "Extreme cold"],
	Avalanches: ["Avalanches", "Avalanches"],
	"Vagues-submersion": ["Vagues et submersion", "Waves and coastal flooding"]
};
/** La vigilance du département, `null` si elle est inconnue (jamais « pas de vigilance » sans donnée). */
function lireVigilance(etat) {
	const niveau = COULEURS_VIGILANCE$1.indexOf(etat?.state);
	if (!etat || niveau < 0) return null;
	return {
		niveau,
		phenomenes: Object.entries(etat.attributes).map(([nom, couleur]) => ({
			nom,
			niveau: COULEURS_VIGILANCE$1.indexOf(couleur)
		})).filter((p) => p.niveau > 0).sort((a, b) => b.niveau - a.niveau)
	};
}
/** Le nom affiché d'un phénomène, dans la langue de l'utilisateur. */
var nomPhenomene = (nom, francais) => PHENOMENES[nom]?.[francais ? 0 : 1] ?? nom;
// src/cartes/meteo-france.ts
var CARTE_OFFICIELLE = "https://vigilance.meteofrance.fr";
var AutomaticMeteoFrance = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{display:flex;flex-direction:column;gap:12px;padding:14px 16px}
    button.pluie{display:block;width:100%;border-radius:12px}
    .tete{display:flex;align-items:baseline;justify-content:space-between;gap:12px}
    .source{font-size:12px;white-space:nowrap}
    .phrase{display:flex;align-items:center;gap:8px;margin-top:6px;font-size:15px;font-weight:650;color:var(--primary-text-color)}
    .phrase ha-icon{--mdc-icon-size:20px;color:var(--primary-color)}
    .barre{display:flex;gap:3px;height:12px;margin-top:10px}
    .barre i{display:block;min-width:4px;border-radius:4px;background:color-mix(in srgb, var(--secondary-text-color) 20%, transparent)}
    .barre i.i1{background:color-mix(in srgb, var(--primary-color) 38%, transparent)}
    .barre i.i2{background:color-mix(in srgb, var(--primary-color) 68%, transparent)}
    .barre i.i3{background:var(--primary-color)}
    .axe{display:flex;justify-content:space-between;margin-top:5px;font-size:11.5px;color:var(--secondary-text-color)}
    button.vert{display:flex;align-items:center;gap:9px;font-size:13.5px;color:var(--secondary-text-color);border-radius:8px}
    .pastille{width:9px;height:9px;border-radius:50%;background:var(--automatic-dashboard-vert);flex:none}
    .vigilance{display:grid;grid-template-columns:auto 1fr;gap:12px;padding:13px 14px;border-radius:14px}
    .vigilance .ico{width:38px;height:38px}
    .n1{background:rgba(232,194,26,.16)} .n1 .ico{background:#E8C21A;color:#3A3000}
    .n2{background:rgba(233,140,40,.16)} .n2 .ico{background:#E98C28;color:#fff}
    .n3{background:var(--automatic-dashboard-alerte-pale)} .n3 .ico{background:var(--automatic-dashboard-alerte);color:#fff}
    .titre{font-size:15px;font-weight:700;color:var(--primary-text-color)}
    .phenomenes{font-size:13.5px;font-weight:600;color:var(--primary-text-color);margin-top:2px}
    .conseil{margin:6px 0 0;font-size:13px;line-height:1.4;color:var(--secondary-text-color)}
    a{display:inline-flex;align-items:center;gap:4px;margin-top:8px;font-size:13px;font-weight:650;color:var(--primary-color);text-decoration:none}
    a ha-icon{--mdc-icon-size:15px}
  `];
	}
	getGridOptions() {
		return {
			columns: 12,
			rows: "auto"
		};
	}
	suivies(m) {
		return definis([m.meteoFrance, m.vigilance]);
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const pluie = lirePluie(m.meteoFrance ? hass.states[m.meteoFrance] : void 0);
		const vig = lireVigilance(m.vigilance ? hass.states[m.vigilance] : void 0);
		if (!pluie && !vig) return null;
		const fr = estFrancais(hass);
		const alerte = vig && vig.niveau > 0 ? b`<div class="vigilance n${vig.niveau}" role="alert"><span class="ico"><ha-icon icon="mdi:alert-outline"></ha-icon></span><div>
          <div class="titre">${tx.vigilance(tx.couleurs[vig.niveau])}</div>
          <div class="phenomenes">${vig.phenomenes.map((p) => nomPhenomene(p.nom, fr)).join(", ")}</div>
          <p class="conseil">${tx.conseils[vig.niveau]}</p>
          <a href=${CARTE_OFFICIELLE} target="_blank" rel="noopener noreferrer">${tx.vigilanceCarte}<ha-icon icon="mdi:open-in-new"></ha-icon></a></div></div>` : A;
		const vert = vig && vig.niveau === 0 ? b`<button class="vert" @click=${() => plusDInfos(this, m.vigilance)}><span class="pastille"></span>${tx.vigilanceVerte}</button>` : A;
		return b`<ha-card>${alerte}${pluie ? this.pluie(hass, pluie, m.meteoFrance) : A}${vert}</ha-card>`;
	}
	pluie(hass, p, id) {
		const tx = t$1(hass);
		const type = (texte) => texte ? tx.pluieTypes[texte] ?? texte : "";
		const phrase = p.dans === null ? tx.pluieAucune : p.continue ? tx.pluieContinue : p.fin !== null ? tx.pluieFin(p.fin) : tx.pluieDans(type(p.type), p.dans);
		return b`<button class="pluie" @click=${() => plusDInfos(this, id)}>
      <span class="tete"><span class="sur">${tx.pluieTitre}</span>${p.reference ? b`<span class="source doux">${tx.pluieSource(heure(hass, p.reference))}</span>` : A}</span>
      <span class="phrase"><ha-icon icon=${p.dans === null ? "mdi:umbrella-closed-outline" : "mdi:umbrella-outline"}></ha-icon>${phrase}</span>
      <span class="barre" aria-hidden="true">${p.tranches.map((tr) => b`<i class="i${tr.intensite}" style="flex:${tr.duree} 1 0"
        title=${`${tr.debut} min · ${type(tr.texte)}`}></i>`)}</span>
      <span class="axe"><span>${tx.maintenant}</span><span>${tx.dans1h}</span></span></button>`;
	}
};
// src/cartes/moment.ts
var MINUTE = 6e4;
var MACHINES = [
	[/lave-vaisselle|dishwasher/i, "mdi:dishwasher"],
	[/s(è|e)che-linge|dryer/i, "mdi:tumble-dryer"],
	[/lave-linge|washing|washer/i, "mdi:washing-machine"]
];
var AutomaticMoment = class extends CarteAutomatic {
	constructor(..._args) {
		super(..._args);
		this._minute = 0;
	}
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:12px 16px 8px}
    ul{list-style:none;margin:6px 0 0;padding:0}
    li{display:flex;align-items:center;gap:6px;border-top:1px solid var(--divider-color)}
    li:first-child{border-top:0}
    button.ligne{display:flex;align-items:center;gap:11px;flex:1;min-width:0;min-height:46px;padding:6px 0;border-radius:10px}
    .ligne ha-icon{--mdc-icon-size:20px;color:var(--secondary-text-color);flex:none}
    .texte{min-width:0;font-size:14px;font-weight:600;line-height:1.3;color:var(--primary-text-color)}
    .texte b{font-weight:700;color:var(--primary-color);margin-right:6px}
    .texte small{display:block;font-size:12.5px;font-weight:500;color:var(--secondary-text-color);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .texte span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    button.pause{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;flex:none;
      background:var(--automatic-dashboard-accent-pale, rgba(2,119,189,.12));color:var(--primary-color)}
    button.pause ha-icon{--mdc-icon-size:20px}
  `];
	}
	getGridOptions() {
		return {
			columns: 12,
			rows: "auto"
		};
	}
	suivies(m) {
		return [
			...m.medias.map((e) => e.id),
			...m.personnes,
			...m.agendas,
			...m.enMarche,
			...m.courses ? [m.courses] : []
		];
	}
	autresChangements() {
		return Math.floor(Date.now() / MINUTE) !== this._minute;
	}
	rendu(hass, m) {
		this._minute = Math.floor(Date.now() / MINUTE);
		const lignes = [
			...this.medias(hass, m),
			...this.presence(hass, m),
			...this.agenda(hass, m),
			...this.machines(hass, m),
			...this.courses(hass, m)
		].slice(0, m.mode === "complet" ? 5 : 6);
		if (!lignes.length) return null;
		return b`<ha-card><span class="sur">${t$1(hass).enCeMomentTitre}</span><ul>${lignes.map((l) => b`<li>
      <button class="ligne" @click=${() => this.ouvrir(l)}><ha-icon icon=${l.icone}></ha-icon>
        <span class="texte"><span>${l.avant ? b`<b>${l.avant}</b>` : A}${l.texte}</span>${l.detail ? b`<small>${l.detail}</small>` : A}</span></button>
      ${l.pause ? b`<button class="pause" title=${t$1(hass).pauseMedia} aria-label=${t$1(hass).pauseMedia} @click=${() => this.pause(l.pause)}>
        <ha-icon icon="mdi:pause"></ha-icon></button>` : A}</li>`)}</ul></ha-card>`;
	}
	medias(hass, m) {
		const enLecture = m.medias.filter((e) => hass.states[e.id]?.state === "playing");
		if (enLecture.length > 2) return [{
			icone: "mdi:play-circle-outline",
			texte: t$1(hass).mediasEnLecture(enLecture.length),
			entite: enLecture[0].id
		}];
		return enLecture.map((e) => {
			const a = hass.states[e.id].attributes;
			const titre = [a.media_artist, a.media_title].filter(Boolean).join(" · ") || a.app_name || a.source;
			return {
				icone: "mdi:play-circle-outline",
				texte: nomCourt(hass, e.id, m.noms),
				detail: titre,
				entite: e.id,
				pause: e.id
			};
		});
	}
	presence(hass, m) {
		const tx = t$1(hass);
		const suivies = m.personnes.map((id) => hass.states[id]).filter((p) => valide(p) && Array.isArray(p.attributes.device_trackers) && p.attributes.device_trackers.length > 0);
		if (!suivies.length) return [];
		const nom = (p) => m.noms[p.entity_id] || p.attributes.friendly_name || p.entity_id;
		const la = suivies.filter((p) => p.state === "home");
		const ailleurs = suivies.filter((p) => p.state !== "home");
		const texte = !la.length ? tx.personne : la.length > 3 || m.mode === "complet" && la.length > 2 ? tx.personnesALaMaison(la.length) : tx.aLaMaison(la.map(nom));
		const detail = ailleurs.length > 2 ? void 0 : ailleurs.map((p) => tx.ailleurs(nom(p), p.state === "not_home" ? null : p.state)).join(" · ");
		return [{
			icone: la.length ? "mdi:home-account" : "mdi:home-export-outline",
			texte,
			detail: detail || void 0,
			entite: (la[0] ?? suivies[0]).entity_id
		}];
	}
	agenda(hass, m) {
		const tx = t$1(hass);
		const minuit = (/* @__PURE__ */ new Date(/* @__PURE__ */ new Date())).setHours(0, 0, 0, 0);
		const jour = (d) => Math.floor((new Date(d).setHours(0, 0, 0, 0) - minuit) / 864e5);
		const lire = (s) => new Date(String(s ?? "").replace(" ", "T"));
		return m.agendas.map((id) => hass.states[id]).filter((e) => valide(e) && Boolean(e.attributes.message) && !Number.isNaN(lire(e.attributes.start_time).getTime())).map((e) => ({
			e,
			debut: lire(e.attributes.start_time),
			enCours: e.state === "on",
			journee: Boolean(e.attributes.all_day)
		})).filter((x) => x.enCours || jour(x.debut) <= 1).sort((a, b) => a.debut.getTime() - b.debut.getTime()).slice(0, 2).map(({ e, debut, enCours, journee }) => {
			const j = jour(debut);
			return {
				icone: "mdi:calendar-clock",
				avant: enCours ? tx.enCours : journee ? j === 0 ? tx.toutLeJour : tx.demain : j === 0 ? heure(hass, debut) : `${tx.demain} ${heure(hass, debut)}`,
				texte: String(e.attributes.message),
				chemin: "/calendar"
			};
		});
	}
	machines(hass, m) {
		const tx = t$1(hass);
		const lignes = [];
		for (const id of m.enMarche) {
			const e = hass.states[id];
			if (!valide(e)) continue;
			const nom = nomCourt(hass, id, m.noms);
			const domaine = id.split(".")[0];
			const formate = hass.formatEntityState?.(e) || e.state;
			if (domaine === "vacuum" && ["cleaning", "returning"].includes(e.state)) lignes.push({
				icone: "mdi:robot-vacuum",
				texte: nom,
				detail: formate,
				entite: id
			});
			else if (domaine === "lawn_mower" && e.state === "mowing") lignes.push({
				icone: "mdi:robot-mower",
				texte: nom,
				detail: formate,
				entite: id
			});
			else if (domaine === "binary_sensor" && e.state === "on") lignes.push({
				icone: MACHINES.find(([motif]) => motif.test(nom))?.[1] ?? "mdi:progress-clock",
				texte: tx.enMarche(nom),
				entite: id
			});
			else if (domaine === "timer" && e.state === "active") {
				const reste = Math.max(1, Math.ceil((new Date(e.attributes.finishes_at ?? "").getTime() - Date.now()) / MINUTE));
				if (!Number.isNaN(reste)) lignes.push({
					icone: "mdi:timer-outline",
					texte: tx.minuteur(nom, reste),
					entite: id
				});
			} else if (domaine === "timer" && e.state === "paused") lignes.push({
				icone: "mdi:timer-pause-outline",
				texte: tx.enPause(nom),
				entite: id
			});
		}
		return lignes;
	}
	courses(hass, m) {
		const n = Number.parseInt(hass.states[m.courses ?? ""]?.state ?? "", 10);
		if (!m.courses || Number.isNaN(n) || n <= 0) return [];
		return [{
			icone: "mdi:cart-outline",
			texte: t$1(hass).articles(n),
			chemin: `/todo?entity_id=${m.courses}`
		}];
	}
	ouvrir(l) {
		if (l.chemin) naviguer(l.chemin);
		else if (l.entite) plusDInfos(this, l.entite);
	}
	pause(id) {
		this.hass?.callService?.("media_player", "media_pause", { entity_id: id });
	}
};
var NOMS_FR = [
	[/^(chambre|cuisine|salle|buanderie|cave|mezzanine|v(é|e)randa|terrasse|piscine|fen(ê|e)tre|porte|baie|lucarne|trappe)\b/i, "la "],
	[/^(salon|bureau|s(é|e)jour|couloir|garage|grenier|cellier|dressing|hall|palier|jardin|balcon|patio|velux|portail|volet|garde-manger|wc)\b/i, "le "],
	[/^(entr(é|e)e|(é|e)tage|atelier|abri|escalier)\b/i, "l'"]
];
var NOMS_EN = /^(bedroom|kitchen|living|bathroom|office|hall|hallway|garage|attic|basement|cellar|laundry|dining|nursery|guest|master|kids?|window|door|patio|garden|terrace|balcony)\b/i;
/**
* « la chambre de Léa », « l'entrée », « the bedroom » ; null si le nom n'est pas un nom
* commun connu (« Atelier Paul » oui, « Chez Léa » non) : la phrase s'écrit alors sans article.
*/
function avecArticle(nom, fr) {
	const minuscule = (s) => s.charAt(0).toLowerCase() + s.slice(1);
	if (!fr) return NOMS_EN.test(nom) ? `the ${minuscule(nom)}` : null;
	const trouve = NOMS_FR.find(([motif]) => motif.test(nom));
	return trouve ? `${trouve[1]}${minuscule(nom)}` : null;
}
/** Le chauffage tourne-t-il ? L'action en cours si l'appareil la donne, sinon son mode. */
function chauffe(etat) {
	if (!etat || [
		"off",
		"unavailable",
		"unknown"
	].includes(etat.state)) return false;
	const action = etat.attributes.hvac_action;
	if (action) return action === "heating" || action === "preheating";
	return [
		"heat",
		"heat_cool",
		"auto"
	].includes(etat.state);
}
/** Les conseils du moment, et les ouvertures qu'ils remplacent (pas deux points pour la même fenêtre). */
function conseils(hass, m) {
	const fr = estFrancais(hass);
	const tx = t$1(hass);
	const etat = (id) => hass.states[id];
	const points = [];
	const remplaces = /* @__PURE__ */ new Set();
	const chauffages = m.climats.filter((e) => e.domaine === "climate" && chauffe(etat(e.id)));
	const central = chauffages.some((e) => !e.piece);
	for (const o of m.ouvrants) {
		if (etat(o.id)?.state !== "on") continue;
		if (!central && !chauffages.some((c) => c.piece && c.piece === o.piece)) continue;
		const nom = nomCourt(hass, o.id, m.noms);
		const article = avecArticle(nom, fr);
		points.push({
			cle: `ouvrant:${o.id}`,
			niveau: 2,
			icone: "mdi:radiator",
			conseil: true,
			securite: true,
			titre: article ? tx.fermer(article) : `${tx.fermerSans} : ${nom}`,
			detail: tx.chauffageOuvert,
			entite: o.id
		});
		remplaces.add(o.id);
	}
	for (const p of m.pieces.filter((x) => !x.exterieur)) {
		const mesure = (classe) => p.entites.filter((e) => e.role === "mesure" && e.classe === classe).map((e) => [e.id, Number.parseFloat(etat(e.id)?.state ?? "")]).filter(([, v]) => !Number.isNaN(v)).sort((a, b) => b[1] - a[1])[0];
		const article = avecArticle(p.name, fr);
		const aerer = article ? tx.aerer(article) : `${tx.aererSans} : ${p.name}`;
		const co2 = mesure("carbon_dioxide");
		if (co2 && co2[1] >= 1e3) {
			points.push({
				cle: `air:${p.area_id}`,
				niveau: co2[1] >= 1500 ? 2 : 1,
				icone: "mdi:molecule-co2",
				conseil: true,
				titre: aerer,
				detail: tx.co2(nombre(hass, co2[1], 0)),
				entite: co2[0]
			});
			continue;
		}
		const humidite = mesure("humidity");
		if (humidite && humidite[1] >= 80) points.push({
			cle: `air:${p.area_id}`,
			niveau: 1,
			icone: "mdi:water-percent",
			conseil: true,
			titre: aerer,
			detail: tx.humidite(nombre(hass, humidite[1], 0)),
			entite: humidite[0]
		});
	}
	return {
		points,
		remplaces
	};
}
// src/moteur/absence.ts
/** Tout le monde est parti : au moins une personne suivie, et aucune à la maison. */
function estAbsent(hass, m) {
	const suivies = m.personnes.map((id) => hass.states[id]).filter((s) => s && Array.isArray(s.attributes.device_trackers) && s.attributes.device_trackers.length > 0);
	return suivies.length > 0 && suivies.every((s) => s.state !== "home" && s.state !== "unknown" && s.state !== "unavailable");
}
/** Ce qui reste ouvert, allumé ou déverrouillé : de quoi écrire la phrase. */
function bilanAbsence(hass, m) {
	const etat = (id) => hass.states[id]?.state;
	return {
		ouverts: m.ouvrants.filter((e) => etat(e.id) === "on"),
		lumieres: m.lumieres.filter((e) => etat(e.id) === "on"),
		serrures: m.securite.filter((e) => e.domaine === "lock" && [
			"unlocked",
			"open",
			"opening"
		].includes(etat(e.id) ?? "")),
		alarmes: m.securite.filter((e) => e.domaine === "alarm_control_panel" && etat(e.id) === "disarmed")
	};
}
/** Les points propres à l'absence : lumières oubliées, serrures ouvertes, alarme désarmée. */
function pointsAbsence(hass, m) {
	const tx = t$1(hass);
	const fr = estFrancais(hass);
	const b = bilanAbsence(hass, m);
	const points = [];
	for (const e of b.serrures) {
		const nom = nomCourt(hass, e.id, m.noms);
		const article = avecArticle(nom, fr);
		points.push({
			cle: `serrure:${e.id}`,
			niveau: 2,
			icone: "mdi:lock-open-variant-outline",
			conseil: true,
			securite: true,
			titre: article ? tx.verrouiller(article) : `${tx.verrouillerSans} : ${nom}`,
			detail: tx.personneLa,
			entite: e.id
		});
	}
	for (const e of b.alarmes) points.push({
		cle: `alarme-desarmee:${e.id}`,
		niveau: 2,
		icone: "mdi:shield-off-outline",
		conseil: true,
		securite: true,
		titre: tx.armer,
		detail: tx.personneLa,
		entite: e.id
	});
	if (b.lumieres.length) {
		const pieces = [...new Set(b.lumieres.map((e) => m.pieces.find((p) => p.area_id === e.piece)?.name).filter(Boolean))];
		points.push({
			cle: "lumieres-absence",
			niveau: 1,
			icone: "mdi:lightbulb-group-off-outline",
			conseil: true,
			securite: true,
			titre: tx.eteindre,
			detail: tx.lumieresOubliees(b.lumieres.length, pieces.slice(0, 3).join(", ")),
			entite: b.lumieres[0].id
		});
	}
	return points;
}
// src/moteur/points.ts
function pointsARegarder(hass, m) {
	const tx = t$1(hass);
	const etat = (id) => hass.states[id];
	const points = [];
	for (const e of m.alertes) {
		if (etat(e.id)?.state !== "on") continue;
		const fuite = e.classe === "moisture";
		points.push({
			cle: `alerte:${e.id}`,
			niveau: 3,
			icone: fuite ? "mdi:water-alert" : "mdi:smoke-detector-alert",
			titre: fuite ? tx.fuite : tx.fumee,
			detail: nomCourt(hass, e.id, m.noms),
			entite: e.id,
			prevenir: fuite ? "fuite" : [
				"smoke",
				"gas",
				"carbon_monoxide"
			].includes(e.classe ?? "") ? "fumee" : void 0
		});
	}
	for (const e of m.gardees.filter((x) => x.domaine === "alarm_control_panel")) if (etat(e.id)?.state === "triggered") points.push({
		cle: `alarme:${e.id}`,
		niveau: 3,
		icone: "mdi:shield-alert",
		titre: tx.alarme,
		detail: nomCourt(hass, e.id, m.noms),
		entite: e.id
	});
	const vig = lireVigilance(m.vigilance ? etat(m.vigilance) : void 0);
	if (vig && vig.niveau >= 2) {
		const phenomenes = vig.phenomenes.map((p) => nomPhenomene(p.nom, estFrancais(hass))).join(", ");
		points.push({
			cle: "vigilance",
			niveau: vig.niveau === 3 ? 3 : 2,
			icone: "mdi:alert-outline",
			titre: tx.vigilance(tx.couleurs[vig.niveau]),
			detail: phenomenes,
			entite: m.vigilance
		});
	}
	const avis = conseils(hass, m);
	points.push(...avis.points);
	for (const e of m.ouvrants) {
		if (avis.remplaces.has(e.id)) continue;
		if (etat(e.id)?.state === "on") points.push({
			cle: `ouvrant:${e.id}`,
			securite: true,
			niveau: 2,
			icone: "mdi:window-open-variant",
			titre: nomCourt(hass, e.id, m.noms),
			detail: tx.ouverte,
			entite: e.id
		});
	}
	for (const e of m.piles) {
		const v = Number.parseFloat(etat(e.id)?.state ?? "");
		if (!Number.isNaN(v) && v <= 20) points.push({
			cle: `pile:${e.id}`,
			niveau: v <= 10 ? 2 : 1,
			icone: "mdi:battery-alert-variant-outline",
			titre: tx.pileFaible,
			detail: `${nomCourt(hass, e.id, m.noms)}, ${nombre(hass, v, 0)} %`,
			entite: e.id,
			prevenir: "pile"
		});
	}
	for (const e of m.systeme.filter((x) => x.plateforme === "uptime_kuma" && x.domaine === "sensor")) if (etat(e.id)?.state === "down") points.push({
		cle: `service:${e.id}`,
		niveau: 2,
		icone: "mdi:server-off",
		titre: tx.serviceEnPanne,
		detail: nomCourt(hass, e.id, m.noms),
		entite: e.id
	});
	const majs = m.majs.filter((e) => etat(e.id)?.state === "on");
	if (majs.length) points.push({
		cle: "majs",
		niveau: 1,
		icone: "mdi:package-up",
		titre: tx.majs(majs.length),
		detail: tx.majsDetail,
		chemin: "/config/updates"
	});
	const sauvegarde = (cle) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle);
	const reussie = sauvegarde("last_successful_automatic_backup");
	const tentee = sauvegarde("last_attempted_automatic_backup");
	if (reussie) {
		const dReussie = new Date(etat(reussie.id)?.state ?? "");
		const dTentee = new Date((tentee && etat(tentee.id)?.state) ?? "");
		if (!Number.isNaN(dTentee.getTime()) && (Number.isNaN(dReussie.getTime()) || dTentee > dReussie)) points.push({
			cle: "sauvegarde",
			niveau: 2,
			icone: "mdi:backup-restore",
			titre: tx.sauvegardeEchec,
			detail: tx.sauvegardeEchecDetail,
			chemin: "/config/backup",
			prevenir: "sauvegarde"
		});
		else if (Number.isNaN(dReussie.getTime())) points.push({
			cle: "sauvegarde",
			niveau: 1,
			icone: "mdi:backup-restore",
			titre: tx.sauvegardeAucune,
			detail: tx.sauvegardeAucuneDetail,
			chemin: "/config/backup"
		});
	}
	if ((/* @__PURE__ */ new Date()).getDay() === 1 && aUnBilan(hass, m)) points.push({
		cle: "bilan",
		niveau: 1,
		icone: "mdi:calendar-week",
		titre: tx.bilanPret,
		detail: tx.bilanPretDetail,
		chemin: "bilan"
	});
	if (estAbsent(hass, m)) {
		points.push(...pointsAbsence(hass, m));
		const rang = (p) => p.niveau === 3 ? 0 : p.securite ? 1 : 2;
		return points.sort((a, b) => rang(a) - rang(b) || b.niveau - a.niveau);
	}
	return points.sort((a, b) => b.niveau - a.niveau);
}
/** Un point grave ne s'ignore jamais. */
var ignorable = (p) => p.niveau < 3;
/** Les points à regarder, sans ceux que l'utilisateur a ignorés aujourd'hui. */
function pointsVisibles(hass, m) {
	const tous = pointsARegarder(hass, m);
	const ignores = tous.filter((p) => ignorable(p) && estIgnore(p.cle));
	return {
		visibles: tous.filter((p) => !ignores.includes(p)),
		ignores
	};
}
// src/phrases.ts
var VERT = "var(--automatic-dashboard-vert)";
var ORANGE = "var(--warning-color)";
var ROUGE = "var(--automatic-dashboard-alerte)";
var BLEU = "var(--primary-color)";
/**
* La phrase de l'accueil (et de la tablette murale) : une alerte grave d'abord, puis ce qui
* reste quand personne n'est là, la météo en mode Découverte, les points, ou « tout va bien ».
*/
function phraseAccueil(hass, m) {
	const tx = t$1(hass);
	const points = pointsVisibles(hass, m).visibles;
	const graves = points.filter((p) => p.niveau === 3);
	if (graves.length) return {
		phrase: tx.alerteGrave(`${graves[0].titre} : ${graves[0].detail}`),
		point: ROUGE
	};
	if (estAbsent(hass, m)) {
		const b = bilanAbsence(hass, m);
		const reste = [
			b.ouverts.length ? tx.absOuverts(b.ouverts.length) : "",
			b.serrures.length ? tx.absSerrures(b.serrures.length) : "",
			b.lumieres.length ? tx.absLumieres(b.lumieres.length) : "",
			b.alarmes.length ? tx.absAlarme : ""
		].filter(Boolean);
		return reste.length ? {
			phrase: tx.absenceReste(reste.join(", ")),
			point: ORANGE
		} : {
			phrase: tx.absenceCalme,
			point: VERT
		};
	}
	if (m.mode === "decouverte") return phraseMeteo(hass, m);
	if (points.length) return {
		phrase: tx.points(points.length),
		point: ORANGE
	};
	return {
		phrase: tx.toutVaBien,
		point: VERT
	};
}
/** « Éclaircies, 12,4°. Pas de pluie dans l'heure. » */
function phraseMeteo(hass, m) {
	const tx = t$1(hass);
	const meteo = m.meteo ? hass.states[m.meteo] : void 0;
	if (!valide(meteo)) return {
		phrase: "",
		point: BLEU
	};
	const cond = conditionMeteo(hass, meteo).texte;
	let phrase = tx.phraseMeteo(cond, degres(hass, meteo.attributes.temperature));
	const pluie = lirePluie(m.meteoFrance ? hass.states[m.meteoFrance] : void 0);
	if (pluie) phrase += " " + (pluie.dans === null ? tx.pasDePluie : pluie.dans === 0 ? tx.pluieEnCours : tx.pluieDansPhrase(pluie.dans));
	return {
		phrase,
		point: BLEU
	};
}
/** « 21,3° · 48 %, 2 lumières allumées, chauffage en marche. » */
function phrasePiece(hass, p) {
	const tx = t$1(hass);
	const morceaux = [];
	const temp = premiereValeur(hass, p.temperatures);
	const hum = premiereValeur(hass, p.humidites);
	if (temp !== null) morceaux.push(`${degres(hass, temp)}${hum !== null ? ` · ${nombre(hass, hum, 0)} %` : ""}`);
	const etat = (id) => hass.states[id]?.state;
	const lum = p.entites.filter((e) => e.domaine === "light" && etat(e.id) === "on").length;
	const vol = p.entites.filter((e) => e.domaine === "cover" && etat(e.id) === "open").length;
	if (lum) morceaux.push(tx.lumieresAllumees(lum));
	if (vol) morceaux.push(tx.voletsOuverts(vol));
	if (p.entites.some((e) => e.domaine === "climate" && [
		"heat",
		"heat_cool",
		"auto"
	].includes(etat(e.id) ?? ""))) morceaux.push(tx.chauffe);
	if (p.entites.some((e) => e.domaine === "climate" && etat(e.id) === "cool")) morceaux.push(tx.clim);
	if (!lum && !vol && morceaux.length <= 1) morceaux.push(tx.toutEteint.toLowerCase());
	return {
		phrase: majuscule(tx.piecePhrase(morceaux)),
		point: BLEU
	};
}
/** La phrase d'une page thématique : climat, énergie, sécurité, système ou à ranger. */
function phraseSujet(hass, m, sujet) {
	const tx = t$1(hass);
	const fr = estFrancais(hass);
	const etat = (id) => id ? hass.states[id] : void 0;
	const nom = (e) => nomCourt(hass, e.id, m.noms);
	if (sujet === "climat") {
		const pieces = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length).map((p) => ({
			p,
			v: premiereValeur(hass, p.temperatures)
		})).filter((x) => x.v !== null);
		const froides = pieces.filter((x) => x.v < 18.5), chaudes = pieces.filter((x) => x.v > 24);
		const ecarts = [...froides, ...chaudes];
		let phrase;
		if (!pieces.length) {
			const e = temperatureDehors(hass, m);
			phrase = e !== null ? `${fr ? "Dehors" : "Outside"} ${degres(hass, e)}.` : "";
		} else if (pieces.length === 1) {
			const e = temperatureDehors(hass, m);
			phrase = `${pieces[0].p.name} : ${degres(hass, pieces[0].v)}.${e !== null ? ` ${fr ? "Dehors" : "Outside"} : ${degres(hass, e)}.` : ""}`;
		} else if (!ecarts.length) phrase = fr ? "Il fait bon partout." : "Comfortable everywhere.";
		else if (ecarts.length <= 2) {
			const liste = ecarts.map((x) => `${x.p.name} (${degres(hass, x.v)})`).join(fr ? " et " : " and ");
			phrase = fr ? `Il fait bon presque partout. À surveiller : ${liste}.` : `Comfortable almost everywhere. Keep an eye on ${liste}.`;
		} else phrase = fr ? `${ecarts.length} pièces hors de la zone de confort.` : `${ecarts.length} rooms outside the comfort zone.`;
		const chauffes = m.climats.filter((e) => e.domaine === "climate" && [
			"heat",
			"heat_cool",
			"auto"
		].includes(etat(e.id)?.state ?? "")).length;
		if (chauffes) phrase += fr ? ` ${chauffes} chauffage${chauffes > 1 ? "s" : ""} en marche.` : ` ${chauffes} heater${chauffes > 1 ? "s" : ""} on.`;
		return {
			phrase,
			point: ecarts.length ? ORANGE : VERT
		};
	}
	if (sujet === "energie") {
		const reseau = etat(m.puissanceReseau);
		const w = Number.parseFloat(reseau?.state ?? "");
		if (Number.isNaN(w)) return {
			phrase: "",
			point: BLEU
		};
		return {
			phrase: tx.energiePhrase(`${nombre(hass, w, 0)} ${reseau.attributes.unit_of_measurement || "W"}`),
			point: BLEU
		};
	}
	if (sujet === "securite") {
		const ouverts = m.ouvrants.filter((e) => etat(e.id)?.state === "on");
		const alertes = m.alertes.filter((e) => etat(e.id)?.state === "on");
		if (alertes.length) return {
			phrase: `${tx.fuite} : ${alertes.map(nom).join(", ")}.`,
			point: ROUGE
		};
		if (!ouverts.length) return {
			phrase: fr ? "Tout est fermé." : "Everything is closed.",
			point: VERT
		};
		const liste = ouverts.slice(0, 2).map(nom).join(fr ? " et " : " and ");
		return {
			phrase: fr ? `${liste} ${ouverts.length > 1 ? "sont ouvertes" : "est ouverte"}. ${ouverts.length > 2 ? `Et ${ouverts.length - 2} autres.` : "Tout le reste est fermé."}` : `${liste} ${ouverts.length > 1 ? "are" : "is"} open.`,
			point: ORANGE
		};
	}
	if (sujet === "systeme") {
		const n = m.majs.filter((e) => etat(e.id)?.state === "on").length;
		const sauvegarde = m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === "last_successful_automatic_backup");
		const d = sauvegarde ? new Date(etat(sauvegarde.id)?.state ?? "") : null;
		if (!d || Number.isNaN(d.getTime())) return {
			phrase: fr ? `Aucune sauvegarde automatique.${n ? ` ${tx.majs(n)}.` : " Tout le reste est à jour."}` : `No automatic backup.${n ? ` ${tx.majs(n)}.` : ""}`,
			point: ORANGE
		};
		return {
			phrase: fr ? `Tout fonctionne. ${n ? `${tx.majs(n)}, sauvegarde ${ilYa(hass, d)}.` : `Tout est à jour, sauvegarde ${ilYa(hass, d)}.`}` : `All good. Backup ${ilYa(hass, d)}.`,
			point: n ? ORANGE : VERT
		};
	}
	if (sujet === "a-ranger") return {
		phrase: fr ? "Donnez-leur une pièce : ils apparaîtront sur l'accueil et dans leur pièce." : "Give them a room: they will show up on the home page and in their room.",
		point: BLEU
	};
	return {
		phrase: "",
		point: BLEU
	};
}
// src/cartes/ciel.ts
var CYCLE = 29.530588853;
/** Le style du ciel, partagé par l'en-tête de l'accueil et la tablette murale. */
var STYLE_CIEL = i$5`
  .ciel{margin:0;flex:none;display:flex;flex-direction:column;align-items:center;gap:2px}
  .ciel svg{display:block;overflow:visible}
  .ciel .rond{width:216px;height:96px}
  .ciel .bandeau{display:none;width:100%;height:auto}
  .ciel figcaption{font-size:12px;font-weight:550;color:var(--secondary-text-color);font-variant-numeric:tabular-nums;white-space:nowrap}
  .horizon{stroke:var(--divider-color);stroke-width:1.5}
  .arc{fill:none;stroke:var(--divider-color);stroke-width:2;stroke-dasharray:3 5;stroke-linecap:round}
  .parcouru{fill:none;stroke-width:2.5;stroke-linecap:round}
  .soleil{fill:#F6C453;stroke:#fff;stroke-width:1.5}
  .lune-ombre{fill:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));stroke:var(--divider-color)}
  .lune{fill:#E8E4D8}
`;
/** Âge de la lune, de 0 (nouvelle) à 1 (nouvelle suivante) ; 0,5 est la pleine lune. */
var ageLune = (date) => ((date.getTime() - Date.UTC(2e3, 0, 6, 18, 14)) / 864e5 % CYCLE + CYCLE) % CYCLE / CYCLE;
/** Le lever et le coucher d'aujourd'hui (sun.sun ne donne que les prochains), et où en est la journée. */
function journee(etat, maintenant) {
	const lever = new Date(etat?.attributes.next_rising ?? "");
	const coucher = new Date(etat?.attributes.next_setting ?? "");
	if (Number.isNaN(lever.getTime()) || Number.isNaN(coucher.getTime())) return null;
	const aujourdhui = (d) => d.toDateString() === maintenant.toDateString() ? d : /* @__PURE__ */ new Date(d.getTime() - 864e5);
	const l = aujourdhui(lever);
	const c = aujourdhui(coucher);
	return {
		lever: l,
		coucher: c,
		avancement: (maintenant.getTime() - l.getTime()) / (c.getTime() - l.getTime())
	};
}
/** Le chemin éclairé d'une lune de rayon r, centrée en (x, y), à un âge donné. */
function luneEclairee(x, y, r, age) {
	const k = Math.cos(2 * Math.PI * age);
	const rx = Math.abs(k) * r;
	const croissante = age < .5;
	return `M${x} ${y - r}A${r} ${r} 0 0 ${croissante ? 1 : 0} ${x} ${y + r}A${rx} ${r} 0 0 ${croissante ? k > 0 ? 0 : 1 : k > 0 ? 1 : 0} ${x} ${y - r}Z`;
}
/** Un dessin du ciel : rond (à côté du texte) ou en bandeau (sous le texte, sur téléphone). */
function dessin(L, H, base, rx, ry, j, maintenant, classe) {
	const cx = L / 2;
	const jour = j.avancement >= 0 && j.avancement <= 1;
	const a = Math.min(1, Math.max(0, j.avancement));
	const sx = cx - rx * Math.cos(Math.PI * a);
	const sy = base - ry * Math.sin(Math.PI * a);
	const arc = `M${cx - rx} ${base}A${rx} ${ry} 0 0 1 ${cx + rx} ${base}`;
	const parcouru = `M${cx - rx} ${base}A${rx} ${ry} 0 0 1 ${sx.toFixed(1)} ${sy.toFixed(1)}`;
	const rLune = Math.min(15, ry * .45);
	const yLune = base - ry * .72;
	return w`<svg class=${classe} viewBox="0 0 ${L} ${H}" aria-hidden="true">
      <line x1="6" x2=${L - 6} y1=${base} y2=${base} class="horizon"/>
      <path d=${arc} class="arc"/>
      ${jour ? w`<path d=${parcouru} stroke="url(#arc-jour)" class="parcouru"/>
            <circle cx=${sx} cy=${sy} r="18" fill="url(#halo)"/><circle cx=${sx} cy=${sy} r="7" class="soleil"/>` : w`<circle cx=${cx} cy=${yLune} r=${rLune} class="lune-ombre"/><path d=${luneEclairee(cx, yLune, rLune, ageLune(maintenant))} class="lune"/>`}
    </svg>`;
}
function ciel(hass, maintenant = /* @__PURE__ */ new Date()) {
	const j = journee(hass.states["sun.sun"], maintenant);
	if (!j) return A;
	const fr = langue(hass) === "fr";
	const jour = j.avancement >= 0 && j.avancement <= 1;
	const lune = phaseLune(maintenant, langue(hass));
	const legende = jour ? `${fr ? "Lever" : "Sunrise"} ${heure(hass, j.lever)} · ${fr ? "coucher" : "sunset"} ${heure(hass, j.coucher)}` : lune.nom;
	return b`<figure class="ciel" aria-label=${legende}>
    <svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>
      <linearGradient id="arc-jour" x1="0" x2="1"><stop offset="0" stop-color="#E9A23B" stop-opacity=".25"/><stop offset="1" stop-color="#E9A23B"/></linearGradient>
      <radialGradient id="halo"><stop offset="0" stop-color="#F6C453" stop-opacity=".55"/><stop offset="1" stop-color="#F6C453" stop-opacity="0"/></radialGradient>
    </defs></svg>
    ${dessin(216, 96, 74, 92, 56, j, maintenant, "rond")}
    ${dessin(360, 54, 46, 168, 34, j, maintenant, "bandeau")}
    <figcaption>${legende}</figcaption>
  </figure>`;
}
// src/cartes/ouverture.ts
var AutomaticOuverture = class extends CarteAutomatic {
	constructor(..._args) {
		super(..._args);
		this._heure = -1;
	}
	static {
		this.styles = [
			STYLE_COMMUN,
			STYLE_CIEL,
			i$5`
    :host{display:block}
    .bloc{padding:6px 2px 4px}
    .sur{display:inline-flex;align-items:center;gap:8px;color:var(--accent-color)}
    .sur::before{content:"";width:8px;height:8px;border-radius:2px;background:var(--primary-color)}
    h1{margin:10px 0 6px;font-family:var(--ha-font-family-heading, Inter, sans-serif);font-size:34px;line-height:1.08;font-weight:700;letter-spacing:-.025em;color:var(--primary-text-color)}
    .phrase{display:flex;align-items:baseline;gap:9px;font-size:16.5px;line-height:1.4;color:var(--primary-text-color);max-width:62ch}
    .phrase::before{content:"";flex:none;width:9px;height:9px;border-radius:50%;transform:translateY(-1px);background:var(--point, var(--automatic-dashboard-vert))}
    @container (max-width: 420px){ h1{font-size:28px} .phrase{font-size:15.5px} }
    .tete{display:flex;align-items:flex-end;justify-content:space-between;gap:20px}
    .tete .bloc{flex:1;min-width:0}
    /* Téléphone : le ciel passe sous la phrase, en bandeau, avec la légende à droite. */
    @container (max-width: 560px){
      .tete{flex-direction:column;align-items:stretch;gap:2px}
      .ciel{display:grid;grid-template-columns:1fr auto;align-items:end;gap:10px}
      .ciel .rond{display:none}
      .ciel .bandeau{display:block}
      .ciel figcaption{font-size:11px}
    }
  `
		];
	}
	suivies(m) {
		return definis([
			"sun.sun",
			...m.personnes,
			...m.securite.map((e) => e.id),
			m.meteo,
			m.meteoFrance,
			m.vigilance,
			...m.alertes.map((e) => e.id),
			...m.ouvrants.map((e) => e.id),
			...m.piles.map((e) => e.id),
			...m.majs.map((e) => e.id),
			...m.systeme.map((e) => e.id),
			...m.temperaturesInterieures.flat(),
			m.puissanceReseau,
			...m.pieces.flatMap((p) => p.entites.map((e) => e.id))
		]);
	}
	autresChangements() {
		return (/* @__PURE__ */ new Date()).getHours() !== this._heure;
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const page = this._config?.page || "accueil";
		const maintenant = /* @__PURE__ */ new Date();
		this._heure = maintenant.getHours();
		const date = majuscule(new Intl.DateTimeFormat(langue(hass), {
			weekday: "long",
			day: "numeric",
			month: "long"
		}).format(maintenant));
		let sur = `${date} · ${hass.config.location_name || ""}`;
		let titre = "", phrase = "", point = "var(--automatic-dashboard-vert)";
		if (page === "accueil") {
			const h = this._heure;
			const prenom = (hass.user?.name || "").replace(/\s*\(.*\)\s*$/, "").split(" ")[0];
			titre = `${h < 5 ? tx.nuit : h < 12 ? tx.bonjour : h < 18 ? tx.apresmidi : tx.bonsoir}${prenom ? `, ${prenom}` : ""}`;
			({phrase, point} = phraseAccueil(hass, m));
		} else if (page === "bilan") {
			const { debut, fin } = semainePassee(maintenant);
			const jour = new Intl.DateTimeFormat(langue(hass), {
				weekday: "long",
				day: "numeric",
				month: "long"
			});
			titre = tx.bilan;
			sur = date;
			phrase = tx.bilanPhrase(jour.format(debut), jour.format(/* @__PURE__ */ new Date(fin.getTime() - 432e5)));
			point = "var(--primary-color)";
		} else if (this._config?.piece) {
			const p = m.pieces.find((x) => x.area_id === this._config?.piece);
			titre = p?.name || "";
			sur = [tx.pieceSurtitre, p?.floor_id ? hass.floors?.[p.floor_id]?.name : void 0].filter(Boolean).join(" · ");
			phrase = p ? phrasePiece(hass, p).phrase : "";
			point = "var(--primary-color)";
		} else {
			const n = m.aRanger.length;
			titre = {
				climat: tx.climat,
				energie: tx.energie,
				securite: tx.securite,
				systeme: tx.systeme,
				"a-ranger": estFrancais(hass) ? `${n} appareil${n > 1 ? "s n'ont" : " n'a"} pas de pièce` : tx.sansPiece(n)
			}[page] || "";
			sur = date;
			({phrase, point} = phraseSujet(hass, m, page));
		}
		const bloc = b`<div class="bloc" style=${o({ "--point": point })}><div class="sur">${sur}</div><h1>${titre}</h1>
      ${phrase ? b`<div class="phrase">${phrase}</div>` : A}</div>`;
		return page === "accueil" ? b`<div class="tete">${bloc}${ciel(hass, maintenant)}</div>` : bloc;
	}
};
// src/cartes/pastille.ts
var AutomaticPastille = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    :host{display:inline-block;height:auto;container-type:normal}
    button{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 13px 0 10px;border-radius:999px;white-space:nowrap;
      background:var(--ha-card-background);border:1px solid var(--divider-color);font-size:14px;font-weight:600;color:var(--primary-text-color)}
    button:hover{border-color:var(--primary-color)}
    ha-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .valeur{font-weight:500;color:var(--secondary-text-color)}
    .actif{background:var(--automatic-dashboard-accent-pale)} .actif ha-icon{color:var(--state-light-active-color)}
    .attention{background:rgba(233,162,59,.14)} .attention ha-icon{color:var(--warning-color)}
    .alerte{background:var(--automatic-dashboard-alerte-pale)} .alerte ha-icon{color:var(--automatic-dashboard-alerte)}
  `];
	}
	suivies(m) {
		const s = this._config?.sujet;
		if (s === "meteo") return definis([m.meteo]);
		if (s === "climat") return m.temperaturesInterieures.flat();
		if (s === "lumieres") return m.lumieres.map((e) => e.id);
		if (s === "securite") return [...m.ouvrants, ...m.alertes].map((e) => e.id);
		if (s === "energie") return definis([m.puissanceReseau]);
		if (s === "systeme") return m.majs.map((e) => e.id);
		if (s === "soleil") return ["sun.sun"];
		if (s === "piece") return m.pieces.find((p) => p.area_id === this._config?.piece)?.temperatures ?? [];
		return [];
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const s = this._config?.sujet;
		const etat = (id) => id ? hass.states[id] : void 0;
		let icone = "mdi:circle-small", libelle = "", valeur = "", ton = "";
		if (s === "meteo") {
			const w = etat(m.meteo);
			if (!valide(w)) return null;
			({icone} = conditionMeteo(hass, w));
			libelle = degres(hass, w.attributes.temperature);
			valeur = conditionMeteo(hass, w).texte;
		} else if (s === "climat") {
			const d = moyenneInterieure(hass, m);
			if (d === null) return null;
			icone = "mdi:home-thermometer-outline";
			libelle = degres(hass, d);
			valeur = tx.dedans;
		} else if (s === "lumieres") {
			const n = m.lumieres.filter((e) => etat(e.id)?.state === "on").length;
			icone = "mdi:lightbulb-group-outline";
			libelle = tx.lumieres;
			valeur = tx.allumees(n);
			ton = n ? "actif" : "";
		} else if (s === "securite") {
			const ouverts = m.ouvrants.filter((e) => etat(e.id)?.state === "on").length;
			const alertes = m.alertes.filter((e) => etat(e.id)?.state === "on").length;
			icone = alertes ? "mdi:shield-alert-outline" : "mdi:shield-home-outline";
			libelle = tx.securite;
			valeur = alertes ? tx.fuite : ouverts ? tx.ouverts(ouverts) : tx.toutFerme;
			ton = alertes ? "alerte" : ouverts ? "attention" : "";
		} else if (s === "energie") {
			const reseau = etat(m.puissanceReseau);
			const w = Number.parseFloat(reseau?.state ?? "");
			if (Number.isNaN(w)) return null;
			icone = "mdi:lightning-bolt-outline";
			libelle = `${nombre(hass, w, 0)} ${reseau.attributes.unit_of_measurement || "W"}`;
			valeur = tx.enCeMoment;
		} else if (s === "systeme") {
			const n = m.majs.filter((e) => etat(e.id)?.state === "on").length;
			icone = "mdi:server-outline";
			libelle = tx.systeme;
			valeur = n ? tx.majs(n) : tx.aJour;
			ton = n ? "attention" : "";
		} else if (s === "a-ranger") {
			if (!m.aRanger.length) return null;
			icone = "mdi:tray-arrow-down";
			libelle = tx.aRanger;
			valeur = String(m.aRanger.length);
		} else if (s === "piece") {
			const p = m.pieces.find((x) => x.area_id === this._config?.piece);
			if (!p) return null;
			const v = premiereValeur(hass, p.temperatures);
			icone = p.icon;
			libelle = p.name;
			valeur = v !== null ? degres(hass, v) : "";
		} else if (s === "soleil") {
			const soleil = etat("sun.sun");
			if (!soleil) return null;
			const leve = soleil.state === "above_horizon";
			icone = leve ? "mdi:weather-sunset-down" : "mdi:weather-sunset-up";
			libelle = leve ? tx.coucher : tx.lever;
			valeur = heure(hass, new Date(leve ? soleil.attributes.next_setting : soleil.attributes.next_rising));
		}
		return b`<button class=${ton} @click=${this._clic}><ha-icon icon=${icone}></ha-icon>${libelle}${valeur ? b`<span class="valeur">${valeur}</span>` : A}</button>`;
	}
	_clic() {
		const s = this._config?.sujet;
		if (!s) return;
		if (s === "meteo") {
			const meteo = this.maison.meteo;
			if (meteo) plusDInfos(this, meteo);
		} else if (s === "soleil") plusDInfos(this, "sun.sun");
		else if (s === "lumieres") {
			if (this.hass?.panels?.light) naviguer("/light");
		} else if (s === "piece") naviguer(this._config?.piece ?? "");
		else naviguer(s);
	}
};
// src/cartes/piece.ts
var AutomaticPiece = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    button.carte{display:flex;flex-direction:column;justify-content:space-between;width:100%;height:100%;padding:13px 14px 12px;border-radius:var(--ha-card-border-radius)}
    .haut{display:flex;justify-content:space-between;align-items:flex-start;gap:8px}
    .mesures{text-align:right;line-height:1}
    .temp{font-size:24px;font-weight:650;letter-spacing:-.02em;color:var(--primary-text-color);white-space:nowrap}
    .hum{font-size:12.5px;margin-top:5px}
    .nom{display:flex;align-items:center;gap:6px;font-weight:650;font-size:15.5px;line-height:1.2;color:var(--primary-text-color);
      white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
    .nom .point{flex:none;width:8px;height:8px;border-radius:50%;background:var(--warning-color)}
    .compteurs{display:flex;gap:11px;margin-top:5px;font-size:12.5px;font-weight:600;color:var(--secondary-text-color);min-height:16px}
    .compteur{display:inline-flex;align-items:center;gap:3px}
    .compteur ha-icon{--mdc-icon-size:15px}
    .compteur.lum{color:var(--state-light-active-color)}
    .compteur.att{color:var(--warning-color)}
    .compteur.chaud ha-icon{color:var(--state-climate-heat-color)}
    .compteur.froid ha-icon{color:var(--state-climate-cool-color)}
    .calme{font-weight:500}
    @container (max-width: 150px){
      button.carte{padding:11px 11px 10px}
      .ico{width:32px;height:32px;border-radius:10px} .ico ha-icon{--mdc-icon-size:18px}
      .temp{font-size:19px} .hum{display:none} .compteurs{display:none}
      .nom{font-size:13.5px;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;line-height:1.2}
    }
    @container (min-width: 330px){ button.carte{padding:15px 18px 14px} .temp{font-size:30px} .nom{font-size:17px} }
  `];
	}
	getGridOptions() {
		return {
			columns: 6,
			rows: 2,
			min_columns: 4,
			max_columns: 12,
			min_rows: 2,
			max_rows: 2
		};
	}
	suivies(m) {
		const p = m.pieces.find((x) => x.area_id === this._config?.piece);
		return p ? [
			...p.temperatures,
			...p.humidites,
			...p.entites.map((e) => e.id)
		] : [];
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const p = m.pieces.find((x) => x.area_id === this._config?.piece);
		if (!p) return null;
		const etat = (id) => hass.states[id]?.state ?? "";
		const temp = premiereValeur(hass, p.temperatures);
		const hum = premiereValeur(hass, p.humidites);
		const lum = p.entites.filter((e) => e.domaine === "light" && etat(e.id) === "on").length;
		const vol = p.entites.filter((e) => e.domaine === "cover" && etat(e.id) === "open").length;
		const ouverts = p.entites.filter((e) => e.role === "ouvrant" && etat(e.id) === "on").length;
		const chauffe = p.entites.some((e) => e.domaine === "climate" && [
			"heat",
			"heat_cool",
			"auto"
		].includes(etat(e.id)));
		const froid = p.entites.some((e) => e.domaine === "climate" && etat(e.id) === "cool");
		const media = p.entites.some((e) => e.domaine === "media_player" && etat(e.id) === "playing");
		const compteurs = [
			lum ? b`<span class="compteur lum"><ha-icon icon="mdi:lightbulb-on"></ha-icon>${lum}</span>` : null,
			vol ? b`<span class="compteur"><ha-icon icon="mdi:window-shutter-open"></ha-icon>${vol}</span>` : null,
			ouverts ? b`<span class="compteur att"><ha-icon icon="mdi:window-open-variant"></ha-icon>${ouverts}</span>` : null,
			chauffe ? b`<span class="compteur chaud"><ha-icon icon="mdi:radiator"></ha-icon></span>` : null,
			froid ? b`<span class="compteur froid"><ha-icon icon="mdi:snowflake"></ha-icon></span>` : null,
			media ? b`<span class="compteur"><ha-icon icon="mdi:music"></ha-icon></span>` : null
		].filter((c) => c !== null);
		const nb = p.entites.filter((e) => !e.secondaire).length;
		return b`<ha-card><button class="carte" title=${p.name} @click=${() => naviguer(this._config?.piece ?? "")}>
      <span class="haut"><span class="ico ${lum ? "chaud" : ""}"><ha-icon icon=${p.icon}></ha-icon></span>
        <span class="mesures">${temp !== null ? b`<div class="temp chiffre">${degres(hass, temp)}</div>` : A}
        ${hum !== null ? b`<div class="hum doux chiffre">${nombre(hass, hum, 0)} %</div>` : A}</span></span>
      <span><span class="nom">${p.name}${ouverts ? b`<span class="point"></span>` : A}</span>
        <span class="compteurs">${compteurs.length ? compteurs : b`<span class="calme">${temp === null ? `${nb} ${tx.appareils.toLowerCase()}` : tx.toutEteint}</span>`}</span></span>
    </button></ha-card>`;
	}
};
// src/cartes/plan.ts
/** Du froid au chaud : les paliers de couleur d'une pièce. */
var PALIERS = [
	[17, "#4F8FD9"],
	[19, "#5FB3D6"],
	[22, "#5DB88A"],
	[24, "#E9A23B"],
	[Infinity, "#D9614F"]
];
var couleurTemperature = (t) => t === null ? null : PALIERS.find(([seuil]) => t < seuil)[1];
var AutomaticPlan = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:16px 16px 14px;display:grid;gap:12px}
    .etage{display:grid;grid-template-columns:auto 1fr;gap:10px;align-items:stretch}
    .etage > .sur{writing-mode:vertical-rl;transform:rotate(180deg);text-align:center;font-size:10.5px;padding:4px 0}
    .sans-etage{grid-template-columns:1fr}
    /* Une mosaïque : les grandes pièces prennent deux colonnes (et deux rangées pour les plus grandes), les petites comblent les trous. */
    .pieces{display:grid;grid-template-columns:repeat(auto-fill,minmax(104px,1fr));grid-auto-rows:84px;grid-auto-flow:dense;gap:6px}
    .piece{display:flex;flex-direction:column;justify-content:space-between;min-width:0;padding:10px 12px;border-radius:12px;
      box-sizing:border-box;text-align:left;background:color-mix(in srgb, var(--c, #888) 26%, var(--card-background-color, #fff));
      border:1px solid color-mix(in srgb, var(--c, #888) 45%, transparent);transition:transform .12s}
    .piece:hover{transform:translateY(-1px)}
    .piece.inconnue{--c:var(--secondary-text-color);background:transparent;border-style:dashed}
    .piece.dehors{background:repeating-linear-gradient(135deg, color-mix(in srgb, var(--c, #888) 18%, transparent) 0 6px, transparent 6px 12px);border-style:dashed}
    .nom{font-size:13px;font-weight:650;color:var(--primary-text-color);line-height:1.2;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .bas{display:flex;align-items:baseline;justify-content:space-between;gap:6px}
    .temp{font-size:22px;font-weight:700;letter-spacing:-.02em;color:color-mix(in srgb, var(--c, #888) 70%, var(--primary-text-color))}
    .hum{font-size:12px;font-weight:600;color:var(--secondary-text-color)}
    .legende{display:flex;align-items:center;gap:10px;font-size:11.5px;color:var(--secondary-text-color);font-variant-numeric:tabular-nums}
    .legende span.degrade{flex:1;max-width:220px;height:6px;border-radius:3px;
      background:linear-gradient(90deg, #4F8FD9, #5FB3D6 30%, #5DB88A 55%, #E9A23B 78%, #D9614F)}
    @media (prefers-reduced-motion: reduce){ .piece{transition:none} }
  `];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: "auto"
		};
	}
	suivies(m) {
		return m.pieces.flatMap((p) => [...p.temperatures, ...p.humidites]);
	}
	rendu(hass, m) {
		const pieces = m.pieces.filter((p) => p.entites.length || p.temperatures.length);
		if (pieces.filter((p) => p.temperatures.length).length < 2) return null;
		const groupes = [...m.etages].sort((a, b) => (b.level ?? 0) - (a.level ?? 0)).map((e) => [e.name, pieces.filter((p) => p.etage === e.floor_id)]).filter(([, l]) => l.length);
		const sans = pieces.filter((p) => !p.etage);
		if (sans.length) groupes.push([groupes.length ? estFrancais(hass) ? "Autres" : "Other" : null, sans]);
		return b`<ha-card>
      ${groupes.map(([nom, liste]) => b`<div class=${nom ? "etage" : "etage sans-etage"}>
        ${nom ? b`<span class="sur">${nom}</span>` : A}
        <div class="pieces">${liste.map((p) => this.piece(hass, p))}</div></div>`)}
      <div class="legende"><span>16°</span><span class="degrade"></span><span>26°</span></div>
    </ha-card>`;
	}
	piece(hass, p) {
		const t = premiereValeur(hass, p.temperatures);
		const h = premiereValeur(hass, p.humidites);
		const couleur = couleurTemperature(t);
		const colonnes = p.utiles >= 5 ? 2 : 1;
		const rangees = p.utiles >= 12 ? 2 : 1;
		return b`<button class=${[
			"piece",
			couleur ? "" : "inconnue",
			p.exterieur ? "dehors" : ""
		].join(" ")} style=${`grid-column:span ${colonnes};grid-row:span ${rangees};${couleur ? `--c:${couleur}` : ""}`}
      title=${p.name} @click=${() => p.entites.length && naviguer(p.area_id)}>
      <span class="nom">${p.name}</span>
      <span class="bas"><span class="temp chiffre">${t === null ? "—" : degres(hass, t)}</span>
        ${h === null ? A : b`<span class="hum chiffre">${nombre(hass, h, 0)} %</span>`}</span>
    </button>`;
	}
};
var CLASSES_FUMEE = /* @__PURE__ */ new Set([
	"smoke",
	"gas",
	"carbon_monoxide"
]);
var TEXTES = {
	fr: {
		alias: {
			fuite: "prévenir en cas de fuite",
			fumee: "prévenir en cas de fumée ou de gaz",
			pile: "prévenir quand une pile est faible",
			sauvegarde: "prévenir si la sauvegarde échoue"
		},
		titre: {
			fuite: "Fuite détectée",
			fumee: "Fumée ou gaz détecté",
			pile: "Pile faible",
			sauvegarde: "Sauvegarde ratée"
		},
		message: {
			fuite: "{{ trigger.to_state.name }} a détecté de l'eau.",
			fumee: "{{ trigger.to_state.name }} s'est déclenché.",
			pile: "{{ trigger.to_state.name }} : {{ trigger.to_state.state }} %, à changer bientôt.",
			sauvegarde: "La dernière sauvegarde automatique de Home Assistant a échoué."
		},
		description: "Créé par Automatic Dashboard, depuis un point à regarder. Il vous appartient : modifiez-le librement."
	},
	en: {
		alias: {
			fuite: "notify on leak",
			fumee: "notify on smoke or gas",
			pile: "notify when a battery is low",
			sauvegarde: "notify if the backup fails"
		},
		titre: {
			fuite: "Leak detected",
			fumee: "Smoke or gas detected",
			pile: "Low battery",
			sauvegarde: "Backup failed"
		},
		message: {
			fuite: "{{ trigger.to_state.name }} detected water.",
			fumee: "{{ trigger.to_state.name }} went off.",
			pile: "{{ trigger.to_state.name }}: {{ trigger.to_state.state }}%, replace it soon.",
			sauvegarde: "The last automatic Home Assistant backup failed."
		},
		description: "Created by Automatic Dashboard from a thing to check. It is yours: edit it freely."
	}
};
var idAutomatisme = (sujet) => `automatic_dashboard_${sujet}`;
/** Cet automatisme existe-t-il déjà (créé ici, ou gardé après modification) ? */
var automatismeExiste = (hass, sujet) => Object.values(hass.states).some((s) => s.entity_id.startsWith("automation.") && s.attributes.id === idAutomatisme(sujet));
/** Les téléphones de l'application Home Assistant, plus la notification dans Home Assistant. */
function prevenir(hass, titre, message, sujet) {
	const telephones = Object.keys(hass.services?.notify ?? {}).filter((s) => s.startsWith("mobile_app_")).sort();
	return [{
		action: "persistent_notification.create",
		data: {
			title: titre,
			message,
			notification_id: idAutomatisme(sujet)
		}
	}, ...telephones.map((s) => ({
		action: `notify.${s}`,
		data: {
			title: titre,
			message
		}
	}))];
}
/** L'automatisme d'un sujet, ou null si la maison n'a rien à surveiller pour lui. */
function automatisme(hass, m, sujet) {
	const tx = estFrancais(hass) ? TEXTES.fr : TEXTES.en;
	let triggers = [];
	let conditions = [];
	if (sujet === "fuite" || sujet === "fumee") {
		const ids = m.alertes.filter((e) => sujet === "fuite" ? e.classe === "moisture" : CLASSES_FUMEE.has(e.classe ?? "")).map((e) => e.id);
		if (!ids.length) return null;
		triggers = [{
			trigger: "state",
			entity_id: ids,
			from: "off",
			to: "on"
		}];
	} else if (sujet === "pile") {
		const nombres = m.piles.filter((e) => e.domaine === "sensor").map((e) => e.id);
		const binaires = m.piles.filter((e) => e.domaine === "binary_sensor").map((e) => e.id);
		if (nombres.length) triggers.push({
			trigger: "numeric_state",
			entity_id: nombres,
			below: 20
		});
		if (binaires.length) triggers.push({
			trigger: "state",
			entity_id: binaires,
			from: "off",
			to: "on"
		});
		if (!triggers.length) return null;
	} else {
		const capteur = (cle) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle)?.id;
		const tentee = capteur("last_attempted_automatic_backup");
		const reussie = capteur("last_successful_automatic_backup");
		if (!tentee || !reussie) return null;
		triggers = [{
			trigger: "state",
			entity_id: tentee
		}];
		conditions = [{
			condition: "template",
			value_template: `{% set t = states('${tentee}') | as_datetime %}{% set r = states('${reussie}') | as_datetime %}{{ t is not none and (r is none or t > r) }}`
		}];
	}
	return {
		id: idAutomatisme(sujet),
		config: {
			id: idAutomatisme(sujet),
			alias: `Automatic Dashboard${estFrancais(hass) ? " : " : ": "}${tx.alias[sujet]}`,
			description: tx.description,
			mode: "queued",
			triggers,
			conditions,
			actions: prevenir(hass, tx.titre[sujet], tx.message[sujet], sujet)
		}
	};
}
/** Crée l'automatisme dans Home Assistant (administrateur seulement), comme l'éditeur d'automatisations. */
async function creerAutomatisme(hass, a) {
	const api = hass.callApi;
	if (!api) throw new Error("callApi indisponible");
	await api("POST", `config/automation/config/${a.id}`, a.config);
}
// src/cartes/points.ts
var AutomaticPoints = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:6px 16px}
    ha-card.grave{background:var(--automatic-dashboard-alerte-pale);border-color:transparent}
    ul{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;column-gap:28px}
    @container (min-width: 640px){ ul{grid-template-columns:1fr 1fr} }
    li{border-top:1px solid var(--divider-color)}
    li:first-child{border-top:0}
    @container (min-width: 640px){ li:nth-child(2){border-top:0} }
    li{display:grid;grid-template-columns:1fr auto;align-items:center;gap:4px}
    .actions{display:flex;align-items:center;gap:2px}
    .action.fait{color:var(--success-color, #2e7d32);opacity:1}
    li .ouvrir{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:13px;width:100%;min-height:58px;padding:9px 0;text-align:left}
    .action{display:grid;place-items:center;width:36px;height:36px;border-radius:50%;color:var(--secondary-text-color);opacity:.75}
    .action:hover,.action:focus-visible{opacity:1;background:var(--secondary-background-color);color:var(--primary-text-color)}
    .action ha-icon{--mdc-icon-size:19px}
    .ignores{display:flex;align-items:center;gap:8px;padding:9px 0 11px;font-size:13px;color:var(--secondary-text-color);border-top:1px solid var(--divider-color)}
    ul:empty + .ignores{border-top:0}
    .ignores ha-icon{--mdc-icon-size:17px}
    .ignores button{font-weight:650;color:var(--primary-color)}
    .n3 .ico{background:var(--automatic-dashboard-alerte-pale);color:var(--automatic-dashboard-alerte)}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--automatic-dashboard-accent-pale);color:var(--primary-color)}
    .nom{font-weight:650;font-size:14.5px;line-height:1.25;color:var(--primary-text-color)}
    .nom small{display:block;font-weight:500;font-size:13px;color:var(--secondary-text-color);margin-top:2px}
    .fleche{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .plus{display:block;padding:8px 0 10px;font-size:13px;color:var(--secondary-text-color)}
  `];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: "auto"
		};
	}
	suivies(m) {
		return definis([m.vigilance, ...[
			...m.alertes,
			...m.ouvrants,
			...m.piles,
			...m.majs,
			...m.systeme
		].map((e) => e.id)]);
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const { visibles: points, ignores } = pointsVisibles(hass, m);
		if (!points.length && !ignores.length) return null;
		const plafond = m.mode === "complet" ? 4 : m.mode === "maison" ? 4 : 3;
		const montres = points.slice(0, plafond);
		const reste = points.length - montres.length;
		return b`<ha-card class=${points.some((p) => p.niveau === 3) ? "grave" : ""}><ul>${montres.map((p) => b`<li class="n${p.niveau}">
      <button class="ouvrir" @click=${() => this.ouvrir(p)}>
        <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span>
        <span class="nom">${p.titre}<small>${p.detail}</small></span>
        ${ignorable(p) ? A : b`<ha-icon class="fleche" icon="mdi:chevron-right"></ha-icon>`}</button>
      <span class="actions">${this.prevenir(hass, m, p)}
      ${ignorable(p) ? b`<button class="action" title=${tx.ignorer} aria-label=${`${tx.ignorer} : ${p.titre}`} @click=${() => ignorer(hass, [p.cle], true)}>
            <ha-icon icon="mdi:eye-off-outline"></ha-icon></button>` : A}</span></li>`)}</ul>
      ${reste > 0 ? b`<span class="plus">${majuscule(tx.autres(reste))}</span>` : A}
      ${ignores.length ? b`<div class="ignores"><ha-icon icon="mdi:eye-off-outline"></ha-icon><span>${tx.ignores(ignores.length)}</span>
            <button @click=${() => ignorer(hass, ignores.map((p) => p.cle), false)}>${tx.remontrer}</button></div>` : A}</ha-card>`;
	}
	prevenir(hass, m, p) {
		if (!p.prevenir || !hass.user?.is_admin) return A;
		const tx = t$1(hass);
		if (automatismeExiste(hass, p.prevenir)) return b`<button class="action fait" title=${tx.prevenu} aria-label=${tx.prevenu}
        @click=${() => naviguer(`/config/automation/edit/${idAutomatisme(p.prevenir)}`)}><ha-icon icon="mdi:bell-check-outline"></ha-icon></button>`;
		const a = automatisme(hass, m, p.prevenir);
		if (!a) return A;
		return b`<button class="action" title=${tx.prevenir} aria-label=${`${tx.prevenir} : ${p.titre}`}
      @click=${() => this.creer(a)}><ha-icon icon="mdi:bell-plus-outline"></ha-icon></button>`;
	}
	async creer(a) {
		const tx = t$1(this.hass);
		const annoncer = (message, action) => this.dispatchEvent(new CustomEvent("hass-notification", {
			detail: {
				message,
				action
			},
			bubbles: true,
			composed: true
		}));
		try {
			await creerAutomatisme(this.hass, a);
			annoncer(tx.automatismeCree(String(a.config.alias)), {
				text: tx.voir,
				action: () => naviguer(`/config/automation/edit/${a.id}`)
			});
		} catch (erreur) {
			annoncer(`${tx.automatismeEchec} ${erreur?.message ?? ""}`.trim());
		}
	}
	ouvrir(p) {
		if (p.entite) plusDInfos(this, p.entite);
		else if (p.chemin) naviguer(p.chemin);
	}
};
// src/cartes/premiers-pas.ts
/** L'emplacement par défaut d'un Home Assistant neuf (Amsterdam) : la maison n'est pas encore placée. */
var AMSTERDAM = {
	latitude: 52.3731339,
	longitude: 4.8903147
};
var AutomaticPremiersPas = class extends CarteAutomatic {
	static {
		this.styles = [STYLE_COMMUN, i$5`
    ha-card{padding:16px 18px 10px}
    .titre{font-size:17px;font-weight:700;color:var(--primary-text-color)}
    .sous{font-size:13px;margin:3px 0 8px}
    ol{list-style:none;margin:0;padding:0}
    li{border-top:1px solid var(--divider-color)}
    li button{display:flex;align-items:center;gap:12px;width:100%;min-height:48px;font-size:14.5px;font-weight:550;color:var(--primary-text-color)}
    .coche{display:grid;place-items:center;width:24px;height:24px;border-radius:50%;flex:none;border:2px solid var(--divider-color)}
    .fait .coche{background:var(--automatic-dashboard-vert);border-color:var(--automatic-dashboard-vert);color:#fff}
    .fait .coche ha-icon{--mdc-icon-size:16px}
    .fait span.texte{color:var(--secondary-text-color);text-decoration:line-through;text-decoration-color:var(--divider-color)}
    .texte{flex:1}
    .fleche{--mdc-icon-size:18px;color:var(--secondary-text-color)}
  `];
	}
	getGridOptions() {
		return {
			columns: 12,
			rows: "auto"
		};
	}
	suivies() {
		return [this.prochaineSauvegarde() ?? "sensor.backup_next_scheduled_automatic_backup"];
	}
	autresChangements(ancien) {
		const hass = this.hass;
		return (ancien.config.components ?? []).length !== (hass.config.components ?? []).length || ancien.config.latitude !== hass.config.latitude;
	}
	prochaineSauvegarde() {
		return Object.values(this.hass?.entities ?? {}).find((e) => e.platform === "backup" && e.translation_key === "next_scheduled_automatic_backup")?.entity_id;
	}
	rendu(hass, m) {
		if (!hass.user?.is_admin) return null;
		const tx = t$1(hass);
		const c = new Set(hass.config.components ?? []);
		const amsterdam = Math.abs(hass.config.latitude - AMSTERDAM.latitude) < .001 && Math.abs(hass.config.longitude - AMSTERDAM.longitude) < .001;
		const prochaine = this.prochaineSauvegarde();
		const sauvegardesActives = Boolean(prochaine) && valide(hass.states[prochaine]);
		const fr = (hass.config.country || "") === "FR";
		const etapes = [
			{
				cle: "emplacement",
				fait: !amsterdam,
				lien: "/_my_redirect/general"
			},
			fr ? {
				cle: "meteoFrance",
				fait: c.has("meteo_france"),
				lien: "/_my_redirect/config_flow_start?domain=meteo_france"
			} : {
				cle: "meteo",
				fait: Boolean(m.meteo),
				lien: "/_my_redirect/config_flow_start?domain=met"
			},
			{
				cle: "feries",
				fait: c.has("holiday"),
				lien: "/_my_redirect/config_flow_start?domain=holiday"
			},
			{
				cle: "sauvegardes",
				fait: sauvegardesActives,
				lien: "/_my_redirect/backup_config"
			},
			{
				cle: "pieces",
				fait: m.aRanger.length === 0 && m.utiles.some((e) => e.piece),
				lien: "/_my_redirect/areas"
			},
			{
				cle: "appli",
				fait: Object.values(hass.entities).some((e) => e.platform === "mobile_app"),
				lien: "https://www.home-assistant.io/integrations/mobile_app/#apps"
			}
		];
		if (etapes.every((e) => e.fait)) return null;
		return b`<ha-card><div class="titre">${tx.premiersPas}</div><div class="sous doux">${tx.premiersPasDetail}</div><ol>
      ${etapes.map((e) => b`<li class=${e.fait ? "fait" : ""}><button @click=${() => this.ouvrir(e)}><span class="coche">${e.fait ? b`<ha-icon icon="mdi:check"></ha-icon>` : A}</span>
        <span class="texte">${tx.etapes[e.cle]}</span>${e.fait ? A : b`<ha-icon class="fleche" icon="mdi:chevron-right"></ha-icon>`}</button></li>`)}
      </ol></ha-card>`;
	}
	ouvrir(e) {
		if (e.fait) return;
		if (e.lien.startsWith("http")) window.open(e.lien, "_blank", "noopener");
		else naviguer(e.lien);
	}
};
// src/cartes/tablette.ts
/** La nuit de l'écran de veille : de 23 h à 6 h. */
var estNuit = (d) => d.getHours() >= 23 || d.getHours() < 6;
var VEILLE_APRES = 6e4;
var AutomaticTablette = class extends CarteAutomatic {
	static {
		this.properties = {
			_veille: { state: true },
			_minute: { state: true }
		};
	}
	constructor() {
		super();
		this._dernierGeste = Date.now();
		this._reveil = (ev) => {
			this._dernierGeste = Date.now();
			if (this._veille) {
				ev.preventDefault();
				ev.stopPropagation();
				this._veille = false;
			}
		};
		this._veille = false;
		this._minute = -1;
	}
	static {
		this.styles = [
			STYLE_COMMUN,
			STYLE_CIEL,
			i$5`
    :host{height:100%}
    .ecran{box-sizing:border-box;min-height:calc(100vh - var(--header-height, 56px) - 16px);display:grid;grid-template-columns:minmax(0,1.4fr) minmax(0,1fr);
      gap:clamp(20px,4vw,64px);padding:clamp(20px,4vw,56px);align-items:center}
    .heure{font-size:clamp(84px,14vw,200px);font-weight:700;letter-spacing:-.05em;line-height:.9;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
    .date{margin-top:14px;font-size:clamp(20px,2.4vw,30px);font-weight:600;color:var(--secondary-text-color)}
    .phrase{display:flex;align-items:baseline;gap:14px;margin-top:clamp(20px,3vw,40px);font-size:clamp(20px,2.3vw,30px);line-height:1.35;
      color:var(--primary-text-color);max-width:28ch}
    .phrase::before{content:"";flex:none;width:14px;height:14px;border-radius:50%;background:var(--point);transform:translateY(-2px)}
    .chiffres{display:flex;flex-wrap:wrap;gap:clamp(18px,3vw,44px);margin-top:clamp(24px,3vw,44px)}
    .chiffre-tab{display:flex;flex-direction:column;gap:4px}
    .chiffre-tab b{font-size:clamp(28px,3.4vw,46px);font-weight:680;letter-spacing:-.02em;color:var(--primary-text-color);font-variant-numeric:tabular-nums}
    .chiffre-tab span{font-size:15px;font-weight:600;color:var(--secondary-text-color);display:flex;align-items:center;gap:6px}
    .chiffre-tab ha-icon{--mdc-icon-size:18px}
    .droite{display:grid;gap:18px;align-content:center}
    .ciel{align-self:start}
    .ciel .rond{width:min(100%,320px);height:auto}
    .ciel figcaption{font-size:14px}
    ul{list-style:none;margin:0;padding:0;display:grid;gap:10px}
    li button{display:grid;grid-template-columns:auto 1fr;gap:16px;align-items:center;width:100%;padding:16px 18px;border-radius:18px;
      background:var(--ha-card-background, var(--card-background-color));border:1px solid var(--divider-color)}
    li .ico{width:48px;height:48px;border-radius:14px}
    li .ico ha-icon{--mdc-icon-size:26px}
    .n3 .ico{background:var(--automatic-dashboard-alerte-pale);color:var(--automatic-dashboard-alerte)}
    .n2 .ico{background:rgba(233,162,59,.16);color:var(--warning-color)}
    .n1 .ico{background:var(--automatic-dashboard-accent-pale);color:var(--primary-color)}
    .titre{font-size:19px;font-weight:650;color:var(--primary-text-color);line-height:1.25}
    .titre small{display:block;font-size:15px;font-weight:500;color:var(--secondary-text-color);margin-top:3px}
    .calme{font-size:20px;color:var(--secondary-text-color);display:flex;align-items:center;gap:12px}
    .calme ha-icon{--mdc-icon-size:30px;color:var(--automatic-dashboard-vert)}
    .veille{position:fixed;inset:0;z-index:100;background:#000;cursor:none;display:block}
    .veille .heure{position:absolute;color:#fff;opacity:.32;font-size:clamp(64px,10vw,140px);transition:left 2s, top 2s}
    @container (max-width: 760px){ .ecran{grid-template-columns:1fr;align-items:start} }
    @media (prefers-reduced-motion: reduce){ .veille .heure{transition:none} }
  `
		];
	}
	getGridOptions() {
		return {
			columns: "full",
			rows: "auto"
		};
	}
	suivies(m) {
		return definis([
			"sun.sun",
			m.meteo,
			m.puissanceReseau,
			...m.personnes,
			...m.temperaturesInterieures.flat(),
			...m.securite.map((e) => e.id),
			...m.alertes.map((e) => e.id),
			...m.piles.map((e) => e.id),
			...m.majs.map((e) => e.id),
			...m.lumieres.map((e) => e.id)
		]);
	}
	connectedCallback() {
		super.connectedCallback();
		this._horloge = window.setInterval(() => {
			const maintenant = /* @__PURE__ */ new Date();
			if (maintenant.getMinutes() !== this._minute) this._minute = maintenant.getMinutes();
			const veille = estNuit(maintenant) && Date.now() - this._dernierGeste > VEILLE_APRES;
			if (veille !== this._veille) this._veille = veille;
		}, 1e3);
		for (const geste of [
			"pointerdown",
			"keydown",
			"touchstart"
		]) window.addEventListener(geste, this._reveil, { capture: true });
	}
	disconnectedCallback() {
		super.disconnectedCallback();
		window.clearInterval(this._horloge);
		for (const geste of [
			"pointerdown",
			"keydown",
			"touchstart"
		]) window.removeEventListener(geste, this._reveil, { capture: true });
	}
	rendu(hass, m) {
		const tx = t$1(hass);
		const maintenant = /* @__PURE__ */ new Date();
		const heure = new Intl.DateTimeFormat(langue(hass), {
			hour: "2-digit",
			minute: "2-digit"
		}).format(maintenant);
		if (this._veille) {
			const graine = maintenant.getHours() * 60 + maintenant.getMinutes();
			const x = 8 + graine * 37 % 50;
			const y = 10 + graine * 53 % 60;
			return b`<div class="veille" role="button" aria-label=${tx.reveiller}><span class="heure" style=${`left:${x}%;top:${y}%`}>${heure}</span></div>`;
		}
		const date = majuscule(new Intl.DateTimeFormat(langue(hass), {
			weekday: "long",
			day: "numeric",
			month: "long"
		}).format(maintenant));
		const { phrase, point } = phraseAccueil(hass, m);
		const dedans = moyenneInterieure(hass, m);
		const dehors = temperatureDehors(hass, m);
		const meteo = m.meteo ? hass.states[m.meteo] : void 0;
		const puissance = m.puissanceReseau ? Number.parseFloat(hass.states[m.puissanceReseau]?.state ?? "") : NaN;
		const points = pointsVisibles(hass, m).visibles.slice(0, 4);
		return b`<div class="ecran">
      <div>
        <div class="heure">${heure}</div>
        <div class="date">${date}</div>
        <div class="phrase" style=${`--point:${point}`}>${phrase}</div>
        <div class="chiffres">
          ${dehors !== null ? b`<div class="chiffre-tab"><b>${degres(hass, dehors)}</b>
            <span><ha-icon icon=${conditionMeteo(hass, meteo).icone}></ha-icon>${tx.dehors}</span></div>` : A}
          ${dedans !== null ? b`<div class="chiffre-tab"><b>${degres(hass, dedans)}</b><span><ha-icon icon="mdi:home-thermometer-outline"></ha-icon>${majuscule(tx.dedans)}</span></div>` : A}
          ${!Number.isNaN(puissance) ? b`<div class="chiffre-tab"><b>${nombre(hass, puissance, 0)} W</b>
            <span><ha-icon icon="mdi:lightning-bolt-outline"></ha-icon>${tx.energie}</span></div>` : A}
        </div>
      </div>
      <div class="droite">
        ${ciel(hass, maintenant)}
        ${points.length ? b`<ul>${points.map((p) => b`<li class="n${p.niveau}"><button @click=${() => p.entite && plusDInfos(this, p.entite)}>
              <span class="ico"><ha-icon icon=${p.icone}></ha-icon></span><span class="titre">${p.titre}<small>${p.detail}</small></span></button></li>`)}</ul>` : b`<div class="calme"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${tx.toutVaBien}</div>`}
      </div>
    </div>`;
	}
};
/** Le formulaire de ticket « Le tableau range mal un appareil ». */
var TICKET_CLASSEMENT = "https://github.com/Automatic-Dashboard/automatic-dashboard/issues/new?template=1-classement.yml";
/** Les mots que les règles lisent dans un nom : on les garde, et rien d'autre. */
var MOTS_CLES = [
	NOM_TECHNIQUE,
	PIECES_EXTERIEURES,
	PIECES_ANNEXES,
	...ICONES_PIECES.map(([motif]) => motif),
	/linky|compteur|tic\b|meter|grid|r(é|e)seau|maison|home|total|index/i,
	/humid|co2|co₂/i
].map((m) => new RegExp(m.source, "gi"));
/** Suffixes d'identifiant que le moteur reconnaît (Météo-France). */
var SUFFIXES = ["_next_rain", "_weather_alert"];
/** Identifiants qui ne disent rien de la maison. */
var IDS_PUBLICS = /* @__PURE__ */ new Set(["sun.sun", "zone.home"]);
/** Attributs gardés tels quels : ils décident du tri, pas d'une valeur. */
var ATTRIBUTS = [
	"device_class",
	"unit_of_measurement",
	"state_class",
	"supported_features",
	"icon",
	"hvac_modes",
	"restored"
];
var COULEURS_VIGILANCE = /* @__PURE__ */ new Set([
	"Vert",
	"Jaune",
	"Orange",
	"Rouge"
]);
/** Ne garde d'un nom que les mots-clés des règles ; `vide` s'il n'en contient aucun. */
function anonymiserNom(nom, vide) {
	if (!nom) return vide;
	const trouves = [];
	for (const motif of MOTS_CLES) for (const m of nom.matchAll(motif)) trouves.push([m.index ?? 0, m[0].toLowerCase()]);
	const mots = [...new Set(trouves.sort((a, b) => a[0] - b[0]).map(([, mot]) => mot))];
	return mots.length ? mots.join(" ") : vide;
}
/** Un état sans valeur : les énumérations (on, heat, open…) restent, les nombres deviennent 0, le reste « unknown ». */
function anonymiserEtat(domaine, etat) {
	if (["person", "device_tracker"].includes(domaine)) return "unknown";
	if (/^-?\d+([.,]\d+)?$/.test(etat)) return "0";
	if (/^[a-z_]{1,30}$/.test(etat) || COULEURS_VIGILANCE.has(etat)) return etat;
	return "unknown";
}
/** Le verdict du tri pour une entité, avec les identifiants de la maison décrite. */
function verdict(e, aRanger, piece) {
	return {
		ecart: e ? e.ecart : "absente",
		role: e?.role ?? null,
		section: e?.section ?? null,
		piece: piece(e?.piece ?? null),
		aRanger: Boolean(e && aRanger.has(e.id))
	};
}
/**
* Décrit la maison sans noms ni valeurs.
* `cibles` : les entités que l'utilisateur signale (mal rangées, absentes, en trop).
*/
function diagnostiquer(hass, reglages = {}, cibles = []) {
	const numero = /* @__PURE__ */ new Map();
	const compteur = (prefixe) => {
		const n = (numero.get(prefixe) ?? 0) + 1;
		numero.set(prefixe, n);
		return n;
	};
	const table = (prefixe) => {
		const t = /* @__PURE__ */ new Map();
		return (id) => {
			if (!id) return null;
			if (!t.has(id)) t.set(id, `${prefixe}${compteur(prefixe)}`);
			return t.get(id);
		};
	};
	const pieceId = table("p");
	const etageId = table("e");
	const appareilId = table("a");
	const etiquetteBrute = table("l");
	const etiquette = (id) => id.startsWith("automatic_dashboard_") ? id : etiquetteBrute(id);
	const entites = /* @__PURE__ */ new Map();
	const entiteId = (id) => {
		if (!id) return null;
		if (IDS_PUBLICS.has(id)) return id;
		if (!entites.has(id)) {
			const [domaine] = id.split(".");
			const suffixe = SUFFIXES.find((s) => id.endsWith(s)) ?? "";
			entites.set(id, `${domaine}.n${compteur(`n.${domaine}`)}${suffixe}`);
		}
		return entites.get(id);
	};
	const floors = {};
	for (const f of Object.values(hass.floors ?? {})) {
		const id = etageId(f.floor_id);
		floors[id] = {
			floor_id: id,
			name: `Étage ${id.slice(1)}`,
			level: f.level ?? null,
			icon: f.icon ?? null
		};
	}
	const areas = {};
	for (const a of Object.values(hass.areas ?? {})) {
		const id = pieceId(a.area_id);
		areas[id] = {
			area_id: id,
			name: anonymiserNom(a.name, `Pièce ${id.slice(1)}`),
			icon: a.icon ?? null,
			floor_id: etageId(a.floor_id),
			temperature_entity_id: entiteId(a.temperature_entity_id),
			humidity_entity_id: entiteId(a.humidity_entity_id),
			labels: (a.labels ?? []).map(etiquette),
			aliases: []
		};
	}
	const devices = {};
	for (const d of Object.values(hass.devices ?? {})) {
		const id = appareilId(d.id);
		devices[id] = {
			id,
			name: anonymiserNom(d.name, "appareil"),
			name_by_user: d.name_by_user ? anonymiserNom(d.name_by_user, "appareil") : null,
			area_id: pieceId(d.area_id),
			parent_device_id: appareilId(d.parent_device_id),
			entry_type: d.entry_type ?? null,
			manufacturer: d.manufacturer ?? null,
			model: d.model ?? null,
			labels: (d.labels ?? []).map(etiquette)
		};
	}
	const entities = {};
	for (const en of Object.values(hass.entities ?? {})) {
		const id = entiteId(en.entity_id);
		entities[id] = {
			entity_id: id,
			platform: en.platform,
			name: en.name ? anonymiserNom(en.name, "nom") : en.name ?? null,
			device_id: appareilId(en.device_id),
			area_id: pieceId(en.area_id),
			hidden: en.hidden ?? false,
			entity_category: en.entity_category ?? null,
			translation_key: en.translation_key ?? null,
			labels: (en.labels ?? []).map(etiquette),
			icon: en.icon ?? null
		};
	}
	const states = {};
	for (const s of Object.values(hass.states)) {
		const id = entiteId(s.entity_id);
		const [domaine] = s.entity_id.split(".");
		const attributes = {};
		for (const cle of ATTRIBUTS) if (s.attributes[cle] !== void 0) attributes[cle] = s.attributes[cle];
		if (s.attributes.friendly_name !== void 0) attributes.friendly_name = anonymiserNom(String(s.attributes.friendly_name), "nom");
		if (Array.isArray(s.attributes.entity_id)) attributes.entity_id = s.attributes.entity_id.map((x) => entiteId(x));
		if (s.attributes["1_hour_forecast"] !== void 0) attributes["1_hour_forecast"] = {};
		states[id] = {
			entity_id: id,
			state: anonymiserEtat(domaine, s.state),
			attributes
		};
	}
	const m = analyser(hass, reglages);
	const parId = new Map(m.toutes.map((e) => [e.id, e]));
	const aRanger = new Set(m.aRanger.map((e) => e.id));
	const ids = (liste) => liste?.filter((id) => hass.states[id]).map((id) => entiteId(id));
	return {
		diagnostic: 1,
		version: "2026.12.0",
		home_assistant: hass.config?.version ?? null,
		langue: (hass.locale?.language || hass.language || "").slice(0, 2),
		reglages: {
			...reglages.mode ? { mode: reglages.mode } : {},
			...reglages.completer === false ? { completer: false } : {},
			...reglages.masquer?.length ? { masquer: ids(reglages.masquer) } : {},
			...reglages.favoris?.length ? { favoris: ids(reglages.favoris) } : {}
		},
		resultat: {
			mode: m.mode,
			...m.compteurs,
			pieces: m.pieces.length,
			aRanger: m.aRanger.length
		},
		signalement: cibles.filter((id) => hass.states[id] || hass.entities[id]).map((id) => ({
			entite: entiteId(id),
			domaine: id.split(".")[0],
			plateforme: hass.entities[id]?.platform ?? "",
			verdict: verdict(parId.get(id), aRanger, pieceId)
		})),
		maison: {
			states,
			entities,
			devices,
			areas,
			floors,
			config: {
				version: hass.config?.version ?? null,
				components: [...hass.config?.components ?? []].sort(),
				latitude: 0,
				longitude: 0
			}
		}
	};
}
/** Le texte à joindre au ticket : du JSON lisible, pour que chacun voie ce qu'il envoie. */
var texteDiagnostic = (d) => `${JSON.stringify(d, null, 1)}\n`;
/** Copie un texte, même hors HTTPS (Home Assistant est souvent servi en http sur le réseau local). */
async function copier(texte, racine = document.body) {
	try {
		await navigator.clipboard.writeText(texte);
		return true;
	} catch {
		const zone = document.createElement("textarea");
		zone.value = texte;
		zone.setAttribute("readonly", "");
		zone.style.cssText = "position:fixed;top:0;left:0;opacity:0";
		racine.appendChild(zone);
		zone.select();
		let ok = false;
		try {
			ok = document.execCommand("copy");
		} catch {
			ok = false;
		}
		zone.remove();
		return ok;
	}
}
/** Enregistre le diagnostic dans un fichier, à joindre au ticket. */
function telecharger(texte) {
	const url = URL.createObjectURL(new Blob([texte], { type: "application/json" }));
	const lien = document.createElement("a");
	lien.href = url;
	lien.download = `automatic-dashboard-diagnostic-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10)}.json`;
	document.body.appendChild(lien);
	lien.click();
	lien.remove();
	setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
// src/mise-en-page/rangees.ts
/**
* Largeur de chacune des `n` cartes d'un groupe.
* - base 6 : par paires ; un nombre impair donne une carte de 12, en tête (« promotion »)
*   ou à la fin (« fin ») ;
* - base 4 : par trois ; un reste d'une carte donne 12, de deux cartes 6 et 6.
* L'ordinateur montre deux rangées de téléphone côte à côte : avec un nombre impair de
* rangées, la dernière est élargie pour ne pas laisser de trou.
*/
function rangees(n, base = 6, mode = "promotion") {
	const lignes = [];
	if (base === 6) {
		const impair = n % 2 === 1;
		if (impair && mode === "promotion") lignes.push([12]);
		for (let k = 0; k < Math.floor(n / 2); k++) lignes.push([6, 6]);
		if (impair && mode !== "promotion") lignes.push([12]);
	} else {
		const reste = n % 3;
		if (reste === 1) lignes.push([12]);
		if (reste === 2) lignes.push([6, 6]);
		for (let k = 0; k < Math.floor(n / 3); k++) lignes.push([
			4,
			4,
			4
		]);
	}
	if (lignes.length % 2 === 1) {
		const derniere = lignes[lignes.length - 1];
		lignes[lignes.length - 1] = derniere.length === 1 ? ["full"] : derniere.length === 2 ? [12, 12] : [
			12,
			6,
			6
		];
	}
	return lignes.flat();
}
/** Ajoute à chaque carte sa largeur (et sa hauteur) dans `grid_options`. */
function avecLargeurs(cartes, base, mode, rows) {
	const largeurs = rangees(cartes.length, base, mode);
	return cartes.map((c, i) => ({
		...c,
		grid_options: {
			...c.grid_options ?? {},
			columns: largeurs[i],
			...rows ? { rows } : {}
		}
	}));
}
// src/strategie/configs.ts
var THEME = "Automatic Dashboard";
var section = (cartes, extra = {}) => ({
	type: "grid",
	column_span: 2,
	cards: cartes,
	...extra
});
var titre = (texte, extra = {}) => ({
	type: "heading",
	heading: texte,
	heading_style: "title",
	...extra
});
/** Une vue complète : en-tête posé sur le fond, pastilles, scène et côté (avec ses deux copies). */
function vue({ path, title, icon, ouverture, badges = [], scene, cote = [], subview = false, coteApres = 0 }) {
	const sections = [...scene];
	if (cote.length) {
		sections.splice(coteApres, 0, section(cote, { visibility: [{
			condition: "view_columns",
			min: 2,
			max: 2
		}] }));
		sections.push(section(cote, { visibility: [{
			condition: "view_columns",
			max: 1
		}] }));
	}
	return {
		path,
		title,
		icon,
		type: "sections",
		max_columns: 3,
		theme: THEME,
		subview,
		header: {
			layout: "start",
			badges_position: "bottom",
			badges_wrap: "scroll",
			card: ouverture
		},
		badges,
		sections,
		...cote.length ? { sidebar: {
			visibility: [{
				condition: "view_columns",
				min: 3
			}],
			sections: [{
				type: "grid",
				cards: cote
			}]
		} } : {}
	};
}
/** Une tuile native, avec la fonction qui convient à l'appareil (sauf en mode Complet, plus compact). */
function tuile(e, mode, options = {}) {
	const { sansFonction, titre: _titre, ...reste } = options;
	const carte = {
		type: "tile",
		entity: e.id,
		...reste
	};
	if (sansFonction || mode === "complet") return carte;
	if (e.domaine === "light") carte.features = [{ type: "light-brightness" }];
	else if (e.domaine === "cover") carte.features = [{ type: "cover-open-close" }];
	else if (e.domaine === "climate") carte.features = [{ type: "target-temperature" }];
	else if (e.domaine === "lock") carte.features = [{ type: "lock-commands" }];
	else if (e.domaine === "sensor" && e.classe && [
		"temperature",
		"humidity",
		"power",
		"carbon_dioxide"
	].includes(e.classe)) carte.features = [{ type: "trend-graph" }];
	return carte;
}
var aFonction = (c) => Array.isArray(c.features) && c.features.length > 0;
// src/strategie/accueil.ts
/** Les commandes habituelles prédites par Home Assistant, sinon une lumière par pièce de vie, puis les thermostats. */
async function favorisAutomatiques(hass, m) {
	let favoris = [];
	try {
		favoris = (await hass.callWS({ type: "usage_prediction/common_control" }))?.entities ?? [];
	} catch {}
	if (!favoris.length) favoris = [...m.pieces.filter((p) => !p.exterieur && !p.annexe).map((p) => p.entites.find((e) => e.domaine === "light" && e.principale) ?? p.entites.find((e) => e.domaine === "light")).filter((e) => e !== void 0).map((e) => e.id), ...m.climats.filter((e) => e.piece).map((e) => e.id)];
	const gardees = new Set(m.gardees.map((e) => e.id));
	return favoris.filter((id) => hass.states[id] && gardees.has(id));
}
/**
* Favoris : les épinglés d'abord, dans l'ordre de l'utilisateur, puis (sauf si on
* l'a refusé) les commandes habituelles, pour remplir les rangées : 4 ou 8 tuiles.
* Au-delà de 8 épinglés, on les montre tous, sans rien ajouter.
*/
async function choisirFavoris(hass, m, reglages = {}) {
	const epingles = [.../* @__PURE__ */ new Set([...reglages.favoris ?? [], ...m.favorisEtiquette])].filter((id) => hass.states[id]);
	if (m.mode === "decouverte") return [];
	if (reglages.completer === false) return epingles;
	const autres = (await favorisAutomatiques(hass, m)).filter((id) => !epingles.includes(id));
	return [...epingles, ...autres].slice(0, nombreDeFavoris(epingles.length, autres.length));
}
/** Combien de tuiles de favoris : 4 ou 8 pour des rangées pleines, ou tous les épinglés au-delà de 8. */
var nombreDeFavoris = (epingles, autres) => epingles > 8 ? epingles : Math.max(epingles, epingles + autres >= 8 ? 8 : 4);
/**
* La carte météo native affiche le nom de l'entité, parfois long et en anglais
* (« Météo-France forecast for city… ») : on lui donne celui de la maison.
*/
var nomMeteo = (hass) => hass.config.location_name ? { name: hass.config.location_name } : {};
/** Pluie dans l'heure et vigilance, s'il y a Météo-France (la carte se masque sans donnée). */
var meteoFrance = (m, avecReglages, colonnes) => m.meteoFrance || m.vigilance ? [avecReglages({
	type: "custom:automatic-dashboard-meteo-france",
	grid_options: {
		columns: colonnes,
		rows: "auto"
	}
})] : [];
/** « En ce moment » : médias, présence, agenda, machines, courses (la carte se masque si rien ne se passe). */
var enCeMoment = (avecReglages) => avecReglages({
	type: "custom:automatic-dashboard-moment",
	grid_options: {
		columns: 12,
		rows: "auto"
	}
});
/** Le côté de l'accueil : météo, aperçus du climat et de l'énergie, en ce moment, éphéméride. */
function contexteMaison(hass, m, avecReglages) {
	const cote = [];
	if (m.meteo) cote.push({
		type: "weather-forecast",
		entity: m.meteo,
		...nomMeteo(hass),
		forecast_type: "hourly",
		show_current: true,
		show_forecast: true,
		grid_options: {
			columns: 12,
			rows: 4
		}
	});
	cote.push(...meteoFrance(m, avecReglages, 12));
	const apercus = [];
	if (m.temperaturesInterieures.length) apercus.push(avecReglages({
		type: "custom:automatic-dashboard-apercu",
		sorte: "climat"
	}));
	if (m.puissanceReseau) apercus.push(avecReglages({
		type: "custom:automatic-dashboard-apercu",
		sorte: "energie"
	}));
	cote.push(...apercus.map((c) => ({
		...c,
		grid_options: {
			columns: apercus.length === 1 ? 12 : 6,
			rows: 2
		}
	})));
	cote.push(enCeMoment(avecReglages));
	cote.push(avecReglages({
		type: "custom:automatic-dashboard-apercu",
		sorte: "ephemeride",
		grid_options: {
			columns: 12,
			rows: 2
		}
	}));
	return cote;
}
/** Accueil des modes Maison et Complet. */
function accueilMaison(hass, m, avecReglages, pastilles, favoris) {
	const tx = t$1(hass);
	const piece = (id) => avecReglages({
		type: "custom:automatic-dashboard-piece",
		piece: id
	});
	const scene = [section([avecReglages({ type: "custom:automatic-dashboard-points" })])];
	if (favoris.length) scene.push(section([titre(tx.favoris), ...favoris.map((id) => ({
		type: "tile",
		entity: id
	}))]));
	const pieces = m.pieces.filter((p) => p.utiles > 0);
	if (m.mode === "complet" && m.etages.length > 1) {
		for (const etage of m.etages) {
			const liste = pieces.filter((p) => p.etage === etage.floor_id);
			if (!liste.length) continue;
			scene.push(section([titre(etage.name, { icon: etage.icon || void 0 }), ...avecLargeurs(liste.map((p) => piece(p.area_id)), 4, "promotion", 2)]));
		}
		const autres = pieces.filter((p) => !p.etage);
		if (autres.length) scene.push(section([titre(estFrancais(hass) ? "Autres pièces" : "Other rooms"), ...avecLargeurs(autres.map((p) => piece(p.area_id)), 4, "promotion", 2)]));
	} else if (m.mode === "complet" && pieces.length) scene.push(section([titre(tx.pieces), ...avecLargeurs(pieces.map((p) => piece(p.area_id)), 4, "promotion", 2)]));
	else if (pieces.length) {
		const ordre = [...pieces];
		if (ordre.length % 2 === 1) {
			const plus = ordre.reduce((a, b) => b.utiles > a.utiles ? b : a);
			ordre.splice(ordre.indexOf(plus), 1);
			ordre.unshift(plus);
		}
		scene.push(section([titre(tx.pieces), ...avecLargeurs(ordre.map((p) => piece(p.area_id)), 6, "promotion", 2)]));
	}
	if (m.aRanger.length) scene.push(section([avecReglages({
		type: "custom:automatic-dashboard-apercu",
		sorte: "a-ranger",
		grid_options: {
			columns: "full",
			rows: 2
		}
	})]));
	return vue({
		path: "accueil",
		title: tx.accueil,
		icon: "mdi:home-roof",
		badges: pastilles,
		ouverture: avecReglages({
			type: "custom:automatic-dashboard-ouverture",
			page: "accueil"
		}),
		scene,
		cote: contexteMaison(hass, m, avecReglages),
		coteApres: 1
	});
}
/** Accueil du mode Découverte : la météo en grand, chaque appareil en grand, les premiers pas. */
function accueilDecouverte(hass, m, avecReglages, pastilles) {
	const tx = t$1(hass);
	const scene = [];
	if (m.meteo) scene.push(section([{
		type: "weather-forecast",
		entity: m.meteo,
		...nomMeteo(hass),
		forecast_type: "hourly",
		show_current: true,
		show_forecast: true,
		forecast_slots: 9,
		grid_options: {
			columns: "full",
			rows: 4
		}
	}, ...meteoFrance(m, avecReglages, "full")]));
	scene.push(section([avecReglages({ type: "custom:automatic-dashboard-points" })]));
	const appareils = m.utiles.filter((e) => e.principale || !e.appareil);
	if (appareils.length) {
		const tuiles = appareils.slice(0, 6).map((e) => tuile(e, "maison", { vertical: false }));
		const ranger = m.aRanger.length ? [avecReglages({
			type: "custom:automatic-dashboard-apercu",
			sorte: "a-ranger",
			grid_options: {
				columns: "full",
				rows: 2
			}
		})] : [];
		scene.push(section([
			titre(tx.votreMaison),
			...avecLargeurs(tuiles, 6, "promotion", 2),
			...ranger
		]));
	}
	scene.push(section([avecReglages({
		type: "custom:automatic-dashboard-premiers-pas",
		grid_options: {
			columns: "full",
			rows: "auto"
		}
	})]));
	const cote = [];
	if (m.meteo) cote.push({
		type: "weather-forecast",
		entity: m.meteo,
		...nomMeteo(hass),
		forecast_type: "daily",
		show_current: false,
		show_forecast: true,
		grid_options: {
			columns: 12,
			rows: 4
		}
	});
	cote.push(enCeMoment(avecReglages));
	cote.push(avecReglages({
		type: "custom:automatic-dashboard-apercu",
		sorte: "ephemeride",
		grid_options: {
			columns: 12,
			rows: 2
		}
	}));
	return vue({
		path: "accueil",
		title: tx.accueil,
		icon: "mdi:home-roof",
		badges: pastilles,
		ouverture: avecReglages({
			type: "custom:automatic-dashboard-ouverture",
			page: "accueil"
		}),
		scene,
		cote,
		coteApres: 1
	});
}
// src/editeur/reglages.ts
/** Retire les réglages vides ou égaux au défaut. */
function nettoyer(config) {
	const propre = { ...config };
	if (!propre.mode || propre.mode === "auto") delete propre.mode;
	for (const cle of ["favoris", "masquer"]) {
		const liste = [...new Set(propre[cle] ?? [])].filter(Boolean);
		if (liste.length) propre[cle] = liste;
		else delete propre[cle];
	}
	if (propre.completer !== false) delete propre.completer;
	const noms = Object.fromEntries(Object.entries(propre.noms ?? {}).filter(([, nom]) => typeof nom === "string" && nom.trim()));
	if (Object.keys(noms).length) propre.noms = noms;
	else delete propre.noms;
	return propre;
}
/** Déplace un élément d'une liste (glisser-déposer). */
function deplacer(liste, de, vers) {
	const copie = [...liste];
	const [element] = copie.splice(de, 1);
	if (element === void 0) return liste;
	copie.splice(Math.max(0, Math.min(vers, copie.length)), 0, element);
	return copie;
}
/** Épingle en favori : à la fin des épinglés ; une entité épinglée n'est plus masquée. */
var epingler = (c, id) => nettoyer({
	...c,
	favoris: [...(c.favoris ?? []).filter((x) => x !== id), id],
	masquer: (c.masquer ?? []).filter((x) => x !== id)
});
var desepingler = (c, id) => nettoyer({
	...c,
	favoris: (c.favoris ?? []).filter((x) => x !== id)
});
/** Masque partout : l'entité sort aussi des favoris épinglés. */
var masquer = (c, id) => nettoyer({
	...c,
	masquer: [...c.masquer ?? [], id],
	favoris: (c.favoris ?? []).filter((x) => x !== id)
});
var demasquer = (c, id) => nettoyer({
	...c,
	masquer: (c.masquer ?? []).filter((x) => x !== id)
});
/** Renomme ; un nom vide rend celui de Home Assistant. */
function renommer(c, id, nom) {
	const noms = { ...c.noms ?? {} };
	if (nom.trim()) noms[id] = nom;
	else delete noms[id];
	return nettoyer({
		...c,
		noms
	});
}
// src/editeur/editeur.ts
var MODES = [
	"auto",
	"decouverte",
	"maison",
	"complet"
];
/**
* Les composants natifs dont l'éditeur se sert (choix d'une entité, glisser-déposer,
* champ de texte) ne sont chargés par Home Assistant qu'à la demande : l'éditeur de la
* carte « entités » les charge tous.
*/
async function chargerComposants() {
	if ([
		"ha-entity-picker",
		"ha-sortable",
		"ha-selector",
		"ha-switch"
	].every((b) => customElements.get(b))) return;
	try {
		await (await (await window.loadCardHelpers?.())?.createCardElement({
			type: "entities",
			entities: []
		}))?.constructor?.getConfigElement?.();
	} catch {}
}
var AutomaticEditeur = class extends i$2 {
	static {
		this.properties = {
			hass: { attribute: false },
			_config: { state: true },
			_auto: { state: true },
			_enCours: { state: true },
			_pret: { state: true },
			_signales: { state: true },
			_copie: { state: true }
		};
	}
	constructor() {
		super();
		this._cleAuto = null;
		this.deplacerFavori = (ev) => {
			ev.stopPropagation();
			const epingles = (this._config.favoris ?? []).filter((id) => this.hass.states[id]);
			const { oldIndex, newIndex } = ev.detail;
			this.changer({
				...this._config,
				favoris: deplacer(epingles, oldIndex, Math.min(newIndex, epingles.length - 1))
			});
		};
		this.ouvrirPieces = () => this.ouvrir("/config/areas/dashboard");
		this.copierDiagnostic = async () => {
			const texte = this.texteDiagnostic();
			const ok = await copier(texte, this.renderRoot);
			this._copie = !ok ? "echec" : texte.length > 6e4 ? "long" : "copie";
		};
		this.telechargerDiagnostic = () => {
			telecharger(this.texteDiagnostic());
			this._copie = "";
		};
		this._auto = [];
		this._enCours = [];
		this._pret = false;
		this._signales = [];
		this._copie = "";
	}
	setConfig(config) {
		this._config = config ?? {};
		this._enregistree ??= JSON.stringify(nettoyer(this._config));
	}
	/** Des changements pas encore enregistrés ? */
	get modifie() {
		return JSON.stringify(nettoyer(this._config ?? {})) !== this._enregistree;
	}
	connectedCallback() {
		super.connectedCallback();
		chargerComposants().then(() => this._pret = true);
	}
	/** La maison telle que le mode automatique la voit (sans le mode forcé, avec ce qui est masqué). */
	get maison() {
		const h = this.hass;
		const masques = this._config?.masquer ?? [];
		const cle = [
			h.entities,
			h.devices,
			h.areas,
			h.floors,
			masques.join()
		];
		if (!this._memo || cle.some((v, i) => v !== this._memo.cle[i])) this._memo = {
			cle,
			maison: analyser(h, { masquer: masques })
		};
		return this._memo.maison;
	}
	updated() {
		if (!this.hass || !this._config) return;
		const cle = (this._config.masquer ?? []).join();
		if (cle === this._cleAuto) return;
		this._cleAuto = cle;
		favorisAutomatiques(this.hass, this.maison).then((ids) => this._auto = ids);
	}
	changer(config) {
		this._config = nettoyer(config);
		this.dispatchEvent(new CustomEvent("config-changed", {
			detail: { config: this._config },
			bubbles: true,
			composed: true
		}));
	}
	get tx() {
		return estFrancais(this.hass) ? EDITEUR.fr : EDITEUR.en;
	}
	render() {
		if (!this.hass || !this._config) return A;
		return b`<div class="editeur">${this.mode()}${this.favoris()}${this.masques()}${this.noms()}${this.pieces()}${this.tablette()}${this.signaler()}</div>`;
	}
	mode() {
		const tx = this.tx;
		const m = this.maison;
		const choisi = this._config.mode ?? "auto";
		const { U, D, P } = m.compteurs;
		return b`<section>
      <h3>${tx.mode}</h3>
      <p class="aide">${tx.detecte(tx.nomsModes[m.mode], U, D, P)}</p>
      <div class="modes" role="radiogroup" aria-label=${tx.mode}>
        ${MODES.map((mode) => {
			const [titre, description] = tx.modes[mode];
			return b`<button role="radio" aria-checked=${choisi === mode ? "true" : "false"} class=${choisi === mode ? "choisi" : ""}
            @click=${() => this.changer({
				...this._config,
				mode
			})}>
            <span class="titre"><span class="rond"></span>${titre}${mode === "auto" ? b`<em>${tx.nomsModes[m.mode]}</em>` : A}</span>
            <span class="description">${description}</span></button>`;
		})}
      </div></section>`;
	}
	favoris() {
		const tx = this.tx;
		const c = this._config;
		const hass = this.hass;
		const epingles = (c.favoris ?? []).filter((id) => hass.states[id]);
		const parEtiquette = this.maison.favorisEtiquette.filter((id) => !epingles.includes(id) && hass.states[id]);
		const fixes = epingles.length + parEtiquette.length;
		const completer = c.completer !== false;
		const autres = completer ? this._auto.filter((id) => !epingles.includes(id) && !parEtiquette.includes(id)) : [];
		const proposes = autres.slice(0, Math.max(0, nombreDeFavoris(fixes, autres.length) - fixes));
		const decouverte = (c.mode && c.mode !== "auto" ? c.mode : this.maison.mode) === "decouverte";
		return b`<section>
      <h3>${tx.favoris}</h3>
      <p class="aide">${tx.favorisAide}</p>
      ${decouverte ? b`<p class="note"><ha-icon icon="mdi:information-outline"></ha-icon>${tx.favorisDecouverte}</p>` : A}
      ${fixes || proposes.length ? b`<ha-sortable handle-selector=".poignee" draggable-selector=".epingle" @item-moved=${this.deplacerFavori}>
            <div class="tuiles">
              ${epingles.map((id) => this.tuile(id, "epingle"))}
              ${parEtiquette.map((id) => this.tuile(id, "etiquette"))}
              ${proposes.map((id) => this.tuile(id, "propose"))}
            </div></ha-sortable>` : b`<p class="vide">${tx.aucunFavori}</p>`}
      ${this.choix(tx.ajouterFavori, [...epingles, ...c.masquer ?? []], (id) => this.changer(epingler(c, id)))}
      <label class="interrupteur">
        <ha-switch .checked=${completer} @change=${(ev) => this.changer({
			...c,
			completer: ev.target.checked
		})}></ha-switch>
        <span>${tx.completer}<small>${tx.completerAide}</small></span>
      </label></section>`;
	}
	tuile(id, genre) {
		const epingle = genre === "epingle";
		const tx = this.tx;
		const hass = this.hass;
		const etat = hass.states[id];
		const piece = hass.areas[hass.entities[id]?.area_id || hass.devices[hass.entities[id]?.device_id ?? ""]?.area_id || ""];
		const nom = nomCourt(hass, id, this._config.noms ?? {});
		return b`<div class=${`tuile ${genre}`}>
      <span class="haut">${epingle ? b`<button class="poignee" title=${tx.deplacer(nom)} aria-label=${tx.deplacer(nom)}
          @keydown=${(ev) => this.deplacerAuClavier(ev, id)}><ha-icon icon="mdi:drag-vertical"></ha-icon></button>` : A}
        <span class="icone"><ha-state-icon .hass=${hass} .stateObj=${etat}></ha-state-icon></span></span>
      <span class="nom"><span class="libelle">${nom}</span><small>${genre === "propose" ? tx.propose : genre === "etiquette" ? tx.parEtiquette : piece?.name ?? ""}</small></span>
      ${genre === "etiquette" ? b`<span class="rond-bouton" title=${tx.parEtiquetteAide}><ha-icon icon="mdi:label-outline"></ha-icon></span>` : epingle ? b`<button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nom}`}
            @click=${() => this.changer(desepingler(this._config, id))}><ha-icon icon="mdi:close"></ha-icon></button>` : b`<button class="rond-bouton" title=${tx.epingler} aria-label=${`${tx.epingler} ${nom}`}
            @click=${() => this.changer(epingler(this._config, id))}><ha-icon icon="mdi:pin-outline"></ha-icon></button>`}
    </div>`;
	}
	deplacerAuClavier(ev, id) {
		const pas = {
			ArrowLeft: -1,
			ArrowUp: -1,
			ArrowRight: 1,
			ArrowDown: 1
		}[ev.key];
		if (!pas) return;
		ev.preventDefault();
		const epingles = (this._config.favoris ?? []).filter((x) => this.hass.states[x]);
		const de = epingles.indexOf(id);
		const vers = de + pas;
		if (de < 0 || vers < 0 || vers >= epingles.length) return;
		this.changer({
			...this._config,
			favoris: deplacer(epingles, de, vers)
		});
		this.updateComplete.then(() => this.renderRoot.querySelectorAll(".poignee")[vers]?.focus());
	}
	masques() {
		const tx = this.tx;
		const c = this._config;
		const hass = this.hass;
		const liste = c.masquer ?? [];
		return b`<section>
      <h3>${tx.masques}</h3>
      <p class="aide">${tx.masquesAide}</p>
      ${liste.length ? b`<div class="puces">${liste.map((id) => b`<span class="puce">
            ${hass.states[id] ? b`<ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>` : A}
            ${nomCourt(hass, id)}
            <button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nomCourt(hass, id)}`}
              @click=${() => this.changer(demasquer(c, id))}><ha-icon icon="mdi:close"></ha-icon></button></span>`)}</div>` : b`<p class="vide">${tx.aucunMasque}</p>`}
      ${(() => {
			const n = this.maison.toutes.filter((e) => e.ecart === "masquee_reglage" && !liste.includes(e.id)).length;
			return n ? b`<p class="note"><ha-icon icon="mdi:label-outline"></ha-icon>${tx.masquesEtiquette(n)}</p>` : A;
		})()}
      ${this.choix(tx.masquer, liste, (id) => this.changer(masquer(c, id)))}</section>`;
	}
	noms() {
		const tx = this.tx;
		const c = this._config;
		const hass = this.hass;
		const ids = [.../* @__PURE__ */ new Set([...Object.keys(c.noms ?? {}), ...this._enCours])];
		return b`<section>
      <h3>${tx.noms}</h3>
      <p class="aide">${tx.nomsAide}</p>
      ${ids.map((id) => b`<div class="renomme">
        <span class="icone">${hass.states[id] ? b`<ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>` : A}</span>
        <ha-selector .hass=${hass} .selector=${{ text: {} }} .value=${c.noms?.[id] ?? ""} .required=${false}
          .label=${tx.nomTableau} .helper=${tx.nomDansHA(nomCourt(hass, id))}
          @value-changed=${(ev) => this.changer(renommer(this._config, id, ev.detail.value ?? ""))}></ha-selector>
        <button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nomCourt(hass, id)}`}
          @click=${() => {
			this._enCours = this._enCours.filter((x) => x !== id);
			this.changer(renommer(this._config, id, ""));
		}}>
          <ha-icon icon="mdi:close"></ha-icon></button></div>`)}
      ${this.choix(tx.renommer, ids, (id) => this._enCours = [...this._enCours, id])}</section>`;
	}
	pieces() {
		const tx = this.tx;
		const modifie = this.modifie;
		return b`<section class="pieces">
      <div><h3>${tx.pieces}</h3><p class="aide">${modifie ? tx.enregistrerDabord : tx.piecesAide}</p></div>
      <button class="lien" ?disabled=${modifie} @click=${this.ouvrirPieces}>${tx.changerOrdre}<ha-icon icon="mdi:arrow-right"></ha-icon></button>
    </section>`;
	}
	tablette() {
		const tx = this.tx;
		const modifie = this.modifie;
		const page = `${location.pathname.split("/")[1]}/tablette`;
		return b`<section class="pieces">
      <div><h3>${tx.tablette}</h3><p class="aide">${modifie ? tx.enregistrerDabord : tx.tabletteAide(`/${page}`)}</p></div>
      <button class="lien" ?disabled=${modifie} @click=${() => this.ouvrir(`/${page}`)}>${tx.ouvrirTablette}<ha-icon icon="mdi:arrow-right"></ha-icon></button>
    </section>`;
	}
	ouvrir(chemin) {
		let noeud = this;
		for (let hote = noeud.getRootNode().host; hote; hote = noeud.getRootNode().host) {
			const dialogue = hote;
			if (typeof dialogue.closeDialog === "function") {
				dialogue.closeDialog();
				break;
			}
			noeud = hote;
		}
		naviguer(chemin);
	}
	signaler() {
		const tx = this.tx;
		const hass = this.hass;
		const ids = this._signales.filter((id) => hass.states[id]);
		const message = {
			copie: tx.copie,
			echec: tx.copieEchec,
			long: tx.tropLong,
			"": ""
		}[this._copie];
		return b`<section class="signaler">
      <h3>${tx.signaler}</h3>
      <p class="aide">${tx.signalerAide}</p>
      ${ids.length ? b`<div class="puces">${ids.map((id) => b`<span class="puce">
            <ha-state-icon .hass=${hass} .stateObj=${hass.states[id]}></ha-state-icon>${nomCourt(hass, id)}
            <button class="rond-bouton" title=${tx.retirer} aria-label=${`${tx.retirer} ${nomCourt(hass, id)}`}
              @click=${() => {
			this._signales = this._signales.filter((x) => x !== id);
			this._copie = "";
		}}>
              <ha-icon icon="mdi:close"></ha-icon></button></span>`)}</div>` : A}
      ${this.choix(tx.signalerChoisir, ids, (id) => {
			this._signales = [...this._signales, id];
			this._copie = "";
		})}
      <div class="actions">
        <button class="lien" @click=${this.telechargerDiagnostic}><ha-icon icon="mdi:download"></ha-icon>${tx.telecharger}</button>
        <button class="lien" @click=${this.copierDiagnostic}><ha-icon icon="mdi:content-copy"></ha-icon>${tx.copier}</button>
        <a class="lien" href=${TICKET_CLASSEMENT} target="_blank" rel="noreferrer">${tx.ouvrirTicket}<ha-icon icon="mdi:open-in-new"></ha-icon></a>
      </div>
      ${message ? b`<p class="retour" role="status">${message}</p>` : A}
    </section>`;
	}
	texteDiagnostic() {
		const c = this._config ?? {};
		return texteDiagnostic(diagnostiquer(this.hass, {
			mode: c.mode,
			masquer: c.masquer,
			favoris: c.favoris,
			completer: c.completer
		}, this._signales));
	}
	/** Le bouton « Ajouter » natif : choisir une entité dans la liste, avec recherche. */
	choix(libelle, exclues, ajouter) {
		if (!this._pret || !customElements.get("ha-entity-picker")) return A;
		return b`<ha-entity-picker class="ajout" .hass=${this.hass} .addButton=${true} .addButtonLabel=${libelle} .excludeEntities=${exclues}
      @value-changed=${(ev) => {
			ev.stopPropagation();
			if (ev.detail.value) ajouter(ev.detail.value);
		}}></ha-entity-picker>`;
	}
	static {
		this.styles = i$5`
    :host{display:block;container-type:inline-size}
    .editeur{display:flex;flex-direction:column;gap:30px;padding:4px 0 20px}
    section{display:flex;flex-direction:column;gap:10px}
    section + section{padding-top:26px;border-top:1px solid var(--divider-color)}
    h3{margin:0;font-size:16px;font-weight:600;color:var(--primary-text-color)}
    .aide{margin:-4px 0 0;font-size:13.5px;line-height:1.45;color:var(--secondary-text-color)}
    .vide{margin:0;font-size:13.5px;color:var(--secondary-text-color);font-style:italic}
    .note{display:flex;gap:8px;margin:0;padding:10px 12px;border-radius:10px;font-size:13px;line-height:1.4;
      background:color-mix(in srgb, var(--primary-color) 9%, transparent);color:var(--primary-text-color)}
    .note ha-icon{--mdc-icon-size:18px;color:var(--primary-color);flex:none}
    button{font:inherit;color:inherit;background:none;border:0;padding:0;cursor:pointer}
    button:focus-visible{outline:2px solid var(--primary-color);outline-offset:2px}

    .modes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin-top:4px}
    .modes button{display:flex;flex-direction:column;gap:5px;text-align:left;padding:12px 12px 13px;border-radius:12px;
      border:1px solid var(--divider-color);transition:border-color .15s, background-color .15s}
    .modes button:hover{border-color:color-mix(in srgb, var(--primary-color) 50%, var(--divider-color))}
    .modes button.choisi{border-color:var(--primary-color);box-shadow:inset 0 0 0 1px var(--primary-color);
      background:color-mix(in srgb, var(--primary-color) 7%, transparent)}
    .modes .titre{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:14.5px;font-weight:600;color:var(--primary-text-color)}
    .modes em{font-style:normal;font-size:12px;font-weight:600;padding:1px 7px;border-radius:9px;
      background:color-mix(in srgb, var(--primary-color) 14%, transparent);color:var(--primary-color)}
    .modes .rond{width:14px;height:14px;border-radius:50%;box-sizing:border-box;border:2px solid var(--secondary-text-color);flex:none}
    .modes .choisi .rond{border:4px solid var(--primary-color)}
    .modes .description{font-size:12.5px;line-height:1.35;color:var(--secondary-text-color)}

    .tuiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
    .tuile{display:flex;align-items:center;gap:8px;min-height:58px;padding:0 4px 0 6px;border-radius:12px;box-sizing:border-box;
      background:var(--card-background-color, #fff);border:1px solid var(--divider-color);min-width:0}
    .tuile.propose{border-style:dashed;background:transparent;padding-left:10px}
    .tuile.etiquette{padding-left:10px}
    .tuile.sortable-ghost{opacity:.4}
    .poignee{display:grid;place-items:center;width:20px;height:40px;border-radius:6px;cursor:grab;color:var(--secondary-text-color);flex:none}
    .poignee ha-icon{--mdc-icon-size:18px}
    .icone{display:grid;place-items:center;width:34px;height:34px;border-radius:50%;flex:none;
      background:color-mix(in srgb, var(--primary-color) 12%, transparent);color:var(--primary-color)}
    .propose .icone{background:var(--secondary-background-color);color:var(--secondary-text-color)}
    .nom{flex:1;min-width:0;font-size:13.5px;font-weight:600;line-height:1.25;color:var(--primary-text-color)}
    .libelle{display:block;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .propose .nom{color:var(--secondary-text-color)}
    .nom small{display:block;font-size:11.5px;font-weight:500;color:var(--secondary-text-color);overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
    .rond-bouton{display:grid;place-items:center;width:32px;height:32px;border-radius:50%;flex:none;color:var(--secondary-text-color)}
    .rond-bouton:hover{background:var(--secondary-background-color);color:var(--primary-text-color)}
    .rond-bouton ha-icon{--mdc-icon-size:18px}

    .interrupteur{display:flex;align-items:flex-start;gap:12px;margin-top:6px;font-size:14px;color:var(--primary-text-color);cursor:pointer}
    .interrupteur ha-switch{flex:none;margin-top:1px}
    .interrupteur small{display:block;margin-top:2px;font-size:12.5px;color:var(--secondary-text-color)}

    .puces{display:flex;flex-wrap:wrap;gap:8px}
    .puce{display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 2px 0 10px;border-radius:18px;font-size:13.5px;
      background:var(--secondary-background-color);color:var(--primary-text-color)}
    .puce ha-state-icon{--mdc-icon-size:18px;color:var(--secondary-text-color)}
    .puce .rond-bouton{width:30px;height:30px}

    .renomme{display:grid;grid-template-columns:auto minmax(0,1fr) auto;align-items:center;gap:12px}

    .pieces{flex-direction:row;align-items:center;justify-content:space-between;gap:16px}
    .lien{display:inline-flex;align-items:center;gap:6px;flex:none;padding:8px 14px;border-radius:18px;font-size:14px;font-weight:600;
      color:var(--primary-color);border:1px solid color-mix(in srgb, var(--primary-color) 40%, transparent)}
    .lien:hover{background:color-mix(in srgb, var(--primary-color) 8%, transparent)}
    .lien:disabled{opacity:.45;cursor:default;background:none}
    .lien ha-icon{--mdc-icon-size:18px}
    .ajout{display:block;align-self:flex-start}
    .actions{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
    a.lien{text-decoration:none}
    .retour{margin:0;font-size:13px;color:var(--secondary-text-color)}

    .haut{display:flex;align-items:center;gap:4px;flex:none}

    @container (max-width: 620px){
      .modes{grid-template-columns:repeat(2,minmax(0,1fr))}
      .tuiles{grid-template-columns:repeat(2,minmax(0,1fr))}
      .pieces{flex-direction:column;align-items:flex-start}
    }
    /* Téléphone : des tuiles verticales, comme celles du tableau, pour lire le nom en entier. */
    @container (max-width: 460px){
      .tuile{display:grid;grid-template-columns:1fr auto;grid-template-areas:"haut bouton" "nom nom";align-items:start;align-content:start;
        gap:6px 4px;padding:8px 4px 10px 8px;min-height:0}
      .tuile.propose{padding-left:10px}
      .haut{grid-area:haut}
      .tuile > .rond-bouton{grid-area:bouton}
      .nom{grid-area:nom;padding-left:2px}
      .libelle{white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}
      .nom small{white-space:nowrap}
    }
    @media (prefers-reduced-motion: reduce){.modes button{transition:none}}
  `;
	}
};
// src/polices.ts
var BASE = "/automatic_dashboard_static";
function chargerPolices() {
	if (document.getElementById("automatic-dashboard-polices")) return;
	const style = document.createElement("style");
	style.id = "automatic-dashboard-polices";
	style.textContent = `
    @font-face{font-family:"Inter";font-style:normal;font-weight:100 900;font-display:swap;
      src:url("${BASE}/inter-latin.woff2") format("woff2");
      unicode-range:U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD}
    @font-face{font-family:"Inter repli";src:local("Arial"),local("Helvetica Neue"),local("Roboto");
      size-adjust:107%;ascent-override:90%;descent-override:22.5%;line-gap-override:0%}`;
	document.head.appendChild(style);
}
// src/strategie/sous-vues.ts
/** Les intégrations qui décrivent la machine de Home Assistant elle-même. */
var MACHINE = /* @__PURE__ */ new Set(["systemmonitor", "hassio"]);
function sousVues(hass, m, avecReglages) {
	const tx = t$1(hass);
	const fr = estFrancais(hass);
	const vues = [];
	const ouverture = (page, extra = {}) => avecReglages({
		type: "custom:automatic-dashboard-ouverture",
		page,
		...extra
	});
	const heros = (page) => avecReglages({
		type: "custom:automatic-dashboard-heros",
		page
	});
	const apercu = (sorte, grid_options) => avecReglages({
		type: "custom:automatic-dashboard-apercu",
		sorte,
		grid_options
	});
	const etat = (id) => hass.states[id]?.state;
	const groupe = (nom, entites, mode, titreExtra = {}) => {
		if (!entites.length) return null;
		const tuiles = entites.map((e) => tuile(e, mode));
		return section([titre(nom, titreExtra), ...avecLargeurs(tuiles, 6, "fin", tuiles.some(aFonction) ? 2 : 1)]);
	};
	const bouton = (texte, icone, action) => ({ badges: [{
		type: "button",
		text: texte,
		icon: icone,
		tap_action: action
	}] });
	for (const p of m.pieces.filter((x) => x.entites.length)) {
		const de = (f) => p.entites.filter(f);
		const lum = de((e) => e.domaine === "light");
		const vol = de((e) => e.domaine === "cover");
		const clim = de((e) => [
			"climate",
			"water_heater",
			"humidifier"
		].includes(e.domaine));
		const app = de((e) => e.role === "commande" && ![
			"light",
			"cover",
			"climate",
			"water_heater",
			"humidifier"
		].includes(e.domaine) && !e.secondaire);
		const capteurs = de((e) => e.role !== null && [
			"mesure",
			"ouvrant",
			"alerte",
			"energie"
		].includes(e.role) && !e.secondaire && !p.temperatures.slice(0, 1).includes(e.id) && !p.humidites.slice(0, 1).includes(e.id));
		const autres = m.mode === "complet" ? de((e) => e.secondaire && e.role !== "info") : [];
		const scene = [
			groupe(tx.lumieres, lum, lum.length > 8 ? "complet" : m.mode, bouton(tx.toutEteindre, "mdi:lightbulb-off-outline", {
				action: "perform-action",
				perform_action: "light.turn_off",
				target: { area_id: p.area_id }
			})),
			groupe(tx.volets, vol, m.mode, bouton(tx.toutFermer, "mdi:window-shutter", {
				action: "perform-action",
				perform_action: "cover.close_cover",
				target: { area_id: p.area_id }
			})),
			groupe(tx.appareils, app, m.mode),
			groupe(tx.capteurs, capteurs, m.mode),
			groupe(fr ? "Autres" : "Other", autres, "complet")
		].filter((s) => s !== null);
		const cote = clim.map((c) => ({
			type: c.domaine === "climate" ? "thermostat" : "tile",
			entity: c.id,
			grid_options: {
				columns: 12,
				rows: c.domaine === "climate" ? 4 : 1
			}
		}));
		const mesures = [p.temperatures[0], p.humidites[0]].filter(Boolean);
		if (mesures.length) cote.push({
			type: "history-graph",
			entities: mesures,
			hours_to_show: 24,
			grid_options: {
				columns: 12,
				rows: 4
			}
		});
		if (!scene.length && !cote.length) continue;
		vues.push(vue({
			path: p.area_id,
			title: p.name,
			icon: p.icon,
			subview: true,
			ouverture: ouverture("piece", { piece: p.area_id }),
			scene: scene.length ? scene : [section([titre(p.name)])],
			cote,
			coteApres: 1
		}));
	}
	const piecesTemp = m.pieces.filter((p) => !p.exterieur && !p.annexe && p.temperatures.length);
	if (piecesTemp.length || m.climats.length) {
		const scene = [section([heros("climat"), ...piecesTemp.length >= 2 ? [titre(fr ? "Pièce par pièce" : "Room by room"), avecReglages({ type: "custom:automatic-dashboard-confort" })] : []])];
		if (piecesTemp.length >= 2) scene.push(section([titre(fr ? "La maison en plan" : "Floor plan"), avecReglages({ type: "custom:automatic-dashboard-plan" })]));
		const thermostats = m.climats.filter((e) => e.domaine === "climate");
		if (thermostats.length) {
			if (m.mode === "complet") scene.push(section([titre(tx.thermostats), ...avecLargeurs(thermostats.map((e) => tuile(e, "maison")), 6, "fin", 2)]));
			else {
				const cartes = thermostats.map((e) => ({
					type: "thermostat",
					entity: e.id
				}));
				if (cartes.length % 2 === 1 && piecesTemp.length) cartes.push({
					type: "history-graph",
					entities: piecesTemp.map((p) => p.temperatures[0]).slice(0, 8),
					hours_to_show: 24
				});
				scene.push(section([titre(tx.thermostats), ...cartes.map((c) => ({
					...c,
					grid_options: {
						columns: 12,
						rows: 4
					}
				}))]));
			}
		}
		const cote = [];
		if (m.meteo) cote.push({
			type: "weather-forecast",
			entity: m.meteo,
			forecast_type: "daily",
			show_current: true,
			show_forecast: true,
			grid_options: {
				columns: 12,
				rows: 4
			}
		});
		if (m.pieces.some((p) => !p.exterieur && p.humidites.length)) cote.push(apercu("humidite", {
			columns: 12,
			rows: 2
		}));
		const pastilles = piecesTemp.slice(0, 12).map((p) => avecReglages({
			type: "custom:automatic-dashboard-pastille",
			sujet: "piece",
			piece: p.area_id
		}));
		vues.push(vue({
			path: "climat",
			title: tx.climat,
			icon: "mdi:thermometer",
			subview: true,
			ouverture: ouverture("climat"),
			badges: pastilles,
			scene,
			cote,
			coteApres: 1
		}));
	}
	if (m.energie.length) {
		const appareils = m.energie.filter((e) => e.classe === "power" && e.id !== m.puissanceReseau && e.piece).slice(0, m.mode === "complet" ? 12 : 8);
		const compteurs = m.energie.filter((e) => e.classe === "energy");
		const scene = [section([heros("energie")])];
		if (appareils.length) scene.push(section([titre(tx.appareils), ...avecLargeurs(appareils.map((e) => tuile(e, "maison")), 6, "fin", 2)]));
		if (compteurs.length && m.mode !== "decouverte") scene.push(section([titre(fr ? "Compteurs" : "Meters"), ...avecLargeurs(compteurs.map((e) => tuile(e, "complet")), 6, "fin", 1)]));
		const cote = [];
		if (appareils.length >= 2) cote.push({
			type: "distribution",
			title: fr ? "Répartition" : "Breakdown",
			entities: appareils.map((e) => e.id),
			grid_options: {
				columns: 12,
				rows: "auto"
			}
		});
		const maison = energiesMaison(hass, m);
		if (maison.length) {
			cote.push({
				type: "statistics-graph",
				title: fr ? "7 derniers jours" : "Last 7 days",
				entities: maison,
				period: "day",
				days_to_show: 7,
				chart_type: "bar",
				stat_types: ["change"],
				grid_options: {
					columns: 12,
					rows: 4
				}
			});
			cote.push(titre(tx.bilan, bouton(fr ? "Voir" : "See", "mdi:calendar-week", {
				action: "navigate",
				navigation_path: "bilan"
			})));
		}
		vues.push(vue({
			path: "energie",
			title: tx.energie,
			icon: "mdi:lightning-bolt-outline",
			subview: true,
			ouverture: ouverture("energie"),
			scene,
			cote,
			coteApres: 1
		}));
	}
	if (m.securite.length) {
		const ouvertsDabord = [...m.ouvrants].sort((a, b) => Number(etat(b.id) === "on") - Number(etat(a.id) === "on"));
		const serrures = m.gardees.filter((e) => e.domaine === "lock");
		const scene = [
			section([heros("securite")]),
			groupe(tx.ouvertures, ouvertsDabord, "complet"),
			groupe(fr ? "Serrures" : "Locks", serrures, "maison"),
			groupe(tx.alertes, m.alertes, "complet"),
			m.mode === "complet" ? groupe(fr ? "Présence" : "Presence", m.gardees.filter((e) => e.role === "presence"), "complet") : null
		].filter((s) => s !== null);
		const suivies = [
			...m.ouvrants,
			...m.alertes,
			...m.gardees.filter((e) => e.domaine === "lock" || e.domaine === "alarm_control_panel")
		].map((e) => e.id);
		const cote = suivies.length ? [{
			type: "logbook",
			target: { entity_id: suivies },
			hours_to_show: 24,
			title: fr ? "Activité" : "Activity",
			grid_options: {
				columns: 12,
				rows: 6
			}
		}] : [];
		vues.push(vue({
			path: "securite",
			title: tx.securite,
			icon: "mdi:shield-home-outline",
			subview: true,
			ouverture: ouverture("securite"),
			scene,
			cote,
			coteApres: 1
		}));
	}
	const valeur = (e) => Number.parseFloat(etat(e.id) ?? "");
	const piles = [...m.piles].sort((a, b) => valeur(a) - valeur(b));
	const majsDabord = [...m.majs].sort((a, b) => Number(etat(b.id) === "on") - Number(etat(a.id) === "on"));
	const plafond = m.mode === "complet" ? 16 : 8;
	const affichables = m.systeme.filter((e) => e.plateforme !== "backup" && [
		"sensor",
		"binary_sensor",
		"switch"
	].includes(e.domaine));
	const machine = affichables.filter((e) => MACHINE.has(e.plateforme) && e.domaine !== "switch");
	const services = [...new Set(affichables.map((e) => e.plateforme))].filter((p) => !MACHINE.has(p)).map((p) => groupe(nomIntegration(hass, p), affichables.filter((e) => e.plateforme === p).slice(0, plafond), "maison"));
	const sceneSysteme = [
		section([heros("systeme")]),
		groupe(tx.misesAJour, majsDabord.slice(0, plafond), "complet"),
		groupe(tx.piles, piles.slice(0, plafond), "complet"),
		groupe(tx.machine, machine.slice(0, 12), "maison"),
		...services
	].filter((s) => s !== null);
	vues.push(vue({
		path: "systeme",
		title: tx.systeme,
		icon: "mdi:server-outline",
		subview: true,
		ouverture: ouverture("systeme"),
		scene: sceneSysteme,
		cote: hass.user?.is_admin ? [{
			type: "repairs",
			hide_empty: true,
			grid_options: { columns: 12 }
		}, {
			type: "discovered-devices",
			hide_empty: true,
			grid_options: { columns: 12 }
		}] : [],
		coteApres: 1
	}));
	if (aUnBilan(hass, m)) {
		const energies = energiesMaison(hass, m);
		const temperatures = m.temperaturesInterieures.map((c) => c[0]).slice(0, 6);
		const cote = [...energies.length ? [{
			type: "statistics-graph",
			title: fr ? "8 dernières semaines" : "Last 8 weeks",
			entities: energies,
			period: "week",
			days_to_show: 56,
			chart_type: "bar",
			stat_types: ["change"],
			grid_options: {
				columns: 12,
				rows: 4
			}
		}] : [], ...temperatures.length ? [{
			type: "history-graph",
			title: fr ? "Températures, 7 jours" : "Temperatures, 7 days",
			entities: temperatures,
			hours_to_show: 168,
			grid_options: {
				columns: 12,
				rows: 4
			}
		}] : []];
		vues.push(vue({
			path: "bilan",
			title: tx.bilan,
			icon: "mdi:calendar-week",
			subview: true,
			ouverture: ouverture("bilan"),
			scene: [section([avecReglages({ type: "custom:automatic-dashboard-bilan" })])],
			cote,
			coteApres: 1
		}));
	}
	if (m.aRanger.length) vues.push(vue({
		path: "a-ranger",
		title: tx.aRanger,
		icon: "mdi:tray-arrow-down",
		subview: true,
		ouverture: ouverture("a-ranger"),
		scene: [section([heros("a-ranger"), avecReglages({ type: "custom:automatic-dashboard-a-ranger" })])]
	}));
	vues.push({
		path: "tablette",
		title: fr ? "Tablette murale" : "Wall tablet",
		icon: "mdi:tablet-dashboard",
		type: "panel",
		subview: true,
		theme: THEME,
		cards: [avecReglages({ type: "custom:automatic-dashboard-tablette" })]
	});
	return vues;
}
// src/strategie/strategie.ts
/** Les réglages lus dans la configuration du tableau, en ignorant ce qui n'a pas la bonne forme (YAML tapé à la main). */
function lireReglages(config) {
	const liste = (v) => Array.isArray(v) ? v.filter((x) => typeof x === "string") : void 0;
	const modes = [
		"auto",
		"decouverte",
		"maison",
		"complet"
	];
	const noms = config.noms && typeof config.noms === "object" && !Array.isArray(config.noms) ? Object.fromEntries(Object.entries(config.noms).filter(([, v]) => typeof v === "string" && v.trim())) : void 0;
	return {
		mode: modes.includes(config.mode) ? config.mode : void 0,
		masquer: liste(config.masquer),
		favoris: liste(config.favoris),
		completer: config.completer === false ? false : void 0,
		noms
	};
}
/** Les noms choisis dans les réglages, posés sur les cartes natives (tuiles, thermostats) qui n'en ont pas. */
function nommer(carte, noms) {
	const id = typeof carte.entity === "string" ? carte.entity : "";
	return noms[id] && carte.name === void 0 ? {
		...carte,
		name: noms[id]
	} : carte;
}
async function genererTableau(config, hass) {
	const reglages = lireReglages(config);
	const m = analyserMemo(hass, reglages);
	const avecReglages = (c) => ({
		...c,
		reglages
	});
	const pastilles = [
		m.meteo && "meteo",
		m.temperaturesInterieures.length > 0 && "climat",
		m.lumieres.length > 0 && "lumieres",
		m.securite.length > 0 && "securite",
		m.puissanceReseau && "energie",
		m.mode === "decouverte" && "soleil",
		"systeme",
		m.aRanger.length > 0 && "a-ranger"
	].filter((s) => typeof s === "string").map((sujet) => avecReglages({
		type: "custom:automatic-dashboard-pastille",
		sujet
	}));
	let views = [m.mode === "decouverte" ? accueilDecouverte(hass, m, avecReglages, pastilles) : accueilMaison(hass, m, avecReglages, pastilles, await choisirFavoris(hass, m, reglages)), ...sousVues(hass, m, avecReglages)];
	if (Object.keys(m.noms).length) views = views.map((v) => ({
		...v,
		...v.sections ? { sections: v.sections.map((s) => ({
			...s,
			cards: s.cards.map((c) => nommer(c, m.noms))
		})) } : {},
		...v.sidebar ? { sidebar: {
			...v.sidebar,
			sections: v.sidebar.sections.map((s) => ({
				...s,
				cards: s.cards.map((c) => nommer(c, m.noms))
			}))
		} } : {}
	}));
	return {
		title: config.title || "Automatic Dashboard",
		views
	};
}
// src/index.ts
/** Numéro de version, lu dans package.json à la construction. */
var VERSION = "2026.12.0";
var AutomaticStrategie = class extends HTMLElement {
	static getCreateSuggestions() {
		return {
			title: "Automatic Dashboard",
			icon: "mdi:home-roof"
		};
	}
	static async generate(config, hass) {
		return genererTableau(config, hass);
	}
	/** L'éditeur visuel, ouvert par « Modifier le tableau de bord ». */
	static async getConfigElement() {
		return document.createElement("automatic-dashboard-editeur");
	}
};
var elements = [
	["ll-strategy-dashboard-automatic-dashboard", AutomaticStrategie],
	["automatic-dashboard-ouverture", AutomaticOuverture],
	["automatic-dashboard-pastille", AutomaticPastille],
	["automatic-dashboard-points", AutomaticPoints],
	["automatic-dashboard-piece", AutomaticPiece],
	["automatic-dashboard-apercu", AutomaticApercu],
	["automatic-dashboard-premiers-pas", AutomaticPremiersPas],
	["automatic-dashboard-heros", AutomaticHeros],
	["automatic-dashboard-confort", AutomaticConfort],
	["automatic-dashboard-a-ranger", AutomaticARanger],
	["automatic-dashboard-meteo-france", AutomaticMeteoFrance],
	["automatic-dashboard-moment", AutomaticMoment],
	["automatic-dashboard-bilan", AutomaticBilan],
	["automatic-dashboard-plan", AutomaticPlan],
	["automatic-dashboard-tablette", AutomaticTablette],
	["automatic-dashboard-editeur", AutomaticEditeur]
];
for (const [balise, classe] of elements) if (!customElements.get(balise)) customElements.define(balise, classe);
chargerPolices();
window.customStrategies = window.customStrategies || [];
if (!window.customStrategies.some((s) => s.type === "automatic_dashboard")) window.customStrategies.push({
	type: "automatic_dashboard",
	strategyType: "dashboard",
	name: "Automatic Dashboard",
	description: "Un tableau de bord complet, construit tout seul à partir de vos appareils.",
	documentationURL: "https://automatic-dashboard.github.io/documentation/"
});
window.customCards = window.customCards || [];
if (!window.customCards.some((c) => c.type === "automatic-dashboard-points")) window.customCards.push({
	type: "automatic-dashboard-points",
	name: "Automatic Dashboard : points à regarder",
	description: "Ce qu'il faut regarder dans la maison, ou rien."
}, {
	type: "automatic-dashboard-piece",
	name: "Automatic Dashboard : pièce",
	description: "Une pièce, sa température et ce qui est allumé."
});
window.__automaticDashboard = {
	version: VERSION,
	analyser: analyserMemo
};
console.info(`Automatic Dashboard ${VERSION}`);
