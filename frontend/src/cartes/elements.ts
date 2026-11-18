// Les cartes Automatic Dashboard et leurs balises, communes au tableau et à la démo du site.

import { AutomaticApercu } from "./apercu";
import { AutomaticARanger } from "./a-ranger";
import { AutomaticBilan } from "./bilan";
import { AutomaticConfort } from "./confort";
import { AutomaticDepart } from "./depart";
import { AutomaticFavori } from "./favori";
import { AutomaticHeros } from "./heros";
import { AutomaticMesFavoris } from "./mes-favoris";
import { AutomaticMeteoFrance } from "./meteo-france";
import { AutomaticMoment } from "./moment";
import { AutomaticOuverture } from "./ouverture";
import { AutomaticPastille } from "./pastille";
import { AutomaticPiece } from "./piece";
import { AutomaticPlan } from "./plan";
import { AutomaticPoints } from "./points";
import { AutomaticPremiersPas } from "./premiers-pas";
import { AutomaticTablette } from "./tablette";

export const CARTES: [string, CustomElementConstructor][] = [
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
  ["automatic-dashboard-favori", AutomaticFavori],
  ["automatic-dashboard-depart", AutomaticDepart],
  ["automatic-dashboard-mes-favoris", AutomaticMesFavoris],
];
