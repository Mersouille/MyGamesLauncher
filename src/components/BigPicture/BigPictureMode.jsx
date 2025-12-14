import React, { useEffect, useMemo, useRef, useState } from "react";
import { useGamepad } from "../../hooks/useGamepad";
import categories from "../../data/categories";
import { getTheme } from "../../data/themes";

/*
  BigPictureMode: Interface plein écran optimisée TV/manette
  - Navigation D-pad/stick gauche dans la grille
  - LB/RB changent de catégorie
  - A lance le jeu
  - B ferme le mode
*/
export default function BigPictureMode({
  games = [],
  theme = "dark",
  initialCategory = "Tous les jeux",
  uiScale = 1,
  onClose,
  onLaunchGame,
}) {
  const currentTheme = getTheme(theme);
  const { gamepadConnected, registerListener } = useGamepad();

  const [categoryIndex, setCategoryIndex] = useState(
    Math.max(0, categories.indexOf(initialCategory))
  );
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showSidebar, setShowSidebar] = useState(false);
  const [flippedCards, setFlippedCards] = useState(new Set()); // IDs des cartes retournées
  const rootRef = useRef(null);
  const selectedRef = useRef(null);

  const filteredGames = useMemo(() => {
    const cat = categories[categoryIndex] || "Tous les jeux";
    if (cat === "Tous les jeux") return games;
    return games.filter((g) => (g.category || "Tous les jeux") === cat);
  }, [games, categoryIndex]);

  // 📺 Colonnes et taille cartes dynamiques (optimisées 4K) - Tailles augmentées
  const getCols = () => {
    const w = window.innerWidth || 1920;
    // 🎮 Réduction du nombre de colonnes pour des jaquettes plus grandes
    if (w >= 3840) return 6;  // 4K : 6 colonnes au lieu de 8
    if (w >= 2560) return 5;  // 2K : 5 colonnes au lieu de 6
    if (w >= 1920) return 4;  // Full HD : 4 colonnes au lieu de 5
    if (w >= 1280) return 3;  // HD : 3 colonnes au lieu de 4
    return 2;
  };
  const [cols, setCols] = useState(getCols());
  const getCardSize = () => {
    const w = window.innerWidth || 1920;
    // 🎮 Cartes significativement plus grandes : 350-500px selon la largeur d'écran
    const base = w >= 3840 ? 500 : w >= 2560 ? 420 : w >= 1920 ? 380 : 320;
    const cardW = Math.round(base * uiScale);
    const cardH = Math.round(cardW * 1.5);
    return { cardW, cardH };
  };
  const [{ cardW, cardH }, setCard] = useState(getCardSize());

  useEffect(() => {
    const onResize = () => {
      setCols(getCols());
      setCard(getCardSize());
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  // Scroll auto vers l'élément sélectionné
  useEffect(() => {
    if (selectedRef.current) {
      selectedRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [selectedIndex, categoryIndex]);

  // Navigation clavier (flèches) pour cohérence avec souris/manette
  useEffect(() => {
    const handleKeyboard = (e) => {
      if (showSidebar) {
        // Dans le sidebar, gérer seulement la fermeture
        if (e.key === "Escape" || e.key === "y" || e.key === "Y") {
          e.preventDefault();
          setShowSidebar(false);
        }
        return;
      }

      // Navigation dans la grille
      switch (e.key) {
        case "ArrowLeft":
          e.preventDefault();
          setSelectedIndex((p) => Math.max(0, p - 1));
          break;
        case "ArrowRight":
          e.preventDefault();
          setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + 1));
          break;
        case "ArrowUp":
          e.preventDefault();
          setSelectedIndex((p) => Math.max(0, p - cols));
          break;
        case "ArrowDown":
          e.preventDefault();
          setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + cols));
          break;
        case "Enter":
        case " ":
          e.preventDefault();
          const g = filteredGames[selectedIndex];
          if (g) onLaunchGame?.(g);
          break;
        case "y":
        case "Y":
          e.preventDefault();
          setShowSidebar(true);
          break;
        case "x":
        case "X":
          e.preventDefault();
          // Retourner la carte du jeu sélectionné
          const selectedGame = filteredGames[selectedIndex];
          if (selectedGame && (selectedGame.description || selectedGame.videoUrl)) {
            setFlippedCards(prev => {
              const newSet = new Set(prev);
              if (newSet.has(selectedGame.id)) {
                newSet.delete(selectedGame.id);
              } else {
                newSet.add(selectedGame.id);
              }
              return newSet;
            });
          }
          break;
        case "Escape":
          e.preventDefault();
          onClose?.();
          break;
        case "q":
        case "Q":
          e.preventDefault();
          setCategoryIndex((i) => {
            const n = (i - 1 + categories.length) % categories.length;
            setSelectedIndex(0);
            return n;
          });
          break;
        case "e":
        case "E":
          e.preventDefault();
          setCategoryIndex((i) => {
            const n = (i + 1) % categories.length;
            setSelectedIndex(0);
            return n;
          });
          break;
      }
    };

    window.addEventListener("keydown", handleKeyboard);
    return () => window.removeEventListener("keydown", handleKeyboard);
  }, [filteredGames, selectedIndex, cols, showSidebar, onLaunchGame, onClose]);

  // Plein écran DOM (fallback si Electron ne gère pas)
  useEffect(() => {
    const tryRequest = async () => {
      try {
        if (document.fullscreenElement) return;
        await document.documentElement.requestFullscreen?.();
      } catch (_) {}
    };
    tryRequest();
    return () => {
      try {
        if (document.fullscreenElement) document.exitFullscreen?.();
      } catch (_) {}
    };
  }, []);

  // Navigation gamepad à priorité haute pendant le mode
  useEffect(() => {
    const unregister = registerListener(
      {
        onHorizontal: (dir) => {
          if (!showSidebar) {
            setSelectedIndex((prev) => {
              const next = prev + dir;
              const max = filteredGames.length - 1;
              return Math.max(0, Math.min(max, next));
            });
          }
        },
        onVertical: (dir) => {
          if (!showSidebar) {
            setSelectedIndex((prev) => {
              const next = prev + dir * cols;
              const max = filteredGames.length - 1;
              return Math.max(0, Math.min(max, next));
            });
          }
        },
        onDPAD_LEFT: () => !showSidebar && setSelectedIndex((p) => Math.max(0, p - 1)),
        onDPAD_RIGHT: () => !showSidebar && setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + 1)),
        onDPAD_UP: () => !showSidebar && setSelectedIndex((p) => Math.max(0, p - cols)),
        onDPAD_DOWN: () => !showSidebar && setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + cols)),
        onLB: () => {
          if (!showSidebar) {
            setCategoryIndex((i) => {
              const n = (i - 1 + categories.length) % categories.length;
              setSelectedIndex(0);
              return n;
            });
          }
        },
        onRB: () => {
          if (!showSidebar) {
            setCategoryIndex((i) => {
              const n = (i + 1) % categories.length;
              setSelectedIndex(0);
              return n;
            });
          }
        },
        onA: () => {
          if (!showSidebar) {
            const g = filteredGames[selectedIndex];
            if (g) onLaunchGame?.(g);
          }
        },
        onY: () => setShowSidebar((prev) => !prev), // Toggle panneau latéral
        onX: () => {
          // Retourner la carte du jeu sélectionné
          if (!showSidebar) {
            const selectedGame = filteredGames[selectedIndex];
            if (selectedGame && (selectedGame.description || selectedGame.videoUrl)) {
              setFlippedCards(prev => {
                const newSet = new Set(prev);
                if (newSet.has(selectedGame.id)) {
                  newSet.delete(selectedGame.id);
                } else {
                  newSet.add(selectedGame.id);
                }
                return newSet;
              });
            }
          }
        },
        onB: () => {
          if (showSidebar) {
            setShowSidebar(false); // Fermer le sidebar d'abord
          } else {
            onClose?.(); // Sinon quitter
          }
        },
      },
      100
    );
    return unregister;
  }, [filteredGames, selectedIndex, cols, registerListener, onClose, onLaunchGame, showSidebar]);

  const selectedGame = filteredGames[selectedIndex];

  return (
    <div
      ref={rootRef}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: currentTheme.background,
        color: currentTheme.text,
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Fond parallaxe avec l'image du jeu sélectionné */}
      {selectedGame && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage: selectedGame.icon 
              ? `url(${window.electronAPI.getCoverUrl(selectedGame.icon) || window.electronAPI.getIconPath(selectedGame.icon)})`
              : "none",
            backgroundSize: "cover",
            backgroundPosition: "center",
            filter: "blur(40px) brightness(0.3)",
            opacity: 0.4,
            transition: "background-image 0.6s ease, opacity 0.6s ease",
            transform: showSidebar ? "scale(1.1)" : "scale(1.05)",
            zIndex: 0,
          }}
        />
      )}

      {/* Contenu principal */}
      <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", height: "100%" }}>
        {/* Header catégories */}
      <div
        style={{
          padding: "24px 40px",
          display: "flex",
          gap: 16,
          alignItems: "center",
          overflowX: "auto",
          borderBottom: `2px solid ${currentTheme.border}`,
          background: "rgba(0,0,0,0.25)",
        }}
      >
        {categories.map((cat, i) => {
          const active = i === categoryIndex;
          return (
            <button
              key={cat}
              onClick={() => {
                setCategoryIndex(i);
                setSelectedIndex(0);
              }}
              style={{
                fontSize: 28,
                padding: "14px 22px",
                borderRadius: 16,
                fontWeight: 700,
                color: active ? currentTheme.text : currentTheme.textSecondary,
                background: active ? currentTheme.primary : "transparent",
                border: `2px solid ${active ? currentTheme.accent : currentTheme.border}`,
                boxShadow: active ? `0 0 24px ${currentTheme.shadow}` : "none",
                whiteSpace: "nowrap",
              }}
            >
              {cat}
            </button>
          );
        })}
        <div style={{ marginLeft: "auto", display: "flex", gap: 12, alignItems: "center" }}>
          {/* Aide contrôles */}
          <div style={{ 
            fontSize: 14, 
            opacity: 0.7, 
            display: "flex", 
            gap: 16, 
            padding: "8px 16px",
            background: "rgba(0,0,0,0.3)",
            borderRadius: 8,
          }}>
            <span>🎮 A: Lancer</span>
            <span>Y: Détails</span>
            <span>X: Retourner</span>
            <span>LB/RB: Catégories</span>
            <span>B: Quitter</span>
          </div>
          <button
            onClick={onClose}
            style={{
              fontSize: 22,
              padding: "12px 18px",
              borderRadius: 14,
              fontWeight: 700,
              background: currentTheme.accent,
              color: currentTheme.text,
              transition: "transform 0.2s ease",
            }}
            title="Quitter le mode Big Picture (B)"
            onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
            onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
          >
            ✖ Quitter
          </button>
        </div>
      </div>

      {/* Grille */}
      <div
        style={{
          flex: 1,
          padding: "32px 40px 40px 40px",
          overflow: "auto",
          transition: "margin-right 0.3s ease",
          marginRight: showSidebar ? "500px" : "0",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: `repeat(${cols}, minmax(${cardW}px, 1fr))`,
            gap: 24,
            justifyItems: "center",
          }}
        >
          {filteredGames.map((g, idx) => {
            const coverUrl = g.icon ? window.electronAPI.getCoverUrl(g.icon) : null;
            const iconSrc = coverUrl || window.electronAPI.getIconPath(g.icon || "default.png");
            const selected = idx === selectedIndex;
            const isFlipped = flippedCards.has(g.id);
            
            const toggleFlip = (e) => {
              e.stopPropagation();
              setFlippedCards(prev => {
                const newSet = new Set(prev);
                if (newSet.has(g.id)) {
                  newSet.delete(g.id);
                } else {
                  newSet.add(g.id);
                }
                return newSet;
              });
            };

            return (
              <div
                key={g.id}
                ref={selected ? selectedRef : null}
                onClick={() => setSelectedIndex(idx)}
                onMouseEnter={() => setSelectedIndex(idx)}
                style={{
                  width: cardW,
                  height: cardH,
                  perspective: "1000px",
                  position: "relative",
                }}
              >
                {/* Container 3D pour l'effet flip */}
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    position: "relative",
                    transformStyle: "preserve-3d",
                    transform: isFlipped ? "rotateY(180deg)" : "rotateY(0deg)",
                    transition: "transform 0.6s ease",
                  }}
                >
                  {/* RECTO - Jaquette normale */}
                  <div
                    style={{
                      position: "absolute",
                      width: "100%",
                      height: "100%",
                      backfaceVisibility: "hidden",
                      borderRadius: 24,
                      overflow: "hidden",
                      border: `4px solid ${selected ? currentTheme.accent : currentTheme.border}`,
                      boxShadow: selected
                        ? `0 0 36px ${currentTheme.accent}, 0 12px 48px ${currentTheme.shadow}`
                        : `0 10px 28px ${currentTheme.shadow}`,
                      transform: selected ? "scale(1.06)" : "scale(1)",
                      transition: "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
                      background: currentTheme.cardBg,
                      cursor: "pointer",
                    }}
                  >
                <img
                  src={iconSrc}
                  alt={g.name}
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    objectFit: "cover",
                    transition: "transform 0.3s ease",
                    transform: selected ? "scale(1.05)" : "scale(1)"
                  }}
                  onError={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = "true";
                      e.target.src = window.electronAPI.getIconPath("default.png");
                    }
                  }}
                />

                {/* Badges en haut */}
                <div style={{ position: "absolute", top: 12, left: 12, right: 12, display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  {/* Badge statut */}
                  {g.status && g.status !== "not-started" && (
                    <div
                      style={{
                        fontSize: Math.round(cardW * 0.04),
                        padding: `${Math.round(cardW * 0.015)}px ${Math.round(cardW * 0.025)}px`,
                        borderRadius: 8,
                        fontWeight: 700,
                        background: g.status === "in-progress" 
                          ? "rgba(59, 130, 246, 0.9)"
                          : g.status === "completed"
                          ? "rgba(34, 197, 94, 0.9)"
                          : g.status === "100-percent"
                          ? "rgba(234, 179, 8, 0.9)"
                          : "rgba(107, 114, 128, 0.9)",
                        color: "#fff",
                        backdropFilter: "blur(8px)",
                        boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                      }}
                    >
                      {g.status === "in-progress"
                        ? "🎮 En cours"
                        : g.status === "completed"
                        ? "✅ Terminé"
                        : g.status === "100-percent"
                        ? "🏆 100%"
                        : ""}
                    </div>
                  )}

                  {/* Badges droite : PIN + Favori (avec espacement garanti) */}
                  <div style={{ 
                    display: "flex", 
                    gap: 10, 
                    alignItems: "center",
                    flexWrap: "nowrap",
                    minWidth: (g.pinProtected && g.pin ? Math.round(cardW * 0.08) : 0) + (g.favorite ? Math.round(cardW * 0.08) : 0),
                  }}>
                    {/* Badge Favori (à gauche du cadenas) */}
                    {g.favorite && (
                      <div
                        style={{
                          fontSize: Math.round(cardW * 0.055),
                          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.5))",
                          flexShrink: 0,
                        }}
                        title="Favori"
                      >
                        ⭐
                      </div>
                    )}
                    {/* Badge PIN (à droite, toujours visible) */}
                    {g.pinProtected && g.pin && (
                      <div
                        style={{
                          fontSize: Math.round(cardW * 0.05),
                          padding: Math.round(cardW * 0.015),
                          borderRadius: "50%",
                          background: "rgba(220, 38, 38, 0.9)",
                          backdropFilter: "blur(8px)",
                          boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
                          flexShrink: 0,
                        }}
                        title="Protégé par PIN"
                      >
                        🔒
                      </div>
                    )}
                  </div>
                </div>

                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.85), transparent 50%)",
                  }}
                />
                <div style={{ position: "absolute", left: 18, bottom: 16, right: 18, textAlign: "center" }}>
                  <div style={{ fontSize: Math.round(cardW * 0.07), fontWeight: 800, marginBottom: 8 }}>{g.name}</div>
                  
                  {/* Infos supplémentaires */}
                  <div style={{ display: "flex", gap: 12, justifyContent: "center", marginBottom: 10, flexWrap: "wrap" }}>
                    {/* Temps de jeu */}
                    {g.playTime > 0 && (
                      <div style={{ fontSize: Math.round(cardW * 0.04), opacity: 0.9 }}>
                        ⏱️ {Math.floor(g.playTime / 60)}h {g.playTime % 60}min
                      </div>
                    )}
                    {/* Note */}
                    {g.rating > 0 && (
                      <div style={{ fontSize: Math.round(cardW * 0.04), opacity: 0.9 }}>
                        {"⭐".repeat(g.rating)}
                      </div>
                    )}
                  </div>

                  <div style={{ display: "flex", gap: 8, justifyContent: "center" }}>
                    <button
                      onClick={() => onLaunchGame?.(g)}
                      style={{
                        padding: `${Math.round(cardW * 0.025)}px ${Math.round(cardW * 0.045)}px`,
                        borderRadius: 8,
                        fontSize: Math.round(cardW * 0.048),
                        fontWeight: 700,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        color: currentTheme.text,
                        whiteSpace: "nowrap",
                        transition: "transform 0.2s ease",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.05)"}
                      onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                    >
                      🚀 Lancer
                    </button>
                  </div>
                </div>

                {/* Icône flèche pour retourner la carte (en bas à droite) */}
                {g.description && (
                  <button
                    onClick={toggleFlip}
                    style={{
                      position: "absolute",
                      bottom: 16,
                      right: 16,
                      fontSize: Math.round(cardW * 0.06),
                      background: "rgba(0, 0, 0, 0.7)",
                      backdropFilter: "blur(10px)",
                      border: `2px solid ${currentTheme.accent}`,
                      borderRadius: "50%",
                      width: Math.round(cardW * 0.12),
                      height: Math.round(cardW * 0.12),
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      cursor: "pointer",
                      transition: "all 0.3s ease",
                      zIndex: 10,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.2) rotate(180deg)";
                      e.currentTarget.style.background = currentTheme.accent;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                      e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                    }}
                    title="Voir les détails (retourner la carte)"
                  >
                    ↪️
                  </button>
                )}
              </div>

              {/* VERSO - Description */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "100%",
                  backfaceVisibility: "hidden",
                  transform: "rotateY(180deg)",
                  borderRadius: 24,
                  overflow: "hidden",
                  border: `4px solid ${selected ? currentTheme.accent : currentTheme.border}`,
                  boxShadow: selected
                    ? `0 0 36px ${currentTheme.accent}, 0 12px 48px ${currentTheme.shadow}`
                    : `0 10px 28px ${currentTheme.shadow}`,
                  background: `linear-gradient(135deg, ${currentTheme.cardBg}, ${currentTheme.background})`,
                  padding: 20,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                {/* Header verso avec titre */}
                <div style={{ 
                  display: "flex", 
                  justifyContent: "space-between", 
                  alignItems: "center",
                  marginBottom: 8,
                }}>
                  <h3 style={{ 
                    fontSize: Math.round(cardW * 0.055), 
                    fontWeight: 800, 
                    margin: 0,
                    flex: 1,
                  }}>
                    {g.name}
                  </h3>
                </div>

                {/* Description scrollable */}
                {g.description && (
                  <div
                    style={{
                      flex: 1,
                      overflowY: "auto",
                      padding: 16,
                      background: "rgba(255,255,255,0.05)",
                      borderRadius: 8,
                      fontSize: Math.round(cardW * 0.042),
                      lineHeight: 1.6,
                      opacity: 0.9,
                      marginBottom: 8,
                    }}
                  >
                    {g.description}
                  </div>
                )}

                {/* Bouton Lancer (réduit, centré en bas) */}
                <div style={{
                  display: "flex",
                  justifyContent: "center",
                  marginTop: "auto",
                }}>
                  <button
                    onClick={() => onLaunchGame?.(g)}
                    style={{
                      padding: `${Math.round(cardW * 0.025)}px ${Math.round(cardW * 0.08)}px`,
                      borderRadius: 12,
                      fontSize: Math.round(cardW * 0.045),
                      fontWeight: 700,
                      background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                      color: currentTheme.text,
                      border: "none",
                      cursor: "pointer",
                      transition: "transform 0.2s ease",
                      boxShadow: `0 4px 12px ${currentTheme.shadow}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "scale(1.05)";
                      e.currentTarget.style.boxShadow = `0 6px 16px ${currentTheme.shadow}`;
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "scale(1)";
                      e.currentTarget.style.boxShadow = `0 4px 12px ${currentTheme.shadow}`;
                    }}
                  >
                    🚀 Lancer le jeu
                  </button>
                </div>

                {/* Flèche retour en bas à droite */}
                <button
                  onClick={toggleFlip}
                  style={{
                    position: "absolute",
                    bottom: 16,
                    right: 16,
                    fontSize: Math.round(cardW * 0.06),
                    background: "rgba(0, 0, 0, 0.7)",
                    backdropFilter: "blur(10px)",
                    border: `2px solid ${currentTheme.accent}`,
                    borderRadius: "50%",
                    width: Math.round(cardW * 0.12),
                    height: Math.round(cardW * 0.12),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    cursor: "pointer",
                    transition: "all 0.3s ease",
                    zIndex: 10,
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.2) rotate(-180deg)";
                    e.currentTarget.style.background = currentTheme.accent;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "scale(1) rotate(0deg)";
                    e.currentTarget.style.background = "rgba(0, 0, 0, 0.7)";
                  }}
                  title="Retour au recto (X)"
                >
                  ↩️
                </button>
              </div>
            </div>
          </div>
            );
          })}
        </div>
      </div>

      {/* Panneau latéral détaillé */}
      {showSidebar && selectedGame && (
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            bottom: 0,
            width: "500px",
            background: "rgba(0, 0, 0, 0.95)",
            backdropFilter: "blur(20px)",
            borderLeft: `2px solid ${currentTheme.accent}`,
            padding: "32px",
            overflowY: "auto",
            zIndex: 10,
            animation: "slideIn 0.3s ease",
          }}
        >
          <style>
            {`
              @keyframes slideIn {
                from { transform: translateX(100%); }
                to { transform: translateX(0); }
              }
            `}
          </style>

          {/* Header */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 28, fontWeight: 800, margin: 0 }}>Détails</h2>
              <button
                onClick={() => setShowSidebar(false)}
                style={{
                  fontSize: 24,
                  background: "transparent",
                  color: currentTheme.text,
                  border: "none",
                  cursor: "pointer",
                  opacity: 0.7,
                }}
              >
                ✖
              </button>
            </div>
            <div style={{ fontSize: 14, opacity: 0.6 }}>Appuyez sur Y ou B pour fermer</div>
          </div>

          {/* Jaquette */}
          <div style={{ marginBottom: 24 }}>
            <img
              src={selectedGame.icon 
                ? (window.electronAPI.getCoverUrl(selectedGame.icon) || window.electronAPI.getIconPath(selectedGame.icon))
                : window.electronAPI.getIconPath("default.png")}
              alt={selectedGame.name}
              style={{
                width: "100%",
                borderRadius: 16,
                boxShadow: `0 8px 32px ${currentTheme.shadow}`,
              }}
              onError={(e) => {
                if (!e.target.dataset.fallback) {
                  e.target.dataset.fallback = "true";
                  e.target.src = window.electronAPI.getIconPath("default.png");
                }
              }}
            />
          </div>

          {/* Nom du jeu */}
          <h3 style={{ fontSize: 24, fontWeight: 700, marginBottom: 20 }}>{selectedGame.name}</h3>

          {/* Statistiques */}
          <div style={{ marginBottom: 24 }}>
            <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, opacity: 0.9 }}>📊 Statistiques</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {/* Temps de jeu */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                <span style={{ opacity: 0.8 }}>⏱️ Temps de jeu</span>
                <span style={{ fontWeight: 700 }}>
                  {selectedGame.playTime > 0 
                    ? `${Math.floor(selectedGame.playTime / 60)}h ${selectedGame.playTime % 60}min`
                    : "Aucun"}
                </span>
              </div>
              
              {/* Statut */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                <span style={{ opacity: 0.8 }}>🎮 Statut</span>
                <span style={{ fontWeight: 700 }}>
                  {selectedGame.status === "in-progress"
                    ? "En cours"
                    : selectedGame.status === "completed"
                    ? "Terminé"
                    : selectedGame.status === "100-percent"
                    ? "100%"
                    : "Non commencé"}
                </span>
              </div>

              {/* Note */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                <span style={{ opacity: 0.8 }}>⭐ Note</span>
                <span style={{ fontWeight: 700 }}>
                  {selectedGame.rating > 0 ? "⭐".repeat(selectedGame.rating) : "Non noté"}
                </span>
              </div>

              {/* Catégorie */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                <span style={{ opacity: 0.8 }}>📁 Catégorie</span>
                <span style={{ fontWeight: 700 }}>{selectedGame.category || "Aucune"}</span>
              </div>

              {/* Favori */}
              <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(255,255,255,0.05)", borderRadius: 8 }}>
                <span style={{ opacity: 0.8 }}>⭐ Favori</span>
                <span style={{ fontWeight: 700 }}>{selectedGame.favorite ? "Oui" : "Non"}</span>
              </div>

              {/* Protection PIN */}
              {selectedGame.pinProtected && selectedGame.pin && (
                <div style={{ display: "flex", justifyContent: "space-between", padding: "12px 16px", background: "rgba(220, 38, 38, 0.2)", borderRadius: 8, border: "1px solid rgba(220, 38, 38, 0.5)" }}>
                  <span style={{ opacity: 0.8 }}>🔒 Protection</span>
                  <span style={{ fontWeight: 700 }}>Code PIN activé</span>
                </div>
              )}
            </div>
          </div>

          {/* Description */}
          {selectedGame.description && selectedGame.description.trim() && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, opacity: 0.9 }}>📄 Description</h4>
              <div
                style={{
                  padding: 16,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.9,
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {selectedGame.description}
              </div>
            </div>
          )}

          {/* Commentaires */}
          {selectedGame.notes && selectedGame.notes.trim() && (
            <div style={{ marginBottom: 24 }}>
              <h4 style={{ fontSize: 18, fontWeight: 700, marginBottom: 12, opacity: 0.9 }}>📝 Commentaires</h4>
              <div
                style={{
                  padding: 16,
                  background: "rgba(255,255,255,0.05)",
                  borderRadius: 8,
                  fontSize: 14,
                  lineHeight: 1.6,
                  opacity: 0.9,
                  maxHeight: 150,
                  overflowY: "auto",
                }}
              >
                {selectedGame.notes}
              </div>
            </div>
          )}

          {/* Bouton de lancement */}
          <button
            onClick={() => onLaunchGame?.(selectedGame)}
            style={{
              width: "100%",
              padding: "16px 24px",
              fontSize: 20,
              fontWeight: 700,
              borderRadius: 12,
              background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
              color: currentTheme.text,
              border: "none",
              cursor: "pointer",
              transition: "transform 0.2s ease, box-shadow 0.2s ease",
              boxShadow: `0 4px 16px ${currentTheme.shadow}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = "scale(1.02)";
              e.currentTarget.style.boxShadow = `0 6px 24px ${currentTheme.shadow}`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = "scale(1)";
              e.currentTarget.style.boxShadow = `0 4px 16px ${currentTheme.shadow}`;
            }}
          >
            🚀 Lancer le jeu
          </button>
        </div>
      )}
      </div>
    </div>
  );
}
