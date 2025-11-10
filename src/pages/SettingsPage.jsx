import React, { useState, useEffect } from "react";
import SettingsMenu from "../components/Settings/SettingsMenu";
import { useTheme } from "../context/ThemeContext";

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const defaultSettings = { theme: theme || "light", lang: "fr" };
  const [settings, setSettings] = useState(defaultSettings);

  // 🧠 Charger les paramètres
  useEffect(() => {
    console.log("🔍 Chargement des paramètres...");
    if (window.electronAPI) {
      window.electronAPI
        .getSettings()
        .then((data) => {
          console.log("✅ Paramètres chargés :", data);
          setSettings(data);
          setTheme(data.theme || "light");
        })
        .catch((err) => console.error("❌ Erreur chargement settings :", err));
    } else {
      const saved = localStorage.getItem("mygames-settings");
      if (saved) {
        const data = JSON.parse(saved);
        setSettings(data);
        setTheme(data.theme || "light");
      } else {
        console.log("⚠️ Aucun paramètre trouvé, valeurs par défaut");
      }
    }
  }, []);

  // 💾 Sauvegarde automatique à chaque changement
  useEffect(() => {
    console.log("💾 Sauvegarde des paramètres :", settings);
    if (window.electronAPI) {
      window.electronAPI
        .saveSettings(settings)
        .then((res) => console.log(res ? "✅ Sauvegarde réussie" : "⚠️ Échec sauvegarde"))
        .catch((err) => console.error("❌ Erreur sauvegarde :", err));
    } else {
      localStorage.setItem("mygames-settings", JSON.stringify(settings));
      console.log("💾 Sauvegarde locale effectuée");
    }
  }, [settings]);

  const handleChange = (newSettings) => {
    setSettings(newSettings);
    setTheme(newSettings.theme); // 👈 met à jour l’apparence globale
  };

  return (
    <div className={`settings-page ${settings.theme}`}>
      <SettingsMenu settings={settings} onChange={handleChange} />
    </div>
  );
}
