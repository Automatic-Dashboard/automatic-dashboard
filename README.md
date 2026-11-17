# Automatic Dashboard

**Installez, c'est prêt.** Un tableau de bord complet pour Home Assistant, construit tout seul à partir de vos appareils.

![L'accueil d'Automatic Dashboard dans un appartement équipé : l'état de la maison en une phrase, les points à regarder, les favoris, les pièces, et sur le côté la météo, la pluie dans l'heure, le climat, l'énergie et « En ce moment »](docs/captures/v1/famille/accueil-ordinateur-clair.png)

Automatic Dashboard lit les appareils, les pièces et les étages de votre Home Assistant, et en fait un tableau soigné : l'état de la maison en une phrase, les points à regarder, vos favoris, chaque pièce avec sa température et ce qui est allumé, puis une page par sujet (climat, énergie, sécurité, système). Rien à écrire, rien à configurer : quand vous ajoutez un appareil ou une pièce, le tableau suit.

Le nom dit ce qu'il fait : un tableau de bord qui se construit tout seul, et se reconstruit quand la maison change.

C'est un projet communautaire et libre, initié par Antonin Chenavaz. Il n'a aucun but lucratif : aucune fonction payante, aucune donnée collectée.

**[Le site](https://automatic-dashboard.github.io)** · **[La démo](https://automatic-dashboard.github.io/demo/)** · **[La documentation](https://automatic-dashboard.github.io/documentation/)**

## Un tableau qui s'adapte à votre maison

La même direction artistique pour tout le monde, mais trois densités, choisies automatiquement d'après ce que vous avez :

| Mode | Pour qui | Ce que vous voyez |
|---|---|---|
| **Découverte** | Vous débutez, avec quelques appareils | La météo en grand, chaque appareil en grand, et des premiers pas qui se cochent tout seuls |
| **Maison** | Quelques dizaines d'appareils | Les points à regarder, vos favoris, vos pièces, le climat et l'énergie en un coup d'œil |
| **Complet** | Des centaines d'entités | Seules celles qui servent : les pièces par étage, les détails techniques rangés dans Système |

| | |
|---|---|
| ![Mode Découverte, en thème sombre : la météo en grand, la pluie dans l'heure, les premiers pas](docs/captures/v1/debutant/accueil-ordinateur-sombre.png) | ![Mode Complet, en thème sombre : 75 appareils, les pièces par étage](docs/captures/v1/complete/accueil-ordinateur-sombre.png) |
| **Découverte** : une installation neuve, trois appareils. | **Complet** : 75 appareils sur deux étages. |
| ![La page Climat : dedans, dehors, humidité, courbes de 24 heures et confort pièce par pièce](docs/captures/v1/famille/climat-ordinateur-clair.png) | ![La page Énergie en thème sombre](docs/captures/v1/famille/energie-ordinateur-sombre.png) |
| La page Climat et le confort pièce par pièce. | La page Énergie. |

<p>
  <img src="docs/captures/v1/famille/accueil-telephone-clair.png" alt="L'accueil sur téléphone, en thème clair" width="24%">
  <img src="docs/captures/v1/famille/accueil-telephone-sombre.png" alt="L'accueil sur téléphone, en thème sombre" width="24%">
  <img src="docs/captures/v1/famille/salon-telephone-sombre.png" alt="La page du salon sur téléphone" width="24%">
  <img src="docs/captures/v1/famille/climat-telephone-clair.png" alt="La page Climat sur téléphone" width="24%">
</p>

## Pourquoi pas la vue d'ensemble de Home Assistant ?

Home Assistant génère déjà une vue d'ensemble : des pièces et des résumés d'une ligne. C'est un bon point de départ, et Automatic Dashboard en reprend la mécanique (une stratégie de tableau, des sections, un côté). Il va plus loin :

| | |
|---|---|
| ![La vue d'ensemble native de Home Assistant sur la même maison](docs/captures/v1/famille/vue-native-ordinateur-clair.png) | ![Automatic Dashboard sur la même maison](docs/captures/v1/famille/accueil-ordinateur-clair.png) |
| La vue d'ensemble de Home Assistant. | Automatic Dashboard, sur la même maison. |

- **Une phrase avant les chiffres** : « 4 points à regarder, le reste va bien », « Fenêtre de la chambre ouverte ».
- **Des pièces qui parlent** : leur température, leur humidité, ce qui est allumé, ouvert ou en marche.
- **Des pages riches** : courbes de 24 heures, confort pièce par pièce, production solaire, sauvegardes, services du réseau.
- **« À ranger »** : les appareils sans pièce, et le bouton pour leur en choisir une.
- **Une seule direction artistique**, claire et sombre, soignée jusque sur téléphone.
- **Trois densités** : la même maison n'a pas les mêmes besoins avec trois appareils ou avec trois cents.

## Installer

Automatic Dashboard demande Home Assistant 2026.9 ou plus récent.

1. **Ajoutez Automatic Dashboard à HACS.** En attendant son inscription au catalogue officiel (et donc au Marketplace de Home Assistant), ajoutez-le comme dépôt personnalisé :

   [![Ajouter à HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Automatic-Dashboard&repository=automatic-dashboard&category=integration)

2. **Ajoutez l'intégration**, puis redémarrez Home Assistant :

   [![Ajouter l'intégration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=automatic_dashboard)

3. **Créez le tableau** : Paramètres, Tableaux de bord, Ajouter un tableau de bord, rubrique « Tableaux de bord communautaires », Automatic Dashboard.

L'intégration installe aussi le thème Automatic Dashboard (clair et sombre). Le tableau l'utilise même si vous gardez un autre thème ailleurs.

## Réglages

Tout est automatique, mais vous pouvez préciser : sur le tableau, le crayon en haut à droite (« Modifier le tableau de bord ») ouvre les réglages d'Automatic Dashboard.

- **Mode** : automatique (Automatic Dashboard montre ce qu'il a vu chez vous : « mode Maison, 40 entités utiles, 40 appareils, 7 pièces »), ou forcé en Découverte, Maison ou Complet.
- **Favoris** : épinglez les vôtres et faites-les glisser pour les ranger (ou les flèches du clavier). Les appareils que vous utilisez le plus complètent la rangée, sauf si vous le refusez.
- **Masqués** : ce qu'Automatic Dashboard ne montre nulle part, sans rien changer ailleurs dans Home Assistant.
- **Noms** : le nom affiché dans Automatic Dashboard, sans renommer l'appareil dans Home Assistant ni pour les assistants vocaux.
- **Pièces** : elles suivent l'ordre choisi dans Home Assistant (Paramètres, Pièces) ; un lien y mène.

![Les réglages d'Automatic Dashboard dans l'éditeur visuel : mode, favoris, masqués, noms](docs/captures/v1/famille/editeur-ordinateur-clair.png)

Les mêmes réglages, en mode YAML du tableau :

```yaml
strategy:
  type: custom:automatic-dashboard
  mode: complet          # sinon automatique
  favoris:               # épinglés, dans cet ordre
    - light.salon
  completer: false       # seulement les épinglés
  masquer:               # entités à ne jamais montrer
    - switch.prise_technique
  noms:                  # noms affichés dans Automatic Dashboard
    light.lampe_chevet: Veilleuse
```

Pour une pièce, la température affichée est celle que vous choisissez dans les réglages de la pièce dans Home Assistant ; sinon, celle d'un thermomètre de la pièce.

## Au quotidien

- **Des conseils, pas seulement des constats** : « Fermez la fenêtre du salon » quand le chauffage tourne, « Aérez la chambre » quand le CO₂ monte.
- **Ignorer un point pour aujourd'hui** (l'œil barré) : la fenêtre ouverte exprès ne reste pas en tête toute la journée. Elle revient demain.
- **Me prévenir** (la cloche) sur une fuite, une pile faible ou une sauvegarde ratée : l'automatisme tout fait est créé dans Home Assistant, il prévient vos téléphones.
- **Le mode absence** : quand tout le monde est parti, la phrase et les points mettent la sécurité en tête. La disposition ne bouge pas.
- **Le bilan de la semaine**, annoncé le lundi : l'énergie jour par jour, les températures, ce qui s'est ouvert.
- **Le ciel du jour** en tête de l'accueil, **la maison en plan** dans Climat, et **une page tablette murale** (`/votre-tableau/tablette`) avec un écran de veille la nuit.
- **« À ranger » propose la pièce** d'après le nom de l'appareil, en un clic.
- **Les étiquettes « Automatic Dashboard : masquer », « favori » et « extérieur »**, créées par l'intégration, règlent des dizaines d'entités d'un coup depuis Home Assistant.
- **Signaler un problème** : dans les réglages, un diagnostic de votre maison sans aucun nom ni valeur, à joindre au ticket. Il devient un cas de test, pour que l'erreur ne revienne jamais.

## Vie privée

Automatic Dashboard ne contacte aucun service extérieur et ne collecte rien. Il lit ce que Home Assistant sait déjà, dans votre navigateur. Pour la météo, les jours fériés ou la vigilance, il vous propose d'ajouter les intégrations officielles de Home Assistant, en un clic.

## Développer

| Dossier | Contenu |
|---|---|
| [custom_components/automatic_dashboard/](custom_components/automatic_dashboard/) | L'intégration : elle sert le tableau et installe le thème |
| [frontend/](frontend/) | Le tableau en TypeScript (Lit) : moteur de tri, stratégie, cartes, tests |
| [dev/](dev/) | Trois maisons d'essai dans Docker : débutant, famille, complète ([mode d'emploi](dev/README.md)) |
| [tests/](tests/) | Les tests de l'intégration |
| [docs/](docs/) | Cahier des charges, études de conception, captures |

```sh
cd frontend
npm ci
npm run verifier    # types, tests sur les trois maisons d'essai, construction de automatic-dashboard.js
```

Les contributions sont les bienvenues : le [guide de contribution](CONTRIBUTING.md) explique comment signaler un appareil mal rangé, traduire ou proposer du code. Les changements de chaque version sont dans le [journal des versions](CHANGELOG.md).

## Licence

Le code est distribué sous licence [Apache 2.0](LICENSE). Le nom Automatic Dashboard, son logo et son symbole restent réservés : voir [NOTICE](NOTICE). La police Inter est sous licence SIL Open Font License 1.1.

Home Assistant est une marque de l'Open Home Foundation. Automatic Dashboard n'y est pas affilié.

---

## In English

**Install it, it's ready.** Automatic Dashboard builds a complete, polished Home Assistant dashboard from your own devices, rooms and floors, with nothing to configure. As its name says, it builds itself, and rebuilds itself when the home changes. It adapts to your home with three densities (Discovery for beginners, Home, Complete for hundreds of entities) and keeps one visual identity for everyone. It is a free, community project started by Antonin Chenavaz: no paid features, no data collected, no external service contacted. Install it through HACS (custom repository for now), add the integration, then add the "Automatic Dashboard" community dashboard. Settings (mode, favorites, hidden entities, names) are in the visual editor ("Edit dashboard"). Day to day, it gives advice rather than facts (close the window while the heating is on, air out a stuffy room), lets you ignore a thing to check for today, creates ready-made "notify me" automations, switches to an away mode when everyone has left, sums up the week every Monday, draws the sky of the day and a floor plan colored by temperature, offers a wall tablet page, suggests the room of unassigned devices, and reads bulk-setting labels. Reporting a problem attaches a diagnostic of the home without any name or value, which becomes a test case. The interface is available in French and English; contributions and bug reports in English are welcome ([contributing guide](CONTRIBUTING.md), [changelog](CHANGELOG.md)).
