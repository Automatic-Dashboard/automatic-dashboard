# Journal des versions

Les numéros suivent ceux de Home Assistant : l'année, le mois, puis les corrections (2026.12.0, 2026.12.1…). Chaque version est publiée comme une release GitHub, avec ces notes en français et en anglais.

## 2026.12.4

Les leçons d'une première vraie maison : plus de 400 entités, des caméras, des estimations PowerCalc, un pont hors ligne.

### En français

**Corrigé**
- L'énergie du jour et le bilan additionnent sans erreur des compteurs en Wh et en kWh : un compteur en Wh comptait mille fois trop.
- Une consommation en veille ou une estimation (PowerCalc) n'est plus prise pour la puissance de la maison. Sans vrai compteur, le tableau n'affiche pas de puissance plutôt qu'une fausse.
- La sécurité ne dit plus « Tout est fermé » quand les capteurs d'ouverture ne répondent pas.

**Amélioré**
- Les restes d'intégrations supprimées ou renommées (des entités en double que plus rien ne fournit) disparaissent du tableau. Un appareil hors ligne reste affiché, et un point signale « N appareils ne répondent plus ».
- Les totaux par jour, semaine ou mois d'un compteur sont écartés ; les estimations PowerCalc vont sur la page Énergie, plus dans les pièces.
- Les accessoires d'une caméra (projecteur, sirène, mode privé) et la télécommande d'un téléviseur passent au second plan, et le projecteur d'une caméra n'est plus compté parmi les lumières.
- Les favoris ne proposent plus d'entité indisponible.

### In English

**Fixed**
- Today's energy and the summary now add up Wh and kWh meters correctly: a Wh meter counted a thousand times too much.
- A standby consumption or an estimate (PowerCalc) is no longer taken for the home's power. Without a real meter, the dashboard shows no power rather than a wrong one.
- Security no longer says "Everything is closed" when door and window sensors do not respond.

**Improved**
- Leftovers of removed or renamed integrations (duplicate entities that nothing provides anymore) disappear from the dashboard. An offline device stays visible, and a point says "N devices not responding".
- Per-day, per-week and per-month meter totals are left out; PowerCalc estimates go to the Energy page instead of the rooms.
- Camera accessories (floodlight, siren, privacy mode) and a TV's remote move to the background, and a camera floodlight no longer counts as a light.
- Favorites no longer suggest an unavailable entity.

## 2026.12.3

### En français

**Ajouté**
- Des sections Automatic Dashboard à glisser dans n'importe quel tableau : l'état de la maison, en ce moment, le climat, le système, à ranger et avant de partir. Elles apparaissent dans *Créer une section*, *Section automatique*, avec leur aperçu, et suivent la maison comme le tableau complet.
- Sur le site, une démo en direct : le vrai tableau, sur une maison fictive, dans le navigateur.

**Amélioré**
- Les textes sont rangés dans un fichier par langue, vérifiés par les tests : de nouvelles langues pourront s'ajouter sans toucher au code. Une langue non traduite s'affiche en anglais.

**Corrigé**
- Créer le tableau à la main, depuis « Tableaux de bord communautaires », échouait : le type déclaré ne correspondait pas à celui du tableau.

### In English

**Added**
- Automatic Dashboard sections to drop into any dashboard: the state of the home, right now, climate, system, to sort and before leaving. They show up in *Create section*, *Automatic section*, with a preview, and follow the home like the full dashboard.
- On the website, a live demo: the real dashboard, on a fictional home, in the browser.

**Improved**
- Texts live in one file per language, checked by tests: new languages can be added without touching the code. An untranslated language falls back to English.

**Fixed**
- Creating the dashboard by hand from "Community dashboards" failed: the declared type did not match the dashboard's.

## 2026.12.2

### En français

**Amélioré**
- Quand le tableau ne peut pas se construire, une page claire dit quoi faire (recharger, redémarrer après une mise à jour, sinon signaler l'erreur avec le message à joindre), au lieu d'une erreur technique de Home Assistant.

**Corrigé**
- En thème sombre, les initiales des personnes (dans le journal, par exemple) sont lisibles : elles étaient gris foncé sur bleu foncé. Relevé par un audit d'accessibilité (WCAG 2.1 AA) de toutes les pages, qui n'a rien trouvé d'autre dans le tableau.

### In English

**Improved**
- When the dashboard cannot be built, a clear page says what to do (reload, restart after an update, otherwise report the error with the message to attach), instead of a technical Home Assistant error.

**Fixed**
- In dark mode, people's initials (in the logbook, for example) are readable: they were dark grey on dark blue. Found by an accessibility audit (WCAG 2.1 AA) of every page, which found nothing else in the dashboard.

## 2026.12.1

Une version de correction, pour les maisons en degrés Fahrenheit et l'heure sur 12 heures.

### En français

**Corrigé**
- Les maisons en °F : les conseils de saison (fermer les volets quand il fait chaud, ouvrir quand il fait plus frais dehors), la phrase du climat, la carte Confort et les couleurs de la maison en plan comparaient les degrés Fahrenheit à des seuils en °C. Le tableau pouvait conseiller de fermer les volets par temps de gel. Chaque mesure est maintenant convertie selon l'unité de son capteur, et les échelles sont graduées dans l'unité affichée.
- L'heure suit le format 12 ou 24 heures choisi dans le profil de Home Assistant, jusque sur l'horloge de la tablette murale.

### In English

**Fixed**
- Homes in °F: seasonal advice (closing shutters when it is hot, opening when it is cooler outside), the climate sentence, the Comfort card and the colors of the floor plan compared Fahrenheit readings with thresholds in °C. The dashboard could suggest closing the shutters in freezing weather. Each reading is now converted according to its own sensor's unit, and scales use the displayed unit.
- Times follow the 12 or 24-hour format chosen in the Home Assistant profile, including the wall tablet clock.

## 2026.12.0

Première version publique.

### En français

**Installez, c'est prêt.** Automatic Dashboard construit un tableau de bord complet à partir des appareils, des pièces et des étages de votre Home Assistant, et le tient à jour tout seul.

**Prêt en deux minutes**
- Ajoutez-le au Marketplace de Home Assistant (*Ajouter grâce à un lien* : `Automatic-Dashboard/automatic-dashboard` ; HACS avant 2026.11), installez-le : un écran, deux cases. Le tableau est créé pour vous, et peut devenir celui de tout le monde.
- Trois modes, choisis d'après votre maison : Découverte (quelques appareils), Maison, Complet (des centaines d'entités).

