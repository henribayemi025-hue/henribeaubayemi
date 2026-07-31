// GÉNÉRÉ AUTOMATIQUEMENT — ne pas éditer à la main.
// Source: table `categories` en base (migrations 0022→0025).
// Régénérer: node scripts/gen-categories.mjs categories.json
//
// Ce fichier ne contient QUE la structure (ids + parenté). Les bannières,
// icônes, règles de devis et champs par catégorie vivent dans categories.js,
// qui importe ceci.

export const PRODUCT_HEADS = [
  "mode_femme",
  "mode_homme",
  "enfants_bebe",
  "hightech",
  "beaute_cosmetiques",
  "bijoux_montres",
  "maison_deco",
  "evenementiel_mariages",
  "alimentaire",
  "jus_naturels",
  "seconde_main",
  "vehicules",
  "immobilier_vente",
  "mode_a_trier",
  "musique",
  "sport_loisirs",
  "electromenager",
  "livres_papeterie",
  "sante_bienetre",
  "animaux",
  "jardin_exterieur"
];

export const SERVICE_HEADS = [
  "beaute_domicile",
  "menage",
  "btp_bricolage",
  "informatique_digital",
  "electricite_plomberie",
  "livraison_demenagement",
  "traiteur_chef",
  "location_immobiliere",
  "location_vehicules",
  "photo_video",
  "couture_retouches",
  "mecanique_auto",
  "sante_domicile",
  "garde_enfants",
  "transport_chauffeur",
  "securite",
  "marketing_com",
  "admin_juridique",
  "cours",
  "evenementiel_service",
  "autre_service"
];

export const CATEGORY_CHILDREN = {
  "mode_femme": [
    "femme_robes",
    "femme_hauts",
    "femme_pantalons",
    "femme_jupes",
    "femme_vestes_manteaux",
    "femme_lingerie",
    "femme_chaussures",
    "femme_sacs",
    "femme_maroquinerie",
    "femme_accessoires"
  ],
  "mode_homme": [
    "homme_chemises",
    "homme_tshirts_polos",
    "homme_pantalons",
    "homme_vestes_costumes",
    "homme_chaussures",
    "homme_accessoires"
  ],
  "enfants_bebe": [
    "enfant_bebe",
    "enfant_fille",
    "enfant_garcon",
    "enfant_chaussures",
    "enfant_jouets",
    "enfant_puericulture"
  ],
  "hightech": [
    "hightech_telephones",
    "hightech_ordinateurs",
    "hightech_audio",
    "hightech_accessoires"
  ],
  "beaute_cosmetiques": [
    "parfums",
    "beaute",
    "cheveux"
  ],
  "bijoux_montres": [
    "bijoux",
    "montres"
  ],
  "maison_deco": [
    "deco",
    "art"
  ],
  "evenementiel_mariages": [
    "mariages",
    "evenement",
    "mannequinerie"
  ],
  "alimentaire": [
    "alimentaire_patisserie",
    "alimentaire_epicerie",
    "alimentaire_boissons"
  ],
  "vehicules": [
    "vehicules_voiture",
    "vehicules_moto",
    "vehicules_pieces"
  ],
  "immobilier_vente": [
    "immo_maison",
    "immo_appartement",
    "immo_terrain"
  ],
  "mode_a_trier": [
    "mode",
    "chaussures",
    "sacs",
    "maroquinerie",
    "accessoires"
  ],
  "musique": [
    "musique_instruments",
    "musique_sono",
    "musique_accessoires"
  ],
  "sport_loisirs": [
    "sport_fitness",
    "sport_vetements",
    "sport_plein_air",
    "sport_velos"
  ],
  "electromenager": [
    "electro_cuisine",
    "electro_gros",
    "electro_froid"
  ],
  "animaux": [
    "animaux_nourriture",
    "animaux_accessoires"
  ],
  "beaute_domicile": [
    "beaute_coiffure",
    "beaute_maquillage",
    "beaute_esthetique",
    "ongles"
  ],
  "btp_bricolage": [
    "btp_maconnerie",
    "btp_peinture",
    "btp_menuiserie",
    "btp_architecture",
    "reparation",
    "jardinage"
  ],
  "informatique_digital": [
    "info_depannage",
    "info_site_web",
    "info_reseaux"
  ],
  "livraison_demenagement": [
    "demenagement",
    "coursier"
  ],
  "photo_video": [
    "photo_evenement",
    "photo_studio",
    "video_montage"
  ]
};
