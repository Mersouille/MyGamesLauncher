// main.cjs
// Désactive les warnings de sécurité d'Electron uniquement en développement
// (utile pour éviter le bandeau jaune lié à 'unsafe-eval' lors du HMR de Vite)
// On ne doit JAMAIS désactiver ces warnings en production.
const devRun =
  process.env.NODE_ENV === "development" || process.env.npm_lifecycle_event === "start";
if (devRun) {
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = "true";
}
const { app, BrowserWindow, ipcMain, protocol, dialog, Menu, session } = require("electron");
const { autoUpdater } = require("electron-updater");

// 🔓 DÉSACTIVE COMPLÈTEMENT LA SÉCURITÉ WEB POUR ÉVITER CSP
app.commandLine.appendSwitch("disable-web-security");
app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors");

// Log utile pour savoir si les warnings de sécurité ont été désactivés
console.log(
  `🛡️ Dev mode: ${devRun} — ELECTRON_DISABLE_SECURITY_WARNINGS=${
    process.env.ELECTRON_DISABLE_SECURITY_WARNINGS || "unset"
  }`
);

let currentLang = "fr"; // 🌍 langue par défaut du menu
const path = require("path");
const fs = require("fs");
const Store = require("electron-store");

// 🧩 Définit un vrai nom d'application pour AppData
app.setName("MyGames Launcher");
app.setPath("userData", path.join(app.getPath("appData"), "MyGames Launcher"));

// 📦 Initialisation du stockage persistant pour les jeux
const store = new Store({
  name: "games",
  projectName: "MyGames Launcher", // ✅ crée son propre dossier dans AppData
});

// ------------------------------------------------------------
// 🔁 Migration automatique depuis l'ancien fichier src/data/games.json
try {
  const oldGamesPath = path.join(__dirname, "src", "data", "games.json");

  if (fs.existsSync(oldGamesPath)) {
    console.log("🧩 Migration détectée : ancien fichier games.json trouvé.");

    const oldData = fs.readFileSync(oldGamesPath, "utf-8");
    const oldGames = JSON.parse(oldData);

    const currentGames = store.get("games", []);
    if (currentGames.length === 0 && oldGames.length > 0) {
      store.set("games", oldGames);
      console.log(`✅ Migration réussie (${oldGames.length} jeux transférés).`);

      const backupPath = path.join(__dirname, "src", "data", "games_backup.json");
      fs.renameSync(oldGamesPath, backupPath);
      console.log("📦 Ancien fichier renommé en games_backup.json");
    } else {
      console.log("ℹ️ Migration ignorée : données déjà présentes dans electron-store.");
    }
  } else {
    console.log("✅ Aucun ancien fichier à migrer (electron-store déjà en place).");
  }
} catch (err) {
  console.error("❌ Erreur lors de la migration :", err);
}

