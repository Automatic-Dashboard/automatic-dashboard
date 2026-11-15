# CentralHome

**Installez, c'est prêt.** Un tableau de bord complet pour Home Assistant, construit tout seul à partir de vos appareils.

![L'accueil de CentralHome dans une maison équipée](docs/captures/essai3-maison-ordinateur.jpg)

CentralHome lit les appareils, les pièces et les étages de votre Home Assistant, et en fait un tableau soigné : l'état de la maison en une phrase, les points à regarder, vos favoris, chaque pièce avec sa température et ce qui est allumé, puis une page par sujet (climat, énergie, sécurité, système). Rien à écrire, rien à configurer : quand vous ajoutez un appareil ou une pièce, le tableau suit.

C'est un projet communautaire et libre, initié par Antonin Chenavaz. Il n'a aucun but lucratif : aucune fonction payante, aucune donnée collectée.

## Un tableau qui s'adapte à votre maison

La même direction artistique pour tout le monde, mais trois densités, choisies automatiquement d'après ce que vous avez :

| Mode | Pour qui | Ce que vous voyez |
|---|---|---|
| **Découverte** | Vous débutez, avec quelques appareils | La météo en grand, chaque appareil en grand, et des premiers pas qui se cochent tout seuls |
| **Maison** | Quelques dizaines d'appareils | Les points à regarder, vos favoris, vos pièces, le climat et l'énergie en un coup d'œil |
| **Complet** | Des centaines d'entités | Seules celles qui servent : les pièces par étage, les détails techniques rangés dans Système |

| | |
|---|---|
| ![Mode Découverte](docs/captures/essai3-decouverte-haut.jpg) | ![Mode Complet](docs/captures/essai3-complet-ordinateur.jpg) |
| Mode Découverte : une installation neuve, trois appareils. | Mode Complet : 75 appareils sur deux étages. |
| ![Page Climat](docs/captures/heros-climat-maison.jpg) | ![Sur téléphone](docs/captures/essai3-maison-telephone.jpg) |
| La page Climat et sa carte Confort. | Sur téléphone. |

## Installer

CentralHome demande Home Assistant 2026.9 ou plus récent.

1. **Ajoutez CentralHome à HACS.** En attendant son inscription au catalogue officiel (et donc au Marketplace de Home Assistant), ajoutez-le comme dépôt personnalisé :

   [![Ajouter à HACS](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=CentralHome-HA&repository=centralhome&category=integration)

2. **Ajoutez l'intégration**, puis redémarrez Home Assistant :

   [![Ajouter l'intégration](https://my.home-assistant.io/badges/config_flow_start.svg)](https://my.home-assistant.io/redirect/config_flow_start/?domain=centralhome)

3. **Créez le tableau** : Paramètres, Tableaux de bord, Ajouter un tableau de bord, rubrique « Tableaux de bord communautaires », CentralHome.

L'intégration installe aussi le thème CentralHome (clair et sombre). Le tableau l'utilise même si vous gardez un autre thème ailleurs.

## Réglages

Tout est automatique, mais vous pouvez préciser, en mode YAML du tableau :

```yaml
strategy:
  type: custom:centralhome
  mode: auto          # ou decouverte, maison, complet
  favoris:            # sinon, CentralHome les choisit
    - light.salon
  masquer:            # entités à ne jamais montrer
    - switch.prise_technique
```

Pour une pièce, la température affichée est celle que vous choisissez dans les réglages de la pièce dans Home Assistant ; sinon, celle d'un thermomètre de la pièce.

## Vie privée

CentralHome ne contacte aucun service extérieur et ne collecte rien. Il lit ce que Home Assistant sait déjà, dans votre navigateur. Pour la météo, les jours fériés ou la vigilance, il vous propose d'ajouter les intégrations officielles de Home Assistant, en un clic.

## Développer

| Dossier | Contenu |
|---|---|
| [custom_components/centralhome/](custom_components/centralhome/) | L'intégration : elle sert le tableau et installe le thème |
| [frontend/](frontend/) | Le tableau en TypeScript (Lit) : moteur de tri, stratégie, cartes, tests |
| [dev/](dev/) | Trois maisons d'essai dans Docker : débutant, famille, complète ([mode d'emploi](dev/README.md)) |
| [docs/](docs/) | Cahier des charges, études de conception, captures |

```sh
cd frontend
npm ci
npm test            # moteur de tri et stratégie, sur les trois maisons d'essai
npm run build       # écrit custom_components/centralhome/frontend/centralhome.js
```

Les contributions seront ouvertes après la première version publique, avec un guide de contribution.

## Licence

Le code est distribué sous licence [Apache 2.0](LICENSE). Le nom CentralHome, son logo et son symbole restent réservés : voir [NOTICE](NOTICE). La police Inter est sous licence SIL Open Font License 1.1.

Home Assistant est une marque de l'Open Home Foundation. CentralHome n'y est pas affilié.

---

## In English

**Install it, it's ready.** CentralHome builds a complete, polished Home Assistant dashboard from your own devices, rooms and floors, with nothing to configure. It adapts to your home with three densities (Discovery for beginners, Home, Complete for hundreds of entities) and keeps one visual identity for everyone. It is a free, community project started by Antonin Chenavaz: no paid features, no data collected, no external service contacted. Install it through HACS (custom repository for now), add the integration, then add the "CentralHome" community dashboard. The interface is available in French and English.
