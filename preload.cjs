// preload.cjs
const { contextBridge, ipcRenderer } = require("electron");
const fs = require("fs");
const path = require("path");

// ------------------------------------------------------------
// 🔹 Fonction : renvoie le chemin d’une icône encodée en base64
// ------------------------------------------------------------
function getIconPath(iconName) {
  if (!iconName) return "";

  try {
    const iconPath = path.join(__dirname, "dist-react", "icons", iconName);

    if (fs.existsSync(iconPath)) {
      const data = fs.readFileSync(iconPath);
      const ext = path.extname(iconName).slice(1).toLowerCase(); // png / jpg / jpeg
      const base64 = data.toString("base64");
      const uri = `data:image/${ext};base64,${base64}`;
      console.log("🧩 [PRELOAD] Base64 icon =", uri.slice(0, 80) + "...");
      return uri;
    } else {
      console.warn("⚠️ Icône introuvable :", iconPath);
    }
  } catch (err) {
    console.error("❌ Erreur de lecture d’icône :", err);
  }

  return "";
}

// ------------------------------------------------------------
// 🔹 Fonction : renvoie une URL utilisant le protocole local:// pour les jaquettes
// ------------------------------------------------------------
function getCoverUrl(coverName) {
  if (!coverName) return "";

  // Toujours utiliser le chemin relatif covers/... (qui peut contenir temp/)
  // Le protocole local:// sait gérer covers/temp/file.png
  const url = `local://covers/${coverName}`;
  console.log(`🔗 getCoverUrl(${coverName}) => ${url}`);
  return url;
}

// ------------------------------------------------------------
// 🔹 Fonction : retourne les versions d'Electron, Chrome et Node
// ------------------------------------------------------------
function getVersions() {
  const { electron, chrome, node } = process.versions;
  return {
    electron,
    chrome,
    node,
    timestamp: new Date().toISOString(), // utile pour debug
  };
}

