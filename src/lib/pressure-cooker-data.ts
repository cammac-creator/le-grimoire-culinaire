export interface PressureCookerItem {
  name: string
  category: PressureCookerCategory
  minutes: number
  level: 1 | 2
  liquid: string
  note?: string
}

export type PressureCookerCategory =
  | 'legumes'
  | 'viande'
  | 'agneau'
  | 'volaille'
  | 'gibier'
  | 'poisson'
  | 'pommes-de-terre'
  | 'cereales'
  | 'legumes-secs'

export const CATEGORY_LABELS: Record<PressureCookerCategory, string> = {
  legumes: 'Légumes',
  viande: 'Viande',
  agneau: 'Agneau',
  volaille: 'Volaille',
  gibier: 'Gibier',
  poisson: 'Poisson',
  'pommes-de-terre': 'Pommes de terre',
  cereales: 'Céréales & Riz',
  'legumes-secs': 'Légumes secs',
}

export const CATEGORY_ICONS: Record<PressureCookerCategory, string> = {
  legumes: '🥦',
  viande: '🥩',
  agneau: '🐑',
  volaille: '🍗',
  gibier: '🦌',
  poisson: '🐟',
  'pommes-de-terre': '🥔',
  cereales: '🌾',
  'legumes-secs': '🫘',
}

export const PRESSURE_COOKER_DATA: PressureCookerItem[] = [
  // LÉGUMES
  { name: 'Asperges blanches', category: 'legumes', minutes: 8, level: 1, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Artichauts entiers', category: 'legumes', minutes: 20, level: 2, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Betterave', category: 'legumes', minutes: 35, level: 2, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Blettes en morceaux', category: 'legumes', minutes: 3, level: 2, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Carottes en bâtonnets', category: 'legumes', minutes: 4, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Céleri-rave en bâtonnets', category: 'legumes', minutes: 3, level: 1, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Chou blanc coupé en deux', category: 'legumes', minutes: 20, level: 1, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Choucroute crue', category: 'legumes', minutes: 25, level: 2, liquid: 'Selon la recette, min. 2 dl' },
  { name: 'Chou-fleur en fleurons', category: 'legumes', minutes: 6, level: 1, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Choux de Bruxelles', category: 'legumes', minutes: 4, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Choux-raves en tranches', category: 'legumes', minutes: 6, level: 2, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Chou rouge', category: 'legumes', minutes: 15, level: 2, liquid: 'Selon la recette, min. 2 dl' },
  { name: 'Épi de maïs', category: 'legumes', minutes: 7, level: 2, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Fenouil en quartiers', category: 'legumes', minutes: 8, level: 2, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Haricots secs', category: 'legumes', minutes: 15, level: 2, liquid: 'Recouvrir d\'eau' },
  { name: 'Haricots verts', category: 'legumes', minutes: 3, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Marrons', category: 'legumes', minutes: 6, level: 1, liquid: 'Grille perforée, min. 1 dl' },
  { name: 'Poireau en rondelles', category: 'legumes', minutes: 3, level: 2, liquid: 'Grille perforée, min. 1 dl' },

  // VIANDE
  { name: 'Bœuf en daube', category: 'viande', minutes: 15, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Côtes de porc', category: 'viande', minutes: 20, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Émincé de bœuf', category: 'viande', minutes: 15, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Émincé de porc', category: 'viande', minutes: 13, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Émincé de veau', category: 'viande', minutes: 15, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Jarret de veau en tranches', category: 'viande', minutes: 30, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Lard fumé / salé', category: 'viande', minutes: 25, level: 2, liquid: 'Recouvrir totalement d\'eau' },
  { name: 'Paupiettes de bœuf', category: 'viande', minutes: 15, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Ragoût de bœuf (goulash)', category: 'viande', minutes: 25, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Ragoût de porc (goulash)', category: 'viande', minutes: 25, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Ragoût de veau (goulash)', category: 'viande', minutes: 20, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Rôti de bœuf', category: 'viande', minutes: 45, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Rôti de porc', category: 'viande', minutes: 35, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Rôti de veau', category: 'viande', minutes: 30, level: 2, liquid: 'Selon la recette, min. 1 dl' },

  // AGNEAU
  { name: 'Ragoût d\'agneau (goulash)', category: 'agneau', minutes: 25, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Rôti d\'agneau', category: 'agneau', minutes: 30, level: 2, liquid: 'Selon la recette, min. 1 dl' },

  // VOLAILLE
  { name: 'Cuisse de poulet', category: 'volaille', minutes: 15, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Poulet entier', category: 'volaille', minutes: 20, level: 2, liquid: 'Selon la recette, min. 1 dl' },

  // GIBIER
  { name: 'Civet / ragoût de gibier', category: 'gibier', minutes: 20, level: 2, liquid: 'Selon la recette, min. 1 dl' },
  { name: 'Émincé de gibier', category: 'gibier', minutes: 15, level: 2, liquid: 'Selon la recette, min. 1 dl' },

  // POISSON
  { name: 'Poisson entier (ex: dorade)', category: 'poisson', minutes: 18, level: 1, liquid: 'Panier à étuver, min. 1 dl' },

  // POMMES DE TERRE
  { name: 'Petites, entières', category: 'pommes-de-terre', minutes: 8, level: 2, liquid: 'Grille perforée, min. 2 dl', note: 'Laisser évacuer la vapeur lentement' },
  { name: 'Grandes, entières', category: 'pommes-de-terre', minutes: 12, level: 2, liquid: 'Grille perforée, min. 2 dl', note: 'Laisser évacuer la vapeur lentement' },
  { name: 'Coupées en quatre', category: 'pommes-de-terre', minutes: 5, level: 2, liquid: 'Grille perforée, min. 2 dl', note: 'Laisser évacuer la vapeur lentement' },

  // CÉRÉALES
  { name: 'Maïs gros (Bramata)', category: 'cereales', minutes: 20, level: 1, liquid: 'Ratio 1 : 4' },
  { name: 'Risotto', category: 'cereales', minutes: 7, level: 1, liquid: 'Ratio 1 : 3' },
  { name: 'Riz complet', category: 'cereales', minutes: 30, level: 2, liquid: 'Ratio 1 : 2', note: 'Non trempé' },
  { name: 'Riz précuit', category: 'cereales', minutes: 7, level: 2, liquid: 'Ratio 1 : 2' },
  { name: 'Riz sauvage (mix)', category: 'cereales', minutes: 7, level: 2, liquid: 'Ratio 1 : 2' },

  // LÉGUMES SECS
  { name: 'Haricots rouges', category: 'legumes-secs', minutes: 10, level: 1, liquid: 'Ratio 1 : 3', note: 'Trempés 12h. Non trempés : +⅓ du temps' },
  { name: 'Lentilles vertes et brunes', category: 'legumes-secs', minutes: 7, level: 1, liquid: 'Ratio 1 : 3', note: 'Sans trempage' },
  { name: 'Pois chiches', category: 'legumes-secs', minutes: 7, level: 1, liquid: 'Ratio 1 : 3', note: 'Trempés 12h. Non trempés : +⅓ du temps' },
]
