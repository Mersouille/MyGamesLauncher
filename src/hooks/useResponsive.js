import { useState, useEffect } from "react";

/**
 * 🎯 Hook personnalisé pour gérer le responsive design de l'application
 * Détecte la taille de la fenêtre en temps réel et calcule :
 * - uiScale : facteur d'échelle pour tous les éléments UI
 * - gridColumns : nombre de colonnes optimal pour la grille de jeux
 * - cardWidth : largeur des cartes de jeu
 */
export function useResponsive() {
  const [dimensions, setDimensions] = useState({
    width: typeof window !== "undefined" ? window.innerWidth : 1920,
    height: typeof window !== "undefined" ? window.innerHeight : 1080,
  });

  useEffect(() => {
    // 📏 Handler pour mettre à jour les dimensions
    const handleResize = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // 🎧 Écouter les changements de taille
    window.addEventListener("resize", handleResize);

    // 🧹 Nettoyage
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // 🎨 Calcul du facteur d'échelle UI
  const uiScale = (() => {
    const { width, height } = dimensions;

    // 📺 TV 4K 65" en plein écran (3840x2160 ou supérieur)
    if (width >= 3840 && height >= 2160) {
      return 1.2; // ✨ Augmenté pour mieux utiliser l'espace
    }
    // 🖥️ Moniteur 4K (3000px+)
    else if (width >= 3000) {
      return 1.0; // ✅ Taille normale
    }
    // 💻 Grand écran 1440p (2560x1440)
    else if (width >= 2560) {
      return 0.95;
    }
    // 🖥️ Full HD (1920x1080)
    else if (width >= 1920) {
      return 0.9;
    }
    // 📱 Fenêtre réduite
    else if (width >= 1280) {
      return 0.8;
    }
    // 📱 Très petite fenêtre
    else {
      return 0.7;
    }
  })();

  // 🎯 Calcul du nombre de colonnes optimal
  const gridColumns = (() => {
    const { width } = dimensions;

    // TV 4K / très grand écran
    if (width >= 3840) {
      return 12; // Maximum de colonnes pour TV 4K
    } else if (width >= 3000) {
      return 10;
    } else if (width >= 2560) {
      return 8;
    } else if (width >= 1920) {
      return 6;
    } else if (width >= 1440) {
      return 5;
    } else if (width >= 1280) {
      return 4;
    } else if (width >= 1024) {
      return 3;
    } else {
      return 2;
    }
  })();

  // 🃏 Calcul de la largeur des cartes
  const cardWidth = (() => {
    const { width } = dimensions;
    const sidebarWidth = 240; // Largeur de la sidebar
    const availableWidth = width - sidebarWidth;
    const gap = 32; // Gap entre les cartes (8 * 4px de Tailwind)
    const totalGaps = (gridColumns - 1) * gap;
    const cardArea = (availableWidth - totalGaps - 80) / gridColumns; // -80 pour les marges
    return Math.max(140, Math.min(300, Math.round(cardArea))); // Entre 140px et 300px
  })();

  return {
    uiScale,
    gridColumns,
    cardWidth,
    cardHeight: Math.round(cardWidth * 1.5), // Ratio 2:3 pour les jaquettes
    width: dimensions.width,
    height: dimensions.height,
  };
}