// ------------------------------------------------------------
// 🔹 Exposition sécurisée des APIs vers le Renderer (React)
// ------------------------------------------------------------
contextBridge.exposeInMainWorld("electronAPI", {
  // ⚙️ Paramètres utilisateur
  getSettings: () => ipcRenderer.invoke("get-settings"),
  saveSettings: (settings) => ipcRenderer.invoke("save-settings", settings),

  // 🎮 Gestion des jeux
  getGames: () => ipcRenderer.invoke("get-games"),
  addGame: () => ipcRenderer.invoke("add-game"),
  launchGame: (game) => ipcRenderer.invoke("launch-game", game),

  // 🕹️ Écouter les mises à jour du temps de jeu
  onGameTimeUpdated: (callback) => {
    ipcRenderer.removeAllListeners("game-time-updated");
    ipcRenderer.on("game-time-updated", (_, data) => {
      if (callback) callback(data);
    });
  },

  // 🧭 Menu et événements (corrigé pour éviter les doublons)
  onAddGame: (callback) => {
    // Empêche d'empiler plusieurs fois le même listener
    ipcRenderer.removeAllListeners("menu-add-game");

    ipcRenderer.on("menu-add-game", (_, data) => {
      console.log("🧩 [DEBUG preload] Données reçues du main :", data); // 👈 ici
      if (callback && data) callback(data);
    });
  },

  // ⚙️ Écoute de l'ouverture des paramètres API depuis le menu
  onOpenApiSettings: (callback) => {
    ipcRenderer.removeAllListeners("menu-open-api-settings");
    ipcRenderer.on("menu-open-api-settings", () => {
      console.log("⚙️ [DEBUG preload] Ouverture paramètres API demandée");
      if (callback) callback();
    });
  },

  // 📝 Écoute de l'ouverture du journal depuis le menu
  onOpenJournal: (callback) => {
    ipcRenderer.removeAllListeners("menu-open-journal");
    ipcRenderer.on("menu-open-journal", () => {
      console.log("📝 [DEBUG preload] Ouverture Journal demandée");
      if (callback) callback();
    });
  },

  // 🌍 Mise à jour de la langue du menu
  updateMenuLanguage: (lang) => ipcRenderer.send("update-menu-language", lang),

  // 🖥️ Gestion du menu Electron
  hideMenu: () => ipcRenderer.invoke("hide-menu"),
  showMenu: () => ipcRenderer.invoke("show-menu"),

  // 🖥️ Écoute des changements de plein écran natif
  onFullscreenChange: (callback) => {
    const handler = (_, isFullscreen) => {
      if (callback) callback(isFullscreen);
    };
    
    ipcRenderer.on("fullscreen-changed", handler);
    
    // Retourner une fonction de nettoyage
    return () => {
      ipcRenderer.removeListener("fullscreen-changed", handler);
    };
  },

  // 🧩 Gestion des icônes
  getIconPath,
  getCoverUrl,

  // 📁 Récupère le chemin de l’app (utile pour debug)
  getAppPath: () => ipcRenderer.invoke("get-app-path"),

  // 💾 Sauvegarde de la liste des jeux
  saveGames: (games) => ipcRenderer.invoke("save-games", games),

  // 🔍 Informations de version (debug)
  getVersions,

  // 🔽 Télécharge une image depuis une URL et la sauvegarde dans /covers
  downloadImage: (url, filename) => ipcRenderer.invoke("download-image", { url, filename }),
  // 🔗 Requêtes vers l'API SteamGridDB (générique)
  sgdbRequest: ({ apiKey, path, method = "GET", params = {}, body = null }) =>
    ipcRenderer.invoke("sgdb-request", { apiKey, path, method, params, body }),
  // Helpers plus spécifiques
  sgdbSearch: ({ apiKey, term }) => ipcRenderer.invoke("sgdb-search", { apiKey, term }),
  sgdbGetGrids: ({ apiKey, gameId }) => ipcRenderer.invoke("sgdb-get-grids", { apiKey, gameId }),
  sgdbDownloadFirstGrid: ({ apiKey, term, filenamePrefix }) =>
    ipcRenderer.invoke("sgdb-download-first-grid", { apiKey, term, filenamePrefix }),
  sgdbValidateKey: ({ apiKey }) => ipcRenderer.invoke("sgdb-validate-key", { apiKey }),
  // 🖼️ Récupérer toutes les grids disponibles pour un jeu
  sgdbGetAllGrids: ({ apiKey, term }) => ipcRenderer.invoke("sgdb-get-all-grids", { apiKey, term }),
  // 🔽 Télécharger une grid spécifique par URL
  sgdbDownloadGridByUrl: ({ url, filenamePrefix }) =>
    ipcRenderer.invoke("sgdb-download-grid-by-url", { url, filenamePrefix }),

  // 🎮 Scanner de launchers pour import automatique
  scanSteamGames: () => ipcRenderer.invoke("scan-steam-games"),
  scanEpicGames: () => ipcRenderer.invoke("scan-epic-games"),
  scanUbisoftGames: () => ipcRenderer.invoke("scan-ubisoft-games"),
  scanBattlenetGames: () => ipcRenderer.invoke("scan-battlenet-games"),
  scanOriginGames: () => ipcRenderer.invoke("scan-origin-games"),
  scanGOGGames: () => ipcRenderer.invoke("scan-gog-games"),
  scanRockstarGames: () => ipcRenderer.invoke("scan-rockstar-games"),
  importGame: (game) => ipcRenderer.invoke("import-game", game),

  // 📚 Gestion des collections personnalisées
  saveCollections: (collections) => ipcRenderer.invoke("save-collections", collections),
  getCollections: () => ipcRenderer.invoke("get-collections"),

  // 🏆 Gestion des achievements
  saveAchievements: (achievements) => ipcRenderer.invoke("save-achievements", achievements),
  getAchievements: () => ipcRenderer.invoke("get-achievements"),

  // 🎮 Gestion des profils de contrôleurs
  saveControllerProfiles: (profiles) => ipcRenderer.invoke("save-controller-profiles", profiles),
  getControllerProfiles: () => ipcRenderer.invoke("get-controller-profiles"),

  // 🔌 Méthodes génériques pour écouter les événements du menu
  on: (channel, callback) => {
    ipcRenderer.on(channel, (_, ...args) => callback(...args));
  },
  off: (channel, callback) => {
    ipcRenderer.removeListener(channel, callback);
  },
  removeAllListeners: (channel) => {
    ipcRenderer.removeAllListeners(channel);
  },

  // 🔄 Mises à jour applicatives
  checkForUpdates: () => ipcRenderer.invoke("updates-check"),
  quitAndInstall: () => ipcRenderer.invoke("updates-quit-and-install"),
  onUpdateStatus: (callback) => {
    ipcRenderer.removeAllListeners("update-status");
    ipcRenderer.on("update-status", (_, payload) => callback && callback(payload));
  },

  // 📝 Journal de conversation (JSON côté userData)
  saveConversationEntry: (entry) => ipcRenderer.invoke("save-conversation-entry", entry),
  getConversationHistory: () => ipcRenderer.invoke("get-conversation-history"),
  clearConversationHistory: () => ipcRenderer.invoke("clear-conversation-history"),
});

// ------------------------------------------------------------
// 🔹 Synchronisation du menu depuis le front
// ------------------------------------------------------------
ipcRenderer.on("menu-language-changed", (_, lang) => {
  console.log(`🌐 [PRELOAD] Langue du menu changée : ${lang}`);
});
