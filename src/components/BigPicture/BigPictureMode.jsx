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
    // 🎮 TV 4K : 8 colonnes, Full HD : 5 colonnes, Réduit : 3 colonnes
    if (w >= 3840) return 8;
    if (w >= 2560) return 6;
    if (w >= 1920) return 5;
    if (w >= 1280) return 4;
    return 3;
  };
  const [cols, setCols] = useState(getCols());
  const getCardSize = () => {
    const w = window.innerWidth || 1920;
    // 🎮 Cartes plus grandes : 280-400px selon la largeur d'écran
    const base = w >= 3840 ? 380 : w >= 2560 ? 340 : w >= 1920 ? 300 : 250;
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
          setSelectedIndex((prev) => {
            const next = prev + dir;
            const max = filteredGames.length - 1;
            return Math.max(0, Math.min(max, next));
          });
        },
        onVertical: (dir) => {
          setSelectedIndex((prev) => {
            const next = prev + dir * cols;
            const max = filteredGames.length - 1;
            return Math.max(0, Math.min(max, next));
          });
        },
        onDPAD_LEFT: () => setSelectedIndex((p) => Math.max(0, p - 1)),
        onDPAD_RIGHT: () => setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + 1)),
        onDPAD_UP: () => setSelectedIndex((p) => Math.max(0, p - cols)),
        onDPAD_DOWN: () => setSelectedIndex((p) => Math.min(filteredGames.length - 1, p + cols)),
        onLB: () =>
          setCategoryIndex((i) => {
            const n = (i - 1 + categories.length) % categories.length;
            setSelectedIndex(0);
            return n;
          }),
        onRB: () =>
          setCategoryIndex((i) => {
            const n = (i + 1) % categories.length;
            setSelectedIndex(0);
            return n;
          }),
        onA: () => {
          const g = filteredGames[selectedIndex];
          if (g) onLaunchGame?.(g);
        },
        onB: () => onClose?.(),
      },
      100
    );
    return unregister;
  }, [filteredGames, selectedIndex, cols, registerListener, onClose, onLaunchGame]);

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
      }}
    >
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
        <div style={{ marginLeft: "auto", display: "flex", gap: 12 }}>
          <button
            onClick={onClose}
            style={{
              fontSize: 22,
              padding: "12px 18px",
              borderRadius: 14,
              fontWeight: 700,
              background: currentTheme.accent,
              color: currentTheme.text,
            }}
            title="Quitter le mode Big Picture (B)"
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
            return (
              <div
                key={g.id}
                ref={selected ? selectedRef : null}
                style={{
                  width: cardW,
                  height: cardH,
                  borderRadius: 24,
                  overflow: "hidden",
                  border: `4px solid ${selected ? currentTheme.accent : currentTheme.border}`,
                  boxShadow: selected
                    ? `0 0 36px ${currentTheme.accent}, 0 12px 48px ${currentTheme.shadow}`
                    : `0 10px 28px ${currentTheme.shadow}`,
                  transform: selected ? "scale(1.06)" : "scale(1)",
                  transition: "transform 0.15s ease, box-shadow 0.15s ease, border 0.15s ease",
                  position: "relative",
                  background: currentTheme.cardBg,
                }}
              >
                <img
                  src={iconSrc}
                  alt={g.name}
                  style={{ width: "100%", height: "100%", objectFit: "cover" }}
                  onError={(e) => {
                    if (!e.target.dataset.fallback) {
                      e.target.dataset.fallback = "true";
                      e.target.src = window.electronAPI.getIconPath("default.png");
                    }
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    inset: 0,
                    background: "linear-gradient(to top, rgba(0,0,0,0.7), transparent 40%)",
                  }}
                />
                <div style={{ position: "absolute", left: 18, bottom: 16, right: 18 }}>
                  <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 10 }}>{g.name}</div>
                  <div style={{ display: "flex", gap: 12 }}>
                    <button
                      onClick={() => onLaunchGame?.(g)}
                      style={{
                        padding: "10px 16px",
                        borderRadius: 12,
                        fontSize: 18,
                        fontWeight: 700,
                        background: `linear-gradient(90deg, ${currentTheme.primary}, ${currentTheme.accent})`,
                        color: currentTheme.text,
                      }}
                    >
                      🚀 Lancer
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
