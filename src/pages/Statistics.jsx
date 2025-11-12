import React, { useEffect, useRef } from "react";
import { useGamepad } from "../hooks/useGamepad";
import { getTheme } from "../data/themes";

// ✅ Version modale (comme Achievements) avec bouton ✕ et fermeture via B
const Statistics = ({ games, onClose, currentTheme = "dark" }) => {
  const theme = getTheme(currentTheme);
  const { gamepadConnected, registerListener } = useGamepad();

  // Ref pour éviter de réenregistrer le listener
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // 🎮 Écoute du bouton B pour fermer
  useEffect(() => {
    if (!gamepadConnected) return;

    const unregister = registerListener(
      {
        onB: () => {
          if (onCloseRef.current) {
            onCloseRef.current();
          }
        },
      },
      100
    ); // Priorité 100 (haute) pour fermer la page

    return unregister;
  }, [gamepadConnected, registerListener]);

  // 📊 Calcul des statistiques générales
  const totalGames = games.length;
  const totalPlayTime = games.reduce((sum, game) => sum + (game.playTime || 0), 0);
  const averagePlayTime = totalGames > 0 ? (totalPlayTime / totalGames).toFixed(1) : 0;
  const favoritesCount = games.filter((g) => g.favorite).length;

  // 🎯 Statistiques de progression
  const statusStats = {
    "not-started": games.filter((g) => !g.status || g.status === "not-started").length,
    "in-progress": games.filter((g) => g.status === "in-progress").length,
    completed: games.filter((g) => g.status === "completed").length,
    "100-percent": games.filter((g) => g.status === "100-percent").length,
  };

  const completionRate =
    totalGames > 0
      ? (((statusStats.completed + statusStats["100-percent"]) / totalGames) * 100).toFixed(1)
      : 0;

  // 📈 Répartition par catégories
  const categoryStats = games.reduce((acc, game) => {
    const cat = game.category || "Sans catégorie";
    acc[cat] = (acc[cat] || 0) + 1;
    return acc;
  }, {});

  const sortedCategories = Object.entries(categoryStats).sort((a, b) => b[1] - a[1]);

  // ⭐ Top jeux par note
  const topRatedGames = games
    .filter((g) => g.rating > 0)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 5);

  // 🎮 Top jeux par temps de jeu
  const topPlayedGames = games
    .filter((g) => g.playTime > 0)
    .sort((a, b) => b.playTime - a.playTime)
    .slice(0, 5);

  // 📅 Jeux ajoutés récemment
  const recentGames = [...games]
    .sort((a, b) => new Date(b.dateAdded) - new Date(a.dateAdded))
    .slice(0, 5);

  // 🎨 Fonction pour formater le temps (playTime est en MINUTES)
  const formatTime = (minutes) => {
    if (minutes === 0) return "0min";
    if (minutes < 60) return `${Math.round(minutes)}min`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    if (mins === 0) return `${hours}h`;
    return `${hours}h ${mins}min`;
  };

  // 🎨 Fonction pour formater la date
  const formatDate = (dateString) => {
    if (!dateString) return "Date inconnue";
    const date = new Date(dateString);
    return date.toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.9)",
        backdropFilter: "blur(14px)",
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: 24,
          border: `2px solid ${theme.border}`,
          boxShadow: `0 0 60px ${theme.shadow}`,
          width: "100%",
          maxWidth: 1280,
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: 32,
            borderBottom: `1px solid ${theme.border}`,
            background: `linear-gradient(135deg, ${theme.primary}22, ${theme.accent}22)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 800, color: theme.text }}>
            📊 Statistiques
          </h1>
          <button
            onClick={() => onClose?.()}
            style={{
              width: 44,
              height: 44,
              borderRadius: "50%",
              border: `2px solid ${theme.border}`,
              background: theme.cardBg,
              color: theme.text,
              cursor: "pointer",
              fontSize: 22,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all .2s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = theme.accent;
              e.currentTarget.style.boxShadow = `0 0 12px ${theme.accent}`;
              e.currentTarget.style.transform = "scale(1.05)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = theme.border;
              e.currentTarget.style.boxShadow = "none";
              e.currentTarget.style.transform = "scale(1)";
            }}
            title="Fermer (B)"
          >
            ✕
          </button>
        </div>

        <div style={{ padding: 24, overflowY: "auto" }}>
          <h2 className="text-3xl font-bold text-white mb-8" style={{ display: "none" }}>
            (Header caché, remplacé)
          </h2>

          {/* 📊 Statistiques générales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 rounded-lg p-6 shadow-lg">
              <div className="text-blue-200 text-sm font-semibold mb-2">Total de jeux</div>
              <div className="text-4xl font-bold text-white">{totalGames}</div>
            </div>

            <div className="bg-gradient-to-br from-purple-600 to-purple-800 rounded-lg p-6 shadow-lg">
              <div className="text-purple-200 text-sm font-semibold mb-2">Temps total</div>
              <div className="text-4xl font-bold text-white">{formatTime(totalPlayTime)}</div>
            </div>

            <div className="bg-gradient-to-br from-green-600 to-green-800 rounded-lg p-6 shadow-lg">
              <div className="text-green-200 text-sm font-semibold mb-2">Temps moyen par jeu</div>
              <div className="text-4xl font-bold text-white">
                {formatTime(parseFloat(averagePlayTime))}
              </div>
            </div>

            <div className="bg-gradient-to-br from-yellow-600 to-yellow-800 rounded-lg p-6 shadow-lg">
              <div className="text-yellow-200 text-sm font-semibold mb-2">Favoris</div>
              <div className="text-4xl font-bold text-white">{favoritesCount}</div>
            </div>
          </div>

          {/* 🎯 Progression */}
          <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg mb-8">
            <h2 className="text-xl font-bold text-white mb-4">🎯 Progression des jeux</h2>
            <div className="mb-4">
              <div className="flex justify-between text-sm text-gray-300 mb-2">
                <span>Taux de complétion des jeux</span>
                <span className="font-bold text-green-400">{completionRate}%</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-4 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-green-500 to-green-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${completionRate}%` }}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="text-center">
                <div className="text-3xl mb-2">⏸️</div>
                <div className="text-2xl font-bold text-white">{statusStats["not-started"]}</div>
                <div className="text-xs text-gray-400">Non commencés</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🎮</div>
                <div className="text-2xl font-bold text-blue-400">{statusStats["in-progress"]}</div>
                <div className="text-xs text-gray-400">En cours</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">✅</div>
                <div className="text-2xl font-bold text-green-400">{statusStats.completed}</div>
                <div className="text-xs text-gray-400">Terminés</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-2">🏆</div>
                <div className="text-2xl font-bold text-yellow-400">
                  {statusStats["100-percent"]}
                </div>
                <div className="text-xs text-gray-400">100%</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* 📈 Répartition par catégories */}
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">📈 Par catégorie</h2>
              <div className="space-y-3">
                {sortedCategories.slice(0, 8).map(([category, count]) => {
                  const percentage = ((count / totalGames) * 100).toFixed(1);
                  return (
                    <div key={category}>
                      <div className="flex justify-between text-sm text-gray-300 mb-1">
                        <span className="truncate">{category}</span>
                        <span className="font-semibold ml-2">
                          {count} ({percentage}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-full rounded-full transition-all duration-500"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ⭐ Top jeux par note */}
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">⭐ Mieux notés</h2>
              {topRatedGames.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun jeu noté pour le moment</p>
              ) : (
                <div className="space-y-3">
                  {topRatedGames.map((game, index) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="text-2xl font-bold text-yellow-400 w-8 text-center">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{game.name}</div>
                        <div className="flex gap-0.5 mt-1">
                          {[...Array(5)].map((_, i) => (
                            <span
                              key={i}
                              className={`text-sm ${
                                i < game.rating ? "text-yellow-400" : "text-gray-600"
                              }`}
                            >
                              ⭐
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* 🎮 Top jeux par temps de jeu */}
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">🎮 Plus joués</h2>
              {topPlayedGames.length === 0 ? (
                <p className="text-gray-400 text-sm">Aucun temps de jeu enregistré</p>
              ) : (
                <div className="space-y-3">
                  {topPlayedGames.map((game, index) => (
                    <div
                      key={game.id}
                      className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                    >
                      <div className="text-2xl font-bold text-purple-400 w-8 text-center">
                        #{index + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-white font-semibold truncate">{game.name}</div>
                        <div className="text-sm text-gray-400 mt-1">
                          ⏱️ {formatTime(game.playTime)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 📅 Jeux ajoutés récemment */}
            <div className="bg-gray-800/50 rounded-lg p-6 shadow-lg">
              <h2 className="text-xl font-bold text-white mb-4">📅 Ajoutés récemment</h2>
              <div className="space-y-3">
                {recentGames.map((game, index) => (
                  <div
                    key={game.id}
                    className="flex items-center gap-3 bg-gray-700/50 rounded-lg p-3 hover:bg-gray-700 transition-colors"
                  >
                    <div className="text-2xl font-bold text-blue-400 w-8 text-center">
                      #{index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-white font-semibold truncate">{game.name}</div>
                      <div className="text-sm text-gray-400 mt-1">
                        📅 {formatDate(game.dateAdded)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Statistics;
