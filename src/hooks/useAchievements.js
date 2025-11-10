// src/hooks/useAchievements.js
import { useState, useEffect, useCallback } from "react";
import { calculateStats, checkAchievements } from "../data/achievements";

/**
 * useAchievements - Hook personnalisé pour gérer les achievements
 * Vérifie automatiquement les achievements à chaque changement de jeux/collections
 * et notifie les nouveaux achievements débloqués
 */
export function useAchievements(games, collections) {
  const [unlockedAchievements, setUnlockedAchievements] = useState([]);
  const [newlyUnlocked, setNewlyUnlocked] = useState([]);
  const [achievementsLoaded, setAchievementsLoaded] = useState(false);

  // Charger les achievements depuis Electron au démarrage
  useEffect(() => {
    async function loadAchievements() {
      try {
        const saved = await window.electronAPI.getAchievements();
        console.log("🏆 [useAchievements] Chargement depuis Electron :", saved);
        setUnlockedAchievements(saved || []);
        setAchievementsLoaded(true);
        console.log("🏆 [useAchievements] Achievements chargés :", saved?.length || 0);
      } catch (err) {
        console.error("❌ Erreur chargement achievements :", err);
        setAchievementsLoaded(true);
      }
    }
    loadAchievements();
  }, []);

  // Vérifier les achievements à chaque changement de jeux/collections
  useEffect(() => {
    // Attendre que les achievements soient chargés
    if (!achievementsLoaded || !games || !collections) {
      console.log(
        "🏆 [useAchievements] Vérification ignorée - achievementsLoaded:",
        achievementsLoaded,
        "games:",
        games?.length,
        "collections:",
        collections?.length
      );
      return;
    }

    console.log(
      "🏆 [useAchievements] Vérification des achievements - actuellement débloqués:",
      unlockedAchievements.length
    );
    const stats = calculateStats(games, collections, unlockedAchievements);
    const newAchievements = checkAchievements(stats, unlockedAchievements);

    if (newAchievements.length > 0) {
      console.log("🎉 [useAchievements] Nouveaux achievements débloqués :", newAchievements);

      // Créer une version sérialisable (sans fonctions) pour la sauvegarde
      const serializableAchievements = newAchievements.map((a) => ({
        id: a.id,
        unlockedAt: a.unlockedAt,
      }));

      // Mettre à jour la liste des achievements débloqués
      const updatedUnlocked = [...unlockedAchievements, ...serializableAchievements];
      setUnlockedAchievements(updatedUnlocked);

      // Sauvegarder dans Electron (version sérialisable uniquement)
      console.log("💾 [useAchievements] Sauvegarde de", updatedUnlocked.length, "achievements");
      window.electronAPI.saveAchievements(updatedUnlocked);

      // Notifier les nouveaux achievements (version complète avec toutes les données)
      setNewlyUnlocked(newAchievements);
    } else {
      console.log("✅ [useAchievements] Aucun nouveau achievement");
    }
  }, [games, collections, achievementsLoaded]);

  // Fonction pour consommer une notification d'achievement
  const consumeNotification = useCallback(() => {
    if (newlyUnlocked.length > 0) {
      const [first, ...rest] = newlyUnlocked;
      setNewlyUnlocked(rest);
      return first;
    }
    return null;
  }, [newlyUnlocked]);

  // Fonction pour réinitialiser tous les achievements (debug)
  const resetAchievements = useCallback(async () => {
    try {
      await window.electronAPI.saveAchievements([]);
      setUnlockedAchievements([]);
      setNewlyUnlocked([]);
      console.log("🔄 Achievements réinitialisés");
    } catch (err) {
      console.error("❌ Erreur réinitialisation achievements :", err);
    }
  }, []);

  return {
    unlockedAchievements,
    newlyUnlocked,
    consumeNotification,
    resetAchievements,
    hasNewAchievement: newlyUnlocked.length > 0,
  };
}

export default useAchievements;
