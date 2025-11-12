import React, { useState } from "react";
import { themes, getTheme } from "../../data/themes";

export default function ThemeSelector({ settings, onChange, onOpenJournal }) {
  const [isOpen, setIsOpen] = useState(false);
  const currentThemeKey = settings.theme || "dark";
  const currentTheme = getTheme(currentThemeKey);

  const handleThemeChange = (newTheme) => {
    const newSettings = { ...settings, theme: newTheme };
    onChange(newSettings);
    if (window?.electronAPI?.setTheme) {
      window.electronAPI.setTheme(newTheme);
    }
    setIsOpen(false); // Fermer après sélection
  };

  const handleReload = () => {
    window.location.reload();
  };

  const handleFullscreen = () => {
    if (window?.electronAPI?.toggleFullscreen) {
      window.electronAPI.toggleFullscreen();
    }
  };

  const handleDevTools = () => {
    if (window?.electronAPI?.toggleDevTools) {
      window.electronAPI.toggleDevTools();
    }
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Bouton principal */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        title="Changer le thème"
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 9999,
          cursor: "pointer",
          background: currentTheme.cardBg,
          border: `2px solid ${currentTheme.border}`,
          borderRadius: "50%",
          width: "48px",
          height: "48px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.5rem",
          color: currentTheme.text,
          boxShadow: isOpen ? `0 0 20px ${currentTheme.accent}` : `0 0 12px ${currentTheme.shadow}`,
          transition: "all 0.25s ease",
          transform: isOpen ? "scale(1.1) rotate(90deg)" : "scale(1.0)",
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = "scale(1.1)";
            e.currentTarget.style.boxShadow = `0 0 20px ${currentTheme.accent}`;
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.transform = "scale(1.0)";
            e.currentTarget.style.boxShadow = `0 0 12px ${currentTheme.shadow}`;
          }
        }}
      >
        {currentTheme.icon}
      </button>

      {/* Menu déroulant */}
      {isOpen && (
        <div
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 9998,
            background: currentTheme.cardBg,
            border: `2px solid ${currentTheme.border}`,
            borderRadius: "16px",
            padding: "16px",
            boxShadow: `0 8px 32px ${currentTheme.shadow}`,
            minWidth: "280px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            animation: "slideIn 0.3s ease",
          }}
        >
          <h3
            style={{
              margin: "0 0 16px 0",
              fontSize: "1.2rem",
              fontWeight: "700",
              color: currentTheme.text,
              textAlign: "center",
            }}
          >
            🎨 Affichage
          </h3>

          {/* 📝 Bouton Journal */}
          <button
            onClick={() => {
              onOpenJournal && onOpenJournal();
              setIsOpen(false);
            }}
            style={{
              width: "100%",
              padding: "10px",
              marginBottom: "12px",
              borderRadius: "8px",
              cursor: "pointer",
              background: currentTheme.primary,
              color: currentTheme.text,
              fontSize: "0.9rem",
              fontWeight: "600",
              border: `2px solid ${currentTheme.border}`,
              transition: "all 0.2s ease",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: "6px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = currentTheme.primaryHover;
              e.currentTarget.style.transform = "scale(1.02)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = currentTheme.primary;
              e.currentTarget.style.transform = "scale(1)";
            }}
          >
            📝 Journal
          </button>

          {/* 🔎 Curseur Taille de la grille */}
          <div
            style={{
              marginBottom: "16px",
              padding: "8px",
              background: "rgba(0,0,0,0.2)",
              borderRadius: "8px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <span style={{ fontSize: "0.85rem", fontWeight: 500, color: currentTheme.text }}>
                Taille grille
              </span>
              <span style={{ fontSize: "0.75rem", color: "#9ca3af" }}>
                {Math.round((settings.uiScale ?? 1) * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0.6}
              max={1.2}
              step={0.05}
              value={typeof settings.uiScale === "number" ? settings.uiScale : 1}
              onChange={(e) => onChange({ ...settings, uiScale: parseFloat(e.target.value) })}
              style={{ width: "100%", cursor: "pointer" }}
            />
          </div>

          {/* Options du menu */}
          <div
            style={{ display: "flex", flexDirection: "column", gap: "6px", marginBottom: "16px" }}
          >
            <button
              onClick={handleReload}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                cursor: "pointer",
                background: "rgba(128, 128, 128, 0.2)",
                color: currentTheme.text,
                fontSize: "0.85rem",
                fontWeight: "600",
                border: `1px solid ${currentTheme.border}`,
                transition: "all 0.2s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(128, 128, 128, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(128, 128, 128, 0.2)";
              }}
            >
              🔄 Recharger
            </button>
            <button
              onClick={handleFullscreen}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                cursor: "pointer",
                background: "rgba(128, 128, 128, 0.2)",
                color: currentTheme.text,
                fontSize: "0.85rem",
                fontWeight: "600",
                border: `1px solid ${currentTheme.border}`,
                transition: "all 0.2s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(128, 128, 128, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(128, 128, 128, 0.2)";
              }}
            >
              ⛶ Plein écran
            </button>
            <button
              onClick={handleDevTools}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                cursor: "pointer",
                background: "rgba(128, 128, 128, 0.2)",
                color: currentTheme.text,
                fontSize: "0.85rem",
                fontWeight: "600",
                border: `1px solid ${currentTheme.border}`,
                transition: "all 0.2s ease",
                textAlign: "left",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(128, 128, 128, 0.3)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(128, 128, 128, 0.2)";
              }}
            >
              🔧 Outils de développement
            </button>
          </div>

          <h4
            style={{
              margin: "0 0 10px 0",
              fontSize: "0.95rem",
              fontWeight: "600",
              color: currentTheme.text,
              textAlign: "center",
            }}
          >
            Thèmes
          </h4>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(2, 1fr)",
              gap: "10px",
            }}
          >
            {Object.entries(themes).map(([key, theme]) => (
              <button
                key={key}
                onClick={() => handleThemeChange(key)}
                style={{
                  background:
                    currentThemeKey === key ? theme.background : "rgba(128, 128, 128, 0.2)",
                  color: currentThemeKey === key ? theme.text : "#999",
                  border:
                    currentThemeKey === key
                      ? `3px solid ${theme.accent}`
                      : "2px solid rgba(128, 128, 128, 0.3)",
                  borderRadius: "12px",
                  padding: "12px 8px",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  fontSize: "0.85rem",
                  fontWeight: currentThemeKey === key ? "700" : "500",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px",
                  boxShadow:
                    currentThemeKey === key
                      ? `0 0 16px ${theme.shadow}, 0 4px 8px rgba(0, 0, 0, 0.2)`
                      : "0 2px 4px rgba(0, 0, 0, 0.1)",
                  transform: currentThemeKey === key ? "scale(1.05)" : "scale(1)",
                  position: "relative",
                }}
                onMouseEnter={(e) => {
                  if (currentThemeKey !== key) {
                    e.currentTarget.style.transform = "scale(1.05)";
                    e.currentTarget.style.borderColor = theme.accent;
                    e.currentTarget.style.boxShadow = `0 0 12px ${theme.shadow}`;
                  }
                }}
                onMouseLeave={(e) => {
                  if (currentThemeKey !== key) {
                    e.currentTarget.style.transform = "scale(1)";
                    e.currentTarget.style.borderColor = "rgba(128, 128, 128, 0.3)";
                    e.currentTarget.style.boxShadow = "0 2px 4px rgba(0, 0, 0, 0.1)";
                  }
                }}
              >
                {currentThemeKey === key && (
                  <div
                    style={{
                      position: "absolute",
                      top: "4px",
                      right: "4px",
                      background: theme.accent,
                      color: theme.background,
                      fontSize: "0.65rem",
                      fontWeight: "700",
                      padding: "3px 7px",
                      borderRadius: "6px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    ✓
                  </div>
                )}
                <span style={{ fontSize: "1.5rem" }}>{theme.icon}</span>
                <span style={{ textAlign: "center", lineHeight: "1.2" }}>{theme.name}</span>
              </button>
            ))}
          </div>

          <p
            style={{
              fontSize: "0.75rem",
              color: "#888",
              marginTop: "12px",
              textAlign: "center",
              fontStyle: "italic",
            }}
          >
            💡 Changement instantané
          </p>
        </div>
      )}

      <style>
        {`
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
        `}
      </style>
    </div>
  );
}
