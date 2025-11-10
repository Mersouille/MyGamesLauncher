import React, { useState, useEffect, useRef } from "react";
import GridSelectorModal from "./GridSelectorModal";
import { useGamepad } from "../hooks/useGamepad";
import { getTheme } from "../data/themes";

const GameGrid = ({
  games,
  onLaunch,
  onDelete,
  onToggleFavorite,
  onUpdate,
  onShowDetails,
  onAddToCollection,
  theme,
  isModalOpen = false, // 🎮 Désactiver la navigation si un modal externe est ouvert
}) => {
  const currentTheme = getTheme(theme || "dark");
  const [loadingId, setLoadingId] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [currentGame, setCurrentGame] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const { gamepadConnected, registerListener } = useGamepad();
  const gridRef = useRef(null);
  const selectedCardRef = useRef(null);

  // ✅ Trie les jeux : les favoris apparaissent en premier
  const sortedGames =
    games && games.length > 0
      ? [...games].sort((a, b) => {
          if (a.favorite === b.favorite) return a.id - b.id;
          return b.favorite ? 1 : -1;
        })
      : [];

  // Refs pour éviter de réenregistrer le listener à chaque render
  const sortedGamesRef = useRef(sortedGames);
  const onLaunchRef = useRef(onLaunch);
  const onToggleFavoriteRef = useRef(onToggleFavorite);

  // Mettre à jour les refs directement pendant le render
  sortedGamesRef.current = sortedGames;
  onLaunchRef.current = onLaunch;
  onToggleFavoriteRef.current = onToggleFavorite;

  // 🎮 Gestion de la navigation avec manette
  useEffect(() => {
    if (!gamepadConnected || modalOpen || isModalOpen) {
      return;
    }

    const unregister = registerListener(
      {
        // Navigation horizontale (stick gauche)
        onHorizontal: (direction) => {
          setSelectedIndex((prev) => {
            const newIndex = prev + direction;
            const gamesCount = sortedGamesRef.current.length;
            if (newIndex < 0) return 0;
            if (newIndex >= gamesCount) return gamesCount - 1;
            return newIndex;
          });
        },
        // Navigation verticale (stick gauche)
        onVertical: (direction) => {
          setSelectedIndex((prev) => {
            const newIndex = prev + direction * 4;
            const gamesCount = sortedGamesRef.current.length;
            if (newIndex < 0) return 0;
            if (newIndex >= gamesCount) return gamesCount - 1;
            return newIndex;
          });
        },
        // Bouton A = Lancer le jeu sélectionné
        onA: () => {
          setSelectedIndex((currentIndex) => {
            const selectedGame = sortedGamesRef.current[currentIndex];
            if (selectedGame && onLaunchRef.current) {
              onLaunchRef.current(selectedGame);
            }
            return currentIndex;
          });
        },
        // Bouton B = Toggle favori
        onB: () => {
          setSelectedIndex((currentIndex) => {
            const selectedGame = sortedGamesRef.current[currentIndex];
            if (selectedGame && onToggleFavoriteRef.current) {
              onToggleFavoriteRef.current(selectedGame);
            }
            return currentIndex;
          });
        },
        // D-pad pour navigation précise
        onDPAD_LEFT: () => {
          setSelectedIndex((prev) => {
            const gamesCount = sortedGamesRef.current.length;
            return Math.max(0, prev - 1);
          });
        },
        onDPAD_RIGHT: () => {
          setSelectedIndex((prev) => {
            const gamesCount = sortedGamesRef.current.length;
            return Math.min(gamesCount - 1, prev + 1);
          });
        },
        onDPAD_UP: () => {
          setSelectedIndex((prev) => Math.max(0, prev - 4));
        },
        onDPAD_DOWN: () => {
          setSelectedIndex((prev) => {
            const gamesCount = sortedGamesRef.current.length;
            return Math.min(gamesCount - 1, prev + 4);
          });
        },
      },
      0
    ); // Priorité 0 (basse) pour la navigation de base

    return unregister;
  }, [gamepadConnected, modalOpen, isModalOpen, registerListener]);

  // 🎯 Scroll automatique vers le jeu sélectionné
  useEffect(() => {
    if (selectedCardRef.current && gamepadConnected) {
      selectedCardRef.current.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    }
  }, [selectedIndex, gamepadConnected]);

  // Si aucun jeu, afficher message
  if (!games || games.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-400">
        Aucun jeu trouvé 😢
      </div>
    );
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center px-8 py-10"
      style={{
        color: currentTheme.text,
      }}
    >
      <div
        ref={gridRef}
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-10 w-full max-w-7xl"
      >
        {sortedGames.map((game, index) => {
          // Priorité : jaquette dans /covers via local:// si disponible, sinon icône encodée en base64
          const coverUrl = game.icon ? window.electronAPI.getCoverUrl(game.icon) : null;
          const iconSrc = coverUrl || window.electronAPI.getIconPath(game.icon || "default.png");

          const isSelected = gamepadConnected && index === selectedIndex;

          return (
            <div
              key={game.id}
              ref={isSelected ? selectedCardRef : null}
              className={`game-card relative w-64 h-96 rounded-2xl overflow-hidden shadow-lg border transition-all duration-300 ${
                game.favorite ? "ring-2 ring-yellow-400" : ""
              }`}
              style={{
                backgroundColor: currentTheme.cardBg,
                borderColor: isSelected ? currentTheme.accent : currentTheme.border,
                borderWidth: "3px",
                boxShadow: isSelected
                  ? `0 0 32px ${currentTheme.accent}, 0 12px 40px ${currentTheme.shadow}`
                  : `0 4px 16px ${currentTheme.shadow}`,
                transform: isSelected ? "scale(1.1)" : "scale(1)",
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = "scale(1.08)";
                  e.currentTarget.style.borderColor = currentTheme.accent;
                  e.currentTarget.style.boxShadow = `0 0 24px ${currentTheme.accent}, 0 12px 32px ${currentTheme.shadow}`;
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.transform = "scale(1)";
                  e.currentTarget.style.borderColor = currentTheme.border;
                  e.currentTarget.style.boxShadow = `0 4px 16px ${currentTheme.shadow}`;
                }
              }}
            >
              {/* 🎮 Image de jaquette (optimisée) */}
              <img
                src={iconSrc || window.electronAPI.getIconPath("default.png")}
                alt={game.name}
                loading="lazy" // 💤 Charge les images uniquement quand visibles à l’écran
                decoding="async" // ⚡ Améliore les performances de rendu
                className="object-cover w-full h-full object-center rounded-lg transition-transform duration-300"
                onError={(e) => {
                  // ✅ Empêche la boucle infinie de rechargement
                  if (!e.target.dataset.fallback) {
                    e.target.dataset.fallback = "true";
                    e.target.src = window.electronAPI.getIconPath("default.png");
                  }
                }}
              />

              {/* ⭐ Bouton Favori en haut à droite */}
              <button
                onClick={() => onToggleFavorite?.(game)}
                title={game.favorite ? "Retirer des favoris" : "Ajouter aux favoris"}
                className="absolute top-3 right-3 text-2xl transition-all duration-200"
                style={{
                  filter: game.favorite ? "none" : "grayscale(100%)",
                  opacity: game.favorite ? 1 : 0.5,
                  transform: game.favorite ? "scale(1.1)" : "scale(1)",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.filter = "none";
                  e.currentTarget.style.opacity = "1";
                  e.currentTarget.style.transform = "scale(1.2)";
                }}
                onMouseLeave={(e) => {
                  if (!game.favorite) {
                    e.currentTarget.style.filter = "grayscale(100%)";
                    e.currentTarget.style.opacity = "0.5";
                    e.currentTarget.style.transform = "scale(1)";
                  } else {
                    e.currentTarget.style.transform = "scale(1.1)";
                  }
                }}
              >
                ⭐
              </button>

              {/* 📊 Badge de statut en haut à gauche */}
              {game.status && game.status !== "not-started" && (
                <div
                  className={`absolute top-3 left-3 px-2 py-1 rounded-full text-xs font-semibold shadow-lg ${
                    game.status === "in-progress"
                      ? "bg-blue-600 text-white"
                      : game.status === "completed"
                      ? "bg-green-600 text-white"
                      : game.status === "100-percent"
                      ? "bg-yellow-500 text-black"
                      : "bg-gray-600 text-white"
                  }`}
                >
                  {game.status === "in-progress"
                    ? "🎮 En cours"
                    : game.status === "completed"
                    ? "✅ Terminé"
                    : game.status === "100-percent"
                    ? "🏆 100%"
                    : "⏸️ Non commencé"}
                </div>
              )}

              {/* 📛 Nom du jeu (superposé en bas) */}
              <div className="absolute bottom-14 left-0 right-0 text-center bg-gradient-to-t from-black/90 to-transparent py-4">
                <h2 className="text-lg font-semibold">{game.name}</h2>
                {/* ⏱️ Temps de jeu */}
                {game.playTime > 0 && (
                  <div className="text-xs text-gray-300 mt-1">
                    ⏱️ {Math.floor(game.playTime / 60)}h {game.playTime % 60}min
                  </div>
                )}
              </div>

              {/* 🚀 Bouton "Lancer" centré en bas */}
              <button
                onClick={() => onLaunch?.(game)}
                className="absolute bottom-3 left-1/2 -translate-x-1/2 font-semibold py-1.5 px-4 rounded-full shadow-md transition-all duration-300 text-sm"
                style={{
                  background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.accent})`,
                  color: currentTheme.text,
                }}
              >
                🚀 Lancer
              </button>

              {/*  Bouton Détails en bas à gauche */}
              <button
                onClick={() => onShowDetails?.(game)}
                className="absolute bottom-3 left-3 bg-purple-600 hover:bg-purple-500 text-white text-xs py-1 px-2 rounded-md shadow-md transition-all duration-300"
                title="Détails et notes"
              >
                📝
              </button>

              {/* � Bouton Supprimer en bas à droite */}
              <button
                onClick={() => onDelete?.(game)}
                className="absolute bottom-3 right-3 bg-red-600 hover:bg-red-500 text-white text-xs py-1 px-2 rounded-md shadow-md transition-all duration-300"
                title="Supprimer"
              >
                🗑
              </button>

              {/* 🔎 Bouton : rechercher & télécharger une jaquette depuis SteamGridDB */}
              <button
                onClick={async () => {
                  try {
                    const settings = await window.electronAPI.getSettings();
                    const apiKey = settings?.sgdbApiKey;
                    if (!apiKey) {
                      alert("Veuillez renseigner votre SteamGridDB API Key dans les paramètres.");
                      return;
                    }
                    setCurrentGame(game);
                    setModalOpen(true);
                  } catch (err) {
                    console.error(err);
                    alert("Erreur : " + err.message);
                  }
                }}
                className="absolute top-3 left-3 bg-green-600 hover:bg-green-500 text-white text-xs py-1 px-2 rounded-md shadow-md transition-all duration-300 z-10"
                title="Trouver jaquette"
              >
                🔎 Jaquette
              </button>
            </div>
          );
        })}
      </div>

      {/* Modal de sélection de jaquette */}
      <GridSelectorModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setCurrentGame(null);
        }}
        gameName={currentGame?.name}
        term={currentGame?.name}
        onSelect={async (grid) => {
          try {
            setLoadingId(currentGame.id);
            const res = await window.electronAPI.sgdbDownloadGridByUrl({
              url: grid.url,
              filenamePrefix: `${currentGame.id}_`,
            });

            if (res && res.success && res.path) {
              const parts = res.path.split(/\\|\//);
              const basename = parts[parts.length - 1];
              onUpdate?.(currentGame.id, { icon: basename });
              alert("✅ Jaquette téléchargée : " + basename);
            } else {
              alert("❌ Échec : " + (res?.error || "aucune réponse"));
            }
          } catch (err) {
            console.error(err);
            alert("❌ Erreur : " + err.message);
          } finally {
            setLoadingId(null);
          }
        }}
      />
    </div>
  );
};

export default GameGrid;