// ------------------------------------------------------------
// 🔹 Déclare le protocole myapp:// comme sécurisé (pour compatibilité future)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "myapp",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// Déclare également le schéma `local` comme privilégié pour permettre
// l'utilisation depuis le renderer (fetch(), <img src="local://...">, etc.)
protocol.registerSchemesAsPrivileged([
  {
    scheme: "local",
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

let win;
let splash; // 🎬 Fenêtre de chargement (splash screen)

// ------------------------------------------------------------
// 🎬 Création de l'écran de chargement
function createSplashScreen() {
  splash = new BrowserWindow({
    width: 400,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    resizable: false,
    backgroundColor: "#00000000",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // HTML inline pour l'écran de chargement
  const splashHTML = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body {
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          font-family: 'Segoe UI', Tahoma, sans-serif;
          color: white;
          overflow: hidden;
          border-radius: 12px;
        }
        .container {
          text-align: center;
        }
        .logo {
          font-size: 48px;
          margin-bottom: 20px;
          animation: pulse 2s ease-in-out infinite;
        }
        .title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 30px;
          letter-spacing: 2px;
        }
        .spinner {
          width: 50px;
          height: 50px;
          border: 4px solid rgba(255, 255, 255, 0.3);
          border-top: 4px solid white;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        .loading-text {
          margin-top: 20px;
          font-size: 14px;
          opacity: 0.9;
          animation: fadeInOut 1.5s ease-in-out infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }
        @keyframes fadeInOut {
          0%, 100% { opacity: 0.5; }
          50% { opacity: 1; }
        }
      </style>
    </head>
    <body>
      <div class="logo">🎮</div>
      <div class="title">MyGames Launcher</div>
      <div class="spinner"></div>
      <div class="loading-text">Chargement en cours...</div>
    </body>
    </html>
  `;

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(splashHTML)}`);
  splash.center();
}

// ------------------------------------------------------------
// 🔹 Création de la fenêtre principale
function createWindow() {
  const preloadPath = path.join(__dirname, "preload.cjs");

  win = new BrowserWindow({
    width: 1200,
    height: 800,
    backgroundColor: "#1a1a1a",
    show: false, // ✅ Ne pas afficher immédiatement
    webPreferences: {
      preload: preloadPath,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
      // ⚠️ webSecurity désactivé pour éviter les problèmes de CSP avec Vite
      webSecurity: false,
      allowRunningInsecureContent: true, // ✅ Permet tout contenu
      // ✅ Autorise l'autoplay audio
      autoplayPolicy: "no-user-gesture-required",
      // 🔒 DÉSACTIVER COMPLÈTEMENT LE CSP
      experimentalFeatures: true,
      enableBlinkFeatures: "BypassCSP", // ✅ BYPASS COMPLET DU CSP
    },
  });

  // 🔸 Supprime le menu anglais par défaut
  Menu.setApplicationMenu(null);

  // 🔒 SUPPRIMER TOUS LES HEADERS CSP qui bloquent les scripts inline de Vite
  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };
    // Supprimer tous les headers CSP possibles
    delete responseHeaders["content-security-policy"];
    delete responseHeaders["Content-Security-Policy"];
    delete responseHeaders["x-webkit-csp"];
    delete responseHeaders["X-WebKit-CSP"];
    delete responseHeaders["x-content-security-policy"];
    delete responseHeaders["X-Content-Security-Policy"];

    callback({ responseHeaders });
  });

  // Configuration des en-têtes pour le développement
  if (!app.isPackaged) {
    try {
      // DevTools désactivés au démarrage (utilisez le menu Affichage > DevTools si besoin)
      // win.webContents.openDevTools();

      session.defaultSession.webRequest.onBeforeSendHeaders((details, callback) => {
        const headers = details.requestHeaders;
        headers["Origin"] = "http://localhost:5174";
        callback({ cancel: false, requestHeaders: headers });
      });

      win.loadURL("http://localhost:5174").catch((err) => {
        console.error("❌ Erreur lors du chargement de l'URL de dev:", err);
      });
    } catch (err) {
      console.error("❌ Erreur lors de la configuration dev:", err);
    }
  } else {
    win.loadFile(path.join(__dirname, "dist-react", "index.html")).catch((err) => {
      console.error("❌ Erreur lors du chargement du fichier de prod:", err);
    });
  }

  // ✅ Gérer le splash screen via executeJavaScript (évite script inline bloqué par CSP)
  win.webContents.on("did-finish-load", () => {
    win.webContents
      .executeJavaScript(
        `
      setTimeout(() => {
        const splash = document.getElementById('splash-screen');
        const root = document.getElementById('root');
        if (splash) splash.style.display = 'none';
        if (root) root.style.display = 'block';
      }, 800);
    `
      )
      .catch((err) => console.error("❌ Erreur executeJavaScript splash:", err));
  });

  // ✅ Afficher la fenêtre principale quand elle est prête et fermer le splash
  win.once("ready-to-show", () => {
    setTimeout(() => {
      if (splash && !splash.isDestroyed()) {
        splash.close();
      }
      win.show();
      win.focus();
      console.log("✅ Fenêtre principale affichée");
    }, 500); // Petit délai pour une transition plus smooth
  });

  // 🖥️ Gérer le menu en mode plein écran (via événements Electron natifs)
  // ⚠️ TEMPORAIREMENT DÉSACTIVÉ - Ces événements causent des crashes
  /*
  win.on("enter-full-screen", () => {
    try {
      // Vérifier que la fenêtre existe et n'est pas détruite
      if (!win || win.isDestroyed()) {
        console.warn("⚠️ Fenêtre détruite lors de enter-full-screen");
        return;
      }
      
      // Masquer le menu Electron en mode plein écran
      Menu.setApplicationMenu(null);
      console.log("🖥️ [Event] Mode plein écran activé - Menu Electron masqué");
      
      // Notifier le renderer du changement (avec vérification et délai)
      setTimeout(() => {
        if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
          try {
            win.webContents.send("fullscreen-changed", true);
          } catch (sendError) {
            console.error("❌ Erreur envoi fullscreen-changed:", sendError);
          }
        }
      }, 50);
    } catch (error) {
      console.error("❌ Erreur enter-full-screen:", error);
    }
  });

  win.on("leave-full-screen", () => {
    try {
      // Vérifier que la fenêtre existe et n'est pas détruite
      if (!win || win.isDestroyed()) {
        console.warn("⚠️ Fenêtre détruite lors de leave-full-screen");
        return;
      }
      
      // Restaurer le menu Electron en sortant du plein écran (avec délai)
      setTimeout(() => {
        if (!win || win.isDestroyed()) return;
        
        try {
          createAppMenu(currentLang);
          console.log("🖥️ [Event] Mode plein écran désactivé - Menu Electron restauré");
        } catch (menuError) {
          console.error("❌ Erreur lors de la restauration du menu:", menuError);
        }
      }, 100);
      
      // Notifier le renderer du changement (avec vérification et délai)
      setTimeout(() => {
        if (win && !win.isDestroyed() && win.webContents && !win.webContents.isDestroyed()) {
          try {
            win.webContents.send("fullscreen-changed", false);
          } catch (sendError) {
            console.error("❌ Erreur envoi fullscreen-changed:", sendError);
          }
        }
      }, 50);
    } catch (error) {
      console.error("❌ Erreur leave-full-screen:", error);
    }
  });
  */
  console.log("⚠️ Les événements fullscreen natifs sont désactivés temporairement");
}

// ------------------------------------------------------------
// 🔹 Gestion de la persistance des jeux
ipcMain.handle("get-games", async () => {
  const games = store.get("games", []);
  console.log("📦 [Electron Store] Jeux chargés :", games.length);
  return games;
});

ipcMain.handle("save-games", async (_, games) => {
  store.set("games", games);
  console.log("💾 [Electron Store] Jeux sauvegardés :", games.length);
  return true;
});

// ------------------------------------------------------------
// 🔹 Sauvegarde des paramètres utilisateur
ipcMain.handle("save-settings", async (event, settings) => {
  try {
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    console.log("⚙️ Paramètres sauvegardés :", settingsPath);
    return true;
  } catch (err) {
    console.error("❌ Erreur save-settings :", err);
    return false;
  }
});

// 🔹 Lecture des paramètres utilisateur
ipcMain.handle("get-settings", async () => {
  try {
    const settingsPath = path.join(app.getPath("userData"), "settings.json");
    if (fs.existsSync(settingsPath)) {
      const data = fs.readFileSync(settingsPath, "utf-8");
      return JSON.parse(data);
    }
    return {};
  } catch (err) {
    console.error("❌ Erreur get-settings :", err);
    return {};
  }
});

// ------------------------------------------------------------
// 📚 Gestion des collections personnalisées
// ------------------------------------------------------------

// 🔹 Sauvegarder les collections
ipcMain.handle("save-collections", async (_, collections) => {
  try {
    store.set("collections", collections);
    console.log("📚 Collections sauvegardées :", collections.length);
    return true;
  } catch (err) {
    console.error("❌ Erreur save-collections :", err);
    return false;
  }
});

// 🔹 Récupérer les collections
ipcMain.handle("get-collections", async () => {
  try {
    const collections = store.get("collections", []);
    console.log("📚 Collections chargées :", collections.length);
    return collections;
  } catch (err) {
    console.error("❌ Erreur get-collections :", err);
    return [];
  }
});

// ------------------------------------------------------------
// 🏆 Gestion des achievements
// ------------------------------------------------------------

// 🔹 Sauvegarder les achievements
ipcMain.handle("save-achievements", async (_, achievements) => {
  try {
    store.set("achievements", achievements);
    console.log("🏆 Achievements sauvegardés :", achievements.length);
    return true;
  } catch (err) {
    console.error("❌ Erreur save-achievements :", err);
    return false;
  }
});

// 🔹 Récupérer les achievements
ipcMain.handle("get-achievements", async () => {
  try {
    const achievements = store.get("achievements", []);
    console.log("🏆 Achievements chargés :", achievements.length);
    return achievements;
  } catch (err) {
    console.error("❌ Erreur get-achievements :", err);
    return [];
  }
});

// 🎮 Sauvegarder les profils de contrôleurs
ipcMain.handle("save-controller-profiles", async (_, profiles) => {
  try {
    store.set("controllerProfiles", profiles);
    console.log("🎮 Profils de contrôleurs sauvegardés :", profiles.length);
    return true;
  } catch (err) {
    console.error("❌ Erreur save-controller-profiles :", err);
    return false;
  }
});

// 🎮 Récupérer les profils de contrôleurs
ipcMain.handle("get-controller-profiles", async () => {
  try {
    const profiles = store.get("controllerProfiles", []);
    console.log("🎮 Profils de contrôleurs chargés :", profiles.length);
    return profiles;
  } catch (err) {
    console.error("❌ Erreur get-controller-profiles :", err);
    return [];
  }
});

// ------------------------------------------------------------
// � Télécharge une image depuis une URL et la sauvegarde dans /covers
// Usage: ipcRenderer.invoke('download-image', { url, filename })
// Retourne { success: true, path } ou { success: false, error }
ipcMain.handle("download-image", async (_, { url, filename }) => {
  try {
    if (!url || !filename) throw new Error("url and filename are required");

    // Assure que le dossier covers existe (dans userData en production)
    const coversDir = path.join(app.getPath("userData"), "covers");
    ensureDirectory(coversDir);

    // Utilise fetch (Node 18+ / Electron) pour récupérer l'image
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Sanitize filename
    const safeName = filename.replace(/[^a-zA-Z0-9._-]/g, "_");
    const outPath = path.join(coversDir, safeName);

    fs.writeFileSync(outPath, buffer);

    console.log(`✅ Image téléchargée: ${url} -> ${outPath}`);
    return { success: true, path: outPath };
  } catch (err) {
    console.error("❌ download-image error:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// 🖥️ Gestion du menu Electron (masquer/afficher)
ipcMain.handle("hide-menu", async () => {
  try {
    if (win && !win.isDestroyed()) {
      // 🔧 Utiliser setMenuBarVisibility au lieu de setApplicationMenu
      // qui fonctionne mieux sur Windows pour masquer la barre de menu
      win.setMenuBarVisibility(false);
      win.setAutoHideMenuBar(true);
      console.log("🖥️ Menu masqué (demande depuis renderer)");
      return { success: true };
    }
    return { success: false, error: "Window not available" };
  } catch (error) {
    console.error("❌ Erreur hide-menu:", error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle("show-menu", async () => {
  try {
    if (win && !win.isDestroyed()) {
      // 🔧 Restaurer la visibilité de la barre de menu
      win.setMenuBarVisibility(true);
      win.setAutoHideMenuBar(false);
      console.log("🖥️ Menu restauré (demande depuis renderer)");
      return { success: true };
    }
    return { success: false, error: "Window not available" };
  } catch (error) {
    console.error("❌ Erreur show-menu:", error);
    return { success: false, error: error.message };
  }
});

// ------------------------------------------------------------
// � SteamGridDB: handler générique pour appeler l'API (auth via apiKey)
// Usage: ipcRenderer.invoke('sgdb-request', { apiKey, path, method, params, body })
ipcMain.handle(
  "sgdb-request",
  async (_, { apiKey, path: apiPath, method = "GET", params = {}, body = null }) => {
    try {
      apiKey = String(apiKey || "").trim();
      if (!apiKey) throw new Error("apiKey is required (empty after trim)");
      if (!apiPath) throw new Error("path is required");

      const base = "https://www.steamgriddb.com/api/v2/"; // trailing slash is important
      const cleanPath = String(apiPath || "").replace(/^\/+/, "");
      const url = new URL(cleanPath, base);
      console.log(`🔗 [sgdb-request] ${method} -> ${url.toString()} (hasAuth=${!!apiKey})`);

      // add query params
      Object.keys(params || {}).forEach((k) => url.searchParams.set(k, params[k]));

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${apiKey}`,
        // Some servers redirect to HTML pages when User-Agent is missing; set a browser-like UA and referer
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyGamesLauncher/1.0",
        Referer: "https://www.steamgriddb.com/",
      };
      console.log(
        "   -> request headers:",
        Object.keys(headers).join(", "),
        "Authorization present=",
        !!headers.Authorization
      );

      const options = { method, headers };
      if (body) {
        options.body = typeof body === "string" ? body : JSON.stringify(body);
        headers["Content-Type"] = headers["Content-Type"] || "application/json";
      }

      const res = await fetch(url.toString(), options);
      console.log(`⬅️ [sgdb-request] HTTP ${res.status} ${res.statusText} for ${url.toString()}`);
      try {
        console.log(`   response.url=${res.url}`);
        console.log(`   content-type=${res.headers.get("content-type")}`);
      } catch (e) {}
      const text = await res.text();
      let data = null;
      try {
        data = text ? JSON.parse(text) : null;
      } catch (e) {
        data = text;
      }

      if (!res.ok) {
        // avoid dumping huge HTML pages into the error message
        const short = typeof data === "string" ? data.slice(0, 400) : JSON.stringify(data);
        throw new Error(`SGDB ${res.status} ${res.statusText}: ${short}`);
      }

      return { success: true, data };
    } catch (err) {
      console.error("❌ sgdb-request error:", err);
      return { success: false, error: err.message || String(err) };
    }
  }
);

// ------------------------------------------------------------
// 🔹 SGDB: recherche rapide (autocomplete)
ipcMain.handle("sgdb-search", async (_, { apiKey, term }) => {
  try {
    apiKey = String(apiKey || "").trim();
    if (!apiKey) throw new Error("apiKey is required (empty after trim)");
    if (!term) throw new Error("term is required");

    const base = "https://www.steamgriddb.com/api/v2/";
    const url = new URL(`search/autocomplete/${encodeURIComponent(term)}`, base);
    console.log(`🔍 [sgdb-search] GET -> ${url.toString()} (term='${term}')`);

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyGamesLauncher/1.0",
      Referer: "https://www.steamgriddb.com/",
    };
    console.log(
      "   -> request headers:",
      Object.keys(headers).join(", "),
      "Authorization present=",
      !!headers.Authorization
    );
    const res = await fetch(url.toString(), { method: "GET", headers });
    console.log(
      `⬅️ [sgdb-search] HTTP ${res.status} ${
        res.statusText
      } for ${url.toString()} (hasAuth=${!!apiKey})`
    );
    try {
      console.log(`   response.url=${res.url}`);
      console.log(`   content-type=${res.headers.get("content-type")}`);
    } catch (e) {}
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    if (!res.ok) {
      const short = typeof data === "string" ? data.slice(0, 400) : JSON.stringify(data);
      throw new Error(`SGDB ${res.status} ${res.statusText}: ${short}`);
    }
    return { success: true, data };
  } catch (err) {
    console.error("❌ sgdb-search error:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// 🔹 SGDB: obtenir les grids pour un jeu donné
ipcMain.handle("sgdb-get-grids", async (_, { apiKey, gameId }) => {
  try {
    apiKey = String(apiKey || "").trim();
    if (!apiKey) throw new Error("apiKey is required (empty after trim)");
    if (!gameId) throw new Error("gameId is required");

    const base = "https://www.steamgriddb.com/api/v2/";
    const url = new URL(`grids/game/${gameId}`, base);
    console.log(`🔍 [sgdb-get-grids] GET -> ${url.toString()} (gameId=${gameId})`);

    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyGamesLauncher/1.0",
      Referer: "https://www.steamgriddb.com/",
    };
    console.log(
      "   -> request headers:",
      Object.keys(headers).join(", "),
      "Authorization present=",
      !!headers.Authorization
    );
    const res = await fetch(url.toString(), { method: "GET", headers });
    console.log(
      `⬅️ [sgdb-get-grids] HTTP ${res.status} ${
        res.statusText
      } for ${url.toString()} (hasAuth=${!!apiKey})`
    );
    try {
      console.log(`   response.url=${res.url}`);
      console.log(`   content-type=${res.headers.get("content-type")}`);
    } catch (e) {}
    const text = await res.text();
    let data = null;
    try {
      data = text ? JSON.parse(text) : null;
    } catch (e) {
      data = text;
    }
    if (!res.ok) {
      const short = typeof data === "string" ? data.slice(0, 400) : JSON.stringify(data);
      throw new Error(`SGDB ${res.status} ${res.statusText}: ${short}`);
    }
    return { success: true, data };
  } catch (err) {
    console.error("❌ sgdb-get-grids error:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// 🔹 SGDB: validation de la clé (teste plusieurs endpoints et renvoie un rapport)
ipcMain.handle("sgdb-validate-key", async (_, params = {}) => {
  try {
    let apiKey = params.apiKey ?? params.apikey ?? params.key ?? "";
    apiKey = String(apiKey || "").trim();
    if (!apiKey) throw new Error("apiKey is required (empty after trim)");

    const base = "https://www.steamgriddb.com/api/v2/";
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyGamesLauncher/1.0",
      Referer: "https://www.steamgriddb.com/",
    };

    const endpoints = [
      { name: "search", path: "search/autocomplete/Portal" },
      { name: "game", path: "games/id/8286" },
    ];

    const results = [];
    for (const ep of endpoints) {
      const url = new URL(ep.path, base).toString();
      console.log(`🔎 [sgdb-validate-key] calling ${url}`);
      const res = await fetch(url, { method: "GET", headers });
      const status = res.status;
      const statusText = res.statusText;
      let text = "";
      try {
        text = await res.text();
      } catch (e) {
        text = String(e.message || e);
      }
      const contentType = res.headers && res.headers.get ? res.headers.get("content-type") : null;
      results.push({
        name: ep.name,
        url,
        status,
        statusText,
        contentType,
        snippet: text ? text.slice(0, 800) : "",
      });
    }

    console.log("✅ sgdb-validate-key handler executed, returning", results.length, "results");
    return { success: true, results };
  } catch (err) {
    console.error("❌ sgdb-validate-key error:", err);
    return { success: false, error: err.message || String(err) };
  }
});
console.log("✅ Handler enregistré: sgdb-validate-key");

// ------------------------------------------------------------
// 🔹 SGDB: rechercher + télécharger la première grille trouvée pour un jeu
ipcMain.handle("sgdb-download-first-grid", async (_, { apiKey, term, filenamePrefix = "" }) => {
  try {
    apiKey = String(apiKey || "").trim();
    if (!apiKey) throw new Error("apiKey is required (empty after trim)");
    if (!term) throw new Error("term is required");

    // 1) recherche
    const searchBase = "https://www.steamgriddb.com/api/v2/";
    const searchUrl = new URL(`search/autocomplete/${encodeURIComponent(term)}`, searchBase);
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyGamesLauncher/1.0",
      Referer: "https://www.steamgriddb.com/",
    };
    console.log(
      "   -> request headers:",
      Object.keys(headers).join(", "),
      "Authorization present=",
      !!headers.Authorization
    );
    const searchRes = await fetch(searchUrl.toString(), { method: "GET", headers });
    console.log(
      `⬅️ [sgdb-download-first-grid] HTTP ${searchRes.status} ${
        searchRes.statusText
      } for ${searchUrl.toString()} (hasAuth=${!!apiKey})`
    );
    try {
      console.log(`   response.url=${searchRes.url}`);
      console.log(`   content-type=${searchRes.headers.get("content-type")}`);
    } catch (e) {}
    const searchText = await searchRes.text();
    let searchData = null;
    try {
      searchData = searchText ? JSON.parse(searchText) : null;
    } catch (e) {
      searchData = searchText;
    }
    if (!searchRes.ok) {
      const short =
        typeof searchData === "string" ? searchData.slice(0, 400) : JSON.stringify(searchData);
      throw new Error(`SGDB search ${searchRes.status} ${searchRes.statusText}: ${short}`);
    }
    // API v2 returns { success: true, data: [...] }
    const results = searchData?.data || searchData;
    const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
    if (!first) return { success: false, error: "No search results" };

    // 2) obtenir les grids
    const gridsUrl = new URL(`grids/game/${first.id}`, searchBase);
    const gridsRes = await fetch(gridsUrl.toString(), { method: "GET", headers });
    console.log(
      `⬅️ [sgdb-download-first-grid] HTTP ${gridsRes.status} ${
        gridsRes.statusText
      } for ${gridsUrl.toString()} (hasAuth=${!!apiKey})`
    );
    try {
      console.log(`   response.url=${gridsRes.url}`);
      console.log(`   content-type=${gridsRes.headers.get("content-type")}`);
    } catch (e) {}
    const gridsText = await gridsRes.text();
    let gridsData = null;
    try {
      gridsData = gridsText ? JSON.parse(gridsText) : null;
    } catch (e) {
      gridsData = gridsText;
    }
    if (!gridsRes.ok) {
      const short =
        typeof gridsData === "string" ? gridsData.slice(0, 400) : JSON.stringify(gridsData);
      throw new Error(`SGDB grids ${gridsRes.status} ${gridsRes.statusText}: ${short}`);
    }
    const list = Array.isArray(gridsData.data) ? gridsData.data : gridsData;
    if (!list || list.length === 0) return { success: false, error: "No grids found" };

    // 3) choisir la première image avec un champ url
    const pick = list.find((i) => i && (i.url || i.image || i.thumb || i.thumbnail)) || list[0];
    const imageUrl = pick.url || pick.image || pick.thumb || pick.thumbnail;
    if (!imageUrl) return { success: false, error: "No downloadable url on chosen grid" };

    // 4) téléchargement (réplique la logique de download-image pour rester synchrone ici)
    try {
      const coversDir = path.join(app.getPath("userData"), "covers");
      ensureDirectory(coversDir);
      const resImg = await fetch(imageUrl);
      if (!resImg.ok) throw new Error(`HTTP ${resImg.status} ${resImg.statusText}`);
      const arrayBufferImg = await resImg.arrayBuffer();
      const bufferImg = Buffer.from(arrayBufferImg);
      const safeName = `${filenamePrefix}${path.basename(imageUrl)}`.replace(
        /[^a-zA-Z0-9._-]/g,
        "_"
      );
      const outPath = path.join(coversDir, safeName);
      fs.writeFileSync(outPath, bufferImg);
      return { success: true, path: outPath };
    } catch (err) {
      console.error("❌ download via sgdb-download-first-grid error:", err);
      return { success: false, error: err.message || String(err) };
    }
  } catch (err) {
    console.error("❌ sgdb-download-first-grid error:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// 🔹 SGDB: récupérer toutes les grids disponibles pour permettre à l'utilisateur de choisir
ipcMain.handle("sgdb-get-all-grids", async (_, { apiKey, term }) => {
  try {
    apiKey = String(apiKey || "").trim();
    if (!apiKey) throw new Error("apiKey is required (empty after trim)");
    if (!term) throw new Error("term is required");

    const searchBase = "https://www.steamgriddb.com/api/v2/";
    const headers = {
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) MyGamesLauncher/1.0",
      Referer: "https://www.steamgriddb.com/",
    };

    // 1) Recherche
    const searchUrl = new URL(`search/autocomplete/${encodeURIComponent(term)}`, searchBase);
    const searchRes = await fetch(searchUrl.toString(), { method: "GET", headers });
    const searchText = await searchRes.text();
    const searchData = searchText ? JSON.parse(searchText) : null;

    if (!searchRes.ok) {
      throw new Error(`SGDB search ${searchRes.status} ${searchRes.statusText}`);
    }

    const results = searchData?.data || searchData;
    const first = Array.isArray(results) && results.length > 0 ? results[0] : null;
    if (!first) return { success: false, error: "No search results" };

    // 2) Récupérer toutes les grids
    const gridsUrl = new URL(`grids/game/${first.id}`, searchBase);
    const gridsRes = await fetch(gridsUrl.toString(), { method: "GET", headers });
    const gridsText = await gridsRes.text();
    const gridsData = gridsText ? JSON.parse(gridsText) : null;

    if (!gridsRes.ok) {
      throw new Error(`SGDB grids ${gridsRes.status} ${gridsRes.statusText}`);
    }

    const grids = gridsData?.data || [];
    if (!grids || grids.length === 0) {
      return { success: false, error: "No grids found" };
    }

    // Filtrer uniquement les jaquettes verticales (grids), pas les bannières/héros/logos
    const filteredGrids = grids.filter((g) => {
      // Garder seulement les grids classiques (ratio ~3:4 ou 2:3)
      const ratio = g.width && g.height ? g.width / g.height : 1;
      return ratio > 0.5 && ratio < 1; // Ratio vertical typique des jaquettes
    });

    if (filteredGrids.length === 0) {
      return { success: false, error: "No vertical grids found" };
    }

    // Télécharger les miniatures et servir via local://
    const tempDir = path.join(app.getPath("userData"), "covers", "temp");
    ensureDirectory(tempDir);

    // Limiter à 4 jaquettes et télécharger les miniatures
    const gridPromises = filteredGrids.slice(0, 4).map(async (g, index) => {
      try {
        // Log pour debug
        console.log(
          `🔍 Grid ${index} structure:`,
          JSON.stringify({ id: g.id, url: g.url, thumb: g.thumb }, null, 2)
        );

        // Utiliser la vraie URL d'image directe (pas thumb qui peut être une page web)
        const imageUrl = g.url; // g.url contient l'image directe, pas g.thumb
        const res = await fetch(imageUrl);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const arrayBuffer = await res.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        const ext = imageUrl.includes(".png") ? "png" : "jpg";
        const tempFilename = `grid_${first.id}_${index}.${ext}`;
        const tempPath = path.join(tempDir, tempFilename);

        fs.writeFileSync(tempPath, buffer);

        return {
          id: g.id,
          url: g.url,
          thumb: g.thumb,
          localThumb: tempFilename, // Fichier local à servir via local://covers/temp/
          width: g.width,
          height: g.height,
          style: g.style,
          author: g.author?.name || "Unknown",
        };
      } catch (err) {
        console.error(`❌ Failed to download thumb for grid ${g.id}:`, err.message);
        return {
          id: g.id,
          url: g.url,
          thumb: g.thumb,
          localThumb: null,
          width: g.width,
          height: g.height,
          style: g.style,
          author: g.author?.name || "Unknown",
        };
      }
    });

    const gridList = await Promise.all(gridPromises);

    console.log(
      `✅ [sgdb-get-all-grids] Returning ${gridList.length} vertical grids (${
        gridList.filter((g) => g.localThumb).length
      } with local thumbs) for "${term}"`
    );
    console.log("🔍 First grid being returned:", JSON.stringify(gridList[0], null, 2));
    return { success: true, grids: gridList, gameName: first.name };
  } catch (err) {
    console.error("❌ sgdb-get-all-grids error:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// 🔹 SGDB: télécharger une grille spécifique par URL
ipcMain.handle("sgdb-download-grid-by-url", async (_, { url, filenamePrefix = "" }) => {
  try {
    if (!url) throw new Error("url is required");

    // ✅ Utiliser userData au lieu de __dirname (qui est en lecture seule en production)
    const coversDir = path.join(app.getPath("userData"), "covers");
    ensureDirectory(coversDir);

    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

    const arrayBuffer = await res.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const safeName = `${filenamePrefix}${path.basename(url)}`.replace(/[^a-zA-Z0-9._-]/g, "_");
    const outPath = path.join(coversDir, safeName);

    fs.writeFileSync(outPath, buffer);
    console.log(`✅ [sgdb-download-grid-by-url] Downloaded: ${outPath}`);
    return { success: true, path: outPath };
  } catch (err) {
    console.error("❌ sgdb-download-grid-by-url error:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// 🔧 Utilitaire: garantit qu'un chemin est un dossier (répare ENOTDIR)
function ensureDirectory(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      const st = fs.statSync(dirPath);
      if (!st.isDirectory()) {
        // S'il existe un fichier à la place du dossier, on le renomme en .bak
        const bak = dirPath + ".bak-" + Date.now();
        fs.renameSync(dirPath, bak);
        fs.mkdirSync(dirPath, { recursive: true });
        console.warn(`⚠️ '${dirPath}' était un fichier. Renommé en '${bak}' et dossier recréé.`);
      }
    } else {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  } catch (e) {
    console.error("❌ ensureDirectory error:", e);
    throw e;
  }
}

// ------------------------------------------------------------
// 🗂️ Liste des catégories pour Electron
const categories = [
  "Action / Aventure",
  "Tir (FPS)",
  "Rôle (RPG)",
  "Horreur",
  "Combat",
  "Sport",
  "Course",
  "Simulation",
  "Autre",
];

// ------------------------------------------------------------
// 🔹 Ajout manuel d’un jeu (avec fenêtre de sélection de catégorie)
ipcMain.handle("add-game", async () => {
  const result = await dialog.showOpenDialog({
    properties: ["openFile"],
    filters: [
      { name: "Jeux exécutables", extensions: ["exe"] },
      { name: "Tous les fichiers", extensions: ["*"] },
    ],
  });

  if (result.canceled || result.filePaths.length === 0) {
    console.log("❌ Ajout annulé.");
    return null;
  }

  const filePath = result.filePaths[0];
  console.log("🎮 Nouveau jeu sélectionné :", filePath);

  // Retourne juste le chemin du fichier
  // La catégorie sera choisie via le modal React CategorySelector
  return { filePath };
});

// ------------------------------------------------------------
// 🎮 Lancer un jeu et tracker le temps de jeu
// ------------------------------------------------------------
const { spawn } = require("child_process");
const activeProcesses = new Map(); // Garde une trace des processus actifs

// Supprime le flag "Exécuter en tant qu'administrateur" du registre Windows pour un exe donné.
// Ce flag est stocké dans HKCU\...\AppCompatFlags\Layers avec la valeur "RUNASADMIN".
// Sans cette suppression, spawn() échoue silencieusement car il n'utilise pas ShellExecute
// et ne peut pas déclencher l'élévation UAC.
// ⚠️ Utilise exec() (async) pour ne PAS bloquer le thread principal d'Electron.
function removeRunAsAdminFlag(exePath) {
  const { exec } = require("child_process");
  const regKey =
    "HKCU\\Software\\Microsoft\\Windows NT\\CurrentVersion\\AppCompatFlags\\Layers";

  return new Promise((resolve) => {
    // 1) Lire la valeur actuelle via reg.exe (pas de PowerShell = plus rapide)
    exec(
      `reg query "${regKey}" /v "${exePath}" 2>nul`,
      { encoding: "utf-8", timeout: 3000 },
      (err, stdout) => {
        if (err || !stdout.includes("RUNASADMIN")) {
          // Pas de flag RunAsAdmin → rien à faire
          console.log(`🔧 removeRunAsAdminFlag(${path.basename(exePath)}): NONE`);
          return resolve();
        }

        // Extraire la valeur complète et retirer uniquement "RUNASADMIN"
        const match = stdout.match(/REG_SZ\s+(.+)/);
        if (!match) return resolve();

        const currentVal = match[1].trim();
        const newVal = currentVal
          .split(/\s+/)
          .filter((f) => f !== "RUNASADMIN")
          .join(" ")
          .trim();

        if (newVal === "") {
          // Plus aucun flag → supprimer l'entrée entière
          exec(
            `reg delete "${regKey}" /v "${exePath}" /f 2>nul`,
            { timeout: 3000 },
            () => {
              console.log(`🔧 removeRunAsAdminFlag(${path.basename(exePath)}): REMOVED`);
              resolve();
            }
          );
        } else {
          // D'autres flags existent → mettre à jour sans "RUNASADMIN"
          exec(
            `reg add "${regKey}" /v "${exePath}" /t REG_SZ /d "${newVal}" /f 2>nul`,
            { timeout: 3000 },
            () => {
              console.log(`🔧 removeRunAsAdminFlag(${path.basename(exePath)}): UPDATED → ${newVal}`);
              resolve();
            }
          );
        }
      }
    );
  }).catch((err) => {
    console.warn("⚠️ removeRunAsAdminFlag a échoué silencieusement :", err?.message);
  });
}

ipcMain.handle("launch-game", async (_, game) => {
  try {
    // Support à la fois 'path' et 'exePath' pour compatibilité
    const gamePath = game.path || game.exePath;

    if (!game || !gamePath) {
      throw new Error("Chemin du jeu invalide");
    }

    console.log(`🚀 Lancement du jeu : ${game.name} (${gamePath})`);

    // Supprime le flag "Exécuter en tant qu'administrateur" si présent (async, non-bloquant).
    await removeRunAsAdminFlag(gamePath);

    const startTime = Date.now();
    const gameDir = path.dirname(gamePath);

    // Lancer le processus du jeu
    const gameProcess = spawn(gamePath, [], {
      cwd: gameDir,
      detached: true,
      stdio: "ignore",
    });

    // Stocker les infos du processus
    activeProcesses.set(game.id, {
      process: gameProcess,
      startTime,
      gameId: game.id,
    });

    // Surveiller la fermeture du processus
    gameProcess.on("exit", (code) => {
      const endTime = Date.now();
      const sessionDuration = Math.floor((endTime - startTime) / 1000 / 60); // minutes

      console.log(`🎮 ${game.name} fermé après ${sessionDuration} minutes`);

      // Mettre à jour le temps de jeu dans la base
      const games = store.get("games", []);
      const updatedGames = games.map((g) => {
        if (g.id === game.id) {
          const currentPlayTime = g.playTime || 0;
          return { ...g, playTime: currentPlayTime + sessionDuration };
        }
        return g;
      });

      store.set("games", updatedGames);
      console.log(`💾 Temps de jeu mis à jour pour ${game.name}: +${sessionDuration}min`);

      // Notifier le renderer
      win?.webContents.send("game-time-updated", {
        gameId: game.id,
        sessionDuration,
        totalPlayTime: (game.playTime || 0) + sessionDuration,
      });

      activeProcesses.delete(game.id);
    });

    gameProcess.on("error", (err) => {
      console.error(`❌ Erreur lors du lancement de ${game.name}:`, err);
      activeProcesses.delete(game.id);
    });

    // Détacher le processus pour qu'il continue même si Electron se ferme
    gameProcess.unref();

    return { success: true, message: `${game.name} lancé !` };
  } catch (err) {
    console.error("❌ Erreur launch-game:", err);
    return { success: false, error: err.message || String(err) };
  }
});

// ------------------------------------------------------------
// ---------- TEMP LOGS pour debug : n'oublie pas de retirer ensuite ----------
function registerLocalProtocol() {
  const { protocol, app } = require("electron");
  const path = require("path");
  const fs = require("fs");

  // Affiche les chemins utiles
  console.log("🔎 DEBUG PATHS:");
  console.log("  __dirname:", __dirname);
  console.log("  process.cwd():", process.cwd());
  try {
    console.log("  app.getAppPath():", app.getAppPath());
  } catch (err) {
    console.log("  app.getAppPath() => not available yet");
  }

  // liste le contenu du dossier covers (s'il existe)
  const probable = [
    path.join(__dirname, "covers"),
    path.join(process.cwd(), "covers"),
    path.join(app && app.getAppPath ? app.getAppPath() : process.cwd(), "covers"),
  ];

  for (const p of probable) {
    try {
      console.log(`  listing: ${p}`);
      const files = fs.existsSync(p) ? fs.readdirSync(p) : ["(not found)"];
      console.log("    files:", files);
    } catch (e) {
      console.log("    error listing:", e && e.message);
    }
  }

  // registre le protocole exactement comme avant (sécurisé)
  protocol.registerFileProtocol("local", (request, callback) => {
    try {
      // Décoder l'URL pour convertir %2F en / etc.
      let url = request.url.replace("local://", "");
      url = decodeURIComponent(url);

      // Si l'URL contient déjà un chemin absolu (E:\...), l'utiliser directement
      if (path.isAbsolute(url)) {
        const candidates = [url];
        let found = fs.existsSync(url) ? url : null;

        console.log(
          "🧾 local:// request (absolute):",
          request.url,
          "-> resolved:",
          found || "(not found)"
        );

        if (!found) {
          return callback({ path: path.join(__dirname, "dist-react", "icons", "default.png") });
        }
        return callback({ path: found });
      }

      // Sinon, extraire le chemin relatif après "covers/"
      const relativePath = url.replace(/^covers[\/\\]/, "");
      const candidates = [
        // ✅ Priorité 1: userData/covers (où sont stockées les jaquettes téléchargées)
        path.join(app.getPath("userData"), "covers", relativePath),
        // Fallbacks pour compatibilité dev
        path.join(__dirname, "covers", relativePath),
        path.join(process.cwd(), "covers", relativePath),
      ];

      let found = null;
      for (const c of candidates) {
        if (fs.existsSync(c)) {
          found = c;
          break;
        }
      }

      console.log(
        "🧾 local:// request:",
        request.url,
        "-> resolved:",
        found || "(not found)",
        "candidates:",
        candidates
      );
      if (!found) {
        return callback({ path: path.join(__dirname, "dist-react", "icons", "default.png") });
      }
      callback({ path: found });
    } catch (err) {
      console.error("❌ registerFileProtocol error:", err);
      callback({ error: -2 });
    }
  });

  try {
    const testDir = path.join(__dirname, "covers");
    console.log("🔍 Test d’accès direct :", testDir);
    const files = fs.readdirSync(testDir);
    console.log("📁 Contenu réel du dossier covers :", files);
  } catch (err) {
    console.error("❌ Impossible de lire le dossier covers :", err);
  }

  console.log("✅ registerLocalProtocol() (debug) registered.");
}

// ------------------------------------------------------------
// 🔹 Création d’un menu personnalisé avec icônes et traductions
function createAppMenu(lang = "fr") {
  // 🛡️ Vérification de sécurité pour éviter les crashes
  if (!win || win.isDestroyed()) {
    console.warn("⚠️ createAppMenu appelé mais la fenêtre n'existe pas ou est détruite");
    return;
  }
  
  const isFrench = lang === "fr";

  const template = [
    {
      label: isFrench ? "⚙️ Paramètres" : "⚙️ Settings",
      submenu: [
        {
          label: isFrench ? "🔑 Clé API SteamGridDB" : "🔑 SteamGridDB API Key",
          click: () => {
            // Envoyer un événement à React pour ouvrir le panneau de configuration de l'API
            win?.webContents.send("menu-open-api-settings");
          },
        },
        { type: "separator" },
        {
          label: isFrench ? "Quitter" : "Quit",
          accelerator: "CmdOrCtrl+Q",
          click: () => app.quit(),
        },
      ],
    },
    {
      label: isFrench ? "🎮 Jeux" : "🎮 Games",
      submenu: [
        {
          label: isFrench ? "Ajouter un jeu" : "Add a Game",
          accelerator: "CmdOrCtrl+N",
          click: async () => {
            // ✅ Ouvre le dialogue pour choisir un fichier jeu
            const result = await dialog.showOpenDialog({
              properties: ["openFile"],
              filters: [
                { name: "Jeux exécutables", extensions: ["exe"] },
                { name: "Tous les fichiers", extensions: ["*"] },
              ],
            });

            if (result.canceled || result.filePaths.length === 0) {
              console.log("❌ Ajout annulé depuis le menu");
              win?.webContents.send("menu-add-game", null);
              return;
            }

            const filePath = result.filePaths[0];
            console.log("🎮 Jeu sélectionné depuis le menu :", filePath);

            // ✅ Envoyer juste le filePath, React affichera le modal CategorySelector
            win?.webContents.send("menu-add-game", { filePath });
            console.log(`✅ Fichier sélectionné depuis le menu : ${filePath}`);
          },
        },
      ],
    },
    {
      label: isFrench ? "🖥️ Affichage" : "🖥️ View",
      submenu: [
        { role: "reload", label: isFrench ? "Recharger" : "Reload" },
        { 
          label: isFrench ? "Plein écran" : "Fullscreen",
          accelerator: "F11",
          click: () => {
            try {
              if (!win || win.isDestroyed()) {
                console.warn("⚠️ Fenêtre non disponible pour fullscreen");
                return;
              }
              
              const isCurrentlyFullscreen = win.isFullScreen();
              console.log("🖥️ Toggle fullscreen - État actuel:", isCurrentlyFullscreen);
              
              // Simplement basculer le plein écran, SANS masquer le menu
              // (pour éviter les crashes)
              win.setFullScreen(!isCurrentlyFullscreen);
              
            } catch (error) {
              console.error("❌ Erreur toggle fullscreen:", error);
            }
          }
        },
        { role: "toggleDevTools", label: isFrench ? "Outils de développement" : "DevTools" },
      ],
    },
    {
      label: isFrench ? "🌐 Langue" : "🌐 Language",
      submenu: [
        {
          label: "Français",
          type: "radio",
          checked: isFrench,
          click: () => {
            currentLang = "fr";
            createAppMenu("fr");
            win?.webContents.send("menu-language-changed", "fr");
          },
        },
        {
          label: "English",
          type: "radio",
          checked: !isFrench,
          click: () => {
            currentLang = "en";
            createAppMenu("en");
            win?.webContents.send("menu-language-changed", "en");
          },
        },
      ],
    },
    {
      label: isFrench ? "❓ Aide" : "❓ Help",
      submenu: [
        {
          label: isFrench ? "📝 Journal des conversations" : "📝 Conversation Journal",
          click: () => {
            win?.webContents.send("menu-open-journal");
          },
        },
        { type: "separator" },
        {
          label: isFrench ? "Rechercher des mises à jour" : "Check for Updates",
          click: async () => {
            try {
              const currentVer = app.getVersion();
              const feedURL = autoUpdater.getFeedURL();

              console.log("🔍 Menu: Recherche de mises à jour...");
              console.log("  Version actuelle:", currentVer);
              console.log("  Feed URL:", feedURL);

              win?.webContents.send("update-status", { status: "manual-check" });
              const result = await autoUpdater.checkForUpdates();

              console.log("🔍 Menu: Résultat:", result);
            } catch (e) {
              const msg = e?.message || String(e);
              console.error("🔍 Menu: Erreur:", msg);
              console.error("🔍 Stack:", e?.stack);

              // 🧹 Silencieux si cas fréquents: 404/no feed/private/no publisher
              const m = msg.toLowerCase();
              const isBenign =
                m.includes("404") ||
                m.includes("releases.atom") ||
                m.includes("cannot find") ||
                m.includes("latest.yml") ||
                m.includes("no published versions") ||
                m.includes("feedurl is not set") ||
                m.includes("enoent") ||
                m.includes("enotfound");
              if (isBenign) {
                dialog.showMessageBox({
                  type: "info",
                  title: isFrench ? "Mise à jour" : "Update",
                  message: isFrench
                    ? `Aucune mise à jour publique trouvée.\n\nDébug:\n- Version: ${app.getVersion()}\n- Erreur: ${msg}`
                    : `No public update found.\n\nDebug:\n- Version: ${app.getVersion()}\n- Error: ${msg}`,
                });
                win?.webContents.send("update-status", { status: "none" });
                return;
              }
              dialog.showErrorBox(
                isFrench ? "Mise à jour" : "Update",
                (isFrench ? "Erreur de vérification : " : "Check failed: ") + msg
              );
            }
          },
        },
        {
          label: isFrench ? "Site officiel" : "Official Website",
          click: () => require("electron").shell.openExternal("https://github.com/"),
        },
        { type: "separator" },
        {
          label: isFrench ? "🗑️ Réinitialiser les données" : "🗑️ Reset Data",
          click: () => {
            const choice = dialog.showMessageBoxSync({
              type: "warning",
              title: isFrench ? "Réinitialiser" : "Reset",
              message: isFrench
                ? "⚠️ Voulez-vous supprimer tous les jeux et paramètres ?\n\nCette action est irréversible !"
                : "⚠️ Do you want to delete all games and settings?\n\nThis action is irreversible!",
              buttons: isFrench ? ["Annuler", "Réinitialiser"] : ["Cancel", "Reset"],
              defaultId: 0,
              cancelId: 0,
            });
            if (choice === 1) {
              store.clear();
              dialog.showMessageBox({
                type: "info",
                title: isFrench ? "Réinitialisation" : "Reset",
                message: isFrench
                  ? "✅ Données supprimées.\nRedémarrez l'application."
                  : "✅ Data deleted.\nRestart the application.",
              });
              app.relaunch();
              app.quit();
            }
          },
        },
        { type: "separator" },
        {
          label: isFrench ? "À propos" : "About",
          click: () => {
            dialog.showMessageBox({
              type: "info",
              title: "MyGames Launcher",
              message: isFrench
                ? "🎮 MyGames Launcher\nVersion 1.9.0\nDéveloppé avec ❤️ par Xpolaris"
                : "🎮 MyGames Launcher\nVersion 1.9.0\nDeveloped with ❤️ by Xpolaris",
              buttons: ["OK"],
            });
          },
        },
      ],
    },
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
}

// ✅ Mise à jour de la langue du menu
ipcMain.on("update-menu-language", (_, lang) => {
  currentLang = lang;
  createAppMenu(lang);
  console.log("🌐 Menu mis à jour :", lang);
});

// ------------------------------------------------------------
// 🧹 Nettoyage des fichiers temporaires et jaquettes non utilisées
// ------------------------------------------------------------
function cleanupTempFolder() {
  try {
    const tempDir = path.join(__dirname, "covers", "temp");
    if (fs.existsSync(tempDir)) {
      const files = fs.readdirSync(tempDir);
      files.forEach((file) => {
        const filePath = path.join(tempDir, file);
        if (fs.statSync(filePath).isFile()) {
          fs.unlinkSync(filePath);
        }
      });
      console.log(`🧹 Dossier temp/ nettoyé : ${files.length} fichier(s) supprimé(s)`);
    }
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage du dossier temp :", err);
  }
}

function cleanupUnusedCovers() {
  try {
    const coversDir = path.join(__dirname, "covers");
    if (!fs.existsSync(coversDir)) return;

    // Récupérer toutes les jaquettes utilisées par les jeux
    const games = store.get("games", []);
    const usedCovers = new Set();

    games.forEach((game) => {
      if (game.icon) {
        // Extraire juste le nom de fichier (sans chemin)
        const iconName = path.basename(game.icon);
        usedCovers.add(iconName);
      }
    });

    // Parcourir le dossier covers et supprimer les fichiers non utilisés
    const files = fs.readdirSync(coversDir);
    let deletedCount = 0;

    files.forEach((file) => {
      const filePath = path.join(coversDir, file);
      const stats = fs.statSync(filePath);

      // Ignorer les dossiers (comme temp/) et default.png
      if (stats.isDirectory() || file === "default.png") return;

      // Si le fichier n'est pas utilisé, le supprimer
      if (!usedCovers.has(file)) {
        fs.unlinkSync(filePath);
        deletedCount++;
        console.log(`🗑️ Jaquette non utilisée supprimée : ${file}`);
      }
    });

    if (deletedCount > 0) {
      console.log(`🧹 ${deletedCount} jaquette(s) non utilisée(s) supprimée(s)`);
    } else {
      console.log("✅ Aucune jaquette non utilisée à supprimer");
    }
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage des jaquettes :", err);
  }
}

// 🧹 Nettoyer les anciennes jaquettes des dossiers icons (obsolètes)
function cleanupLegacyIconsFolders() {
  try {
    const iconsFolders = [
      path.join(__dirname, "dist", "icons"),
      path.join(__dirname, "dist-react", "icons"),
      path.join(__dirname, "public", "icons"),
    ];

    let totalDeleted = 0;

    iconsFolders.forEach((iconsDir) => {
      if (!fs.existsSync(iconsDir)) return;

      const files = fs.readdirSync(iconsDir);
      let deletedCount = 0;

      files.forEach((file) => {
        // Garder uniquement default.png, supprimer tout le reste
        if (file !== "default.png") {
          const filePath = path.join(iconsDir, file);
          try {
            const stats = fs.statSync(filePath);
            if (stats.isFile()) {
              fs.unlinkSync(filePath);
              deletedCount++;
              totalDeleted++;
            }
          } catch (err) {
            console.error(`❌ Erreur lors de la suppression de ${file}:`, err.message);
          }
        }
      });

      if (deletedCount > 0) {
        console.log(`🧹 ${deletedCount} ancienne(s) jaquette(s) supprimée(s) de ${iconsDir}`);
      }
    });

    if (totalDeleted > 0) {
      console.log(`✅ Nettoyage terminé : ${totalDeleted} fichier(s) obsolète(s) supprimé(s)`);
    } else {
      console.log("✅ Aucun fichier obsolète à supprimer dans les dossiers icons");
    }
  } catch (err) {
    console.error("❌ Erreur lors du nettoyage des dossiers icons :", err);
  }
}

// ------------------------------------------------------------
// 🔹 Application prête
app.whenReady().then(() => {
  // 🎬 Créer et afficher l'écran de chargement immédiatement
  createSplashScreen();
  console.log("🎬 Splash screen affiché");

  // 🧹 Exécuter toutes les opérations de nettoyage en arrière-plan
  Promise.all([
    // Nettoyage rapide du dossier temp
    new Promise((resolve) => {
      try {
        cleanupTempFolder();
        resolve();
      } catch (err) {
        console.error("❌ Erreur cleanupTempFolder:", err);
        resolve();
      }
    }),
    // Nettoyage des anciennes jaquettes
    new Promise((resolve) => {
      try {
        cleanupLegacyIconsFolders();
        resolve();
      } catch (err) {
        console.error("❌ Erreur cleanupLegacyIconsFolders:", err);
        resolve();
      }
    }),
  ]).then(() => {
    console.log("✅ Opérations de nettoyage terminées");

    // 🧹 Nettoyer les jaquettes non utilisées encore plus tard (opération lente)
    setTimeout(() => {
      cleanupUnusedCovers();
    }, 8000); // Attendre 8 secondes après le démarrage
  });

  // ------------------------------------------------------------
  // 🛡️ Autorise le protocole "local://" dans la Content Security Policy
  // ------------------------------------------------------------
  const { session } = require("electron"); // Déclaration unique

  session.defaultSession.webRequest.onHeadersReceived((details, callback) => {
    const headers = details.responseHeaders || {};

    // Construire une CSP qui inclut 'unsafe-eval' seulement en développement
    const allowUnsafeEval = !app.isPackaged;
    const scriptSrc = allowUnsafeEval ? "'self' 'unsafe-inline' 'unsafe-eval'" : "'self'";

    const csp = [
      `default-src 'self' local:`,
      `script-src ${scriptSrc};`,
      `style-src 'self' 'unsafe-inline';`,
      `img-src 'self' data: local: file: blob: https:;`,
      `connect-src 'self' ws://localhost:* http://localhost:* https://www.steamgriddb.com local:;`,
      `font-src 'self' data:;`,
    ].join(" ");

    headers["Content-Security-Policy"] = [csp];
    callback({ responseHeaders: headers });
  });

  // 🧩 Ensuite on enregistre le protocole et on crée la fenêtre
  registerLocalProtocol();

  // ⏱️ Créer la fenêtre principale avec un petit délai pour laisser le splash visible
  setTimeout(() => {
    createWindow();
    createAppMenu(currentLang);
  }, 1000); // Délai minimal pour voir le splash

  // 🔍 Vérifie où Electron enregistre ses données
  console.log("📂 Dossier userData :", app.getPath("userData"));

  // ------------------------------------------------------------
  // 🔄 Mises à jour automatiques (electron-updater)
  //    En développement (app non packagée), on n'initialise pas pour éviter les logs
  // ------------------------------------------------------------
  try {
    if (!app.isPackaged) {
      console.log(
        "ℹ️ autoUpdater désactivé (app non packagée). Packagez l'application pour tester les mises à jour."
      );
      // Handlers IPC renvoyant un message explicite en dev
      ipcMain.handle("updates-check", async () => ({
        ok: false,
        error: "App non packagée: les mises à jour automatiques sont désactivées en développement.",
      }));
      ipcMain.handle("updates-quit-and-install", () => ({ ok: false, error: "not-packaged" }));
      return; // ne pas initialiser autoUpdater
    }

    // 🔍 DEBUG: Afficher les infos de configuration
    console.log("🔍 [DEBUG] Configuration autoUpdater:");
    console.log("  - Version actuelle:", app.getVersion());
    console.log("  - App packagée:", app.isPackaged);
    console.log("  - Repo GitHub: Mersouille/MyGamesLauncher");

    // Conseillé: laisser electron-builder configurer l'URL de publication via package.json (publish)
    autoUpdater.autoDownload = true; // téléchargement auto des updates
    autoUpdater.autoInstallOnAppQuit = true; // installe à la fermeture

    // Logging simple dans la console
    autoUpdater.on("checking-for-update", () => {
      console.log("🛰️ Vérification de mise à jour...");
      win?.webContents.send("update-status", { status: "checking" });
    });
    autoUpdater.on("update-available", (info) => {
      console.log("⬇️ Mise à jour disponible:", info?.version);
      win?.webContents.send("update-status", { status: "available", info });
    });
    autoUpdater.on("update-not-available", (info) => {
      console.log("✅ Pas de mise à jour disponible");
      win?.webContents.send("update-status", { status: "none", info });
    });
    autoUpdater.on("error", (err) => {
      // ⚠️ Ignorer silencieusement les erreurs 404 (pas de release GitHub publiée)
      if (err?.message?.includes("404")) {
        console.log("ℹ️ Aucune release GitHub trouvée (normal en première installation)");
        return;
      }
      console.error("❌ Erreur autoUpdater:", err?.stack || err?.message || String(err));
      win?.webContents.send("update-status", {
        status: "error",
        error: err?.message || String(err),
      });
    });
    autoUpdater.on("download-progress", (p) => {
      win?.webContents.send("update-status", { status: "downloading", progress: p });
    });
    autoUpdater.on("update-downloaded", (info) => {
      console.log("📦 Mise à jour téléchargée. Prête à installer.");
      win?.webContents.send("update-status", { status: "downloaded", info });
    });

    // Vérification automatique désactivée (évite le toast au démarrage)
    // Utilisez le menu "Aide > Rechercher des mises à jour" pour vérifier manuellement
    // setTimeout(() => {
    //   autoUpdater.checkForUpdatesAndNotify().catch((e) => {
    //     console.warn("⚠️ checkForUpdatesAndNotify a échoué:", e?.message || e);
    //   });
    // }, 4000);

    // APIs IPC pour pilotage manuel depuis le renderer
    ipcMain.handle("updates-check", async () => {
      try {
        const currentVersion = app.getVersion();
        const feedURL = autoUpdater.getFeedURL();

        console.log("🔍 [DEBUG] Version actuelle:", currentVersion);
        console.log("🔍 [DEBUG] URL de vérification:", feedURL);

        const res = await autoUpdater.checkForUpdates();

        const debugInfo = {
          currentVersion: currentVersion,
          feedURL: feedURL,
          updateVersion: res?.updateInfo?.version,
          files: res?.updateInfo?.files?.map((f) => f.url),
          hasUpdate: res?.updateInfo?.version > currentVersion,
        };

        console.log("🔍 [DEBUG] Résultat checkForUpdates:", debugInfo);

        return {
          ok: true,
          info: res?.updateInfo,
          debug: debugInfo, // Renvoyer les infos de debug au renderer
        };
      } catch (e) {
        console.error("🔍 [DEBUG] Erreur lors de la vérification:", e);
        return {
          ok: false,
          error: e?.message || String(e),
          debug: {
            currentVersion: app.getVersion(),
            errorStack: e?.stack,
          },
        };
      }
    });
    ipcMain.handle("updates-quit-and-install", () => {
      try {
        autoUpdater.quitAndInstall();
        return { ok: true };
      } catch (e) {
        return { ok: false, error: e?.message || String(e) };
      }
    });
  } catch (e) {
    console.warn("⚠️ Initialisation autoUpdater ignorée:", e?.message || String(e));
  }
});

// ------------------------------------------------------------
// � Journal de conversation: stockage JSON dans userData/logs
// ------------------------------------------------------------
ipcMain.handle("save-conversation-entry", async (_, entry) => {
  try {
    const logsDir = path.join(app.getPath("userData"), "logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const filePath = path.join(logsDir, "conversation.json");

    // Normaliser l'entrée
    const normalized = {
      id: Date.now() + "_" + Math.random().toString(36).slice(2, 8),
      time: new Date().toISOString(),
      type: String(entry?.type || "info"),
      title: String(entry?.title || ""),
      message: String(entry?.message || ""),
      meta: entry?.meta || null,
    };

    let arr = [];
    if (fs.existsSync(filePath)) {
      try {
        const raw = fs.readFileSync(filePath, "utf-8");
        arr = JSON.parse(raw);
        if (!Array.isArray(arr)) arr = [];
      } catch (e) {
        arr = [];
      }
    }

    arr.push(normalized);
    fs.writeFileSync(filePath, JSON.stringify(arr, null, 2));
    return { ok: true, entry: normalized };
  } catch (e) {
    console.error("❌ save-conversation-entry:", e);
    return { ok: false, error: e?.message || String(e) };
  }
});

ipcMain.handle("get-conversation-history", async () => {
  try {
    const filePath = path.join(app.getPath("userData"), "logs", "conversation.json");
    if (!fs.existsSync(filePath)) return { ok: true, entries: [] };
    const raw = fs.readFileSync(filePath, "utf-8");
    const arr = JSON.parse(raw);
    return { ok: true, entries: Array.isArray(arr) ? arr : [] };
  } catch (e) {
    console.error("❌ get-conversation-history:", e);
    return { ok: false, entries: [], error: e?.message || String(e) };
  }
});

ipcMain.handle("clear-conversation-history", async () => {
  try {
    const logsDir = path.join(app.getPath("userData"), "logs");
    if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir, { recursive: true });
    const filePath = path.join(logsDir, "conversation.json");
    fs.writeFileSync(filePath, JSON.stringify([], null, 2));
    return { ok: true };
  } catch (e) {
    console.error("❌ clear-conversation-history:", e);
    return { ok: false, error: e?.message || String(e) };
  }
});

// ------------------------------------------------------------
// �🔹 Quitte quand toutes les fenêtres sont fermées
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

// ------------------------------------------------------------
// 🎮 SCANNER DE LAUNCHERS - Import automatique de jeux
// ------------------------------------------------------------

// 🎮 Scanner Steam
ipcMain.handle("scan-steam-games", async () => {
  try {
    const games = [];
    const steamPaths = [
      path.join(process.env.ProgramFiles || "C:\\Program Files", "Steam"),
      path.join(process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)", "Steam"),
      path.join(process.env.USERPROFILE || "", "Steam"),
    ];

    for (const steamPath of steamPaths) {
      const libraryFoldersPath = path.join(steamPath, "steamapps", "libraryfolders.vdf");
      if (!fs.existsSync(libraryFoldersPath)) continue;

      // Lire les bibliothèques Steam
      const vdfContent = fs.readFileSync(libraryFoldersPath, "utf-8");
      const pathMatches = [...vdfContent.matchAll(/"path"\s+"([^"]+)"/g)];

      for (const match of pathMatches) {
        const libraryPath = match[1].replace(/\\\\/g, "\\");
        const appsPath = path.join(libraryPath, "steamapps", "common");

        if (fs.existsSync(appsPath)) {
          const folders = fs.readdirSync(appsPath);
          folders.forEach((folder) => {
            const gamePath = path.join(appsPath, folder);
            const stat = fs.statSync(gamePath);
            if (stat.isDirectory()) {
              // Chercher le .exe principal
              const exeFiles = fs
                .readdirSync(gamePath)
                .filter((f) => f.endsWith(".exe") && !f.toLowerCase().includes("unins"));
              if (exeFiles.length > 0) {
                games.push({
                  id: `steam_${Date.now()}_${Math.random()}`,
                  name: folder,
                  path: path.join(gamePath, exeFiles[0]),
                  launcher: "steam",
                });
              }
            }
          });
        }
      }
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan Steam:", error);
    return { success: false, games: [], error: error.message };
  }
});

// 🏪 Scanner Epic Games
ipcMain.handle("scan-epic-games", async () => {
  try {
    const games = [];
    const epicManifestsPath = path.join(
      process.env.ProgramData || "C:\\ProgramData",
      "Epic",
      "EpicGamesLauncher",
      "Data",
      "Manifests"
    );

    if (fs.existsSync(epicManifestsPath)) {
      const manifests = fs.readdirSync(epicManifestsPath).filter((f) => f.endsWith(".item"));

      manifests.forEach((manifest) => {
        try {
          const content = fs.readFileSync(path.join(epicManifestsPath, manifest), "utf-8");
          const data = JSON.parse(content);
          if (data.InstallLocation && data.LaunchExecutable) {
            games.push({
              id: `epic_${data.CatalogItemId || Date.now()}`,
              name: data.DisplayName || data.AppName,
              path: path.join(data.InstallLocation, data.LaunchExecutable),
              launcher: "epic",
            });
          }
        } catch (err) {
          console.error(`Erreur lecture manifest ${manifest}:`, err);
        }
      });
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan Epic:", error);
    return { success: false, games: [], error: error.message };
  }
});

// 🎯 Scanner Ubisoft Connect
ipcMain.handle("scan-ubisoft-games", async () => {
  try {
    const games = [];
    const ubisoftPaths = [
      path.join(
        process.env["ProgramFiles(x86)"] || "",
        "Ubisoft",
        "Ubisoft Game Launcher",
        "games"
      ),
      path.join(process.env.ProgramFiles || "", "Ubisoft", "Ubisoft Game Launcher", "games"),
    ];

    for (const ubisoftPath of ubisoftPaths) {
      if (fs.existsSync(ubisoftPath)) {
        const folders = fs.readdirSync(ubisoftPath);
        folders.forEach((folder) => {
          const gamePath = path.join(ubisoftPath, folder);
          const stat = fs.statSync(gamePath);
          if (stat.isDirectory()) {
            const exeFiles = fs
              .readdirSync(gamePath)
              .filter((f) => f.endsWith(".exe") && !f.toLowerCase().includes("unins"));
            if (exeFiles.length > 0) {
              games.push({
                id: `ubisoft_${Date.now()}_${Math.random()}`,
                name: folder,
                path: path.join(gamePath, exeFiles[0]),
                launcher: "ubisoft",
              });
            }
          }
        });
      }
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan Ubisoft:", error);
    return { success: false, games: [], error: error.message };
  }
});

// ⚔️ Scanner Battle.net
ipcMain.handle("scan-battlenet-games", async () => {
  try {
    const games = [];
    const battlenetPath = path.join(process.env.ProgramData || "C:\\ProgramData", "Battle.net");

    // Battle.net stocke ses jeux dans des dossiers séparés
    const knownGames = {
      "Diablo IV": ["Diablo IV", "Diablo IV.exe"],
      Overwatch: ["Overwatch", "Overwatch.exe"],
      "World of Warcraft": ["World of Warcraft", "Wow.exe"],
      Hearthstone: ["Hearthstone", "Hearthstone.exe"],
      "StarCraft II": ["StarCraft II", "StarCraft II.exe"],
      "Call of Duty": ["Call of Duty", "BlackOpsColdWar.exe"],
    };

    const programFiles = [
      process.env.ProgramFiles || "C:\\Program Files",
      process.env["ProgramFiles(x86)"] || "C:\\Program Files (x86)",
    ];

    for (const [gameName, [folder, exe]] of Object.entries(knownGames)) {
      for (const basePath of programFiles) {
        const gamePath = path.join(basePath, folder, exe);
        if (fs.existsSync(gamePath)) {
          games.push({
            id: `battlenet_${gameName.replace(/\s/g, "_")}`,
            name: gameName,
            path: gamePath,
            launcher: "battlenet",
          });
          break;
        }
      }
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan Battle.net:", error);
    return { success: false, games: [], error: error.message };
  }
});

// 🎲 Scanner EA Origin
ipcMain.handle("scan-origin-games", async () => {
  try {
    const games = [];
    const originPath = path.join(
      process.env.ProgramData || "C:\\ProgramData",
      "Origin",
      "LocalContent"
    );

    if (fs.existsSync(originPath)) {
      const folders = fs.readdirSync(originPath);
      folders.forEach((folder) => {
        const gamePath = path.join(originPath, folder);
        const stat = fs.statSync(gamePath);
        if (stat.isDirectory()) {
          const exeFiles = fs
            .readdirSync(gamePath)
            .filter((f) => f.endsWith(".exe") && !f.toLowerCase().includes("installer"));
          if (exeFiles.length > 0) {
            games.push({
              id: `origin_${Date.now()}_${Math.random()}`,
              name: folder,
              path: path.join(gamePath, exeFiles[0]),
              launcher: "origin",
            });
          }
        }
      });
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan Origin:", error);
    return { success: false, games: [], error: error.message };
  }
});

// 🌌 Scanner GOG Galaxy
ipcMain.handle("scan-gog-games", async () => {
  try {
    const games = [];
    const gogDbPath = path.join(
      process.env.ProgramData || "C:\\ProgramData",
      "GOG.com",
      "Galaxy",
      "storage",
      "galaxy-2.0.db"
    );

    // GOG utilise une base de données SQLite, pour simplifier on scanne les dossiers
    const gogPaths = [
      path.join(process.env.ProgramFiles || "", "GOG Galaxy", "Games"),
      path.join(process.env["ProgramFiles(x86)"] || "", "GOG Galaxy", "Games"),
      "C:\\GOG Games",
      "D:\\GOG Games",
    ];

    for (const gogPath of gogPaths) {
      if (fs.existsSync(gogPath)) {
        const folders = fs.readdirSync(gogPath);
        folders.forEach((folder) => {
          const gamePath = path.join(gogPath, folder);
          const stat = fs.statSync(gamePath);
          if (stat.isDirectory()) {
            const exeFiles = fs
              .readdirSync(gamePath)
              .filter((f) => f.endsWith(".exe") && !f.toLowerCase().includes("unins"));
            if (exeFiles.length > 0) {
              games.push({
                id: `gog_${Date.now()}_${Math.random()}`,
                name: folder,
                path: path.join(gamePath, exeFiles[0]),
                launcher: "gog",
              });
            }
          }
        });
      }
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan GOG:", error);
    return { success: false, games: [], error: error.message };
  }
});

// ⭐ Scanner Rockstar Games
ipcMain.handle("scan-rockstar-games", async () => {
  try {
    const games = [];
    const rockstarPaths = [
      path.join(process.env.ProgramFiles || "", "Rockstar Games"),
      path.join(process.env["ProgramFiles(x86)"] || "", "Rockstar Games"),
    ];

    const knownGames = {
      "Grand Theft Auto V": "GTA5.exe",
      "Red Dead Redemption 2": "RDR2.exe",
      "Max Payne 3": "MaxPayne3.exe",
      "L.A. Noire": "LANoire.exe",
    };

    for (const rockstarPath of rockstarPaths) {
      if (fs.existsSync(rockstarPath)) {
        for (const [gameName, exe] of Object.entries(knownGames)) {
          const gamePath = path.join(rockstarPath, gameName, exe);
          if (fs.existsSync(gamePath)) {
            games.push({
              id: `rockstar_${gameName.replace(/\s/g, "_")}`,
              name: gameName,
              path: gamePath,
              launcher: "rockstar",
            });
          }
        }
      }
    }

    return { success: true, games };
  } catch (error) {
    console.error("Erreur scan Rockstar:", error);
    return { success: false, games: [], error: error.message };
  }
});

// 📥 Importer un jeu dans la bibliothèque
ipcMain.handle("import-game", async (_, game) => {
  try {
    const games = store.get("games", []);

    // Vérifier si le jeu n'existe pas déjà
    const exists = games.some((g) => g.path === game.path);
    if (exists) {
      return { success: false, error: "Jeu déjà importé" };
    }

    // Ajouter le jeu avec un ID unique
    const newGame = {
      id: Date.now(),
      name: game.name,
      path: game.path,
      category: game.category || "Action / Aventure", // Utiliser la catégorie fournie ou défaut
      playTime: 0,
      favorite: false,
      dateAdded: new Date().toISOString(),
      launcher: game.launcher,
    };

    games.push(newGame);
    store.set("games", games);

    return { success: true, game: newGame };
  } catch (error) {
    console.error("Erreur import jeu:", error);
    return { success: false, error: error.message };
  }
});

// ------------------------------------------------------------
// 💾 Sauvegarde automatique avant fermeture
app.on("before-quit", async () => {
  try {
    // 🧹 Nettoyer uniquement le dossier temp à la fermeture (très rapide)
    // Note: cleanupUnusedCovers() n'est PAS appelé ici pour éviter de ralentir la fermeture
    cleanupTempFolder();

    // 📁 Chemin vers le fichier principal du store
    const userDataPath = app.getPath("userData");
    const storeFile = path.join(userDataPath, "games.json");

    // 📂 Dossier de sauvegarde
    const backupDir = path.join(userDataPath, "backups");
    if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

    // 🕒 Nom de fichier horodaté
    const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
    const backupFile = path.join(backupDir, `games_backup_${timestamp}.json`);

    // 💾 Copie du fichier si existant
    if (fs.existsSync(storeFile)) {
      fs.copyFileSync(storeFile, backupFile);
      console.log(`📦 Sauvegarde automatique créée : ${backupFile}`);
    } else {
      console.warn("⚠️ Aucun fichier games.json trouvé à sauvegarder.");
    }
  } catch (err) {
    console.error("❌ Erreur lors de la sauvegarde automatique :", err);
  }
});
