# Contribuer à Automatic Dashboard

Merci de vouloir aider ! Automatic Dashboard est un projet communautaire et libre, initié par Antonin Chenavaz. Il vit des retours de vraies maisons : chaque ticket sur un appareil mal rangé améliore le tableau pour tout le monde.

*English speakers are welcome: tickets and pull requests can be written in English. The documentation is in French first.*

## Sans écrire de code

- **Signaler un appareil mal rangé** : un capteur technique montré, un appareil absent, une pièce mal comptée. Joignez le **diagnostic** : sur le tableau, le crayon (*Modifier le tableau de bord*), *Signaler un problème*, choisissez l'appareil et ce qu'il devrait être, puis *Copier* ou *Télécharger le diagnostic*. Il décrit votre maison sans aucun nom ni valeur, et vous pouvez l'ouvrir pour le vérifier. Le modèle de ticket « Le tableau range mal un appareil » le demande.
- **Traduire** : chaque langue a son fichier, sans toucher au code (voir [Traduire](#traduire) plus bas).
- **Relire** : les textes du tableau, et ceux du site, dont la documentation est en Markdown dans le dépôt [automatic-dashboard.github.io](https://github.com/Automatic-Dashboard/automatic-dashboard.github.io) (`src/pages/documentation.md`, et `src/pages/en/` pour l'anglais).

### Tester chez vous

Chaque vraie maison apprend au tableau ce que les maisons d'essai ne montrent pas. Après [l'installation](https://automatic-dashboard.github.io/documentation/#installer), dix minutes suffisent :

- **l'accueil** : la phrase du haut est-elle juste ? Les points à regarder sont-ils utiles ?
- **vos pièces** : chaque appareil est-il dans la bonne pièce ? Un capteur technique (signal, batterie, mise à jour) apparaît-il là où il ne devrait pas ?
- **« À ranger »** : les appareils sans pièce sont-ils listés, et la pièce proposée est-elle la bonne ?
- **les pages** Climat, Énergie, Sécurité, Système : les chiffres correspondent-ils à ce que vous connaissez ?
- **sur téléphone** : tout se lit-il sans zoomer ?
- **les réglages** (le crayon) : changez de style, épinglez un favori, masquez une entité. Est-ce clair ?

Racontez ce que vous avez vu dans un [retour de testeur](https://github.com/Automatic-Dashboard/automatic-dashboard/issues/new?template=4-testeur.yml), avec le diagnostic pour chaque appareil mal rangé.

### Traduire

Le tableau parle français et anglais. D'autres langues viendront ; chacune tient dans quelques fichiers, et une langue non traduite s'affiche en anglais.

1. Copiez `frontend/src/langues/en.ts` sous le code de la langue (`de.ts` pour l'allemand), et traduisez chaque phrase. Les phrases qui dépendent d'un nombre sont des fonctions : gardez leurs paramètres, changez seulement le texte.
2. Ajoutez la langue à `LANGUES`, dans `frontend/src/textes.ts`.
3. Copiez `custom_components/automatic_dashboard/translations/en.json` sous le même code : c'est l'écran d'installation de l'intégration.
4. Si votre langue nomme les pièces autrement, ajoutez ses mots aux motifs de `frontend/src/moteur/regles.ts` (`ICONES_PIECES`, `PIECES_EXTERIEURES`) : c'est ce qui permet de proposer la bonne pièce dans « À ranger ».
5. Lancez `npm test` dans `frontend/` : les tests vérifient que la langue a exactement les clés du français et que chaque phrase se construit.

Une phrase écrite directement dans le code échapperait aux traducteurs : les tests le refusent. Ajoutez-la aux fichiers de langue, en français et en anglais.

## Le code

```
custom_components/automatic_dashboard/   l'intégration (Python) : sert le tableau, installe le thème
frontend/src/moteur/             le tri des entités, en fonctions pures, sans affichage
frontend/src/strategie/          la stratégie : les pages et leurs cartes, construites depuis le tri
frontend/src/cartes/             les cartes Automatic Dashboard (Lit)
frontend/src/editeur/            l'éditeur des réglages
frontend/tests/                  les tests du tableau, sur trois maisons exportées de Home Assistant
tests/                           les tests de l'intégration
dev/                             trois maisons d'essai dans Docker (mode d'emploi : dev/README.md)
```

Ce qui est prévu est dans la [feuille de route](https://github.com/Automatic-Dashboard/automatic-dashboard/milestones). Pour commencer, les tickets [« good first issue »](https://github.com/Automatic-Dashboard/automatic-dashboard/issues?q=is%3Aopen+label%3A%22good+first+issue%22) sont à la portée d'une première contribution. Avant de proposer un changement important, ouvrez un ticket ou une [discussion](https://github.com/Automatic-Dashboard/automatic-dashboard/discussions) : on en parle d'abord, pour ne pas perdre votre temps.

### Les principes

1. **Zéro configuration.** Ce qui peut être deviné ne se règle pas. Un réglage de plus doit répondre à un vrai besoin, que la détection ne peut pas couvrir.
2. **Lire ce que Home Assistant fournit.** Le tableau lit l'objet `hass` (pièces, étages, appareils, entités, états) ; il ne va chercher aucune donnée ailleurs et n'en envoie aucune.
3. **Cartes natives d'abord.** Une carte Automatic Dashboard seulement quand les cartes de Home Assistant ne suffisent pas ; jamais de carte tierce à installer.
4. **Une disposition stable.** Les tailles sont fixées à la génération, jamais par l'état du moment.
5. **Des phrases pour toute la famille.** Pas de jargon : « Fenêtre de la chambre ouverte », pas « binary_sensor on ».
6. **Ordinateur et téléphone, clair et sombre.** Tout changement d'affichage se vérifie dans les quatre cas.

### Vérifier

Les mêmes vérifications que GitHub Actions :

```sh
(cd frontend && npm ci && npm run verifier)   # types, tests, construction de automatic-dashboard.js
uv venv && uv pip install -r tests/requirements.txt && .venv/bin/pytest
ruff check . && ruff format --check .
```

Le fichier `custom_components/automatic_dashboard/frontend/automatic-dashboard.js` est construit et versionné : pensez à le reconstruire avec `npm run build` et à le joindre à votre changement.

### Un appareil mal rangé

Le tri est dans `frontend/src/moteur/regles.ts`. Le ticket porte un diagnostic (éditeur, « Signaler un problème ») : la maison de la personne, sans noms ni valeurs. Pour corriger une règle :

1. enregistrez le diagnostic dans `frontend/tests/cas/` sous le numéro du ticket, et ajoutez ce qui était attendu (le mode d'emploi est dans `frontend/tests/cas/README.md`) ;
2. vérifiez que `npm test` échoue sur ce cas ;
3. corrigez la règle, la plus étroite possible ;
4. vérifiez que les trois maisons d'essai et les autres cas ne changent pas.

Le cas reste ensuite pour toujours : une maison mal rangée une fois ne l'est plus jamais.

### Les nouvelles versions de Home Assistant

Chaque jeudi, le flux « Bêta de Home Assistant » monte une maison neuve sur la bêta et sur la version de développement, puis la sonde (`dev/scripts/sonde.py`) ouvre chaque page dans un vrai navigateur. Si la bêta casse quelque chose, un ticket « bêta » s'ouvre tout seul.

## Le nom et le logo

Le code est sous licence Apache 2.0. Le nom Automatic Dashboard, son logo et son symbole restent réservés (voir [NOTICE](../NOTICE)) : une version modifiée et redistribuée doit porter un autre nom.

## Le comportement

Ce projet suit son [code de conduite](https://github.com/Automatic-Dashboard/.github/blob/main/CODE_OF_CONDUCT.md) : bienveillance, patience avec les débutants, et aucune tolérance pour le harcèlement.
