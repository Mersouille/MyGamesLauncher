// src/data/achievements.js
// 🏆 Système de succès et achievements pour MyGames Launcher

export const achievementCategories = {
  BEGINNER: "Débutant",
  COLLECTOR: "Collectionneur",
  VETERAN: "Vétéran",
  MASTER: "Maître",
  LEGEND: "Légende",
};

export const achievements = [
  // 🎮 ACHIEVEMENTS DÉBUTANT
  {
    id: "first_game",
    name: "Premier Pas",
    description: "Ajouter votre premier jeu",
    icon: "🎮",
    category: achievementCategories.BEGINNER,
    rarity: "common",
    check: (stats) => stats.totalGames >= 1,
  },
  {
    id: "first_launch",
    name: "Ignition",
    description: "Lancer un jeu pour la première fois",
    icon: "🚀",
    category: achievementCategories.BEGINNER,
    rarity: "common",
    check: (stats) => stats.totalPlayTime > 0,
  },
  {
    id: "first_favorite",
    name: "Coup de Cœur",
    description: "Marquer un jeu comme favori",
    icon: "⭐",
    category: achievementCategories.BEGINNER,
    rarity: "common",
    check: (stats) => stats.favoritesCount >= 1,
  },
  {
    id: "first_collection",
    name: "Organisateur",
    description: "Créer votre première collection",
    icon: "📚",
    category: achievementCategories.BEGINNER,
    rarity: "common",
    check: (stats) => stats.collectionsCount >= 1,
  },

  // 🎯 ACHIEVEMENTS COLLECTIONNEUR
  {
    id: "collector_5",
    name: "Petit Catalogue",
    description: "Avoir 5 jeux dans votre bibliothèque",
    icon: "📦",
    category: achievementCategories.COLLECTOR,
    rarity: "common",
    check: (stats) => stats.totalGames >= 5,
  },
  {
    id: "collector_10",
    name: "Bibliothèque Naissante",
    description: "Avoir 10 jeux dans votre bibliothèque",
    icon: "📚",
    category: achievementCategories.COLLECTOR,
    rarity: "uncommon",
    check: (stats) => stats.totalGames >= 10,
  },
  {
    id: "collector_25",
    name: "Collectionneur Averti",
    description: "Avoir 25 jeux dans votre bibliothèque",
    icon: "🎯",
    category: achievementCategories.COLLECTOR,
    rarity: "uncommon",
    check: (stats) => stats.totalGames >= 25,
  },
  {
    id: "collector_50",
    name: "Archiviste",
    description: "Avoir 50 jeux dans votre bibliothèque",
    icon: "📖",
    category: achievementCategories.COLLECTOR,
    rarity: "rare",
    check: (stats) => stats.totalGames >= 50,
  },
  {
    id: "collector_100",
    name: "Collectionneur Légendaire",
    description: "Avoir 100 jeux dans votre bibliothèque",
    icon: "💎",
    category: achievementCategories.COLLECTOR,
    rarity: "epic",
    check: (stats) => stats.totalGames >= 100,
  },

  // ⏱️ ACHIEVEMENTS TEMPS DE JEU
  {
    id: "playtime_1h",
    name: "Première Heure",
    description: "Jouer pendant 1 heure",
    icon: "⏱️",
    category: achievementCategories.BEGINNER,
    rarity: "common",
    check: (stats) => stats.totalPlayTime >= 60,
  },
  {
    id: "playtime_10h",
    name: "Joueur Occasionnel",
    description: "Jouer pendant 10 heures",
    icon: "🕐",
    category: achievementCategories.VETERAN,
    rarity: "uncommon",
    check: (stats) => stats.totalPlayTime >= 600,
  },
  {
    id: "playtime_50h",
    name: "Joueur Régulier",
    description: "Jouer pendant 50 heures",
    icon: "⏰",
    category: achievementCategories.VETERAN,
    rarity: "rare",
    check: (stats) => stats.totalPlayTime >= 3000,
  },
  {
    id: "playtime_100h",
    name: "Vétéran",
    description: "Jouer pendant 100 heures",
    icon: "⌚",
    category: achievementCategories.VETERAN,
    rarity: "rare",
    check: (stats) => stats.totalPlayTime >= 6000,
  },
  {
    id: "playtime_250h",
    name: "Accro du Gaming",
    description: "Jouer pendant 250 heures",
    icon: "🎮",
    category: achievementCategories.VETERAN,
    rarity: "epic",
    check: (stats) => stats.totalPlayTime >= 15000,
  },
  {
    id: "playtime_500h",
    name: "No-Life",
    description: "Jouer pendant 500 heures",
    icon: "👑",
    category: achievementCategories.LEGEND,
    rarity: "legendary",
    check: (stats) => stats.totalPlayTime >= 30000,
  },

  // ⭐ ACHIEVEMENTS FAVORIS
  {
    id: "favorites_5",
    name: "Sélectif",
    description: "Avoir 5 jeux favoris",
    icon: "⭐",
    category: achievementCategories.COLLECTOR,
    rarity: "uncommon",
    check: (stats) => stats.favoritesCount >= 5,
  },
  {
    id: "favorites_10",
    name: "Passionné",
    description: "Avoir 10 jeux favoris",
    icon: "🌟",
    category: achievementCategories.COLLECTOR,
    rarity: "rare",
    check: (stats) => stats.favoritesCount >= 10,
  },

  // 📚 ACHIEVEMENTS COLLECTIONS
  {
    id: "collections_3",
    name: "Organisateur Pro",
    description: "Créer 3 collections",
    icon: "🗂️",
    category: achievementCategories.COLLECTOR,
    rarity: "uncommon",
    check: (stats) => stats.collectionsCount >= 3,
  },
  {
    id: "collections_5",
    name: "Maître de l'Organisation",
    description: "Créer 5 collections",
    icon: "🗃️",
    category: achievementCategories.MASTER,
    rarity: "rare",
    check: (stats) => stats.collectionsCount >= 5,
  },

  // 🎯 ACHIEVEMENTS SPÉCIAUX
  {
    id: "all_categories",
    name: "Diversifié",
    description: "Avoir au moins 1 jeu dans chaque catégorie",
    icon: "🎨",
    category: achievementCategories.MASTER,
    rarity: "rare",
    check: (stats) => stats.categoriesUsed >= 8,
  },
  {
    id: "night_owl",
    name: "Oiseau de Nuit",
    description: "Lancer un jeu après minuit",
    icon: "🦉",
    category: achievementCategories.VETERAN,
    rarity: "uncommon",
    check: (stats) => stats.nightLaunches >= 1,
  },
  {
    id: "marathon",
    name: "Marathon",
    description: "Avoir un jeu avec plus de 100h de jeu",
    icon: "🏃",
    category: achievementCategories.VETERAN,
    rarity: "rare",
    check: (stats) => stats.maxGamePlayTime >= 6000,
  },
  {
    id: "speedrunner",
    name: "Speedrunner",
    description: "Lancer 10 jeux en une journée",
    icon: "⚡",
    category: achievementCategories.MASTER,
    rarity: "epic",
    check: (stats) => stats.launchesInDay >= 10,
  },
  {
    id: "perfectionist",
    name: "Perfectionniste",
    description: "Avoir 5 jeux notés 5 étoiles",
    icon: "💯",
    category: achievementCategories.MASTER,
    rarity: "epic",
    check: (stats) => stats.fiveStarGames >= 5,
  },
  {
    id: "collector_ultimate",
    name: "Collection Ultime",
    description: "Avoir 200 jeux dans votre bibliothèque",
    icon: "🏆",
    category: achievementCategories.LEGEND,
    rarity: "legendary",
    check: (stats) => stats.totalGames >= 200,
  },
];

