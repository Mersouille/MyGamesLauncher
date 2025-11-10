import React, { useState, useEffect } from "react";
import { getTheme } from "../data/themes";

const ImportGames = ({ onImport, onClose, theme }) => {
  const currentTheme = getTheme(theme || "dark");
  const [scanning, setScanning] = useState(false);
  const [gamesByLauncher, setGamesByLauncher] = useState({
    steam: [],
    epic: [],
    ubisoft: [],
    battlenet: [],
    origin: [],
    gog: [],
    rockstar: [],
  });
  const [selectedGames, setSelectedGames] = useState(new Set());
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importing, setImporting] = useState(false);

  const launcherInfo = {
    steam: { name: "Steam", icon: "🎮", color: "#1b2838" },
    epic: { name: "Epic Games", icon: "🏪", color: "#2a2a2a" },
    ubisoft: { name: "Ubisoft Connect", icon: "🎯", color: "#0080c7" },
    battlenet: { name: "Battle.net", icon: "⚔️", color: "#148eff" },
    origin: { name: "EA Origin", icon: "🎲", color: "#f56c2d" },
    gog: { name: "GOG Galaxy", icon: "🌌", color: "#86328a" },
    rockstar: { name: "Rockstar Games", icon: "⭐", color: "#fcaf17" },
  };

  // Scanner les jeux au montage du composant
  useEffect(() => {
    scanGames();
  }, []);

  const scanGames = async () => {
    setScanning(true);
    const results = {};

    try {
      // Scanner tous les launchers en parallèle
      const [steam, epic, ubisoft, battlenet, origin, gog, rockstar] = await Promise.all([
        window.electronAPI.scanSteamGames().catch(() => ({ success: false, games: [] })),
        window.electronAPI.scanEpicGames().catch(() => ({ success: false, games: [] })),
        window.electronAPI.scanUbisoftGames().catch(() => ({ success: false, games: [] })),
        window.electronAPI.scanBattlenetGames().catch(() => ({ success: false, games: [] })),
        window.electronAPI.scanOriginGames().catch(() => ({ success: false, games: [] })),
        window.electronAPI.scanGOGGames().catch(() => ({ success: false, games: [] })),
        window.electronAPI.scanRockstarGames().catch(() => ({ success: false, games: [] })),
      ]);

      setGamesByLauncher({
        steam: steam.success ? steam.games || [] : [],
        epic: epic.success ? epic.games || [] : [],
        ubisoft: ubisoft.success ? ubisoft.games || [] : [],
        battlenet: battlenet.success ? battlenet.games || [] : [],
        origin: origin.success ? origin.games || [] : [],
        gog: gog.success ? gog.games || [] : [],
        rockstar: rockstar.success ? rockstar.games || [] : [],
      });
    } catch (error) {
      console.error("Erreur lors du scan:", error);
    } finally {
      setScanning(false);
    }
  };

  const toggleGame = (gameId) => {
    setSelectedGames((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(gameId)) {
        newSet.delete(gameId);
      } else {
        newSet.add(gameId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allGames = Object.values(gamesByLauncher).flat();
    setSelectedGames(new Set(allGames.map((g) => g.id)));
  };

  const deselectAll = () => {
    setSelectedGames(new Set());
  };

  const handleImport = async () => {
    const allGames = Object.values(gamesByLauncher).flat();
    const gamesToImport = allGames.filter((g) => selectedGames.has(g.id));

    if (gamesToImport.length === 0) {
      alert("Aucun jeu sélectionné");
      return;
    }

    setImporting(true);
    setImportProgress({ current: 0, total: gamesToImport.length });

    try {
      for (let i = 0; i < gamesToImport.length; i++) {
        const game = gamesToImport[i];
        setImportProgress({ current: i + 1, total: gamesToImport.length });

        // Importer le jeu
        await window.electronAPI.importGame(game);

        // Petite pause pour éviter de surcharger
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      // Notifier le parent et fermer
      onImport?.(gamesToImport);
      onClose?.();
    } catch (error) {
      console.error("Erreur lors de l'import:", error);
      alert(`Erreur lors de l'import: ${error.message}`);
    } finally {
      setImporting(false);
    }
  };

  const totalGames = Object.values(gamesByLauncher).reduce((sum, games) => sum + games.length, 0);
  const selectedCount = selectedGames.size;

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        backdropFilter: "blur(8px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 10000,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: currentTheme.cardBg,
          color: currentTheme.text,
          borderRadius: "16px",
          padding: "32px",
          maxWidth: "800px",
          width: "90%",
          maxHeight: "80vh",
          overflow: "auto",
          boxShadow: `0 16px 48px ${currentTheme.shadow}`,
          border: `2px solid ${currentTheme.border}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* En-tête */}
        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <h2
            style={{
              fontSize: "1.8rem",
              fontWeight: "700",
              marginBottom: "8px",
              color: currentTheme.text,
            }}
          >
            📥 Importer des jeux
          </h2>
          <p style={{ color: currentTheme.textSecondary, fontSize: "0.95rem" }}>
            Détection automatique depuis 7 launchers
          </p>
        </div>

        {/* Scan en cours */}
        {scanning && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                border: `4px solid ${currentTheme.border}`,
                borderTopColor: currentTheme.accent,
                borderRadius: "50%",
                animation: "spin 1s linear infinite",
                margin: "0 auto 16px",
              }}
            />
            <p style={{ color: currentTheme.textSecondary }}>Recherche des jeux installés...</p>
          </div>
        )}

        {/* Résultats */}
        {!scanning && totalGames === 0 && (
          <div style={{ textAlign: "center", padding: "40px" }}>
            <p style={{ fontSize: "2rem", marginBottom: "16px" }}>😔</p>
            <p style={{ color: currentTheme.textSecondary, marginBottom: "8px" }}>
              Aucun jeu détecté
            </p>
            <p style={{ color: currentTheme.textSecondary, fontSize: "0.85rem" }}>
              Lanceurs supportés : Steam, Epic, Ubisoft, Battle.net, Origin, GOG, Rockstar
            </p>
            <button
              onClick={scanGames}
              style={{
                marginTop: "16px",
                padding: "10px 20px",
                background: currentTheme.primary,
                color: currentTheme.text,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              🔄 Réessayer
            </button>
          </div>
        )}

        {!scanning && totalGames > 0 && (
          <>
            {/* Barre d'actions */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "16px",
                padding: "12px 16px",
                background: currentTheme.cardHoverBg,
                borderRadius: "8px",
              }}
            >
              <div style={{ fontSize: "0.9rem", color: currentTheme.textSecondary }}>
                {selectedCount} / {totalGames} jeux sélectionnés
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={selectAll}
                  style={{
                    padding: "6px 12px",
                    background: currentTheme.primary,
                    color: currentTheme.text,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                    fontWeight: "600",
                  }}
                >
                  Tout sélectionner
                </button>
                <button
                  onClick={deselectAll}
                  style={{
                    padding: "6px 12px",
                    background: currentTheme.border,
                    color: currentTheme.text,
                    border: "none",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "0.85rem",
                  }}
                >
                  Tout désélectionner
                </button>
              </div>
            </div>

            {/* Listes des jeux par launcher */}
            {Object.entries(gamesByLauncher).map(([launcher, games]) => {
              if (games.length === 0) return null;
              const info = launcherInfo[launcher];

              return (
                <div key={launcher} style={{ marginBottom: "20px" }}>
                  <h3
                    style={{
                      fontSize: "1.05rem",
                      fontWeight: "600",
                      marginBottom: "10px",
                      color: currentTheme.text,
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <span style={{ fontSize: "1.3rem" }}>{info.icon}</span>
                    <span>{info.name}</span>
                    <span
                      style={{
                        fontSize: "0.85rem",
                        color: currentTheme.textSecondary,
                        fontWeight: "500",
                      }}
                    >
                      ({games.length})
                    </span>
                  </h3>
                  <div
                    style={{
                      maxHeight: "180px",
                      overflow: "auto",
                      paddingRight: "4px",
                    }}
                  >
                    {games.map((game) => (
                      <div
                        key={game.id}
                        onClick={() => toggleGame(game.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "8px 12px",
                          background: selectedGames.has(game.id)
                            ? currentTheme.primary
                            : "transparent",
                          borderRadius: "6px",
                          marginBottom: "3px",
                          cursor: "pointer",
                          transition: "all 0.2s",
                          border: `1px solid ${
                            selectedGames.has(game.id) ? currentTheme.accent : currentTheme.border
                          }`,
                        }}
                        onMouseEnter={(e) => {
                          if (!selectedGames.has(game.id)) {
                            e.currentTarget.style.background = currentTheme.cardHoverBg;
                            e.currentTarget.style.borderColor = info.color;
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!selectedGames.has(game.id)) {
                            e.currentTarget.style.background = "transparent";
                            e.currentTarget.style.borderColor = currentTheme.border;
                          }
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={selectedGames.has(game.id)}
                          onChange={() => {}}
                          style={{ marginRight: "10px", cursor: "pointer" }}
                        />
                        <span style={{ flex: 1, fontSize: "0.9rem" }}>{game.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}

            {/* Barre de progression */}
            {importing && (
              <div style={{ marginBottom: "16px" }}>
                <div
                  style={{
                    background: currentTheme.border,
                    height: "24px",
                    borderRadius: "12px",
                    overflow: "hidden",
                    position: "relative",
                  }}
                >
                  <div
                    style={{
                      background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.accent})`,
                      height: "100%",
                      width: `${(importProgress.current / importProgress.total) * 100}%`,
                      transition: "width 0.3s ease",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "0.75rem",
                      fontWeight: "600",
                      color: currentTheme.text,
                    }}
                  >
                    {importProgress.current} / {importProgress.total}
                  </div>
                </div>
              </div>
            )}

            {/* Boutons d'action */}
            <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
              <button
                onClick={handleImport}
                disabled={importing || selectedCount === 0}
                style={{
                  flex: 1,
                  padding: "14px 24px",
                  background:
                    importing || selectedCount === 0 ? currentTheme.border : currentTheme.primary,
                  color: currentTheme.text,
                  border: "none",
                  borderRadius: "10px",
                  cursor: importing || selectedCount === 0 ? "not-allowed" : "pointer",
                  fontWeight: "700",
                  fontSize: "1rem",
                  opacity: importing || selectedCount === 0 ? 0.5 : 1,
                }}
              >
                {importing ? "⏳ Import en cours..." : `📥 Importer ${selectedCount} jeu(x)`}
              </button>
              <button
                onClick={onClose}
                disabled={importing}
                style={{
                  padding: "14px 24px",
                  background: currentTheme.border,
                  color: currentTheme.text,
                  border: "none",
                  borderRadius: "10px",
                  cursor: importing ? "not-allowed" : "pointer",
                  fontWeight: "600",
                  opacity: importing ? 0.5 : 1,
                }}
              >
                Annuler
              </button>
            </div>
          </>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        `}
      </style>
    </div>
  );
};

export default ImportGames;
