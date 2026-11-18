// Un style posé par l'API CSS (style.setProperty), jamais par l'attribut « style ». Contrairement
// à styleMap, qui écrit l'attribut au premier affichage, il s'applique aussi sous une politique
// de sécurité stricte, comme sur le site, où la démo fait tourner ces cartes.
//
//   <div ${poserStyle({ gridColumn: "span 2", "--c": couleur })}>

import { type ElementPart, noChange } from "lit";
import { Directive, directive, type PartInfo, PartType } from "lit/directive.js";

type Styles = Record<string, string | number | undefined | null>;
const propriete = (p: string) => (p.startsWith("--") ? p : p.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`));

class PoserStyle extends Directive {
  private avant = new Set<string>();

  constructor(info: PartInfo) {
    super(info);
    if (info.type !== PartType.ELEMENT) throw new Error("poserStyle() se pose sur l'élément lui-même");
  }

  render(_styles: Styles) {
    return noChange;
  }

  override update(part: ElementPart, [styles]: [Styles]) {
    const s = (part.element as HTMLElement | SVGElement).style;
    for (const p of this.avant) if (styles[p] == null) s.removeProperty(propriete(p));
    for (const [p, v] of Object.entries(styles)) if (v != null) s.setProperty(propriete(p), String(v));
    this.avant = new Set(Object.keys(styles));
    return noChange;
  }
}

export const poserStyle = directive(PoserStyle);
