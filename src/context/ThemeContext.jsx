import React, { createContext, useContext, useState, useEffect } from "react";

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState("light");

  // 🧠 Charger le thème au démarrage (depuis settings.json ou localStorage)
  useEffect(() => {
    async function loadTheme() {
      try {
        if (window.electronAPI) {
          const settings = await window.electronAPI.getSettings();
          setTheme(settings.theme || "light");
        } else {
          const saved = localStorage.getItem("mygames-settings");
          if (saved) setTheme(JSON.parse(saved).theme || "light");
        }
      } catch (err) {
        console.error("Erreur chargement thème :", err);
      }
    }
    loadTheme();
  }, []);

  // 🎨 Appliquer la classe CSS du thème sur le body
  useEffect(() => {
    document.body.classList.remove("light", "dark");
    document.body.classList.add(theme);
  }, [theme]);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  return useContext(ThemeContext);
}
