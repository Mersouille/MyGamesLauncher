// src/components/PinModal.jsx
import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * 🔐 Modal de saisie de code PIN (4 chiffres)
 * - Utilisé pour protéger l'accès à certains jeux
 * - Animation shake en cas d'erreur
 * - Option de réinitialisation avec confirmation
 */
export default function PinModal({ isOpen, onClose, onSubmit, gameName, theme = "dark", onResetPin }) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);
  const [shake, setShake] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const inputRefs = useRef([]);

  // Réinitialiser quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      setPin("");
      setError(false);
      setShake(false);
      setShowResetConfirm(false);
      // Focus sur le premier input
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [isOpen]);

  // Gérer la réinitialisation du PIN
  const handleResetPin = () => {
    if (onResetPin) {
      onResetPin();
      onClose();
    }
  };

  // Auto-focus sur le prochain input
  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return; // Accepter uniquement les chiffres

    const newPin = pin.split("");
    newPin[index] = value;
    const updatedPin = newPin.join("");
    setPin(updatedPin);

    // Focus sur le prochain input
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si 4 chiffres saisis, valider automatiquement
    if (updatedPin.length === 4) {
      setTimeout(() => handleSubmit(updatedPin), 300);
    }
  };

  // Gestion du retour arrière
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !pin[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Vérification du PIN
  const handleSubmit = (pinToCheck = pin) => {
    if (pinToCheck.length !== 4) {
      triggerError();
      return;
    }

    const result = onSubmit(pinToCheck);
    if (!result) {
      triggerError();
    }
  };

  // Animation d'erreur
  const triggerError = () => {
    setError(true);
    setShake(true);
    setPin("");
    inputRefs.current[0]?.focus();

    setTimeout(() => {
      setError(false);
      setShake(false);
    }, 600);
  };

  if (!isOpen) return null;

  const currentTheme = theme === "dark" 
    ? { bg: "#1a1a2e", card: "#16213e", text: "#ffffff", primary: "#0f3460", accent: "#e94560" }
    : { bg: "#f0f4f8", card: "#ffffff", text: "#1a1a2e", primary: "#3b82f6", accent: "#8b5cf6" };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.75)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ 
              scale: 1, 
              y: 0,
              x: shake ? [0, -10, 10, -10, 10, 0] : 0,
            }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ duration: 0.3 }}
            onClick={(e) => e.stopPropagation()}
            className="relative rounded-2xl shadow-2xl p-8"
            style={{
              backgroundColor: currentTheme.card,
              color: currentTheme.text,
              maxWidth: "450px",
              width: "90%",
              border: `2px solid ${error ? currentTheme.accent : currentTheme.primary}`,
            }}
          >
            {/* Icône et titre */}
            <div className="text-center mb-6">
              <div className="text-6xl mb-4" style={{ filter: error ? "hue-rotate(180deg)" : "none" }}>
                🔐
              </div>
              <h2 className="text-2xl font-bold mb-2">Code PIN requis</h2>
              <p className="text-sm opacity-75">
                Entrez le code PIN pour lancer <strong>{gameName}</strong>
              </p>
            </div>

            {/* Inputs PIN */}
            <div className="flex justify-center gap-4 mb-6">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  ref={(el) => (inputRefs.current[index] = el)}
                  type="text"
                  inputMode="numeric"
                  maxLength={1}
                  value={pin[index] || ""}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
                  className="text-center text-3xl font-bold rounded-lg transition-all"
                  style={{
                    width: "60px",
                    height: "70px",
                    backgroundColor: error ? "#ff4444" : currentTheme.bg,
                    color: currentTheme.text,
                    border: `2px solid ${error ? currentTheme.accent : pin[index] ? currentTheme.primary : "rgba(255,255,255,0.2)"}`,
                    outline: "none",
                  }}
                />
              ))}
            </div>

            {/* Message d'erreur */}
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="text-center mb-4 text-sm font-semibold"
                  style={{ color: currentTheme.accent }}
                >
                  ❌ Code PIN incorrect
                </motion.div>
              )}
            </AnimatePresence>

            {/* Boutons */}
            {!showResetConfirm ? (
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.1)",
                    color: currentTheme.text,
                  }}
                >
                  Annuler
                </button>
                <button
                  onClick={() => handleSubmit()}
                  className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80"
                  style={{
                    background: `linear-gradient(to right, ${currentTheme.primary}, ${currentTheme.accent})`,
                    color: currentTheme.text,
                  }}
                  disabled={pin.length !== 4}
                >
                  Valider
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="bg-red-600/20 border-2 border-red-600 rounded-lg p-4 text-center">
                  <p className="text-sm font-semibold mb-2" style={{ color: currentTheme.text }}>
                    ⚠️ Êtes-vous sûr de vouloir réinitialiser le code PIN ?
                  </p>
                  <p className="text-xs opacity-75" style={{ color: currentTheme.text }}>
                    Cette action supprimera définitivement la protection par code PIN de ce jeu.
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={() => setShowResetConfirm(false)}
                    className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80"
                    style={{
                      backgroundColor: "rgba(255, 255, 255, 0.1)",
                      color: currentTheme.text,
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleResetPin}
                    className="flex-1 py-3 px-6 rounded-lg font-semibold transition-all hover:opacity-80"
                    style={{
                      background: "linear-gradient(to right, #dc2626, #991b1b)",
                      color: "#ffffff",
                    }}
                  >
                    Confirmer
                  </button>
                </div>
              </div>
            )}

            {/* Aide et lien PIN oublié */}
            {!showResetConfirm && (
              <div className="text-center mt-4 space-y-2">
                <p className="text-xs opacity-60">
                  💡 Astuce : Le code PIN peut être configuré dans les détails du jeu
                </p>
                {onResetPin && (
                  <button
                    onClick={() => setShowResetConfirm(true)}
                    className="text-xs underline hover:no-underline transition-all"
                    style={{ color: currentTheme.accent }}
                  >
                    🔓 Code PIN oublié ? Réinitialiser la protection
                  </button>
                )}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
