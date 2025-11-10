// scripts/check-build.js
/**
 * Vérification automatique avant build du projet MyGames Launcher
 * ---------------------------------------------------------------
 * Vérifie :
 * - la présence des fichiers essentiels
 * - la validité du JSON
 * - la correspondance des icônes
 */

const fs = require("fs");
const path = require("path");

console.log("🔍 Vérification avant build MyGames Launcher...\n");

// ------------------------------------------------------------
// 🔹 1. Fichiers essentiels
// ------------------------------------------------------------
const requiredFiles = [
  "main.cjs",
  "preload.cjs",
  "vite.config.mjs",
  "src/data/games.json",
  "assets/icon.ico",
];

const missing = requiredFiles.filter((f) => !fs.existsSync(path.join(__dirname, "..", f)));

if (missing.length > 0) {
  console.error("❌ Fichiers manquants :", missing.join(", "));
  process.exit(1);
} else {
  console.log("✅ Tous les fichiers essentiels sont présents.\n");
}

// ------------------------------------------------------------
// 🔹 2. Lecture du fichier games.json
// ------------------------------------------------------------
const gamesPath = path.join(__dirname, "..", "src", "data", "games.json");
let games = [];

try {
  const jsonData = fs.readFileSync(gamesPath, "utf-8");
  games = JSON.parse(jsonData);
  console.log(`🎮 ${games.length} jeux trouvés dans games.json.`);
} catch (err) {
  console.error("❌ Erreur de lecture du fichier games.json :", err.message);
  process.exit(1);
}

if (!Array.isArray(games) || games.length === 0) {
  console.warn("⚠️ Aucune entrée de jeu trouvée dans games.json.");
}

// ------------------------------------------------------------
// 🔹 3. Vérification des icônes
// ------------------------------------------------------------
const iconsDir = path.join(__dirname, "..", "dist-react", "icons");

if (!fs.existsSync(iconsDir)) {
  console.error("❌ Dossier des icônes introuvable :", iconsDir);
  process.exit(1);
}

let okIcons = 0;

games.forEach((game) => {
  const iconFile = path.join(iconsDir, game.icon);
  if (fs.existsSync(iconFile)) {
    okIcons++;
  } else {
    console.warn(`⚠️ Icône manquante pour "${game.name}" → ${game.icon}`);
  }
});

if (okIcons === games.length) {
  console.log("🖼️ Toutes les icônes sont présentes ✅");
} else {
  console.warn(`⚠️ ${games.length - okIcons} icône(s) manquante(s) sur ${games.length} jeu(x).`);
}

// ------------------------------------------------------------
// 🔹 4. Vérification du fichier package.json
// ------------------------------------------------------------
const pkgPath = path.join(__dirname, "..", "package.json");
const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf-8"));

if (!pkg.build || !pkg.build.extraResources) {
  console.warn("⚠️ Aucune section 'build.extraResources' trouvée dans package.json.");
} else {
  console.log("📦 Configuration 'build.extraResources' détectée.");
}

// ------------------------------------------------------------
// 🔹 5. Résumé final
// ------------------------------------------------------------
console.log("\n✅ Vérification terminée — prêt pour le build !");
console.log("💡 Lancement du build : npm run build-electron\n");
