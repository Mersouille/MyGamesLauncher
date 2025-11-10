// src/hooks/useSettings.js
import { useState, useEffect } from "react";

const defaultSettings = { theme: "light", lang: "fr" };

export default function useSettings() {
  const [settings, setSettings] = useState(defaultSettings);

  useEffect(() => {
    const saved = localStorage.getItem("mygames-settings");
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  useEffect(() => {
    localStorage.setItem("mygames-settings", JSON.stringify(settings));
  }, [settings]);

  return [settings, setSettings];
}
