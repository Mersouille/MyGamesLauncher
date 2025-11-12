import React from "react";
import { themes, getTheme } from "../../data/themes";

export default function SettingsMenu({ settings, onChange, onClose }) {
  const currentThemeKey = settings.theme || "dark";
  const currentTheme = getTheme(currentThemeKey);

  // 🎨 Change de thème + synchronise avec Electron
  const handleThemeChange = (newTheme) => {
    const newSettings = { ...settings, theme: newTheme };
    onChange(newSettings);
    if (window?.electronAPI?.setTheme) {
      window.electronAPI.setTheme(newTheme);
    }
  };

  return (
    <div
      style={{
        width: "100%",
      }}
    >
      <h3
        style={{
          textAlign: "center",
          fontWeight: 600,
          fontSize: "1.4rem",
          marginBottom: "16px",
          color: currentTheme.text,
          textShadow: `0 0 8px ${currentTheme.shadow}`,
        }}
      >
        �️ Affichage
      </h3>

      {/* 🔎 Taille de la grille (uiScale) */}
      <div style={{ marginBottom: 20 }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 8,
          }}
        >
          <p style={{ fontWeight: 500, margin: 0, color: currentTheme.text }}>
            Taille de la grille
          </p>
          <span style={{ fontSize: 12, color: "#9ca3af" }}>
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
          style={{ width: "100%" }}
        />
        <div style={{ fontSize: 12, color: "#9ca3af", marginTop: 6 }}>
          Ajuste la taille des jaquettes dans la grille et en Big Picture (utile sur TV 4K).
        </div>
      </div>

      <h3
        style={{
          textAlign: "center",
          fontWeight: 600,
          fontSize: "1.4rem",
          marginBottom: "16px",
          color: currentTheme.text,
          textShadow: `0 0 8px ${currentTheme.shadow}`,
        }}
      >
        �🔑 Configuration API
      </h3>

      {/* Info : Thème déplacé dans l'icône */}
      <p
        style={{
          fontSize: "0.85rem",
          color: "#888",
          marginBottom: "16px",
          textAlign: "center",
          fontStyle: "italic",
        }}
      >
        💡 Pour changer le thème, cliquez sur l'icône en haut à droite
      </p>

      {/* 🎨 Sélecteur de thème - RETIRÉ, maintenant dans ThemeSelector */}
      <div style={{ marginBottom: "20px", display: "none" }}>
        <p style={{ fontWeight: 600, marginBottom: "12px", fontSize: "1.05rem" }}>🎨 Thème</p>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: "8px",
            maxHeight: "none",
            paddingRight: "4px",
          }}
        >
          {Object.entries(themes).map(([key, theme]) => (
            <button
              key={key}
              onClick={() => handleThemeChange(key)}
              title={`Changer vers le thème ${theme.name}`}
              style={{
                background: currentThemeKey === key ? theme.background : "rgba(128, 128, 128, 0.2)",
                color: currentThemeKey === key ? theme.text : "#999",
                border:
                  currentThemeKey === key
                    ? `3px solid ${theme.accent}`
                    : "2px solid rgba(128, 128, 128, 0.3)",
                borderRadius: "10px",
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
                overflow: "hidden",
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
              {/* Badge "Actif" pour le thème sélectionné */}
              {currentThemeKey === key && (
                <div
                  style={{
                    position: "absolute",
                    top: "4px",
                    right: "4px",
                    background: theme.accent,
                    color: theme.background,
                    fontSize: "0.6rem",
                    fontWeight: "700",
                    padding: "2px 6px",
                    borderRadius: "6px",
                    boxShadow: "0 2px 4px rgba(0, 0, 0, 0.3)",
                  }}
                >
                  ✓
                </div>
              )}
              <span
                style={{ fontSize: "1.2rem", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.2))" }}
              >
                {theme.icon}
              </span>
              <span
                style={{
                  textAlign: "center",
                  lineHeight: "1.2",
                  textShadow: currentThemeKey === key ? `0 0 8px ${theme.shadow}` : "none",
                }}
              >
                {theme.name}
              </span>
            </button>
          ))}
        </div>
        <p
          style={{
            fontSize: "0.75rem",
            color: "#888",
            marginTop: "8px",
            textAlign: "center",
            fontStyle: "italic",
          }}
        >
          💡 Les changements s'appliquent instantanément
        </p>
      </div>

      {/* 🌍 Langue - RETIRÉ (déjà dans le menu du haut) */}

      {/* 🔑 SteamGridDB API Key */}
      <div style={{ marginBottom: "16px" }}>
        <p style={{ fontWeight: 500, marginBottom: "8px", color: currentTheme.text }}>
          🔑 SteamGridDB API Key
        </p>
        <div style={{ display: "flex", gap: "8px" }}>
          <input
            type="text"
            value={settings.sgdbApiKey || ""}
            onChange={(e) => onChange({ ...settings, sgdbApiKey: e.target.value })}
            placeholder="Clef API SteamGridDB"
            style={{
              flex: 1,
              padding: "10px",
              borderRadius: "8px",
              border: `2px solid ${currentTheme.border}`,
              background: currentTheme.cardBg,
              color: currentTheme.text,
              outline: "none",
              fontSize: "0.9rem",
              transition: "all 0.3s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = currentTheme.accent;
              e.currentTarget.style.boxShadow = `0 0 8px ${currentTheme.shadow}`;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = currentTheme.border;
              e.currentTarget.style.boxShadow = "none";
            }}
          />
          <button
            onClick={async () => {
              const key = settings.sgdbApiKey;
              if (!key) return alert("Entrez une API Key d'abord");
              try {
                const res = await window.electronAPI.sgdbValidateKey({ apiKey: key });
                if (!res) return alert("Aucune réponse du process");
                if (!res.success) return alert("Test échoué: " + (res.error || "Erreur inconnue"));

                // construit un message lisible
                const lines = res.results.map((r) => {
                  return `${r.name}: ${r.status} ${r.statusText} — ${
                    r.contentType || "no-content-type"
                  }\n${r.snippet ? r.snippet.slice(0, 300) : "(no body)"}`;
                });
                alert("Résultats de validation:\n\n" + lines.join("\n\n"));
              } catch (err) {
                console.error(err);
                alert("Erreur lors du test : " + err.message);
              }
            }}
            style={{
              background: currentTheme.primary,
              color: currentTheme.text,
              border: "none",
              borderRadius: "8px",
              padding: "10px 14px",
              cursor: "pointer",
              fontWeight: "600",
              fontSize: "0.85rem",
              transition: "all 0.3s ease",
              boxShadow: `0 2px 8px ${currentTheme.shadow}`,
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
            Tester
          </button>
        </div>
      </div>

      {/* Bouton Fermer */}
      <div style={{ textAlign: "center", marginTop: "20px" }}>
        <button
          onClick={onClose}
          style={{
            background: currentTheme.cardHoverBg,
            color: currentTheme.text,
            border: `2px solid ${currentTheme.border}`,
            borderRadius: "10px",
            padding: "10px 24px",
            cursor: "pointer",
            fontWeight: "600",
            fontSize: "0.95rem",
            transition: "all 0.3s ease",
            boxShadow: `0 2px 8px ${currentTheme.shadow}`,
            width: "100%",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "scale(1.05)";
            e.currentTarget.style.borderColor = currentTheme.accent;
            e.currentTarget.style.boxShadow = `0 4px 12px ${currentTheme.accent}40`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "scale(1.0)";
            e.currentTarget.style.borderColor = currentTheme.border;
            e.currentTarget.style.boxShadow = `0 2px 8px ${currentTheme.shadow}`;
          }}
        >
          ✓ Fermer
        </button>
      </div>
    </div>
  );
}
