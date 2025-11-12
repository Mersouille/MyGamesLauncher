import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { ThemeProvider } from "./context/ThemeContext";
import "./styles/index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <ThemeProvider>
    <App />
  </ThemeProvider>
);

// Une fois React initialisé, afficher la racine et masquer l'écran de splash
try {
  const rootEl = document.getElementById("root");
  if (rootEl) rootEl.classList.remove("hidden");

  const splash = document.getElementById("splash-screen");
  if (splash) splash.classList.add("hidden");
} catch {}
