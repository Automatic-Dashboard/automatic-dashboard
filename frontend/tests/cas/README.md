# Les cas tirés des tickets

Chaque fichier est un **diagnostic** joint à un ticket. Il est produit par l'éditeur du tableau : *Modifier le tableau de bord*, puis la rubrique *Signaler un problème*. C'est la maison de la personne, décrite sans noms ni valeurs : on peut rejouer le tri dessus sans rien savoir d'elle.

Quand la personne a choisi « Il devrait être… » pour l'appareil signalé, le diagnostic contient déjà ce qui était attendu (`attendu`). Il suffit alors de :

1. enregistrer le fichier ici, sous le numéro du ticket : `tests/cas/123.json` ;
2. remplir `titre` (ce qui était faux, en une phrase) et `ticket` (le lien du ticket) ;
3. lancer `npm test` : le cas échoue ;
4. corriger la règle, la plus étroite possible : le cas passe, et reste pour toujours.

Si `attendu` est vide, écrivez-le d'après le ticket. Pour chaque entité signalée (son identifiant est dans `signalement`), on ne met que les champs qui comptent :

| Champ | Sens |
|---|---|
| `ecartee: true` | l'entité doit être cachée (information technique) |
| `ecart: null` | l'entité doit être montrée |
| `piece: "p3"` | elle doit être dans cette pièce (identifiants `p1`, `p2`… du diagnostic) |
| `section: "securite"` | elle doit aller dans cette page : `pieces`, `climat`, `energie`, `securite`, `systeme` |
| `aRanger: true` | elle doit apparaître dans « À ranger » |

On peut aussi vérifier le mode de la maison, avec `"mode": "complet"` à côté de `entites`.

Le champ `signalement` dit ce que le tri faisait au moment du ticket : c'est un bon point de départ.

`exemple-maison-debutant.json` montre le format, sur la maison débutant des essais.
