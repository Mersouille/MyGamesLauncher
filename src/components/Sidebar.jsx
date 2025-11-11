// src/components/Sidebar.jsx
import React, { useEffect, useState, useRef } from "react";
import { useGamepad } from "../hooks/useGamepad";
import categories from "../data/categories.js";

export default function Sidebar({
  currentCategory,
  onSelectCategory,
  collections = [],
  onManageCollections,
  onManageControllers,
  onOpenStatistics,
  onOpenAchievements,
  isModalOpen = false,
}) {
  const { gamepadConnected, registerListener } = useGamepad();

  // Créer une liste complète de toutes les sections navigables
  // 🎯 Ordre optimisé : "Tous les jeux" au milieu pour accès rapide aux deux côtés
  const allSections = React.useMemo(() => {
    // Pages spéciales (accessibles avec LB depuis "Tous les jeux")
    const specialPages = ["📊 Statistiques", "🏆 Achievements", "🎮 Contrôleurs"];
    // Collections (après les pages spéciales)
    const collectionsList = collections.map((c) => `collection:${c.id}`);
    // Catégories de jeux (sans "Tous les jeux")
    const gameCategories = categories.filter((c) => c !== "Tous les jeux");

    // Assemblage : spéciales + collections + "Tous les jeux" (milieu) + autres catégories
    const sections = [
      ...specialPages,
      ...collectionsList,
      "Tous les jeux", // Position centrale
      ...gameCategories,
    ];
    return sections;
  }, [collections]);

  const [selectedIndex, setSelectedIndex] = useState(() => {
    const index = allSections.indexOf(currentCategory);
    return index !== -1 ? index : 0;
  });

  // 🎮 Refs pour accéder aux valeurs actuelles sans déclencher le useEffect
  const selectedIndexRef = useRef(selectedIndex);
  const allSectionsRef = useRef(allSections);
  const onSelectCategoryRef = useRef(onSelectCategory);
  const onManageControllersRef = useRef(onManageControllers);
  const onOpenStatisticsRef = useRef(onOpenStatistics);
  const onOpenAchievementsRef = useRef(onOpenAchievements);
  const currentCategoryRef = useRef(currentCategory);

  // 🚫 Bloquer les interactions pendant qu'on change de catégorie (utiliser ref au lieu de state)
  const isChangingCategoryRef = useRef(false);

  // 📌 Garder une référence à la fonction unregister pour pouvoir désenregistrer manuellement
  const unregisterRef = useRef(null);

  // Mettre à jour les refs quand les valeurs changent
  selectedIndexRef.current = selectedIndex;
  allSectionsRef.current = allSections;
  onSelectCategoryRef.current = onSelectCategory;
  onManageControllersRef.current = onManageControllers;
  onOpenStatisticsRef.current = onOpenStatistics;
  onOpenAchievementsRef.current = onOpenAchievements;
  currentCategoryRef.current = currentCategory;

  // 🎮 Navigation avec gâchettes LB/RB et D-pad
  useEffect(() => {
    console.log("🔄 [Sidebar] useEffect déclenché - gamepadConnected:", gamepadConnected);
    if (!gamepadConnected) return;

    // 🎯 Vérifier si on est dans une page modale
    const isInModalPage = ["📊 Statistiques", "🏆 Achievements", "🎮 Contrôleurs"].includes(
      currentCategory
    );

    console.log(
      "📝 [Sidebar] Enregistrement du listener - isInModalPage:",
      isInModalPage,
      "currentCategory:",
      currentCategory
    );

    // 🚨 CRITIQUE: Construire l'objet callbacks conditionnellement
    const callbacks = {
      // LB = Catégorie précédente (changement immédiat)
      onLB: () => {
        if (isChangingCategoryRef.current) return;
        const currentIndex = allSectionsRef.current.indexOf(currentCategoryRef.current);
        const newIndex = Math.max(0, currentIndex - 1);
        const newSection = allSectionsRef.current[newIndex];

        if (newSection && newSection !== currentCategoryRef.current) {
          isChangingCategoryRef.current = true;
          setTimeout(() => {
            isChangingCategoryRef.current = false;
          }, 0.2); // ⚡⚡⚡⚡⚡⚡ Réduit à 0.2ms pour navigation quasi-instantanée
          onSelectCategoryRef.current(newSection);
          setSelectedIndex(newIndex);
        }
      },
      // RB = Catégorie suivante (changement immédiate)
      onRB: () => {
        if (isChangingCategoryRef.current) return;
        const currentIndex = allSectionsRef.current.indexOf(currentCategoryRef.current);
        const newIndex = Math.min(allSectionsRef.current.length - 1, currentIndex + 1);
        const newSection = allSectionsRef.current[newIndex];

        console.log("🎯 [Sidebar] RB - currentCategory:", currentCategoryRef.current);
        console.log("🎯 [Sidebar] RB - currentIndex:", currentIndex, "→ newIndex:", newIndex);
        console.log("🎯 [Sidebar] RB - allSections:", allSectionsRef.current);
        console.log("🎯 [Sidebar] RB - newSection:", newSection);

        if (newSection && newSection !== currentCategoryRef.current) {
          isChangingCategoryRef.current = true;
          setTimeout(() => {
            isChangingCategoryRef.current = false;
          }, 0.2); // ⚡⚡⚡⚡⚡⚡ Réduit à 0.2ms
          onSelectCategoryRef.current(newSection);
          setSelectedIndex(newIndex);
        }
      },
      // Bouton Y = Ouvrir/Activer la page spéciale sélectionnée
      onY: () => {
        const section = currentCategoryRef.current;
        console.log("🎯 [Sidebar] Bouton Y pressé - section:", section);
        console.log("🔍 [Sidebar] Refs disponibles:", {
          onManageControllers: !!onManageControllersRef.current,
          onOpenStatistics: !!onOpenStatisticsRef.current,
          onOpenAchievements: !!onOpenAchievementsRef.current,
        });

        // Si on est sur une page spéciale, l'ouvrir
        if (section === "🎮 Contrôleurs") {
          console.log("✅ Ouverture Contrôleurs");
          onManageControllersRef.current?.();
        } else if (section === "📊 Statistiques") {
          console.log("✅ Tentative ouverture Statistiques");
          if (onOpenStatisticsRef.current) {
            onOpenStatisticsRef.current();
            console.log("✅ Callback appelé");
          } else {
            console.error("❌ onOpenStatisticsRef.current est null/undefined!");
          }
        } else if (section === "🏆 Achievements") {
          console.log("✅ Ouverture Achievements");
          onOpenAchievementsRef.current?.();
        } else {
          console.log("⚠️ [Sidebar] Bouton Y ignoré - pas une page spéciale");
        }
      },
      // D-pad haut = Section précédente + activation immédiate (alternative à LB)
      onDPAD_UP: () => {
        if (isChangingCategoryRef.current) return;
        const currentIndex = allSectionsRef.current.indexOf(currentCategoryRef.current);
        const newIndex = Math.max(0, currentIndex - 1);
        const newSection = allSectionsRef.current[newIndex];

        if (newSection && newSection !== currentCategoryRef.current) {
          isChangingCategoryRef.current = true;
          setTimeout(() => {
            isChangingCategoryRef.current = false;
          }, 300);
          onSelectCategoryRef.current(newSection);
          setSelectedIndex(newIndex);
        }
      },
      // D-pad bas = Section suivante + activation immédiate
      onDPAD_DOWN: () => {
        if (isChangingCategoryRef.current) return;
        const currentIndex = allSectionsRef.current.indexOf(currentCategoryRef.current);
        const newIndex = Math.min(allSectionsRef.current.length - 1, currentIndex + 1);
        const newSection = allSectionsRef.current[newIndex];

        if (newSection && newSection !== currentCategoryRef.current) {
          isChangingCategoryRef.current = true;
          setTimeout(() => {
            isChangingCategoryRef.current = false;
          }, 300);
          onSelectCategoryRef.current(newSection);
          setSelectedIndex(newIndex);
        }
      },
      // Bouton B = Fermer les pages modales
      onB: () => {
        console.log("🔵 [Sidebar] onB appelé - currentCategory:", currentCategoryRef.current);
        // ✅ Si une modal est ouverte, la fermer en revenant à "Tous les jeux"
        const isModalPage =
          currentCategoryRef.current === "📊 Statistiques" ||
          currentCategoryRef.current === "🏆 Achievements" ||
          currentCategoryRef.current === "🎮 Contrôleurs";

        if (isModalPage) {
          console.log(
            "🎯 [Sidebar] Bouton B pressé - fermeture modal:",
            currentCategoryRef.current
          );
          // ✅ CRITIQUE: Passer forceClose=true pour contourner le blocage dans App.jsx
          onSelectCategoryRef.current("Tous les jeux", true);
        } else {
          console.log("⚠️ [Sidebar] Bouton B ignoré - pas de modal ouverte");
        }
      },
      // Bouton X (alternatif) = Fermer les pages modales aussi
      onX: () => {
        console.log("🔵 [Sidebar] onX appelé - currentCategory:", currentCategoryRef.current);
        const isModalPage =
          currentCategoryRef.current === "📊 Statistiques" ||
          currentCategoryRef.current === "🏆 Achievements" ||
          currentCategoryRef.current === "🎮 Contrôleurs";

        if (isModalPage) {
          console.log(
            "🎯 [Sidebar] Bouton X pressé - fermeture modal:",
            currentCategoryRef.current
          );
          // ✅ CRITIQUE: Passer forceClose=true pour contourner le blocage dans App.jsx
          onSelectCategoryRef.current("Tous les jeux", true);
        }
      },
    };

    // 🎯 CRITIQUE: NE JAMAIS enregistrer onA dans Sidebar
    // Le bouton A est TOUJOURS réservé à GameGrid pour lancer les jeux
    // Utilisez LB/RB/D-pad pour naviguer, et le changement se fait automatiquement
    console.log(
      "⚠️ [Sidebar] Callback onA NON enregistré - réservé à GameGrid pour lancer les jeux"
    );

    const unregister = registerListener(callbacks, 25); // 🎯 Priorité 25 (supérieure à GameGrid priorité 5)

    // Sauvegarder la fonction unregister pour pouvoir l'appeler manuellement
    unregisterRef.current = unregister;

    return () => {
      console.log("🧹 [Sidebar] Cleanup du listener");
      if (unregisterRef.current) {
        unregisterRef.current();
        unregisterRef.current = null;
      }
    };
  }, [gamepadConnected, registerListener, currentCategory]); // ✅ Ajout de currentCategory pour réenregistrer avec priorité dynamique

  // Mettre à jour l'index si la catégorie change depuis l'extérieur
  useEffect(() => {
    const index = allSections.indexOf(currentCategory);
    if (index !== -1) {
      setSelectedIndex(index);
    }
  }, [currentCategory, allSections]);

  return (
    <aside
      style={{
        width: "240px",
        background: "#1e1e1e",
        color: "white",
        padding: "10px 20px 20px 20px",
        borderRight: "1px solid #333",
        height: "100vh",
        position: "relative",
      }}
    >
      {/* 🎮 Indicateur manette + Aide navigation en haut */}
      {gamepadConnected && (
        <div
          style={{
            position: "absolute",
            top: "10px",
            left: "20px",
            right: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "8px",
            zIndex: 100,
          }}
        >
          {/* Badge manette connectée */}
          <div
            style={{
              background: "#28a745",
              color: "white",
              padding: "6px 10px",
              borderRadius: "16px",
              fontSize: "0.7rem",
              fontWeight: "600",
              display: "flex",
              alignItems: "center",
              gap: "5px",
              boxShadow: "0 2px 8px rgba(40, 167, 69, 0.4)",
              width: "fit-content",
            }}
          >
            <span style={{ fontSize: "0.9rem" }}>🎮</span>
            <span>Manette</span>
          </div>
        </div>
      )}

      {/* 📊 Bouton Statistiques */}
      <button
        onClick={() => onSelectCategory("📊 Statistiques")}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "10px",
          marginTop: gamepadConnected ? "50px" : "0",
          background: currentCategory === "📊 Statistiques" ? "#8b5cf6" : "#374151",
          color: "white",
          fontSize: "0.95rem",
          fontWeight: "600",
          border:
            gamepadConnected && allSections[selectedIndex] === "📊 Statistiques"
              ? "2px solid #00d4ff"
              : "none",
          transition: "all 0.2s",
          transform:
            gamepadConnected && allSections[selectedIndex] === "📊 Statistiques"
              ? "scale(1.05)"
              : "scale(1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        📊 Statistiques
      </button>

      {/* 🏆 Bouton Achievements */}
      <button
        onClick={() => onSelectCategory("🏆 Achievements")}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "10px",
          background: currentCategory === "🏆 Achievements" ? "#F59E0B" : "#374151",
          color: "white",
          fontSize: "0.95rem",
          fontWeight: "600",
          border:
            gamepadConnected && allSections[selectedIndex] === "🏆 Achievements"
              ? "2px solid #00d4ff"
              : "none",
          transition: "all 0.2s",
          transform:
            gamepadConnected && allSections[selectedIndex] === "🏆 Achievements"
              ? "scale(1.05)"
              : "scale(1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        🏆 Achievements
      </button>

      {/* 🎮 Bouton Contrôleurs */}
      <button
        onClick={onManageControllers}
        style={{
          width: "100%",
          padding: "12px",
          borderRadius: "8px",
          cursor: "pointer",
          marginBottom: "20px",
          background: "#10b981",
          color: "white",
          fontSize: "0.95rem",
          fontWeight: "600",
          border:
            gamepadConnected && allSections[selectedIndex] === "🎮 Contrôleurs"
              ? "2px solid #00d4ff"
              : "none",
          transition: "all 0.2s",
          transform:
            gamepadConnected && allSections[selectedIndex] === "🎮 Contrôleurs"
              ? "scale(1.05)"
              : "scale(1)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "8px",
        }}
      >
        🎮 Contrôleurs
      </button>

      {/* 📚 Collections Section */}
      {collections.length > 0 && (
        <>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "12px",
            }}
          >
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>Collections</h3>
            <button
              onClick={onManageCollections}
              style={{
                background: "transparent",
                border: "none",
                color: "#8b5cf6",
                cursor: "pointer",
                fontSize: "1.2rem",
                padding: "4px",
              }}
              title="Gérer les collections"
            >
              ⚙️
            </button>
          </div>
          <ul style={{ listStyle: "none", padding: 0, marginBottom: "20px" }}>
            {collections.map((collection) => (
              <li
                key={collection.id}
                onClick={() => onSelectCategory(`collection:${collection.id}`)}
                style={{
                  padding: "10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  marginBottom: "6px",
                  background:
                    currentCategory === `collection:${collection.id}` ? "#8b5cf6" : "transparent",
                  color: currentCategory === `collection:${collection.id}` ? "white" : "#ccc",
                  transition: "all 0.2s",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  border:
                    gamepadConnected && allSections[selectedIndex] === `collection:${collection.id}`
                      ? "2px solid #00d4ff"
                      : "2px solid transparent",
                  transform:
                    gamepadConnected && allSections[selectedIndex] === `collection:${collection.id}`
                      ? "scale(1.05)"
                      : "scale(1)",
                }}
              >
                <span>
                  {collection.icon} {collection.name}
                </span>
                <span
                  style={{
                    fontSize: "0.75rem",
                    background: "rgba(255, 255, 255, 0.1)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                  }}
                >
                  {collection.gameIds.length}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      <h3
        style={{
          marginBottom: "20px",
          fontSize: "1.2rem",
        }}
      >
        Catégories
      </h3>
      <ul style={{ listStyle: "none", padding: 0 }}>
        {categories.map((cat) => (
          <li
            key={cat}
            onClick={() => onSelectCategory(cat)}
            style={{
              padding: "10px",
              borderRadius: "8px",
              cursor: "pointer",
              marginBottom: "6px",
              background: currentCategory === cat ? "#007bff" : "transparent",
              color: currentCategory === cat ? "white" : "#ccc",
              transition: "all 0.2s",
              border:
                gamepadConnected && allSections[selectedIndex] === cat
                  ? "2px solid #00d4ff"
                  : "2px solid transparent",
              transform:
                gamepadConnected && allSections[selectedIndex] === cat ? "scale(1.05)" : "scale(1)",
            }}
          >
            {cat}
          </li>
        ))}
      </ul>

      {/* Bouton pour gérer les collections si aucune n'existe */}
      {collections.length === 0 && (
        <button
          onClick={onManageCollections}
          style={{
            width: "100%",
            padding: "12px",
            borderRadius: "8px",
            cursor: "pointer",
            marginTop: "20px",
            background: "#8b5cf622",
            color: "#8b5cf6",
            fontSize: "0.9rem",
            fontWeight: "600",
            border: "2px dashed #8b5cf6",
            transition: "all 0.2s",
          }}
        >
          📚 Créer une collection
        </button>
      )}
    </aside>
  );
}
