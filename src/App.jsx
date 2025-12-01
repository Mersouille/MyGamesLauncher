// src/App.jsx
import React, { useState, useEffect, useCallback, useRef } from "react";
import GameGrid from "./components/GameGrid";
import ConversationJournal from "./components/ConversationJournal"; // 📝 Journal historique
import SettingsPanel from "./pages/SettingsPanel";
import Statistics from "./pages/Statistics"; // 📊 Page statistiques
import ImportGames from "./pages/ImportGames"; // 📥 Import Steam/Epic
import CategorySelector from "./components/CategorySelector"; // 🆕 Modal de sélection moderne
import SearchBar from "./components/SearchBar"; // 🔍 Barre de recherche
import GameDetailsModal from "./components/GameDetailsModal"; // ⭐ Modal de détails du jeu
import CollectionsManager from "./components/Collections/CollectionsManager"; // 📚 Gestionnaire de collections
import AchievementsPage from "./pages/AchievementsPage"; // 🏆 Page achievements
import AchievementNotification from "./components/Achievements/AchievementNotification"; // 🏆 Notification achievement
import ControllerProfilesManager from "./components/Controllers/ControllerProfilesManager"; // 🎮 Gestionnaire de profils de contrôleurs
import ThemeSelector from "./components/Settings/ThemeSelector"; // 🎨 Sélecteur rapide de thème
import BigPictureMode from "./components/BigPicture/BigPictureMode"; // 📺 Mode Big Picture
import { useResponsive } from "./hooks/useResponsive"; // 📱 Hook pour le responsive design
import MusicPlayer from "./components/MusicPlayer"; // 🎵 Lecteur de musique
import { useBackgroundMusic } from "./hooks/useBackgroundMusic"; // 🎵 Hook musique
import { motion, AnimatePresence } from "framer-motion";
import Sidebar from "./components/Sidebar"; // 🆕 Import du menu latéral
import categories from "./data/categories.js";
import { themes, getTheme } from "./data/themes"; // 🎨 Import des thèmes
import useAchievements from "./hooks/useAchievements"; // 🏆 Hook achievements