// 🎨 Couleurs par rareté
export const rarityColors = {
  common: "#9CA3AF", // Gris
  uncommon: "#10B981", // Vert
  rare: "#3B82F6", // Bleu
  epic: "#A855F7", // Violet
  legendary: "#F59E0B", // Or
};

// 📊 Calculer les statistiques nécessaires pour les achievements
export function calculateStats(games, collections, unlockedAchievements = []) {
  const totalGames = games.length;
  const totalPlayTime = games.reduce((sum, g) => sum + (g.playTime || 0), 0);
  const favoritesCount = games.filter((g) => g.favorite).length;
  const collectionsCount = collections.length;

  const categoriesUsed = new Set(games.map((g) => g.category)).size;
  const maxGamePlayTime = Math.max(0, ...games.map((g) => g.playTime || 0));
  const fiveStarGames = games.filter((g) => g.rating === 5).length;

  return {
    totalGames,
    totalPlayTime,
    favoritesCount,
    collectionsCount,
    categoriesUsed,
    maxGamePlayTime,
    fiveStarGames,
    nightLaunches: 0, // À implémenter avec tracking
    launchesInDay: 0, // À implémenter avec tracking
  };
}

// 🔓 Vérifier quels achievements sont débloqués
export function checkAchievements(stats, currentUnlocked = []) {
  const newlyUnlocked = [];

  achievements.forEach((achievement) => {
    const alreadyUnlocked = currentUnlocked.some((u) => u.id === achievement.id);
    if (!alreadyUnlocked && achievement.check(stats)) {
      newlyUnlocked.push({
        ...achievement,
        unlockedAt: new Date().toISOString(),
      });
    }
  });

  return newlyUnlocked;
}

// 📈 Calculer la progression d'un achievement
export function getAchievementProgress(achievement, stats) {
  // Pour les achievements basiques (check simple), on retourne 0 ou 100
  if (achievement.check(stats)) return 100;

  // Extraction de la valeur cible depuis la description
  const match = achievement.description.match(/\d+/);
  if (!match) return 0;

  const target = parseInt(match[0]);
  let current = 0;

  // Déterminer la valeur actuelle selon le type d'achievement
  if (achievement.id.includes("collector")) {
    current = stats.totalGames;
  } else if (achievement.id.includes("playtime")) {
    current = Math.floor(stats.totalPlayTime / 60); // Convertir en heures
  } else if (achievement.id.includes("favorites")) {
    current = stats.favoritesCount;
  } else if (achievement.id.includes("collections")) {
    current = stats.collectionsCount;
  }

  return Math.min(100, Math.round((current / target) * 100));
}

export default achievements;
