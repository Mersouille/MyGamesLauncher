// src/pages/AchievementsPage.jsx
import React, { useMemo, useEffect } from "react";
import { getTheme } from "../data/themes";
import { useGamepad } from "../hooks/useGamepad";
import {
  achievements,
  achievementCategories,
  rarityColors,
  calculateStats,
  getAchievementProgress,
} from "../data/achievements";

/**
 * AchievementsPage - Page dédiée à l'affichage des achievements
 * Affiche tous les achievements avec progression, filtres par catégorie, et statistiques
 */
const AchievementsPage = ({
  games,
  collections,
  unlockedAchievements = [],
  currentTheme = "dark",
  onClose,
}) => {
  const theme = getTheme(currentTheme);
  const [selectedCategory, setSelectedCategory] = React.useState("all");
  const { gamepadConnected, registerListener } = useGamepad();
  const [closeButtonActive, setCloseButtonActive] = React.useState(false);

  // Ref pour éviter de réenregistrer le listener
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose; // Mise à jour directe pendant le render

  // ⚠️ CRITIQUE: Activer le bouton ✕ seulement après 2 secondes pour éviter les clics accidentels
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("✅ [AchievementsPage] Bouton ✕ activé après 2s");
      setCloseButtonActive(true);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // 🎮 Listener gamepad pour fermer avec le bouton B
  useEffect(() => {
    if (!gamepadConnected) return;

    const unregister = registerListener(
      {
        onB: () => {
          console.log("🎮 [AchievementsPage] Bouton B pressé - fermeture");
          if (onCloseRef.current) {
            onCloseRef.current();
          }
        },
      },
      100 // Priorité 100 (haute) pour fermer le modal
    );

    return unregister;
  }, [gamepadConnected, registerListener]);

  // Calculer les statistiques actuelles
  const stats = useMemo(
    () => calculateStats(games, collections, unlockedAchievements),
    [games, collections, unlockedAchievements]
  );

  // ❌ SUPPRIMÉ: Le listener B est maintenant géré par Sidebar (toujours actif)
  // Plus besoin d'enregistrer un listener ici, évite les race conditions

  // Filtrer les achievements par catégorie
  const filteredAchievements = useMemo(() => {
    if (selectedCategory === "all") return achievements;
    if (selectedCategory === "unlocked")
      return achievements.filter((a) => unlockedAchievements.some((u) => u.id === a.id));
    return achievements.filter((a) => a.category === selectedCategory);
  }, [selectedCategory, unlockedAchievements]);

  // Statistiques globales
  const totalAchievements = achievements.length;
  const unlockedCount = unlockedAchievements.length;
  const completionPercentage = Math.round((unlockedCount / totalAchievements) * 100);

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.9)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
        overflowY: "auto",
      }}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: "24px",
          border: `2px solid ${theme.border}`,
          boxShadow: `0 0 60px ${theme.shadow}`,
          maxWidth: "1200px",
          width: "100%",
          maxHeight: "90vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "32px",
            borderBottom: `1px solid ${theme.border}`,
            background: `linear-gradient(135deg, ${theme.primary}22, ${theme.accent}22)`,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "20px",
            }}
          >
            <h1
              style={{
                margin: 0,
                fontSize: "32px",
                fontWeight: "bold",
                color: theme.text,
                display: "flex",
                alignItems: "center",
                gap: "16px",
              }}
            >
              🏆 Achievements
            </h1>
            <button
              onClick={() => {
                console.log("❌ [AchievementsPage] Bouton ✕ cliqué avec souris");
                onClose();
              }}
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "50%",
                width: "40px",
                height: "40px",
                color: theme.text,
                cursor: "pointer",
                fontSize: "20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
            >
              ✕
            </button>
          </div>

          {/* Statistiques globales */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "16px",
              marginBottom: "20px",
            }}
          >
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>🏆</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.text }}>
                {unlockedCount}/{totalAchievements}
              </div>
              <div style={{ fontSize: "12px", color: theme.textSecondary }}>Débloqués</div>
            </div>
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>📊</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.accent }}>
                {completionPercentage}%
              </div>
              <div style={{ fontSize: "12px", color: theme.textSecondary }}>Succès débloqués</div>
            </div>
            <div
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "12px",
                padding: "16px",
                textAlign: "center",
              }}
            >
              <div style={{ fontSize: "32px", marginBottom: "8px" }}>⏱️</div>
              <div style={{ fontSize: "24px", fontWeight: "bold", color: theme.primary }}>
                {Math.floor(stats.totalPlayTime / 60)}h
              </div>
              <div style={{ fontSize: "12px", color: theme.textSecondary }}>Temps total</div>
            </div>
          </div>

          {/* Barre de progression globale */}
          <div
            style={{
              background: theme.cardBg,
              border: `1px solid ${theme.border}`,
              borderRadius: "12px",
              padding: "20px",
              marginTop: "24px",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
              <span style={{ fontSize: "14px", color: theme.text }}>
                Progression des achievements
              </span>
              <span style={{ fontSize: "14px", color: theme.accent, fontWeight: "600" }}>
                {completionPercentage}%
              </span>
            </div>
            <div
              style={{
                background: theme.border,
                borderRadius: "8px",
                height: "12px",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  background: `linear-gradient(90deg, ${theme.primary}, ${theme.accent})`,
                  width: `${completionPercentage}%`,
                  height: "100%",
                  transition: "width 0.5s ease",
                  boxShadow: `0 0 10px ${theme.accent}`,
                }}
              />
            </div>
          </div>

          {/* Filtres par catégorie */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            <button
              onClick={() => setSelectedCategory("all")}
              style={{
                background: selectedCategory === "all" ? theme.accent : theme.cardBg,
                border: `1px solid ${selectedCategory === "all" ? theme.accent : theme.border}`,
                borderRadius: "20px",
                padding: "8px 16px",
                color: theme.text,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              Tous ({totalAchievements})
            </button>
            <button
              onClick={() => setSelectedCategory("unlocked")}
              style={{
                background: selectedCategory === "unlocked" ? theme.accent : theme.cardBg,
                border: `1px solid ${
                  selectedCategory === "unlocked" ? theme.accent : theme.border
                }`,
                borderRadius: "20px",
                padding: "8px 16px",
                color: theme.text,
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "600",
                transition: "all 0.2s",
              }}
            >
              🏆 Débloqués ({unlockedCount})
            </button>
            {Object.values(achievementCategories).map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                style={{
                  background: selectedCategory === category ? theme.accent : theme.cardBg,
                  border: `1px solid ${
                    selectedCategory === category ? theme.accent : theme.border
                  }`,
                  borderRadius: "20px",
                  padding: "8px 16px",
                  color: theme.text,
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600",
                  transition: "all 0.2s",
                }}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Liste des achievements */}
        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
              gap: "16px",
            }}
          >
            {filteredAchievements.map((achievement) => {
              const isUnlocked = unlockedAchievements.some((u) => u.id === achievement.id);
              const progress = getAchievementProgress(achievement, stats);
              const rarityColor = rarityColors[achievement.rarity];
              const unlocked = unlockedAchievements.find((u) => u.id === achievement.id);

              return (
                <div
                  key={achievement.id}
                  style={{
                    background: isUnlocked ? `${rarityColor}11` : theme.cardBg,
                    border: `2px solid ${isUnlocked ? rarityColor : theme.border}`,
                    borderRadius: "16px",
                    padding: "20px",
                    transition: "all 0.3s",
                    opacity: isUnlocked ? 1 : 0.7,
                    filter: isUnlocked ? "none" : "grayscale(70%)",
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  {/* Badge débloqué */}
                  {isUnlocked && (
                    <div
                      style={{
                        position: "absolute",
                        top: "12px",
                        right: "12px",
                        background: rarityColor,
                        color: "#fff",
                        padding: "4px 10px",
                        borderRadius: "12px",
                        fontSize: "11px",
                        fontWeight: "700",
                        boxShadow: `0 2px 8px ${rarityColor}88`,
                      }}
                    >
                      ✓ DÉBLOQUÉ
                    </div>
                  )}

                  <div style={{ display: "flex", gap: "16px", marginBottom: "12px" }}>
                    <div
                      style={{
                        fontSize: "48px",
                        filter: isUnlocked ? `drop-shadow(0 0 8px ${rarityColor})` : "none",
                      }}
                    >
                      {achievement.icon}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h3
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "18px",
                          fontWeight: "bold",
                          color: isUnlocked ? rarityColor : theme.text,
                        }}
                      >
                        {achievement.name}
                      </h3>
                      <p
                        style={{
                          margin: "0 0 8px 0",
                          fontSize: "13px",
                          color: theme.textSecondary,
                          lineHeight: "1.5",
                        }}
                      >
                        {achievement.description}
                      </p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            background: `${rarityColor}22`,
                            color: rarityColor,
                            padding: "3px 8px",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {achievement.category}
                        </span>
                        <span
                          style={{
                            background: `${rarityColor}22`,
                            color: rarityColor,
                            padding: "3px 8px",
                            borderRadius: "8px",
                            fontSize: "10px",
                            fontWeight: "600",
                            textTransform: "uppercase",
                          }}
                        >
                          {achievement.rarity}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Barre de progression */}
                  {!isUnlocked && progress > 0 && (
                    <div style={{ marginTop: "12px" }}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          marginBottom: "6px",
                        }}
                      >
                        <span style={{ fontSize: "11px", color: theme.textSecondary }}>
                          Progression
                        </span>
                        <span
                          style={{
                            fontSize: "11px",
                            color: theme.accent,
                            fontWeight: "600",
                          }}
                        >
                          {progress}%
                        </span>
                      </div>
                      <div
                        style={{
                          background: theme.border,
                          borderRadius: "6px",
                          height: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            background: rarityColor,
                            width: `${progress}%`,
                            height: "100%",
                            transition: "width 0.5s ease",
                          }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Date de déblocage */}
                  {isUnlocked && unlocked && (
                    <div
                      style={{
                        marginTop: "12px",
                        fontSize: "11px",
                        color: theme.textSecondary,
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                      }}
                    >
                      🗓️ Débloqué le{" "}
                      {new Date(unlocked.unlockedAt).toLocaleDateString("fr-FR", {
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {filteredAchievements.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: "60px 20px",
                color: theme.textSecondary,
              }}
            >
              <div style={{ fontSize: "64px", marginBottom: "16px" }}>🏆</div>
              <div style={{ fontSize: "18px", fontWeight: "600", marginBottom: "8px" }}>
                Aucun achievement dans cette catégorie
              </div>
              <div style={{ fontSize: "14px" }}>Sélectionnez une autre catégorie</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AchievementsPage;