**Ce que montre le tableau**
- L'accueil : l'état de la maison en une phrase, le ciel du jour, les points à regarder, les favoris, les pièces, la météo, le climat, l'énergie et « En ce moment ».
- Une page par pièce et par sujet : Climat, Énergie, Sécurité, Système, et, quand la maison en a, Air, Véhicule et Extérieur.
- Le bilan de la semaine ou du mois : l'énergie jour par jour et son coût (lu dans les réglages Énergie de Home Assistant), les températures, ce qui s'est ouvert.
- « À ranger » propose la pièce d'un appareil d'après son nom, en un clic. « Je pars » liste ce qui reste ouvert ou allumé, avec un bouton par geste.
- Une page tablette murale : l'heure en grand, les favoris en grands boutons, le plein écran, un écran de veille la nuit.

**Il vous aide**
- Des conseils plutôt que des constats : fenêtre ouverte et chauffage allumé, CO₂ ou humidité trop hauts, volets à fermer quand il fait chaud, fenêtres à ouvrir quand il fait plus frais dehors, machine terminée.
- Un point s'ignore tant qu'il ne change pas ; un point grave jamais.
- « Me prévenir » : en cas de fuite, de fumée, de pile faible ou de sauvegarde ratée, l'automatisme tout fait, avec le choix des téléphones.
- Le mode absence met la sécurité en tête quand tout le monde est parti (ou que l'alarme est armée).

**À votre goût**
- Quatre styles : Automatic, Doux, Contrasté, ou votre thème Home Assistant. Les pièces de Climat en barres ou en mosaïque, les tuiles des favoris au choix, le ciel, les conseils et le bilan à garder ou non.
- Les favoris du tableau, et ceux de chaque personne (« Mes favoris »). Masquer, renommer, forcer le mode.
- Trois étiquettes pour régler des dizaines d'entités d'un coup : masquer, favori, extérieur.

**Pour progresser avec vous**
- « Signaler un problème » : un diagnostic de la maison sans aucun nom ni valeur, avec « Il devrait être… ». Il devient un cas de test.
- Le tableau est essayé chaque semaine sur la bêta de Home Assistant.

Français et anglais. Aucune donnée collectée, aucune carte tierce à installer. Demande Home Assistant 2026.9 ou plus récent.

### In English

**Install it, it's ready.** Automatic Dashboard builds a complete dashboard from the devices, areas and floors of your Home Assistant, and keeps it up to date on its own.

**Ready in two minutes**
- Add it to the Home Assistant Marketplace (*Add from link*: `Automatic-Dashboard/automatic-dashboard`; HACS before 2026.11), install it: one screen, two boxes. The dashboard is created for you, and can become everyone's default.
- Three modes, chosen from your home: Discovery (a few devices), Home, Complete (hundreds of entities).

**What the dashboard shows**
- The home page: the state of the house in one sentence, the sky of the day, things to check, favorites, rooms, weather, climate, energy and "Right now".
- One page per room and per topic: Climate, Energy, Security, System, and, when the home has them, Air, Vehicle and Outdoor.
- The weekly or monthly report: energy day by day and its cost (read from Home Assistant's Energy settings), temperatures, what was opened.
- "To sort" suggests a device's room from its name, in one click. "I'm leaving" lists what is still open or on, with a button for each step.
- A wall tablet page: the time shown large, favorites as large buttons, full screen, a screen saver at night.

**It helps you**
- Advice rather than facts: window open while the heating is on, CO₂ or humidity too high, shutters to close when it's hot, windows to open when it's cooler outside, appliance finished.
- An item can be ignored while it doesn't change; a serious one never.
- "Notify me": on a leak, smoke, a low battery or a failed backup, the ready-made automation, with a choice of phones.
- Away mode puts security first when everyone has left (or the alarm is armed).

**Your way**
- Four styles: Automatic, Soft, High contrast, or your Home Assistant theme. Climate rooms as bars or a mosaic, favorite tiles to choose, the sky, advice and report to keep or not.
- The dashboard's favorites, and each person's own ("My favorites"). Hide, rename, force the mode.
- Three labels to set dozens of entities at once: hide, favorite, outdoor.

**Getting better with you**
- "Report a problem": a diagnostic of the home without any name or value, with "It should be…". It becomes a test case.
- The dashboard is tried every week on the Home Assistant beta.

French and English. No data collected, no third-party card to install. Requires Home Assistant 2026.9 or newer.
