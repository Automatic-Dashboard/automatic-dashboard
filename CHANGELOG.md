# Journal des versions

Les numéros suivent ceux de Home Assistant : l'année, le mois, puis les corrections (2026.12.0, 2026.12.1…). Chaque version est publiée comme une release GitHub, avec ces notes en français et en anglais.

## 2026.12.0

Première version publique.

### En français

**Installez, c'est prêt.** Automatic Dashboard construit un tableau de bord complet à partir des appareils, des pièces et des étages de votre Home Assistant, et le tient à jour tout seul.

- **Trois modes, choisis tout seuls** d'après votre maison : Découverte (quelques appareils : la météo et chaque appareil en grand, des premiers pas qui se cochent seuls), Maison (points à regarder, favoris, pièces, aperçus du climat et de l'énergie), Complet (des centaines d'entités : pièces par étage, tuiles compactes).
- **L'accueil** : l'état de la maison en une phrase, des pastilles qui mènent à chaque page, les points à regarder (fenêtre ouverte, fuite, pile faible, sauvegarde ratée, mise à jour, vigilance orange ou rouge, service hors ligne), les favoris, les pièces avec leur température et ce qui est allumé.
- **« En ce moment »** : ce qui joue, qui est à la maison, les prochains rendez-vous, les machines en marche, la liste de courses.
- **Météo-France** : la pluie dans l'heure, en phrase et en barre, et la vigilance du département.
- **Une page par sujet** : chaque pièce, Climat (dedans, dehors, confort pièce par pièce), Énergie (maintenant, aujourd'hui, hier, production solaire), Sécurité (ouvertures, serrures, détecteurs, activité), Système (mises à jour, sauvegardes, piles, la machine et les services du réseau comme Glances, Uptime Kuma, AdGuard Home ou Speedtest), À ranger (les appareils sans pièce, avec un bouton pour leur en choisir une).
- **Les réglages dans l'éditeur visuel** (« Modifier le tableau de bord ») : forcer le mode, épingler et ranger ses favoris, masquer, renommer dans Automatic Dashboard seulement.
- **Des conseils, pas seulement des constats** : « Fermez la fenêtre du salon » quand le chauffage tourne, « Aérez la chambre » au-delà de 1 000 ppm de CO₂ ou de 80 % d'humidité.
- **Ignorer un point pour aujourd'hui** : il revient demain, sur tous les écrans du même compte. Un point grave ne s'ignore jamais.
- **« Me prévenir »** sur une fuite, une pile faible ou une sauvegarde ratée : un clic crée l'automatisme tout fait, qui prévient les téléphones de l'application Home Assistant.
- **Le mode absence** : quand tout le monde est parti, la phrase et les points mettent la sécurité en tête (ouvertures, serrures, alarme, lumières oubliées), sans changer la disposition.
- **Le bilan de la semaine** : l'énergie jour par jour comparée à la semaine d'avant, les températures dedans et dehors, ce qui s'est ouvert. Annoncé chaque lundi.
- **Le ciel du jour** en tête de l'accueil (l'arc du soleil, la lune et sa phase la nuit), **la maison en plan** colorée par la température, et **une page tablette murale** (l'heure en grand, écran de veille la nuit).
- **« À ranger » propose la pièce** d'après le nom de l'appareil (« Lampe du salon » : « Salon ? »), réglée en un clic, avec « Annuler ».
- **Les étiquettes de réglage en masse**, créées par l'intégration : « Automatic Dashboard : masquer » (sur une entité, un appareil ou une pièce), « favori » et « extérieur ».
- **Signaler un problème** : l'éditeur produit un diagnostic de la maison sans aucun nom ni valeur, à joindre au ticket ; il devient un cas de test.
- **Le thème Automatic Dashboard**, clair et sombre, installé avec l'intégration ; une réparation explique quoi faire si Home Assistant ne charge pas les thèmes.
- Français et anglais. Aucune donnée collectée, aucune carte tierce à installer.

Demande Home Assistant 2026.9 ou plus récent.

### In English

**Install it, it's ready.** Automatic Dashboard builds a complete dashboard from the devices, areas and floors of your Home Assistant, and keeps it up to date on its own.

- **Three modes, chosen automatically** from your home: Discovery (a few devices: the weather and each device shown large, first steps that tick themselves off), Home (things to check, favorites, rooms, climate and energy overviews), Complete (hundreds of entities: rooms by floor, compact tiles).
- **The home page**: the state of the house in one sentence, chips leading to each page, things to check (open window, leak, low battery, failed backup, update, orange or red weather warning, offline service), favorites, rooms with their temperature and what is on.
- **"Right now"**: what is playing, who is home, upcoming appointments, running appliances, the shopping list.
- **Météo-France**: rain in the next hour, as a sentence and a bar, and the weather warning for your area.
- **One page per topic**: each room, Climate (inside, outside, comfort room by room), Energy (now, today, yesterday, solar production), Security (openings, locks, detectors, activity), System (updates, backups, batteries, the machine and network services such as Glances, Uptime Kuma, AdGuard Home or Speedtest), To sort (devices without an area, with a button to choose one).
- **Settings in the visual editor** ("Edit dashboard"): force the mode, pin and order favorites, hide, rename in Automatic Dashboard only.
- **Advice, not just facts**: "Close the living room window" while the heating is on, "Air out the bedroom" above 1,000 ppm of CO₂ or 80% humidity.
- **Ignore a thing to check for today**: it comes back tomorrow, on every screen of the same account. A serious one can never be ignored.
- **"Notify me"** on a leak, a low battery or a failed backup: one click creates the ready-made automation, which notifies the phones running the Home Assistant app.
- **Away mode**: when everyone has left, the sentence and the things to check put security first (openings, locks, alarm, lights left on), without changing the layout.
- **The weekly report**: energy day by day compared with the week before, inside and outside temperatures, what was opened. Announced every Monday.
- **The sky of the day** at the top of the home page (the sun's arc, the moon and its phase at night), **the floor plan** colored by temperature, and **a wall tablet page** (the time shown large, a screen saver at night).
- **"To sort" suggests the room** from the device name ("Living room lamp": "Living room?"), set in one click, with "Undo".
- **Bulk-setting labels**, created by the integration: "Automatic Dashboard: hide" (on an entity, device or area), "favorite" and "outdoor".
- **Report a problem**: the editor produces a diagnostic of the home without any name or value, to attach to the issue; it becomes a test case.
- **The Automatic Dashboard theme**, light and dark, installed with the integration; a repair explains what to do if Home Assistant does not load themes.
- French and English. No data collected, no third-party card to install.

Requires Home Assistant 2026.9 or newer.
