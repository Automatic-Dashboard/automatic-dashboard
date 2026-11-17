"""Constantes d'Automatic Dashboard."""

DOMAIN = "automatic_dashboard"
URL_BASE = "/automatic_dashboard_static"
JS_FILE = "automatic-dashboard.js"
THEME_NAME = "Automatic Dashboard"
THEME_FILE = "automatic_dashboard.yaml"
ISSUE_THEMES = "themes_non_charges"

# Le premier tableau : créé au premier chargement de l'interface par un administrateur.
CONF_CREER_TABLEAU = "creer_tableau"
CONF_PAR_DEFAUT = "par_defaut"
TABLEAU_CREE = "tableau_cree"

# Les étiquettes de réglage en masse : posées dans Home Assistant sur des dizaines d'entités,
# d'appareils ou de pièces d'un coup. Le tableau les reconnaît par leur identifiant, tiré du
# nom à la création : les deux langues sont reconnues.
ETIQUETTES = {
    "masquer": {
        "ids": ("automatic_dashboard_masquer", "automatic_dashboard_hide"),
        "fr": "Automatic Dashboard : masquer",
        "en": "Automatic Dashboard: hide",
        "icon": "mdi:eye-off-outline",
        "description": {
            "fr": "Sur une entité, un appareil ou une pièce : Automatic Dashboard ne les montre nulle part.",
            "en": "On an entity, device or area: Automatic Dashboard never shows it.",
        },
    },
    "favori": {
        "ids": ("automatic_dashboard_favori", "automatic_dashboard_favorite"),
        "fr": "Automatic Dashboard : favori",
        "en": "Automatic Dashboard: favorite",
        "icon": "mdi:star-outline",
        "description": {
            "fr": "Sur une entité ou un appareil : il rejoint les favoris de l'accueil, après ceux épinglés.",
            "en": "On an entity or device: it joins the home page favorites, after the pinned ones.",
        },
    },
    "exterieur": {
        "ids": ("automatic_dashboard_exterieur", "automatic_dashboard_outdoor"),
        "fr": "Automatic Dashboard : extérieur",
        "en": "Automatic Dashboard: outdoor",
        "icon": "mdi:tree-outline",
        "description": {
            "fr": "Sur une pièce : sa température devient celle du dehors et sort de la moyenne de la maison.",
            "en": "On an area: its temperature becomes the outdoor one and leaves the home average.",
        },
    },
}
