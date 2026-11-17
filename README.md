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

Il faut Home Assistant 2026.9 ou plus récent, et [HACS](https://hacs.xyz/docs/use/).

1. **Téléchargez Automatic Dashboard dans HACS**, puis redémarrez Home Assistant. En attendant son inscription au catalogue officiel (et donc au Marketplace de Home Assistant), ce bouton l'ajoute comme dépôt personnalisé :

   [![Ouvrir dans HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=Automatic-Dashboard&repository=automatic-dashboard&category=integration)

2. **Ajoutez l'intégration.** Un écran, deux cases : créer le tableau (cochée), et en faire le tableau par défaut pour tout le monde.

   [![Ajouter l'intégration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=automatic_dashboard)

3. **Rechargez la page** : le tableau est dans la barre latérale. C'est prêt.

L'intégration installe aussi le thème Automatic Dashboard (clair et sombre), et trois étiquettes de réglage en masse. Le pas à pas complet, avec les questions fréquentes, est dans [la documentation](https://automatic-dashboard.github.io/documentation/).

## À votre goût

Tout est automatique, mais tout se règle : sur le tableau, le crayon en haut à droite (« Modifier le tableau de bord ») ouvre les réglages d'Automatic Dashboard.

- **Mode** : automatique (le tableau montre ce qu'il a vu chez vous : « mode Maison, 40 entités utiles, 40 appareils, 7 pièces »), ou forcé en Découverte, Maison ou Complet.
- **Apparence** : quatre styles (Automatic, Doux, Contrasté, ou votre thème Home Assistant), les pièces de Climat en barres ou en mosaïque, les tuiles des favoris, et le ciel du jour, les conseils et le bilan à garder ou non.
- **Favoris** du tableau, à épingler et ranger ; et sur l'accueil, **Mes favoris** : chacun choisit les siens, sans être administrateur.
- **Masqués** et **Noms** : ce que le tableau ne montre pas, et le nom qu'il affiche, sans rien changer ailleurs dans Home Assistant.
- **Me prévenir** : en cas de fuite, de fumée, de pile faible ou de sauvegarde ratée, l'automatisme tout fait, avec le choix des téléphones à prévenir.
- **Tablette murale** : les heures de nuit de l'écran de veille, et le détecteur qui rallume l'écran au passage.

![Les réglages d'Automatic Dashboard dans l'éditeur visuel](docs/captures/v1/famille/editeur-ordinateur-clair.png)

Les mêmes réglages s'écrivent en YAML : voir [la documentation](https://automatic-dashboard.github.io/documentation/#en-yaml).

## Au quotidien

- **Des conseils, pas seulement des constats** : « Fermez la fenêtre du salon » quand le chauffage tourne, « Aérez la chambre » quand le CO₂ monte, « Fermez les volets » quand il fait chaud, « Le lave-linge a fini ».
- **Les points à regarder** s'ignorent tant qu'ils ne changent pas (le bouton ⋯), sauf une fuite ou une alarme.
- **Le mode absence** : quand tout le monde est parti, la sécurité passe en tête. **Je pars** : ce qui reste ouvert ou allumé, avec un bouton par geste.
- **Le bilan** de la semaine ou du mois : l'énergie et son coût (d'après les réglages Énergie de Home Assistant), les températures, ce qui s'est ouvert.
- **Des pages qui apparaissent seules** quand la maison en a besoin : Air, Véhicule, Extérieur.
- **Le ciel du jour** en tête de l'accueil, et **une page tablette murale** en plein écran, avec un écran de veille la nuit.
- **« À ranger » propose la pièce** d'après le nom de l'appareil, en un clic.
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

**Install it, it's ready.** Automatic Dashboard builds a complete, polished Home Assistant dashboard from your own devices, rooms and floors, with nothing to configure. As its name says, it builds itself, and rebuilds itself when the home changes. It adapts to your home with three densities (Discovery for beginners, Home, Complete for hundreds of entities) and keeps one visual identity for everyone. It is a free, community project started by Antonin Chenavaz: no paid features, no data collected, no external service contacted. Install it through HACS (custom repository for now), add the integration (one screen: it creates the dashboard for you, and can make it everyone's default), reload the page: it's ready. Everything can be adjusted in the visual editor ("Edit dashboard"): mode, four styles, how rooms are shown, favorites (and each person's own), hidden entities, names, ready-made "notify me" automations with a choice of phones, and the wall tablet. Day to day, it gives advice rather than facts, lets you ignore a thing to check while nothing changes, puts security first when everyone has left, lists what to do before leaving, sums up the week or month with the energy cost, adds Air, Vehicle and Outdoor pages when the home has them, and suggests the room of unassigned devices. Reporting a problem attaches a diagnostic of the home without any name or value, which becomes a test case. The interface is available in French and English; contributions and bug reports in English are welcome ([contributing guide](CONTRIBUTING.md), [changelog](CHANGELOG.md)).
