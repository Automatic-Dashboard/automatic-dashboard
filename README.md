# Automatic Dashboard

[![Vérifier](https://github.com/Automatic-Dashboard/automatic-dashboard/actions/workflows/verifier.yml/badge.svg)](https://github.com/Automatic-Dashboard/automatic-dashboard/actions/workflows/verifier.yml)
[![Release](https://img.shields.io/github/v/release/Automatic-Dashboard/automatic-dashboard?label=version)](https://github.com/Automatic-Dashboard/automatic-dashboard/releases/latest)
[![Licence : Apache 2.0](https://img.shields.io/badge/licence-Apache%202.0-blue)](LICENSE)
[![Site](https://img.shields.io/website?url=https%3A%2F%2Fautomatic-dashboard.github.io%2F&label=site)](https://automatic-dashboard.github.io)

![L'accueil d'Automatic Dashboard dans un appartement équipé : l'état de la maison en une phrase, les points à regarder, les favoris, les pièces, et sur le côté la météo, le climat et l'énergie](.github/assets/accueil.png)

Automatic Dashboard est un tableau de bord complet pour Home Assistant, qui se construit tout seul à partir de vos pièces, de vos étages et de vos appareils. Rien à écrire, rien à configurer : quand vous ajoutez un appareil ou une pièce, le tableau suit.
Il s'adapte à la taille de la maison, de trois appareils à plusieurs centaines, garde une seule direction artistique, claire et sombre, et ne contacte aucun service extérieur.

C'est un projet communautaire et libre, sans but lucratif, initié par Antonin Chenavaz.

Tout le reste est sur le site : [automatic-dashboard.github.io](https://automatic-dashboard.github.io), avec la démo et la documentation.

## Installer

Il vous faut Home Assistant 2026.9 ou plus récent.

1. Ouvrez le Marketplace : *Paramètres*, *Marketplace*. La première fois, acceptez l'avertissement.

   [![Ouvrir le Marketplace](https://my.home-assistant.io/badges/marketplace_repositories.svg)](https://my.home-assistant.io/redirect/marketplace_repositories/)

2. En haut à droite, *Ajouter grâce à un lien*, puis `Automatic-Dashboard/automatic-dashboard`. La première fois, le Marketplace demande de connecter GitHub avec un code à valider sur github.com.
3. Ouvrez Automatic Dashboard, puis *Installer*. L'écran de l'intégration s'ouvre : laissez *Créer le tableau* cochée, et cochez *En faire le tableau par défaut* si vous le souhaitez.
4. Rechargez la page : le tableau est dans la barre latérale.

Avec Home Assistant 2026.9 ou 2026.10, l'installation passe par HACS : [ouvrez Automatic Dashboard dans HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner=Automatic-Dashboard&repository=automatic-dashboard&category=integration), *Télécharger*, redémarrez Home Assistant, puis [ajoutez l'intégration](https://my.home-assistant.io/redirect/config_flow_start/?domain=automatic_dashboard).

Le détail de chaque étape, les réglages et les questions fréquentes sont dans [la documentation](https://automatic-dashboard.github.io/documentation/).

## Contribuer

Un appareil mal rangé, une traduction, une idée : [ouvrez un ticket](https://github.com/Automatic-Dashboard/automatic-dashboard/issues/new/choose). Le [guide de contribution](.github/CONTRIBUTING.md) explique comment joindre le diagnostic de votre maison, sans aucun nom ni valeur, et comment proposer du code.

## Licence

Le code est sous licence Apache 2.0 : voir [LICENSE](LICENSE). Le nom Automatic Dashboard, son logo et son symbole restent réservés : voir [NOTICE](NOTICE). La police Inter garde sa licence (SIL Open Font License 1.1).

Home Assistant est une marque de l'Open Home Foundation. Automatic Dashboard n'y est pas affilié.

---

## In English

Automatic Dashboard is a complete Home Assistant dashboard that builds itself from your areas, floors and devices, with nothing to write or configure. It adapts to the size of the home, keeps one visual identity in light and dark, and never contacts any external service. It is a free, non-profit community project started by Antonin Chenavaz. The interface is available in English and French.

**Install** (Home Assistant 2026.9 or newer): in *Settings*, *Marketplace*, choose *Add from link* and type `Automatic-Dashboard/automatic-dashboard`, then *Install*. The setup screen opens: keep *Create the dashboard* ticked, then reload the page. Before Home Assistant 2026.11, install it from [HACS](https://my.home-assistant.io/redirect/hacs_repository/?owner=Automatic-Dashboard&repository=automatic-dashboard&category=integration) and [add the integration](https://my.home-assistant.io/redirect/config_flow_start/?domain=automatic_dashboard).

Everything else is on [the website](https://automatic-dashboard.github.io/en/), including the [documentation](https://automatic-dashboard.github.io/en/documentation/). Issues and pull requests in English are welcome: see the [contributing guide](.github/CONTRIBUTING.md).
