// Les Héros : la carte de tête des pages thématiques (pleine largeur × 4 rangées) :
// deux ou trois chiffres de 40 px et un visuel (courbe, liste, progression).

import { css, html, nothing, type PropertyDeclarations, type TemplateResult } from "lit";
import { styleMap } from "lit/directives/style-map.js";
import { historique, type Serie, variationJour } from "../donnees/historique";
import type { HomeAssistant } from "../ha";
import { courbes } from "../mise-en-page/courbes";
import type { Maison } from "../moteur/types";
import { energiesMaison, moyenneInterieure, premiereValeur, temperatureDehors } from "../moteur/valeurs";
import { ilYa, mh, naviguer, nombre, nomCourt, plusDInfos, t, trame } from "../outils";
import { CarteAutomatic, definis, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

export class AutomaticHeros extends CarteAutomatic {
  static override properties: PropertyDeclarations = {
    _donnees: { state: true },
  };

  static override styles = [STYLE_COMMUN, css`
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
    .item{display:flex;align-items:center;gap:10px;padding:9px 12px;border-radius:12px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));font-size:14px;font-weight:550;color:var(--primary-text-color)}
    .item ha-icon{--mdc-icon-size:18px;color:var(--warning-color)}
    .item.ok ha-icon{color:var(--automatic-dashboard-vert, var(--success-color, #1E6B47))}
    .alerte{background:var(--automatic-dashboard-alerte-pale, color-mix(in srgb, var(--error-color, #B42318) 12%, transparent))} .alerte .ico{background:var(--automatic-dashboard-alerte, var(--error-color, #B42318));color:#fff}
    .barre{height:12px;border-radius:999px;background:var(--automatic-dashboard-fond-alt, var(--secondary-background-color));overflow:hidden;margin:12px 0 6px}
    .barre span{display:block;height:100%;border-radius:999px;background:var(--automatic-dashboard-vert, var(--success-color, #1E6B47))}
    .legende{display:flex;justify-content:space-between;gap:16px;font-size:13px;color:var(--secondary-text-color)}
    .colonne{display:flex;flex-direction:column;gap:16px;justify-content:center;height:100%}
  `];

  /** Données asynchrones (historique, statistiques), quand elles sont arrivées. */
  private declare _donnees?: unknown[];
  /** La demande déjà faite (une par jeu d'entités). */
  private _charge?: string;

  getGridOptions(): OptionsGrille {
    return { columns: "full", rows: this._config?.page === "a-ranger" ? 3 : 4 };
  }

  override suivies(m: Maison): string[] {
    const p = this._config?.page;
    if (p === "climat") return definis([...m.temperaturesInterieures.flat(), ...m.temperaturesExterieures, m.meteo, ...m.pieces.flatMap((x) => x.humidites)]);
    if (p === "energie") return definis([m.puissanceReseau, ...m.energie.map((e) => e.id)]);
    if (p === "securite") return m.securite.map((e) => e.id);
    if (p === "systeme") return [...m.majs.map((e) => e.id), ...m.systeme.map((e) => e.id)];
    return [];
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    switch (this._config?.page) {
      case "climat": return this.climat(hass, m);
      case "energie": return this.energie(hass, m);
      case "securite": return this.securite(hass, m);
      case "systeme": return this.systeme(hass, m);
      case "a-ranger": return this.aRanger(hass, m);
      default: return null;
    }
  }

  private chiffre(valeur: string, unite: string, legende: string, trait = ""): TemplateResult {
    return html`<div><div class="v chiffre">${valeur}${unite ? html`<small>${unite}</small>` : nothing}</div>
      <div class="l">${trait ? html`<span class="trait ${trait}"></span>` : nothing}${legende}</div></div>`;
  }

  private enveloppe(hass: HomeAssistant, gauche: TemplateResult, droite: TemplateResult, classe = ""): TemplateResult {
    return html`<ha-card class=${classe}><div class="trame" style=${styleMap({ "background-image": trame(hass) })}></div>
      <div class="contenu">${gauche}${droite}</div></ha-card>`;
  }

  // Données asynchrones (historique, statistiques) : on redessine quand elles arrivent.
  // La demande n'est construite qu'une fois par clé (les caches font le reste).
  private charger(cle: string, demande: () => Promise<unknown[]>): void {
    if (this._charge === cle) return;
    this._charge = cle;
    this._donnees = undefined;
    demande().then((d) => {
      // Une réponse arrivée après une autre demande (pièces changées entre-temps) est ignorée.
      if (this._charge === cle) this._donnees = d;
    });
  }

  /** Les données sont-elles encore en route ? */
  private get enAttente(): boolean {
    return this._donnees === undefined;
  }

  /** La place de la courbe, le temps qu'elle arrive. */
  private courbeEnAttente(): TemplateResult {
    return html`<div class="visuel" aria-busy="true"><span class="attente graphe"></span><div class="axe"><span class="attente" style="width:120px;height:11px"></span></div></div>`;
  }

  /** Un chiffre dont la valeur n'est pas encore arrivée : sa légende, et une forme à la place du nombre. */
  private chiffreEnAttente(legende: string): TemplateResult {
    return html`<div aria-busy="true"><div class="v"><span class="attente" style="width:96px;height:36px"></span></div><div class="l">${legende}</div></div>`;
  }

  private climat(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const w = mh(hass);
    const d = moyenneInterieure(hass, m), e = temperatureDehors(hass, m);
    if (d === null && e === null) return null;
    const hums = m.pieces.filter((x) => !x.exterieur && !x.annexe).map((x) => premiereValeur(hass, x.humidites)).filter((v): v is number => v !== null);
    const h = hums.length ? hums.reduce((a, b) => a + b, 0) / hums.length : null;
    const pieces = m.temperaturesInterieures.length;
    const chiffres: TemplateResult[] = [];
    if (d !== null) {
      chiffres.push(this.chiffre(nombre(hass, d, 1), "°",
        pieces === 1 ? m.pieces.find((x) => x.temperatures.length && !x.exterieur)?.name || w.dedans : w.dedans, "plein"));
    }
    if (e !== null) chiffres.push(this.chiffre(nombre(hass, e, 1), "°", w.dehors, m.temperaturesExterieures.length ? "pointille" : ""));
    if (h !== null) chiffres.push(this.chiffre(nombre(hass, h, 0), "%", w.humidite));
    const ids = m.temperaturesInterieures.map((c) => c[0]).slice(0, 8);
    const dehorsId = m.temperaturesExterieures[0];
    this.charger(`climat|${ids.join()}|${dehorsId}`, () => Promise.all([
      ids.length ? historique(hass, "climat", ids) : Promise.resolve([]),
      dehorsId ? historique(hass, `dehors|${dehorsId}`, [dehorsId]) : Promise.resolve([]),
    ]));
    if (this.enAttente) return this.enveloppe(hass, html`<div class="chiffres">${chiffres}</div>`, this.courbeEnAttente());
    const [dedansV = [], dehorsV = []] = (this._donnees ?? []) as Serie[];
    const graphe = courbes([{ valeurs: dedansV, couleur: "var(--primary-color)" }, { valeurs: dehorsV, couleur: "var(--secondary-text-color)" }]);
    return this.enveloppe(hass, html`<div class="chiffres">${chiffres}</div>`,
      html`<div class="visuel">${graphe}${graphe !== nothing ? html`<div class="axe"><span>${w.legende24}</span><span>${w.maintenant}</span></div>` : nothing}</div>`);
  }

  private energie(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const w = mh(hass);
    const ent = m.puissanceReseau ? hass.states[m.puissanceReseau] : undefined;
    const puissance = Number.parseFloat(ent?.state ?? "");
    const compteurs = energiesMaison(hass, m);
    const solaire = m.energie.find((e) => e.classe === "power" && /solaire|solar|pv|onduleur|inverter|production/i.test(e.etat.attributes.friendly_name || ""));
    const reseau = m.puissanceReseau;
    this.charger(`energie|${compteurs.join()}`, () => Promise.all([
      reseau ? historique(hass, "energie", [reseau]) : Promise.resolve([]),
      compteurs.length ? variationJour(hass, compteurs, 0) : Promise.resolve(null),
      compteurs.length ? variationJour(hass, compteurs, -1) : Promise.resolve(null),
    ]));
    const [courbeP = [], jour = null, veille = null] = (this._donnees ?? []) as [Serie?, (number | null)?, (number | null)?];
    const attente = this.enAttente;
    const chiffres: TemplateResult[] = [];
    if (!Number.isNaN(puissance)) chiffres.push(this.chiffre(nombre(hass, puissance, 0), ent!.attributes.unit_of_measurement || "W", w.maintenant));
    if (attente && compteurs.length) chiffres.push(this.chiffreEnAttente(w.aujourdhui));
    if (jour !== null) chiffres.push(this.chiffre(nombre(hass, jour, jour < 10 ? 2 : 1), "kWh", w.aujourdhui));
    if (veille !== null && veille > 0) chiffres.push(this.chiffre(nombre(hass, veille, veille < 10 ? 2 : 1), "kWh", w.hier));
    if (solaire && m.mode === "complet") {
      const s = Number.parseFloat(hass.states[solaire.id]?.state ?? "");
      if (!Number.isNaN(s)) chiffres.push(this.chiffre(nombre(hass, s, 0), "W", w.production));
    }
    if (!chiffres.length) return null;
    if (attente && reseau) return this.enveloppe(hass, html`<div class="chiffres">${chiffres}</div>`, this.courbeEnAttente());
    const graphe = courbes([{ valeurs: courbeP, couleur: "var(--primary-color)" }]);
    return this.enveloppe(hass, html`<div class="chiffres">${chiffres}</div>`,
      html`<div class="visuel">${graphe}${graphe !== nothing ? html`<div class="axe"><span>${w.puissance}, ${w.legende24}</span><span>${w.maintenant}</span></div>` : nothing}</div>`);
  }

  private securite(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const w = mh(hass);
    const tx = t(hass);
    const etat = (id: string) => hass.states[id];
    const nom = (e: { id: string }) => nomCourt(hass, e.id, m.noms);
    const ouverts = m.ouvrants.filter((e) => etat(e.id)?.state === "on");
    const serrures = m.gardees.filter((e) => e.domaine === "lock");
    const ouvertes = serrures.filter((e) => etat(e.id)?.state === "unlocked");
    const alertes = m.alertes.filter((e) => etat(e.id)?.state === "on");
    const alarme = m.gardees.find((e) => e.domaine === "alarm_control_panel");
    const gauche: TemplateResult[] = [];
    if (alarme) {
      const s = etat(alarme.id)?.state;
      const libelle = (s ? (tx.alarmeEtat as Record<string, string>)[s] : undefined) || `${w.alarme} : ${s}`;
      gauche.push(html`<div class="ligne"><span class="ico ${s && s !== "disarmed" ? "actif" : ""}"><ha-icon icon="mdi:shield-home-outline"></ha-icon></span>
        <span>${libelle}</span><button class="bouton second" @click=${() => plusDInfos(this, alarme.id)}>${w.gerer}</button></div>`);
    }
    const chiffres: TemplateResult[] = [];
    if (m.ouvrants.length) chiffres.push(this.chiffre(String(ouverts.length), "", w.ouvertures(ouverts.length, m.ouvrants.length)));
    if (serrures.length) chiffres.push(this.chiffre(String(ouvertes.length), "", w.serrures(ouvertes.length)));
    if (m.alertes.length) chiffres.push(this.chiffre(String(alertes.length), "", w.detecteurs(alertes.length)));
    if (!chiffres.length && !alarme) return null;
    gauche.push(html`<div class="chiffres">${chiffres}</div>`);
    const items = [
      ...alertes.map((e) => html`<div class="item"><ha-icon icon="mdi:water-alert"></ha-icon>${nom(e)}</div>`),
      ...ouverts.slice(0, 4).map((e) => html`<div class="item"><ha-icon icon="mdi:window-open-variant"></ha-icon>${nom(e)} · ${w.ouvert}</div>`),
      ...ouvertes.map((e) => html`<div class="item"><ha-icon icon="mdi:lock-open-variant-outline"></ha-icon>${nom(e)}</div>`),
    ];
    const droite = items.length ? html`<div class="liste">${items}</div>`
      : html`<div class="liste"><div class="item ok"><ha-icon icon="mdi:check-circle-outline"></ha-icon>${w.toutFerme}</div></div>`;
    return this.enveloppe(hass, html`<div class="colonne">${gauche}</div>`, droite, alertes.length ? "alerte" : "");
  }

  private systeme(hass: HomeAssistant, m: Maison): TemplateResult {
    const w = mh(hass);
    const etat = (id: string) => hass.states[id];
    const parCle = (cle: string) => m.systeme.find((e) => e.plateforme === "backup" && hass.entities[e.id]?.translation_key === cle);
    const reussie = parCle("last_successful_automatic_backup"), tentee = parCle("last_attempted_automatic_backup");
    const prochaine = parCle("next_scheduled_automatic_backup"), taille = parCle("last_successful_automatic_backup_size");
    const majs = m.majs.filter((e) => etat(e.id)?.state === "on").length;
    const date = (e: { id: string } | undefined) => (e ? new Date(etat(e.id)?.state ?? "") : undefined);
    const dReussie = date(reussie), dTentee = date(tentee), dProchaine = date(prochaine);
    const ok = (d: Date | undefined): d is Date => Boolean(d) && !Number.isNaN(d!.getTime());
    const gauche = html`<div class="ligne"><span class="ico ${majs ? "" : "actif"}"><ha-icon icon=${majs ? "mdi:package-up" : "mdi:check-decagram-outline"}></ha-icon></span>
      <span>${majs ? w.majs(majs) : w.aJour}<div class="detail">${w.version} ${hass.config.version ?? ""}</div></span>
      ${majs ? html`<button class="bouton" @click=${() => naviguer("/config/updates")}>${w.voir}</button>` : nothing}</div>`;
    let droite: TemplateResult;
    if (!ok(dReussie) && !ok(dProchaine)) {
      droite = html`<div class="colonne"><div class="ligne"><span class="ico" style="background:var(--automatic-dashboard-alerte-pale, color-mix(in srgb, var(--error-color, #B42318) 12%, transparent));color:var(--automatic-dashboard-alerte, var(--error-color, #B42318))"><ha-icon icon="mdi:backup-restore"></ha-icon></span>
        <span>${w.sansSauvegarde}<div class="detail">${w.sansSauvegardeDetail}</div></span></div>
        <div class="boutons"><button class="bouton" @click=${() => naviguer("/config/backup")}>${w.regler}</button></div></div>`;
    } else {
      const echec = ok(dTentee) && (!ok(dReussie) || dTentee > dReussie);
      const chiffres = [
        this.chiffre(ok(dReussie) ? ilYa(hass, dReussie) : w.jamais, "", `${w.sauvegarde} ${echec ? w.echouee : w.reussie}`),
        this.chiffre(ok(dProchaine) ? ilYa(hass, dProchaine) : w.nonPrevue, "", w.prochaine),
      ];
      const poids = taille ? Number.parseFloat(etat(taille.id)?.state ?? "") : Number.NaN;
      if (poids && !Number.isNaN(poids)) chiffres.push(this.chiffre(nombre(hass, poids >= 1024 ? poids / 1024 : poids, 1), poids >= 1024 ? "Go" : "Mo", w.taille));
      droite = html`<div class="chiffres">${chiffres}</div>`;
    }
    return this.enveloppe(hass, html`<div class="colonne">${gauche}</div>`, droite);
  }

  private aRanger(hass: HomeAssistant, m: Maison): TemplateResult | null {
    const w = mh(hass);
    const appareils = new Set(m.utiles.filter((e) => e.appareil && e.piece).map((e) => hass.devices[e.appareil!]?.parent_device_id || e.appareil!));
    const sansAppareil = m.utiles.filter((e) => !e.appareil && e.piece).length;
    const ranges = appareils.size + sansAppareil;
    const reste = m.aRanger.length;
    if (!reste) return null;
    const part = Math.round((ranges / Math.max(1, ranges + reste)) * 100);
    const gauche = html`<div class="colonne"><div style="width:min(100%, 360px)"><div class="v chiffre">${ranges}<small>/ ${ranges + reste}</small></div>
      <div class="barre"><span style=${styleMap({ width: `${part}%` })}></span></div>
      <div class="legende"><span>${w.ranges(ranges)}</span><span>${w.aRanger(reste)}</span></div></div></div>`;
    const droite = html`<div class="boutons" style="justify-content:flex-end">
      <button class="bouton" @click=${() => naviguer("/config/devices/dashboard")}><ha-icon icon="mdi:sofa-outline"></ha-icon>${w.rangerTout}</button>
      <button class="bouton second" @click=${() => naviguer("/config/areas/dashboard")}><ha-icon icon="mdi:plus"></ha-icon>${w.creerPiece}</button></div>`;
    return this.enveloppe(hass, gauche, droite);
  }
}
