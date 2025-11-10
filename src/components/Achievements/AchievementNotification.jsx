// src/components/Achievements/AchievementNotification.jsx
import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { rarityColors } from "../../data/achievements";

/**
 * AchievementNotification - Notification toast animée pour les achievements débloqués
 * Affiche un badge avec animation d'entrée spectaculaire
 */
const AchievementNotification = ({ achievement, onClose }) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    // Auto-fermeture après 5 secondes
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 500); // Attendre la fin de l'animation
    }, 5000);

    return () => clearTimeout(timer);
  }, [onClose]);

  if (!achievement) return null;

  const rarityColor = rarityColors[achievement.rarity] || rarityColors.common;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: 400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: 400, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", damping: 15, stiffness: 200 }}
          style={{
            position: "fixed",
            top: "80px",
            right: "20px",
            zIndex: 10000,
            minWidth: "320px",
            maxWidth: "400px",
          }}
        >
          <div
            style={{
              background: "linear-gradient(135deg, #1e1e1e 0%, #2d2d2d 100%)",
              border: `3px solid ${rarityColor}`,
              borderRadius: "16px",
              padding: "20px",
              boxShadow: `0 10px 40px ${rarityColor}88, 0 0 20px ${rarityColor}44`,
              backdropFilter: "blur(10px)",
              position: "relative",
              overflow: "hidden",
            }}
          >
            {/* Effet de brillance */}
            <motion.div
              initial={{ x: "-100%", opacity: 0.5 }}
              animate={{ x: "200%", opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(90deg, transparent, ${rarityColor}44, transparent)`,
                pointerEvents: "none",
              }}
            />

            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "12px",
                marginBottom: "12px",
              }}
            >
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
                style={{
                  fontSize: "48px",
                  filter: `drop-shadow(0 0 10px ${rarityColor})`,
                }}
              >
                {achievement.icon}
              </motion.div>
              <div style={{ flex: 1 }}>
                <div
                  style={{
                    fontSize: "12px",
                    fontWeight: "600",
                    color: rarityColor,
                    textTransform: "uppercase",
                    letterSpacing: "1px",
                    marginBottom: "4px",
                  }}
                >
                  🏆 Achievement Débloqué !
                </div>
                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    color: "#fff",
                    marginBottom: "4px",
                  }}
                >
                  {achievement.name}
                </div>
                <div
                  style={{
                    fontSize: "13px",
                    color: "#aaa",
                  }}
                >
                  {achievement.description}
                </div>
              </div>
            </div>

            {/* Badge de catégorie et rareté */}
            <div
              style={{
                display: "flex",
                gap: "8px",
                marginTop: "12px",
              }}
            >
              <span
                style={{
                  background: `${rarityColor}22`,
                  color: rarityColor,
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  border: `1px solid ${rarityColor}44`,
                }}
              >
                {achievement.category}
              </span>
              <span
                style={{
                  background: `${rarityColor}22`,
                  color: rarityColor,
                  padding: "4px 12px",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "600",
                  textTransform: "uppercase",
                  border: `1px solid ${rarityColor}44`,
                }}
              >
                {achievement.rarity === "common" && "⚪ Commun"}
                {achievement.rarity === "uncommon" && "🟢 Peu commun"}
                {achievement.rarity === "rare" && "🔵 Rare"}
                {achievement.rarity === "epic" && "🟣 Épique"}
                {achievement.rarity === "legendary" && "🟡 Légendaire"}
              </span>
            </div>

            {/* Bouton fermer */}
            <button
              onClick={() => {
                setIsVisible(false);
                setTimeout(onClose, 500);
              }}
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                background: "rgba(255, 255, 255, 0.1)",
                border: "none",
                borderRadius: "50%",
                width: "24px",
                height: "24px",
                color: "#fff",
                cursor: "pointer",
                fontSize: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
              }}
            >
              ✕
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default AchievementNotification;
