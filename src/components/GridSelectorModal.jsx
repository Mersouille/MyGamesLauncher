import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function GridSelectorModal({ isOpen, onClose, gameName, term, onSelect }) {
  const [grids, setGrids] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedGrid, setSelectedGrid] = useState(null);

  useEffect(() => {
    if (isOpen && term) {
      fetchGrids();
    }
  }, [isOpen, term]);

  const fetchGrids = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = await window.electronAPI.getSettings();
      const result = await window.electronAPI.sgdbGetAllGrids({
        apiKey: settings.sgdbApiKey,
        term: term,
      });

      if (result.success) {
        console.log("📦 Grids received:", result.grids?.length, "grids");
        console.log(
          "🔗 Sample grid data:",
          result.grids?.slice(0, 2).map((g) => ({
            id: g.id,
            localThumb: g.localThumb,
            generatedUrl: g.localThumb
              ? window.electronAPI.getCoverUrl(`temp/${g.localThumb}`)
              : null,
          }))
        );
        setGrids(result.grids || []);
      } else {
        setError(result.error || "Échec de récupération des jaquettes");
      }
    } catch (err) {
      console.error("❌ Fetch grids error:", err);
      setError(err.message || "Erreur réseau");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectGrid = (grid) => {
    setSelectedGrid(grid);
  };

  const handleConfirm = async () => {
    if (selectedGrid && onSelect) {
      onSelect(selectedGrid);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-700 flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-white">Choisir une jaquette</h2>
              <p className="text-gray-400 text-sm mt-1">{gameName || term}</p>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-2 hover:bg-gray-700 rounded-lg"
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
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] bg-gradient-to-b from-gray-900/50 to-gray-900">
            {loading && (
              <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
                <p className="text-gray-400 mt-4 animate-pulse">Chargement des jaquettes...</p>
              </div>
            )}

            {error && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4 text-red-400">
                ❌ {error}
              </div>
            )}

            {!loading && !error && grids.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                Aucune jaquette trouvée pour ce jeu
              </div>
            )}

            {!loading && !error && grids.length > 0 && (
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 max-w-4xl mx-auto">
                {grids.map((grid) => (
                  <motion.div
                    key={grid.id}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleSelectGrid(grid)}
                    className={`
                      group relative cursor-pointer rounded-xl overflow-hidden
                      transition-all duration-300 bg-gray-800
                      ${
                        selectedGrid?.id === grid.id
                          ? "ring-4 ring-blue-500 shadow-2xl shadow-blue-500/50"
                          : "ring-2 ring-gray-700 hover:ring-blue-400 hover:shadow-xl"
                      }
                    `}
                  >
                    {/* Image avec aspect ratio fixe */}
                    <div className="relative w-full aspect-[3/4] bg-gray-900">
                      <img
                        src={(() => {
                          const url = grid.localThumb
                            ? window.electronAPI.getCoverUrl(`temp/${grid.localThumb}`)
                            : grid.thumb || grid.url;
                          console.log(
                            `🖼️ Grid ${grid.id}: localThumb=${
                              grid.localThumb
                            }, url=${url?.substring(0, 80)}`
                          );
                          return url;
                        })()}
                        alt={`Jaquette ${grid.id}`}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="eager"
                        onLoad={(e) => {
                          console.log("✅ Image loaded:", e.target.src.substring(0, 60));
                        }}
                        onError={(e) => {
                          console.error("❌ Image failed to load:", e.target.src.substring(0, 80));
                          if (!e.target.dataset.fallback) {
                            e.target.dataset.fallback = "true";
                            e.target.src =
                              "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 200 300'%3E%3Crect fill='%23374151' width='200' height='300'/%3E%3Ctext x='50%25' y='50%25' fill='%239CA3AF' text-anchor='middle' dy='.3em' font-family='sans-serif' font-size='16'%3E%F0%9F%96%BC%EF%B8%8F%3C/text%3E%3Ctext x='50%25' y='60%25' fill='%236B7280' text-anchor='middle' font-family='sans-serif' font-size='12'%3EErreur chargement%3C/text%3E%3C/svg%3E";
                          }
                        }}
                      />

                      {/* Overlay au survol */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                      {/* Badge de sélection */}
                      {selectedGrid?.id === grid.id && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 bg-blue-500 rounded-full p-2 shadow-lg"
                        >
                          <svg
                            className="w-6 h-6 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </motion.div>
                      )}
                    </div>

                    {/* Infos en bas */}
                    <div className="p-3 bg-gradient-to-b from-gray-800 to-gray-900">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded font-medium">
                          {grid.style || "Standard"}
                        </span>
                        <span className="text-gray-400 truncate flex-1">{grid.author}</span>
                      </div>
                      {grid.width && grid.height && (
                        <p className="text-xs text-gray-500 mt-1">
                          {grid.width} × {grid.height}
                        </p>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-700 flex items-center justify-between bg-gray-900">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="px-6 py-2.5 rounded-lg bg-gray-700 text-white hover:bg-gray-600 transition-all duration-200 font-medium"
              >
                ← Annuler
              </button>
              {grids.length > 0 && (
                <span className="text-sm text-gray-400">
                  {grids.length} jaquette{grids.length > 1 ? "s" : ""} disponible
                  {grids.length > 1 ? "s" : ""}
                </span>
              )}
            </div>
            <button
              onClick={handleConfirm}
              disabled={!selectedGrid}
              className={`
                px-8 py-2.5 rounded-lg font-semibold transition-all duration-200
                flex items-center gap-2
                ${
                  selectedGrid
                    ? "bg-gradient-to-r from-blue-600 to-blue-500 text-white hover:from-blue-500 hover:to-blue-400 shadow-lg shadow-blue-500/50 hover:shadow-blue-500/70 hover:scale-105"
                    : "bg-gray-700 text-gray-500 cursor-not-allowed"
                }
              `}
            >
              {selectedGrid ? "✓ Télécharger" : "Sélectionnez une jaquette"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
