// « En ce moment » : ce qui se passe dans la maison, en quelques lignes : les médias en
// lecture, qui est là, les prochains rendez-vous, les machines en marche, la liste de
// courses. D'après docs/conception/01-mise-en-page.md, partie 6.1. Se masque si rien
// ne se passe ; plafonnée à 5 lignes en mode Complet.

import { css, html, nothing, type TemplateResult } from "lit";
import type { EtatHA, HomeAssistant } from "../ha";
import type { Maison } from "../moteur/types";
import { heure, naviguer, nomCourt, plusDInfos, t, valide } from "../outils";
import { CarteAutomatic, type OptionsGrille } from "./base";
import { STYLE_COMMUN } from "./styles";

interface Ligne {
  icone: string;
  texte: string;
  /** En gras devant le texte : l'heure d'un rendez-vous. */
  avant?: string;
  detail?: string;
  entite?: string;
  chemin?: string;
  /** Lecteur qu'on peut mettre en pause d'ici. */
  pause?: string;
}

const MINUTE = 60000;
const MACHINES: [RegExp, string][] = [
  [/lave-vaisselle|dishwasher/i, "mdi:dishwasher"], [/s(è|e)che-linge|dryer/i, "mdi:tumble-dryer"],
  [/lave-linge|washing|washer/i, "mdi:washing-machine"],
];

