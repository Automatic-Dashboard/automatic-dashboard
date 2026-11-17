# Les cas tirés des tickets

Chaque fichier est un **diagnostic** copié depuis l'éditeur (*Modifier le tableau de bord*, puis *Signaler un problème*) et joint à un ticket. C'est la maison de la personne, décrite sans noms ni valeurs : on peut rejouer le tri dessus sans rien savoir d'elle.

Pour transformer un ticket en cas de test :

1. Enregistrez le diagnostic du ticket ici, sous le numéro du ticket : `tests/cas/123.json`.
2. Ajoutez en tête trois clés :
   - `titre` : ce qui était faux, en une phrase (« Un capteur de signal sans catégorie apparaît dans la chambre ») ;
   - `ticket` : le lien du ticket ;
   - `attendu` : le bon résultat. `mode` pour le mode de la maison, et `entites` pour chaque entité signalée, avec seulement les champs qui comptent : `ecart` (la raison de l'écarter, ou `null` si elle doit être gardée), `role`, `section`, `piece` (identifiant de la pièce dans le diagnostic, `p1`, `p2`…) et `aRanger`.
3. `npm test` doit échouer, puis réussir une fois la règle corrigée. Le cas reste ensuite pour toujours.

Le champ `signalement` du diagnostic dit ce que le tri faisait au moment du ticket : c'est un bon point de départ pour écrire `attendu`.

`exemple-maison-debutant.json` montre le format, sur la maison débutant des essais.
