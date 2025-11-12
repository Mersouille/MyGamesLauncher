import React, { useState, useEffect, useRef } from "react";
import SettingsMenu from "../components/Settings/SettingsMenu";
import { useTheme } from "../context/ThemeContext";
import { getTheme } from "../data/themes";
import { useGamepad } from "../hooks/useGamepad";

export default function SettingsPanel({ settings, setSettings, onClose, onOpenJournal }) {
  const { setTheme } = useTheme();
  const { gamepadConnected, registerListener } = useGamepad();

  const [currentSettings, setCurrentSettings] = useState(settings || { theme: "dark", lang: "fr" });
  const currentTheme = getTheme(currentSettings.theme);

  // Ref pour éviter de réenregistrer le listener
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // Mise à jour directe pendant le render

  useEffect(() => {
    if (window?.electronAPI?.setTheme) {
      window.electronAPI.setTheme(currentSettings.theme);
    }
    setTheme(currentSettings.theme);
  }, [currentSettings.theme, setTheme]);

  const handleChange = (newSettings) => {
    console.log("🎨 handleChange appelé avec :", newSettings);
    setCurrentSettings(newSettings);
    setSettings(newSettings);
    setTheme(newSettings.theme);

    if (window?.electronAPI?.setTheme) {
      window.electronAPI.setTheme(newSettings.theme);
    }
  };

  useEffect(() => {
    if (window?.electronAPI?.saveSettings) {
      window.electronAPI.saveSettings(currentSettings);
    }
  }, [currentSettings]);

  // 🎮 Écoute du bouton B pour fermer
  useEffect(() => {
    if (!gamepadConnected) return;

    console.log("🎮 [SettingsPanel] Enregistrement du listener pour bouton B (priorité: 100)");

    const unregister = registerListener(
      {
        onB: () => {
          console.log("🎮 [SettingsPanel] Bouton B pressé - fermeture");
          onCloseRef.current();
        },
      },
      100
    ); // Priorité 100 (haute) pour fermer le modal

    return unregister;
  }, [gamepadConnected, registerListener]);

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
      onClick={onClose}
    >
      <div
        style={{
          background: currentTheme.cardBg,
          borderRadius: "24px",
          border: `2px solid ${currentTheme.border}`,
          boxShadow: `0 0 60px ${currentTheme.shadow}`,
          maxWidth: "800px",
          width: "100%",
          padding: "32px",
          maxHeight: "90vh",
          overflowY: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <SettingsMenu
          settings={currentSettings}
          onChange={handleChange}
          onClose={onClose}
          onOpenJournal={onOpenJournal}
        />
      </div>
    </div>
  );
}