export class AutomaticMoment extends CarteAutomatic {
  static override styles = [STYLE_COMMUN, css`
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

  /** La minute du dernier rendu : les heures relatives (« Demain », minuteurs) changent avec elle. */
  private _minute = 0;

  getGridOptions(): OptionsGrille {
    return { columns: 12, rows: "auto" };
  }

  override suivies(m: Maison): string[] {
    return [...m.medias.map((e) => e.id), ...m.personnes, ...m.agendas, ...m.enMarche, ...(m.courses ? [m.courses] : [])];
  }

  protected override autresChangements(): boolean {
    return Math.floor(Date.now() / MINUTE) !== this._minute;
  }

  protected override rendu(hass: HomeAssistant, m: Maison): TemplateResult | null {
    this._minute = Math.floor(Date.now() / MINUTE);
    const lignes = [...this.medias(hass, m), ...this.presence(hass, m), ...this.agenda(hass, m), ...this.machines(hass, m), ...this.courses(hass, m)]
      .slice(0, m.mode === "complet" ? 5 : 6);
    if (!lignes.length) return null;
    return html`<ha-card><span class="sur">${t(hass).enCeMomentTitre}</span><ul>${lignes.map((l) => html`<li>
      <button class="ligne" @click=${() => this.ouvrir(l)}><ha-icon icon=${l.icone}></ha-icon>
        <span class="texte"><span>${l.avant ? html`<b>${l.avant}</b>` : nothing}${l.texte}</span>${l.detail ? html`<small>${l.detail}</small>` : nothing}</span></button>
      ${l.pause ? html`<button class="pause" title=${t(hass).pauseMedia} aria-label=${t(hass).pauseMedia} @click=${() => this.pause(l.pause!)}>
        <ha-icon icon="mdi:pause"></ha-icon></button>` : nothing}</li>`)}</ul></ha-card>`;
  }

  private medias(hass: HomeAssistant, m: Maison): Ligne[] {
    const enLecture = m.medias.filter((e) => hass.states[e.id]?.state === "playing");
    if (enLecture.length > 2) return [{ icone: "mdi:play-circle-outline", texte: t(hass).mediasEnLecture(enLecture.length), entite: enLecture[0].id }];
    return enLecture.map((e) => {
      const a = hass.states[e.id].attributes;
      const titre = [a.media_artist, a.media_title].filter(Boolean).join(" · ") || a.app_name || a.source;
      return { icone: "mdi:play-circle-outline", texte: nomCourt(hass, e.id, m.noms), detail: titre, entite: e.id, pause: e.id };
    });
  }

  // Seules les personnes qui ont un traceur : les autres sont toujours « inconnues ».
  // Jamais d'adresse ni de carte : à la maison, ailleurs, ou le nom d'une zone choisie par la famille.
  private presence(hass: HomeAssistant, m: Maison): Ligne[] {
    const tx = t(hass);
    const suivies = m.personnes.map((id) => hass.states[id])
      .filter((p): p is EtatHA => valide(p) && Array.isArray(p.attributes.device_trackers) && p.attributes.device_trackers.length > 0);
    if (!suivies.length) return [];
    const nom = (p: EtatHA) => m.noms[p.entity_id] || p.attributes.friendly_name || p.entity_id;
    const la = suivies.filter((p) => p.state === "home");
    const ailleurs = suivies.filter((p) => p.state !== "home");
    const texte = !la.length ? tx.personne
      : la.length > 3 || (m.mode === "complet" && la.length > 2) ? tx.personnesALaMaison(la.length) : tx.aLaMaison(la.map(nom));
    const detail = ailleurs.length > 2 ? undefined
      : ailleurs.map((p) => tx.ailleurs(nom(p), p.state === "not_home" ? null : p.state)).join(" · ");
    return [{ icone: la.length ? "mdi:home-account" : "mdi:home-export-outline", texte, detail: detail || undefined, entite: (la[0] ?? suivies[0]).entity_id }];
  }

  // Le prochain rendez-vous de chaque agenda (attributs de l'entité), s'il est en cours, aujourd'hui ou demain.
  private agenda(hass: HomeAssistant, m: Maison): Ligne[] {
    const tx = t(hass);
    const maintenant = new Date();
    const minuit = new Date(maintenant).setHours(0, 0, 0, 0);
    const jour = (d: Date) => Math.floor((new Date(d).setHours(0, 0, 0, 0) - minuit) / 86400000);
    const lire = (s: unknown) => new Date(String(s ?? "").replace(" ", "T"));
    return m.agendas.map((id) => hass.states[id])
      .filter((e): e is EtatHA => valide(e) && Boolean(e.attributes.message) && !Number.isNaN(lire(e.attributes.start_time).getTime()))
      .map((e) => ({ e, debut: lire(e.attributes.start_time), enCours: e.state === "on", journee: Boolean(e.attributes.all_day) }))
      .filter((x) => x.enCours || jour(x.debut) <= 1)
      .sort((a, b) => a.debut.getTime() - b.debut.getTime())
      .slice(0, 2)
      .map(({ e, debut, enCours, journee }) => {
        const j = jour(debut);
        const avant = enCours ? tx.enCours
          : journee ? (j === 0 ? tx.toutLeJour : tx.demain)
            : j === 0 ? heure(hass, debut) : `${tx.demain} ${heure(hass, debut)}`;
        return { icone: "mdi:calendar-clock", avant, texte: String(e.attributes.message), chemin: "/calendar" };
      });
  }

  private machines(hass: HomeAssistant, m: Maison): Ligne[] {
    const tx = t(hass);
    const lignes: Ligne[] = [];
    for (const id of m.enMarche) {
      const e = hass.states[id];
      if (!valide(e)) continue;
      const nom = nomCourt(hass, id, m.noms);
      const domaine = id.split(".")[0];
      const formate = hass.formatEntityState?.(e) || e.state;
      if (domaine === "vacuum" && ["cleaning", "returning"].includes(e.state)) {
        lignes.push({ icone: "mdi:robot-vacuum", texte: nom, detail: formate, entite: id });
      } else if (domaine === "lawn_mower" && e.state === "mowing") {
        lignes.push({ icone: "mdi:robot-mower", texte: nom, detail: formate, entite: id });
      } else if (domaine === "binary_sensor" && e.state === "on") {
        lignes.push({ icone: MACHINES.find(([motif]) => motif.test(nom))?.[1] ?? "mdi:progress-clock", texte: tx.enMarche(nom), entite: id });
      } else if (domaine === "timer" && e.state === "active") {
        const reste = Math.max(1, Math.ceil((new Date(e.attributes.finishes_at ?? "").getTime() - Date.now()) / MINUTE));
        if (!Number.isNaN(reste)) lignes.push({ icone: "mdi:timer-outline", texte: tx.minuteur(nom, reste), entite: id });
      } else if (domaine === "timer" && e.state === "paused") {
        lignes.push({ icone: "mdi:timer-pause-outline", texte: tx.enPause(nom), entite: id });
      }
    }
    return lignes;
  }

  private courses(hass: HomeAssistant, m: Maison): Ligne[] {
    const n = Number.parseInt(hass.states[m.courses ?? ""]?.state ?? "", 10);
    if (!m.courses || Number.isNaN(n) || n <= 0) return [];
    return [{ icone: "mdi:cart-outline", texte: t(hass).articles(n), chemin: `/todo?entity_id=${m.courses}` }];
  }

  private ouvrir(l: Ligne): void {
    if (l.chemin) naviguer(l.chemin);
    else if (l.entite) plusDInfos(this, l.entite);
  }

  private pause(id: string): void {
    this.hass?.callService?.("media_player", "media_pause", { entity_id: id });
  }
}
