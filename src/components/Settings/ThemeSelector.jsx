import React, { useState } from "react";
import { themes, getTheme } from "../../data/themes";

export default function ThemeSelector({ settings, onChange }) {
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
            borderRadius: "12px",
            padding: "12px",
            boxShadow: `0 8px 32px ${currentTheme.shadow}`,
            minWidth: "220px",
            maxWidth: "240px",
            maxHeight: "calc(100vh - 120px)",
            overflowY: "auto",
            animation: "slideIn 0.3s ease",
            backdropFilter: "none",
          }}
        >
          <h3
            style={{
              margin: "0 0 12px 0",
              fontSize: "1rem",
              fontWeight: "700",
              color: currentTheme.text,
              textAlign: "center",
            }}
          >
            🎨 Affichage
          </h3>

          {/* 📱 Info : Affichage Responsive Automatique */}
          <div
            style={{
              marginBottom: "12px",
              padding: "8px",
              background: "rgba(139, 92, 246, 0.2)",
              borderRadius: "6px",
              border: "1px solid rgba(139, 92, 246, 0.4)",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                marginBottom: "3px",
              }}
            >
              <span style={{ fontSize: "1rem" }}>📱</span>
              <span style={{ fontSize: "0.8rem", fontWeight: 600, color: currentTheme.text }}>
                Auto-adaptatif
              </span>
            </div>
            <p
              style={{
                fontSize: "0.7rem",
                color: "#9ca3af",
                lineHeight: "1.3",
                margin: 0,
              }}
            >
              La grille s'adapte à votre écran automatiquement.
            </p>
          </div>

          <h4
            style={{
              margin: "0 0 8px 0",
              fontSize: "0.85rem",
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
              gap: "8px",
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
                      ? `2px solid ${theme.accent}`
                      : "1px solid rgba(128, 128, 128, 0.3)",
                  borderRadius: "8px",
                  padding: "8px 6px",
                  cursor: "pointer",
                  transition: "all 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
                  fontSize: "0.75rem",
                  fontWeight: currentThemeKey === key ? "700" : "500",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "4px",
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
                      top: "3px",
                      right: "3px",
                      background: theme.accent,
                      color: theme.background,
                      fontSize: "0.6rem",
                      fontWeight: "700",
                      padding: "2px 5px",
                      borderRadius: "4px",
                      boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                    }}
                  >
                    ✓
                  </div>
                )}
                <span style={{ fontSize: "1.3rem" }}>{theme.icon}</span>
                <span style={{ textAlign: "center", lineHeight: "1.1", fontSize: "0.75rem" }}>
                  {theme.name}
                </span>
              </button>
            ))}
          </div>

          <p
            style={{
              fontSize: "0.7rem",
              color: "#888",
              marginTop: "8px",
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