export default function App() {
  // 📱 Hook responsive pour adapter l'affichage dynamiquement
  const responsive = useResponsive();

  const [games, setGames] = useState([]);
  const [settings, setSettings] = useState({
    theme: "dark",
    musicEnabled: true, // ✅ Activé par défaut - démarre automatiquement
    currentTrack: "track1",
    musicVolume: 0.15, // 🔉 Volume initial réduit (15%)
    uiScale: 1, // Sera remplacé par responsive.uiScale
  });
  const [isBigPicture, setIsBigPicture] = useState(false); // 📺 Etat Big Picture
  const [showSettings, setShowSettings] = useState(false);
  const [currentCategory, setCurrentCategory] = useState("Tous les jeux"); // 🆕 État catégorie

  // 🆕 État pour le modal de sélection de catégorie
  const [showCategorySelector, setShowCategorySelector] = useState(false);
  const [pendingGamePath, setPendingGamePath] = useState(null);

  // 🔍 États pour la recherche et le tri
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name");
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // ⭐ État pour le modal de détails du jeu
  const [selectedGameForDetails, setSelectedGameForDetails] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // � État pour le modal d'import
  const [showImportModal, setShowImportModal] = useState(false);

  // 📚 États pour les collections personnalisées
  const [collections, setCollections] = useState([]);
  const [collectionsLoaded, setCollectionsLoaded] = useState(false);
  const [showCollectionsManager, setShowCollectionsManager] = useState(false);
  const [selectedGameForCollection, setSelectedGameForCollection] = useState(null);

  // 🏆 États pour les achievements
  const [showAchievementsPage, setShowAchievementsPage] = useState(false);
  const [currentAchievementNotification, setCurrentAchievementNotification] = useState(null);

  // 📊 État pour les statistiques
  const [showStatistics, setShowStatistics] = useState(false);
  // 📝 Journal de conversation
  const [showJournal, setShowJournal] = useState(false);

  // � États pour les profils de contrôleurs
  const [controllerProfiles, setControllerProfiles] = useState([]);
  const [controllerProfilesLoaded, setControllerProfilesLoaded] = useState(false);
  const [showControllerManager, setShowControllerManager] = useState(false);

  // �🏆 Hook de gestion des achievements
  const { unlockedAchievements, newlyUnlocked, consumeNotification } = useAchievements(
    games,
    collections
  );

  // � Gestion des notifications toast
  const [toast, setToast] = useState({ visible: false, text: "", color: "#0d6efd" });

  // 🔄 État de mise à jour (autoUpdater)
  const [updateStatus, setUpdateStatus] = useState({ status: null, info: null, progress: null });

  const showToast = (text, color = "#0d6efd") => {
    setToast({ visible: true, text, color });
    setTimeout(() => setToast({ visible: false, text: "", color: "#0d6efd" }), 2000);
  };

  // ⚙️ Gestionnaire de changement des paramètres (doit être avant useBackgroundMusic)
  const handleSettingsChange = useCallback(async (newSettings) => {
    setSettings(newSettings);
    // Sauvegarder dans Electron
    if (window?.electronAPI?.saveSettings) {
      await window.electronAPI.saveSettings(newSettings);
    }
  }, []);

  // 🎵 Hook de gestion de la musique (DOIT être avant handleLaunchGame)
  const music = useBackgroundMusic(settings, handleSettingsChange);

  // 🔄 Abonnement aux mises à jour (events envoyés par main via preload)
  useEffect(() => {
    if (!window?.electronAPI?.onUpdateStatus) return;
    window.electronAPI.onUpdateStatus((payload) => {
      setUpdateStatus(payload || {});
      // Courtes notifications utiles
      if (payload?.status === "available") {
        showToast("⬇️ Mise à jour disponible – téléchargement…", "#0d6efd");
      } else if (payload?.status === "downloaded") {
        showToast("📦 Mise à jour prête à installer", "#28a745");
      } else if (payload?.status === "error") {
        showToast("❌ Échec de la mise à jour", "#dc3545");
      }
    });
  }, []);

  // � Lancer un jeu (réutilisable)
  const handleLaunchGame = async (game) => {
    try {
      // 🎵 Arrêter la musique avant de lancer le jeu
      if (music.isPlaying) {
        music.pause();
        console.log("🔇 Musique mise en pause pour le lancement du jeu");
      }

      const result = await window.electronAPI.launchGame(game);
      if (result.success) {
        showToast(`🚀 ${game.name} lancé !`, "#28a745");
      } else {
        showToast(`❌ Erreur : ${result.error}`, "#dc3545");
      }
    } catch (err) {
      console.error("Erreur lancement jeu:", err);
      showToast(`❌ Erreur : ${err.message}`, "#dc3545");
    }
  };

  // �📺 Raccourci clavier pour basculer le Mode Big Picture (F9)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "F9") {
        e.preventDefault();
        setIsBigPicture((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 🏆 Afficher les notifications d'achievements
  useEffect(() => {
    if (newlyUnlocked.length > 0 && !currentAchievementNotification) {
      const achievement = consumeNotification();
      if (achievement) {
        setCurrentAchievementNotification(achievement);
      }
    }
  }, [newlyUnlocked, currentAchievementNotification, consumeNotification]);

  // 🎮 NE PLUS ouvrir automatiquement - utiliser le bouton Y pour ouvrir
  // (supprimé pour permettre la navigation libre avec LB/RB)

  // 🧠 Charger les jeux depuis Electron
  useEffect(() => {
    async function fetchGames() {
      try {
        const data = await window.electronAPI.getGames();

        // 🧩 Migration automatique : ajoute une catégorie "Tous les jeux" si manquante
        const normalized = (data || []).map((g) => ({
          ...g,
          category: g.category || "Tous les jeux",
        }));

        // 💾 Sauvegarde la correction si besoin
        const hasMissingCategory = normalized.some((g) => !g.category);
        if (hasMissingCategory) {
          await window.electronAPI.saveGames(normalized);
          console.log("🔄 [FIX] Catégories manquantes corrigées et sauvegardées.");
        }

        setGames(normalized);
      } catch (err) {
        console.error("❌ Erreur chargement jeux :", err);
      }
    }
    fetchGames();
  }, []);

  // 📚 Charger les collections depuis Electron
  useEffect(() => {
    async function fetchCollections() {
      try {
        const data = await window.electronAPI.getCollections();
        setCollections(data || []);
        setCollectionsLoaded(true); // Marquer comme chargé
        console.log("📚 Collections chargées :", data?.length || 0);
      } catch (err) {
        console.error("❌ Erreur chargement collections :", err);
        setCollectionsLoaded(true);
      }
    }
    fetchCollections();
  }, []);

  // 🎮 Charger les profils de contrôleurs depuis Electron
  useEffect(() => {
    async function fetchControllerProfiles() {
      try {
        const data = await window.electronAPI.getControllerProfiles();
        setControllerProfiles(data || []);
        setControllerProfilesLoaded(true);
        console.log("🎮 Profils de contrôleurs chargés :", data?.length || 0);
      } catch (err) {
        console.error("❌ Erreur chargement profils contrôleurs :", err);
        setControllerProfilesLoaded(true);
      }
    }
    fetchControllerProfiles();
  }, []);

  // ➕ Fonction pour ajouter un nouveau jeu manuellement
  const handleAddGame = async () => {
    try {
      // ⚙️ Electron renvoie maintenant un objet { filePath, category }
      const result = await window.electronAPI.addGame();

      console.log("🧩 [DEBUG] Résultat reçu depuis Electron :", result);

      if (!result || !result.filePath) {
        console.log("❌ Aucun fichier sélectionné");
        return;
      }

      // Stocker le chemin et ouvrir le modal de sélection de catégorie
      setPendingGamePath(result.filePath);
      setShowCategorySelector(true);
    } catch (error) {
      console.error("❌ Erreur lors de l'ajout du jeu :", error);
    }
  };

  // ➕ Callback quand une catégorie est sélectionnée dans le modal
  const handleCategorySelected = (category) => {
    if (!pendingGamePath) return;

    const gameName = pendingGamePath.split("\\").pop().replace(".exe", "");

    const newGame = {
      id: Date.now(),
      name: gameName,
      path: pendingGamePath,
      icon: "default.png",
      category: category || "Autre",
    };

    setGames((prevGames) => [...prevGames, newGame]);
    showToast(`🎮 ${gameName} ajouté dans ${category} !`, "#28a745");
    console.log("✅ Jeu ajouté :", newGame);

    // Réinitialiser l'état
    setShowCategorySelector(false);
    setPendingGamePath(null);
  };

  // 🎮 Réagir à l'événement "Ajouter un jeu" venant du menu
  useEffect(() => {
    const handleMenuAddGame = (data) => {
      console.log("🧩 [DEBUG React] Données reçues depuis Electron :", data);

      if (!data || !data.filePath) {
        console.log("ℹ️ Ajout de jeu annulé via le menu.");
        return;
      }

      // Ouvrir le modal CategorySelector avec le fichier sélectionné
      setPendingGamePath(data.filePath);
      setShowCategorySelector(true);
    };

    // ✅ Écoute de l'événement "menu-add-game"
    window.electronAPI.onAddGame(handleMenuAddGame);

    // ✅ Écoute de l'événement "menu-open-api-settings" depuis le menu Paramètres
    window.electronAPI.onOpenApiSettings(() => {
      console.log("⚙️ [App] Ouverture des paramètres API depuis le menu");
      setShowSettings(true);
    });

    // ✅ Écoute de l'événement "menu-open-journal" depuis le menu Aide
    window.electronAPI.onOpenJournal(() => {
      console.log("📝 [App] Ouverture du Journal depuis le menu");
      handleOpenJournal();
    });

    // ✅ Nettoyage à la fermeture du composant
    return () => {
      window.electronAPI.removeAllListeners?.("menu-add-game");
      window.electronAPI.removeAllListeners?.("menu-open-api-settings");
      window.electronAPI.removeAllListeners?.("menu-open-journal");
    };
  }, []);

  // 💾 Charger les paramètres (thème)
  useEffect(() => {
    async function loadSettings() {
      try {
        const data = await window.electronAPI.getSettings();
        setSettings(data || { theme: "dark" });
      } catch (err) {
        console.error("⚠️ Impossible de charger les paramètres :", err);
      }
    }
    loadSettings();
  }, []);

  // 🕹️ Écouter les mises à jour du temps de jeu
  useEffect(() => {
    window.electronAPI.onGameTimeUpdated((data) => {
      console.log("🕹️ Temps de jeu mis à jour:", data);
      setGames((prevGames) =>
        prevGames.map((g) => (g.id === data.gameId ? { ...g, playTime: data.totalPlayTime } : g))
      );
      showToast(`⏱️ Session: ${data.sessionDuration}min`, "#0d6efd");
    });
  }, []);

  // 🎨 Appliquer le thème global au body
  useEffect(() => {
    document.body.style.background =
      settings.theme === "dark"
        ? "linear-gradient(160deg, #0f0f0f, #1b1b1b)"
        : "linear-gradient(160deg, #f8f8f8, #e0e0e0)";
    document.body.style.color = settings.theme === "dark" ? "#f1f1f1" : "#222";
  }, [settings.theme]);

  // 💾 Sauvegarde automatique à chaque modification de la liste de jeux
  useEffect(() => {
    if (games.length > 0) {
      window.electronAPI.saveGames(games);
      console.log("💾 Jeux sauvegardés !");
    }
  }, [games]);

  // 💾 Sauvegarde automatique des collections (uniquement après le premier chargement)
  useEffect(() => {
    if (collectionsLoaded && collections) {
      window.electronAPI.saveCollections(collections);
      console.log("📚 Collections sauvegardées !");
    }
  }, [collections, collectionsLoaded]);

  // 💾 Sauvegarde automatique des profils de contrôleurs (uniquement après le premier chargement)
  useEffect(() => {
    if (controllerProfilesLoaded && controllerProfiles) {
      window.electronAPI.saveControllerProfiles(controllerProfiles);
      console.log("🎮 Profils de contrôleurs sauvegardés !");
    }
  }, [controllerProfiles, controllerProfilesLoaded]);

  // 🧩 Mapping des noms visibles vers les catégories internes
  const categoryMap = {
    "Tous les jeux": "Tous les jeux",
    "Jeux Action / Aventure": "Action / Aventure",
    "Jeux de Tir (FPS)": "Tir (FPS)",
    "Jeux de Rôle (RPG)": "Rôle (RPG)",
    "Jeux d'Horreur": "Horreur",
    "Jeux de Combat": "Combat",
    "Jeux de Sport": "Sport",
    "Jeux de Course": "Course",
    "Jeux de Simulation": "Simulation",
  };

  // 🧩 Filtrage et tri des jeux
  const filteredGames = React.useMemo(() => {
    let result = games;

    // 1️⃣ Filtre par catégorie ou collection
    if (currentCategory.startsWith("collection:")) {
      // Filtrage par collection
      const collectionId = parseInt(currentCategory.replace("collection:", ""));
      const collection = collections.find((c) => c.id === collectionId);
      if (collection) {
        result = result.filter((g) => collection.gameIds.includes(g.id));
      }
    } else if (currentCategory !== "Tous les jeux") {
      // Filtrage par catégorie normale
      result = result.filter(
        (g) =>
          g.category && g.category.toLowerCase().trim() === currentCategory.toLowerCase().trim()
      );
    }

    // 2️⃣ Filtre par recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter((g) => g.name.toLowerCase().includes(term));
    }

    // 3️⃣ Filtre favoris uniquement
    if (favoritesOnly) {
      result = result.filter((g) => g.favorite === true);
    }

    // 4️⃣ Tri
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameDesc":
        result.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "playTime":
        result.sort((a, b) => (b.playTime || 0) - (a.playTime || 0));
        break;
      case "playTimeAsc":
        result.sort((a, b) => (a.playTime || 0) - (b.playTime || 0));
        break;
      case "dateAdded":
        result.sort((a, b) => (b.id || 0) - (a.id || 0)); // ID = timestamp
        break;
      case "dateAddedOld":
        result.sort((a, b) => (a.id || 0) - (b.id || 0));
        break;
      default:
        result.sort((a, b) => a.name.localeCompare(b.name));
    }

    return result;
  }, [games, collections, currentCategory, searchTerm, favoritesOnly, sortBy]);

  // 🔍 DEBUG - Vérification des données avant affichage
  console.log("🎮 DEBUG - Liste des jeux :", games);
  console.log("🧭 DEBUG - Catégorie sélectionnée :", currentCategory);
  console.log("🔍 DEBUG - Recherche :", searchTerm);
  console.log("🎯 DEBUG - Jeux filtrés :", filteredGames);

  // 🚨 Vérifier si une modale/page spéciale est ouverte (pour désactiver les listeners de base)
  const isModalOpen =
    currentCategory === "📊 Statistiques" ||
    currentCategory === "🏆 Achievements" ||
    showAchievementsPage ||
    showSettings ||
    showCollectionsManager ||
    showControllerManager ||
    showDetailsModal ||
    showImportModal ||
    showCategorySelector;

  // 🔍 DEBUG - Log pour vérifier isModalOpen
  console.log("🔍 [App] isModalOpen =", isModalOpen, {
    currentCategory,
    showAchievementsPage,
    showSettings,
    showCollectionsManager,
    showControllerManager,
    showDetailsModal,
    showImportModal,
    showCategorySelector,
  });

  // 🎨 Récupérer le thème actuel
  const currentTheme = getTheme(settings.theme);

  // 🚫 Ref pour empêcher les changements de catégorie concurrents
  const isChangingCategoryRef = useRef(false);

  // 🎮 Mémoriser les callbacks pour éviter les re-renders inutiles
  const handleSelectCategory = useCallback(
    (category, forceClose = false) => {
      // ⚠️ CRITIQUE: Bloquer si déjà en train de changer
      if (isChangingCategoryRef.current) {
        console.log("⚠️ [App] Changement de catégorie ignoré (déjà en cours):", category);
        return;
      }

      // 🚨 CRITIQUE: Bloquer UNIQUEMENT les fermetures automatiques vers "Tous les jeux"
      // AUTORISER les changements entre pages modales et les fermetures explicites (forceClose=true)
      const currentModalOpen =
        currentCategory === "📊 Statistiques" ||
        currentCategory === "🏆 Achievements" ||
        currentCategory === "🎮 Contrôleurs";

      const targetIsModal =
        category === "📊 Statistiques" ||
        category === "🏆 Achievements" ||
        category === "🎮 Contrôleurs";

      // Bloquer SEULEMENT si: on est dans une modale ET on va vers "Tous les jeux" ET pas de forceClose
      if (currentModalOpen && category === "Tous les jeux" && !forceClose) {
        console.log(
          "⚠️ [App] Tentative de fermeture automatique BLOQUÉE:",
          currentCategory,
          "→",
          category
        );
        return;
      }

      // ✅ AUTORISER: modale → autre modale, modale → catégorie de jeux, etc.
      console.log("🔄 [App] Navigation autorisée:", currentCategory, "→", category);

      isChangingCategoryRef.current = true;
      console.log(
        "✅ [App] Changement de catégorie accepté:",
        category,
        forceClose ? "(fermeture explicite)" : ""
      );
      setCurrentCategory(category);

      // 🚨 CRITIQUE: Débloquer après 500ms (réduit pour permettre le bouton B)
      setTimeout(() => {
        isChangingCategoryRef.current = false;
        console.log("🔓 [App] Changements de catégorie débloqués");
      }, 500);
    },
    [currentCategory]
  );
  const handleManageCollections = useCallback(() => {
    setSelectedGameForCollection(null);
    setShowCollectionsManager(true);
  }, []);

  const handleManageControllers = useCallback(() => {
    setShowControllerManager(true);
  }, []);

  const handleOpenStatistics = useCallback(() => {
    console.log("🎯 [App] handleOpenStatistics appelé - showStatistics avant:", showStatistics);
    setShowStatistics(true);
    console.log("✅ [App] setShowStatistics(true) appelé");
  }, [showStatistics]);

  const handleOpenAchievements = useCallback(() => {
    console.log("🎯 [App] handleOpenAchievements appelé");
    setShowAchievementsPage(true);
  }, []);
  const handleOpenJournal = useCallback(() => {
    setShowJournal(true);
  }, []);

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* 🧭 Menu latéral gauche */}
      <Sidebar
        currentCategory={currentCategory}
        onSelectCategory={handleSelectCategory}
        collections={collections}
        onManageCollections={handleManageCollections}
        onManageControllers={handleManageControllers}
        onOpenStatistics={handleOpenStatistics}
        onOpenAchievements={handleOpenAchievements}
        isModalOpen={isModalOpen}
      />

      {/* 🧩 Contenu principal */}
      <div
        className={`app theme-${settings.theme}`}
        style={{
          flex: 1,
          minHeight: "100vh",
          background: currentTheme.background,
          color: currentTheme.text,
          fontFamily: "'Poppins', sans-serif",
          transition: "all 0.5s ease",
          overflowY: "auto",
        }}
      >
        {/* 🎨 Sélecteur rapide de thème (remplace l'ancien bouton paramètres) */}
        <ThemeSelector settings={settings} onChange={handleSettingsChange} />

        {/* 📺 Bouton flottant Big Picture (en haut à droite, sous le sélecteur de thème) */}
        {!isBigPicture && (
          <button
            onClick={() => setIsBigPicture(true)}
            title="Activer le mode Big Picture (F9)"
            style={{
              position: "fixed",
              top: 96,
              right: 20,
              zIndex: 1000,
              background: currentTheme.accent,
              color: currentTheme.text,
              padding: "10px 14px",
              borderRadius: 12,
              fontWeight: 700,
              boxShadow: `0 6px 18px ${currentTheme.shadow}`,
            }}
          >
            📺 Big Picture
          </button>
        )}

        {/* 🏷️ En-tête */}
        <header
          className="header"
          style={{
            textAlign: "center",
            padding: "60px 0 30px",
            position: "relative",
          }}
        >
          <h1
            style={{
              fontSize: "2.6rem",
              fontWeight: 600,
              letterSpacing: "1px",
              marginBottom: "0.5rem",
              textShadow:
                settings.theme === "dark"
                  ? "0 0 12px rgba(255,255,255,0.15)"
                  : "0 0 6px rgba(0,0,0,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "15px",
            }}
          >
            🎮 MyGames Launcher
          </h1>
          <p
            style={{
              opacity: 0.85,
              fontSize: "1.1rem",
              marginBottom: "30px",
            }}
          >
            Gérez et lancez vos jeux depuis une interface élégante
          </p>
        </header>

        {/* ➕ Boutons d'actions */}
        <div className="flex justify-center gap-4 my-6">
          <button
            onClick={handleAddGame}
            className="font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-300"
            style={{
              background: currentTheme.primary,
              color: currentTheme.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTheme.primaryHover;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentTheme.primary;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            + Ajouter un jeu
          </button>
          <button
            onClick={() => setShowImportModal(true)}
            className="font-semibold px-6 py-3 rounded-lg shadow-md transition-all duration-300"
            style={{
              background: currentTheme.accent,
              color: currentTheme.text,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTheme.primary;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentTheme.accent;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            📥 Importer (Steam, Epic, etc.)
          </button>
        </div>

        {/* 🎯 Affichage : Toujours afficher GameGrid */}
        {/* ⚠️ Les pages spéciales (Statistiques, Achievements, Contrôleurs) sont des modals overlay */}
        {
          <>
            {/* �🔍 Barre de recherche et filtres */}
            <div className="max-w-7xl mx-auto px-6">
              <SearchBar
                onSearchChange={setSearchTerm}
                onSortChange={setSortBy}
                onFavoritesToggle={setFavoritesOnly}
              />
            </div>

            {/* 🧩 Grille de jeux */}
            <main>
              <GameGrid
                games={filteredGames}
                theme={settings.theme}
                uiScale={responsive.uiScale}
                gridColumns={responsive.gridColumns}
                cardWidth={responsive.cardWidth}
                cardHeight={responsive.cardHeight}
                onLaunch={handleLaunchGame}
                onDelete={(game) => {
                  setGames((prev) => prev.filter((g) => g.id !== game.id));
                  showToast("🗑️ Jeu supprimé", "#dc3545");
                }}
                onToggleFavorite={(gameToToggle) => {
                  setGames((prev) =>
                    prev.map((g) =>
                      g.id === gameToToggle.id ? { ...g, favorite: !g.favorite } : g
                    )
                  );
                  showToast("⭐ Favori mis à jour", "#0d6efd");
                }}
                onUpdate={(id, patch) => {
                  setGames((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
                  showToast("✅ Jaquette mise à jour", "#28a745");
                }}
                onShowDetails={(game) => {
                  setSelectedGameForDetails(game);
                  setShowDetailsModal(true);
                }}
                onAddToCollection={(game) => {
                  setSelectedGameForCollection(game);
                  setShowCollectionsManager(true);
                }}
                isModalOpen={isModalOpen}
              />
            </main>
          </>
        }

        {/* 📺 Mode Big Picture plein écran */}
        {isBigPicture && (
          <BigPictureMode
            games={games}
            theme={settings.theme}
            initialCategory={currentCategory}
            uiScale={responsive.uiScale}
            onClose={() => setIsBigPicture(false)}
            onLaunchGame={(g) => handleLaunchGame(g)}
          />
        )}

        {/* 🔄 Bandeau de mise à jour */}
        {updateStatus?.status && (
          <div
            style={{
              position: "fixed",
              left: 20,
              bottom: 20,
              zIndex: 10000,
              background: currentTheme.cardBg,
              color: currentTheme.text,
              border: `2px solid ${currentTheme.border}`,
              borderRadius: 14,
              padding: "12px 16px",
              minWidth: 320,
              boxShadow: `0 8px 20px ${currentTheme.shadow}`,
            }}
          >
            {updateStatus.status === "checking" && <div>🛰️ Recherche de mises à jour…</div>}
            {updateStatus.status === "manual-check" && <div>🛰️ Vérification en cours…</div>}
            {updateStatus.status === "available" && (
              <div>⬇️ Mise à jour disponible, téléchargement…</div>
            )}
            {updateStatus.status === "downloading" && (
              <div>
                <div style={{ marginBottom: 6 }}>⬇️ Téléchargement…</div>
                <div
                  style={{
                    height: 8,
                    width: "100%",
                    background: "rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.max(
                        0,
                        Math.min(100, Math.round(updateStatus.progress?.percent || 0))
                      )}%`,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                    }}
                  />
                </div>
                <div style={{ fontSize: 12, opacity: 0.85, marginTop: 6 }}>
                  {Math.round(updateStatus.progress?.percent || 0)}%
                </div>
              </div>
            )}
            {updateStatus.status === "none" && <div>✅ Votre application est à jour</div>}
            {updateStatus.status === "downloaded" && (
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div>📦 Mise à jour prête</div>
                <button
                  onClick={() => window.electronAPI?.quitAndInstall?.()}
                  style={{
                    marginLeft: "auto",
                    padding: "8px 12px",
                    borderRadius: 10,
                    fontWeight: 700,
                    background: currentTheme.accent,
                    color: currentTheme.text,
                  }}
                >
                  Redémarrer et installer
                </button>
              </div>
            )}
            {updateStatus.status === "error" && (
              <div style={{ color: "#ff6b6b" }}>❌ Erreur: {updateStatus.error}</div>
            )}
          </div>
        )}

        {/* ⚙️ Panneau de paramètres */}
        {showSettings && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}

        {/* 💬 Toast dynamique animé */}
        <AnimatePresence>
          {toast.visible && (
            <motion.div
              key="toast"
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "fixed",
                bottom: "30px",
                right: "30px",
                background: toast.color,
                color: "white",
                padding: "14px 24px",
                borderRadius: "14px",
                boxShadow: "0 4px 15px rgba(0,0,0,0.3)",
                fontWeight: "500",
                zIndex: 9999,
              }}
            >
              {toast.text}
            </motion.div>
          )}
        </AnimatePresence>

        {/* 🎯 Modal de sélection de catégorie */}
        <CategorySelector
          isOpen={showCategorySelector}
          onClose={() => {
            setShowCategorySelector(false);
            setPendingGamePath(null);
          }}
          onSelect={handleCategorySelected}
          gameName={pendingGamePath?.split("\\").pop().replace(".exe", "")}
        />

        {/* ⭐ Modal de détails du jeu */}
        <GameDetailsModal
          game={selectedGameForDetails}
          isOpen={showDetailsModal}
          onClose={() => {
            setShowDetailsModal(false);
            setSelectedGameForDetails(null);
          }}
          onSave={(details) => {
            if (selectedGameForDetails) {
              setGames((prev) =>
                prev.map((g) =>
                  g.id === selectedGameForDetails.id
                    ? {
                        ...g,
                        status: details.status,
                        rating: details.rating,
                        notes: details.notes,
                        category: details.category,
                        displayName: details.displayName,
                      }
                    : g
                )
              );
              showToast("✅ Détails mis à jour", "#28a745");
            }
          }}
        />

        {/* 📥 Modal d'import Steam/Epic */}
        {showImportModal && (
          <ImportGames
            theme={settings.theme}
            onImport={(importedGames) => {
              showToast(`✅ ${importedGames.length} jeu(x) importé(s)`, "#28a745");
              // Recharger les jeux
              window.electronAPI.getGames().then((data) => {
                const normalized = (data || []).map((g) => ({
                  ...g,
                  category: g.category || "Tous les jeux",
                }));
                setGames(normalized);
              });
            }}
            onClose={() => setShowImportModal(false)}
          />
        )}

        {/* 📚 Gestionnaire de collections */}
        {showCollectionsManager && (
          <CollectionsManager
            collections={collections}
            allGames={games}
            currentTheme={settings.theme}
            onClose={() => {
              setShowCollectionsManager(false);
              setSelectedGameForCollection(null);
            }}
            onSave={(updatedCollections) => {
              setCollections(updatedCollections);
              showToast("📚 Collections mises à jour !", "#8b5cf6");
              setShowCollectionsManager(false);
              setSelectedGameForCollection(null);
            }}
          />
        )}

        {/* 📊 Page Statistiques - Modal overlay */}
        {showStatistics && (
          <Statistics
            games={games}
            onClose={() => {
              setShowStatistics(false);
              // ✅ Rester sur "📊 Statistiques" pour continuer à naviguer
            }}
          />
        )}

        {/* 🏆 Page Achievements - Modal overlay */}
        {showAchievementsPage && (
          <AchievementsPage
            games={games}
            collections={collections}
            unlockedAchievements={unlockedAchievements}
            currentTheme={settings.theme}
            onClose={() => {
              setShowAchievementsPage(false);
              // ✅ Rester sur "🏆 Achievements" pour continuer à naviguer
            }}
          />
        )}

        {/* 🎮 Gestionnaire de profils de contrôleurs - Modal overlay */}
        {showControllerManager && (
          <ControllerProfilesManager
            profiles={controllerProfiles}
            games={games}
            currentTheme={settings.theme}
            onClose={() => {
              setShowControllerManager(false);
              // ✅ NE PAS changer currentCategory - rester sur "🎮 Contrôleurs"
              // pour permettre de continuer à naviguer avec LB vers Achievements/Statistiques
            }}
            onSave={(updatedProfiles) => {
              setControllerProfiles(updatedProfiles);
              showToast("🎮 Profils de contrôleurs mis à jour !", "#10b981");
            }}
          />
        )}

        {/* 🏆 Notification d'achievement débloqué */}
        {currentAchievementNotification && (
          <AchievementNotification
            achievement={currentAchievementNotification}
            onClose={() => setCurrentAchievementNotification(null)}
          />
        )}

        {/* 🎵 Lecteur de musique flottant */}
        <MusicPlayer
          isPlaying={music.isPlaying}
          currentTrack={music.currentTrack}
          tracks={music.tracks}
          onPlay={music.play}
          onPause={music.pause}
          onChangeTrack={music.changeTrack}
          onVolumeChange={music.changeVolume}
          onForward={music.forward}
          onBackward={music.backward}
          volume={settings.musicVolume || 0.15}
          theme={getTheme(settings.theme)}
        />
        {/* 📝 Journal (modal) */}
        {showJournal && (
          <ConversationJournal
            open={showJournal}
            onClose={() => setShowJournal(false)}
            theme={getTheme(settings.theme)}
          />
        )}
      </div>
    </div>
  );
}
