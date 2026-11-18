// La démo interactive du site : le vrai tableau Automatic Dashboard, sur une maison fictive, dans
// une page web. Elle s'installe dans <automatic-dashboard-demo>, placé par la page de démo.

import { CARTES } from "../cartes/elements";
import { definirElements } from "./elements";
import { definirNatives } from "./natives";
import { AutomaticDashboardDemo } from "./scene";

definirElements();
definirNatives();
for (const [balise, classe] of CARTES) if (!customElements.get(balise)) customElements.define(balise, classe);
if (!customElements.get("automatic-dashboard-demo")) customElements.define("automatic-dashboard-demo", AutomaticDashboardDemo);
