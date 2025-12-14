// src/components/GameDetailsModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useGamepad } from "../hooks/useGamepad";
import categories from "../data/categories.js";

/**
 * 🎮 Modal de détails d'un jeu
 * - Statut : Non commencé, En cours, Terminé, 100%
 * - Note : 0-5 étoiles
 * - Commentaires personnels
 */
export default function GameDetailsModal({ game, isOpen, onClose, onSave }) {
  const [status, setStatus] = useState(game?.status || "not-started");
  const [rating, setRating] = useState(game?.rating || 0);
  const [notes, setNotes] = useState(game?.notes || "");
  const [category, setCategory] = useState(game?.category || "Action / Aventure");
  const [displayName, setDisplayName] = useState(game?.displayName || game?.name || "");
  const [hoveredStar, setHoveredStar] = useState(0);
  const [pinProtected, setPinProtected] = useState(game?.pinProtected || false);
  const [pin, setPin] = useState(game?.pin || "");
  const [showPin, setShowPin] = useState(false); // 👁️ Afficher/masquer le PIN
  const [description, setDescription] = useState(game?.description || "");
  const { gamepadConnected, registerListener } = useGamepad();

  // Ref pour éviter de réenregistrer le listener
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // Mise à jour directe pendant le render

  // Synchroniser avec les props quand le jeu change
  useEffect(() => {
    if (game) {
      setStatus(game.status || "not-started");
      setRating(game.rating || 0);
      setNotes(game.notes || "");
      setCategory(game.category || "Action / Aventure");
      setDisplayName(game.displayName || game.name || "");
      setPinProtected(game.pinProtected || false);
      setPin(game.pin || "");
      setShowPin(false); // Toujours masquer le PIN au départ
      setDescription(game.description || "");
    }
  }, [game]);

  // 🎮 Écoute du bouton B pour fermer
  useEffect(() => {
    if (!gamepadConnected || !isOpen) return;

    console.log("🎮 [GameDetailsModal] Enregistrement du listener pour bouton B (priorité: 100)");

    const unregister = registerListener(
      {
        onB: () => {
          console.log("🎮 [GameDetailsModal] Bouton B pressé - fermeture");
          onCloseRef.current();
        },
      },
      100
    ); // Priorité 100 (haute) pour fermer le modal

    return unregister;
  }, [gamepadConnected, registerListener, isOpen]);

  if (!isOpen || !game) return null;

  const statuses = [
    { value: "not-started", label: "Non commencé", icon: "⏸️", color: "gray" },
    { value: "in-progress", label: "En cours", icon: "🎮", color: "blue" },
    { value: "completed", label: "Terminé", icon: "✅", color: "green" },
    { value: "100-percent", label: "100%", icon: "🏆", color: "yellow" },
  ];

  const handleSave = () => {
    onSave({
      status,
      rating,
      notes,
      category,
      displayName,
      pinProtected,
      pin: pinProtected ? pin : "", // Sauvegarder le PIN seulement si activé
      description,
    });
    onClose();
  };

  const renderStars = () => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      const isFilled = i <= (hoveredStar || rating);
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoveredStar(i)}
          onMouseLeave={() => setHoveredStar(0)}
          className="text-3xl transition-all transform hover:scale-125 focus:outline-none"
          style={{
            color: isFilled ? "#fbbf24" : "#4b5563",
            textShadow: isFilled ? "0 0 10px rgba(251, 191, 36, 0.5)" : "none",
          }}
        >
          {isFilled ? "⭐" : "☆"}
        </button>
      );
    }
    return stars;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: "spring", damping: 25 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full mx-4 overflow-hidden border-2 border-gray-700 max-h-[85vh] overflow-y-auto"
            style={{
              scrollbarWidth: "thin",
              scrollbarColor: "rgba(139, 92, 246, 0.6) rgba(30, 30, 30, 0.5)",
            }}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{game.name}</h2>
                  <p className="text-blue-100 text-sm opacity-90">
                    {game.playTime > 0
                      ? `⏱️ ${Math.floor(game.playTime / 60)}h ${game.playTime % 60}min jouées`
                      : "Aucun temps de jeu enregistré"}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-white/80 hover:text-white transition-colors text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Statut */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">📊 Statut</label>
                <div className="grid grid-cols-2 gap-3">
                  {statuses.map((s) => {
                    const isSelected = status === s.value;
                    const colorClasses = {
                      gray: isSelected
                        ? "bg-gray-600 border-gray-400"
                        : "bg-gray-800 border-gray-700",
                      blue: isSelected
                        ? "bg-blue-600 border-blue-400"
                        : "bg-gray-800 border-gray-700",
                      green: isSelected
                        ? "bg-green-600 border-green-400"
                        : "bg-gray-800 border-gray-700",
                      yellow: isSelected
                        ? "bg-yellow-600 border-yellow-400"
                        : "bg-gray-800 border-gray-700",
                    };

                    return (
                      <button
                        key={s.value}
                        type="button"
                        onClick={() => setStatus(s.value)}
                        className={`${
                          colorClasses[s.color]
                        } text-white border-2 rounded-lg p-4 transition-all transform hover:scale-105 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-blue-500`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-3xl">{s.icon}</span>
                          <span className="font-semibold">{s.label}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Catégorie */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">📁 Catégorie</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-gray-800 text-white border-2 border-gray-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all cursor-pointer"
                >
                  {categories
                    .filter((cat) => cat !== "Tous les jeux")
                    .map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                </select>
              </div>

              {/* Nom d'affichage pour recherche */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  🎮 Nom pour recherche de jaquette
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Nom du jeu (ex: Grand Theft Auto V)"
                  className="w-full bg-gray-800 text-white border-2 border-gray-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                />
                <p className="text-gray-400 text-sm mt-2">
                  💡 Ce nom sera utilisé pour rechercher la jaquette sur SteamGridDB
                </p>
              </div>

              {/* Note */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  ⭐ Note personnelle
                </label>
                <div className="flex items-center gap-2 bg-gray-800 rounded-lg p-4 justify-center">
                  {renderStars()}
                </div>
                <p className="text-gray-400 text-sm text-center mt-2">
                  {rating === 0
                    ? "Aucune note"
                    : rating === 1
                    ? "Décevant"
                    : rating === 2
                    ? "Moyen"
                    : rating === 3
                    ? "Bien"
                    : rating === 4
                    ? "Très bien"
                    : "Excellent !"}
                </p>
              </div>

              {/* Commentaires */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  📝 Commentaires
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Vos impressions, notes personnelles..."
                  className="w-full bg-gray-800 text-white border-2 border-gray-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                />
                <p className="text-gray-400 text-sm mt-2">
                  {notes.length} caractère{notes.length !== 1 ? "s" : ""}
                </p>
              </div>

              {/* Protection par code PIN */}
              <div className="border-t-2 border-gray-700 pt-6">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-white font-semibold text-lg flex items-center gap-2">
                    🔐 Protection par code PIN
                  </label>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={pinProtected}
                      onChange={(e) => setPinProtected(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-14 h-8 bg-gray-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-800 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                {pinProtected && (
                  <div className="space-y-3">
                    <div className="relative">
                      <input
                        type={showPin ? "text" : "password"}
                        inputMode="numeric"
                        maxLength={4}
                        value={pin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, ""); // Seulement des chiffres
                          setPin(value);
                        }}
                        placeholder="Code PIN (4 chiffres)"
                        className="w-full bg-gray-800 text-white border-2 border-gray-700 rounded-lg p-4 pr-12 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all text-center text-2xl font-bold tracking-widest"
                        style={{
                          letterSpacing: showPin ? "0.5rem" : "0.3rem",
                        }}
                      />
                      {/* Bouton pour révéler/masquer le PIN */}
                      {pin.length === 4 && (
                        <button
                          type="button"
                          onClick={() => setShowPin(!showPin)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-2xl hover:scale-110 transition-transform"
                          title={showPin ? "Masquer le code PIN" : "Afficher le code PIN"}
                        >
                          {showPin ? "🙈" : "👁️"}
                        </button>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">
                      🔒 Un code PIN sera demandé avant de lancer ce jeu
                    </p>
                    {pin.length > 0 && pin.length < 4 && (
                      <p className="text-yellow-500 text-sm">
                        ⚠️ Le code PIN doit contenir exactement 4 chiffres
                      </p>
                    )}
                  </div>
                )}

                {!pinProtected && (
                  <p className="text-gray-400 text-sm">
                    💡 Activez cette option pour protéger l'accès à ce jeu
                  </p>
                )}
              </div>

              {/* Description pour mode Big Picture */}
              <div>
                <label className="block text-white font-semibold mb-3 text-lg">
                  📄 Description (Mode Big Picture)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Description affichée au verso de la carte en mode Big Picture..."
                  className="w-full bg-gray-800 text-white border-2 border-gray-700 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                  rows={4}
                />
                <p className="text-gray-400 text-sm mt-2">
                  💡 Texte affiché sur le verso de la jaquette en mode Big Picture
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-800 p-4 flex gap-3 justify-end border-t-2 border-gray-700">
              <button
                onClick={onClose}
                className="px-6 py-2.5 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all font-medium"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-all font-medium shadow-lg"
              >
                💾 Enregistrer
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
