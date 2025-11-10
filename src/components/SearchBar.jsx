// src/components/SearchBar.jsx
import React, { useState, useEffect } from "react";

/**
 * 🔍 Composant de recherche et filtrage des jeux
 * - Recherche par nom (instantanée)
 * - Tri par nom, temps de jeu, date d'ajout
 * - Filtre favoris uniquement
 */
export default function SearchBar({ onSearchChange, onSortChange, onFavoritesToggle }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState("name"); // name, playTime, dateAdded
  const [favoritesOnly, setFavoritesOnly] = useState(false);

  // Debounce pour la recherche (performance)
  useEffect(() => {
    const timer = setTimeout(() => {
      if (onSearchChange) {
        onSearchChange(searchTerm);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, onSearchChange]);

  // Notifier les changements de tri
  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    if (onSortChange) {
      onSortChange(newSort);
    }
  };

  // Notifier les changements de filtre favoris
  const handleFavoritesToggle = () => {
    const newValue = !favoritesOnly;
    setFavoritesOnly(newValue);
    if (onFavoritesToggle) {
      onFavoritesToggle(newValue);
    }
  };

  // Réinitialiser tous les filtres
  const handleReset = () => {
    setSearchTerm("");
    setSortBy("name");
    setFavoritesOnly(false);
    if (onSearchChange) onSearchChange("");
    if (onSortChange) onSortChange("name");
    if (onFavoritesToggle) onFavoritesToggle(false);
  };

  return (
    <div className="w-full bg-gray-800/50 backdrop-blur-sm rounded-xl p-4 mb-6 border border-gray-700/50">
      <div className="flex flex-col md:flex-row gap-4 items-center">
        {/* 🔍 Champ de recherche */}
        <div className="flex-1 relative w-full">
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">🔍</div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher un jeu..."
            className="w-full pl-10 pr-4 py-2.5 bg-gray-900/50 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
              title="Effacer"
            >
              ✕
            </button>
          )}
        </div>

        {/* 📊 Sélecteur de tri */}
        <div className="flex items-center gap-2">
          <span className="text-gray-400 text-sm whitespace-nowrap">Trier par :</span>
          <select
            value={sortBy}
            onChange={(e) => handleSortChange(e.target.value)}
            className="bg-gray-900/50 border border-gray-600 rounded-lg px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all cursor-pointer"
          >
            <option value="name">📝 Nom (A-Z)</option>
            <option value="nameDesc">📝 Nom (Z-A)</option>
            <option value="playTime">⏱️ Temps de jeu (↓)</option>
            <option value="playTimeAsc">⏱️ Temps de jeu (↑)</option>
            <option value="dateAdded">📅 Date d'ajout (récent)</option>
            <option value="dateAddedOld">📅 Date d'ajout (ancien)</option>
          </select>
        </div>

        {/* ⭐ Toggle favoris */}
        <button
          onClick={handleFavoritesToggle}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium transition-all whitespace-nowrap ${
            favoritesOnly
              ? "bg-yellow-500/20 text-yellow-400 border-2 border-yellow-500/50 hover:bg-yellow-500/30"
              : "bg-gray-700/50 text-gray-300 border-2 border-gray-600/50 hover:bg-gray-600/50"
          }`}
          title="Afficher uniquement les favoris"
        >
          <span className="text-xl">{favoritesOnly ? "⭐" : "☆"}</span>
          <span className="hidden sm:inline">Favoris</span>
        </button>

        {/* 🔄 Réinitialiser */}
        {(searchTerm || sortBy !== "name" || favoritesOnly) && (
          <button
            onClick={handleReset}
            className="px-4 py-2.5 bg-red-500/20 text-red-400 border-2 border-red-500/50 rounded-lg hover:bg-red-500/30 transition-all whitespace-nowrap font-medium"
            title="Réinitialiser tous les filtres"
          >
            🔄 Reset
          </button>
        )}
      </div>

      {/* 📌 Indicateur de résultats */}
      {(searchTerm || favoritesOnly) && (
        <div className="mt-3 text-sm text-gray-400 flex items-center gap-2">
          <span>🔎</span>
          <span>
            {searchTerm && `Recherche : "${searchTerm}"`}
            {searchTerm && favoritesOnly && " • "}
            {favoritesOnly && "Favoris uniquement"}
          </span>
        </div>
      )}
    </div>
  );
}
