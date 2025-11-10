import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const categories = [
  { id: "Action / Aventure", icon: "🗡️", gradient: "from-red-500 to-orange-500" },
  { id: "Tir (FPS)", icon: "🎯", gradient: "from-blue-500 to-cyan-500" },
  { id: "Rôle (RPG)", icon: "⚔️", gradient: "from-purple-500 to-pink-500" },
  { id: "Horreur", icon: "👻", gradient: "from-gray-700 to-gray-900" },
  { id: "Combat", icon: "🥊", gradient: "from-yellow-500 to-red-500" },
  { id: "Sport", icon: "⚽", gradient: "from-green-500 to-emerald-500" },
  { id: "Course", icon: "🏎️", gradient: "from-orange-500 to-red-600" },
  { id: "Simulation", icon: "✈️", gradient: "from-sky-500 to-blue-600" },
  { id: "Autre", icon: "🎮", gradient: "from-indigo-500 to-purple-500" },
];

export default function CategorySelector({ isOpen, onClose, onSelect, gameName }) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [hoveredCategory, setHoveredCategory] = useState(null);

  const handleSelect = () => {
    if (selectedCategory) {
      onSelect(selectedCategory);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 20 }}
          className="bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative bg-gradient-to-r from-blue-600 to-purple-600 p-6">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
            <div className="flex items-center gap-3">
              <div className="bg-white/20 backdrop-blur-sm p-3 rounded-xl">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-2xl font-bold text-white">Sélectionner une catégorie</h2>
                {gameName && <p className="text-white/80 text-sm mt-1">Pour : {gameName}</p>}
              </div>
            </div>
          </div>

          {/* Grille de catégories */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {categories.map((category) => (
                <motion.button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  onHoverStart={() => setHoveredCategory(category.id)}
                  onHoverEnd={() => setHoveredCategory(null)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`
                    relative p-6 rounded-xl transition-all duration-300
                    ${
                      selectedCategory === category.id
                        ? "ring-4 ring-blue-500 shadow-2xl shadow-blue-500/50"
                        : "ring-2 ring-gray-700 hover:ring-blue-400"
                    }
                    bg-gradient-to-br ${category.gradient}
                    group overflow-hidden
                  `}
                >
                  {/* Effet brillant au survol */}
                  <div
                    className={`
                    absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent
                    transform -translate-x-full transition-transform duration-700
                    ${hoveredCategory === category.id ? "translate-x-full" : ""}
                  `}
                  />

                  {/* Contenu */}
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <span className="text-5xl filter drop-shadow-lg">{category.icon}</span>
                    <span className="text-white font-semibold text-center text-sm leading-tight">
                      {category.id}
                    </span>
                  </div>

                  {/* Badge de sélection */}
                  {selectedCategory === category.id && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      className="absolute top-2 right-2 bg-blue-500 rounded-full p-1.5 shadow-lg"
                    >
                      <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-gray-900/50 backdrop-blur-sm p-4 border-t border-gray-700 flex justify-between items-center">
            <button
              onClick={onClose}
              className="px-6 py-2.5 rounded-lg bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              ← Annuler
            </button>

            <div className="flex items-center gap-3">
              {selectedCategory && (
                <motion.span
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-gray-300 text-sm"
                >
                  {selectedCategory} sélectionné
                </motion.span>
              )}
              <button
                onClick={handleSelect}
                disabled={!selectedCategory}
                className={`
                  px-6 py-2.5 rounded-lg font-medium transition-all
                  ${
                    selectedCategory
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white shadow-lg shadow-blue-500/50"
                      : "bg-gray-700 text-gray-500 cursor-not-allowed"
                  }
                `}
              >
                Confirmer →
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
