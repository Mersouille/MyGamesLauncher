// src/components/Collections/CollectionsManager.jsx
import React, { useState, useEffect, useRef } from "react";
import { getTheme } from "../../data/themes";
import { useGamepad } from "../../hooks/useGamepad";

/**
 * CollectionsManager - Interface de gestion des collections personnalisées
 * Permet de créer, éditer, supprimer des collections et gérer les jeux qu'elles contiennent
 */
const CollectionsManager = ({ collections, onClose, onSave, currentTheme, allGames }) => {
  const theme = getTheme(currentTheme);
  const [localCollections, setLocalCollections] = useState([...collections]);
  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionIcon, setNewCollectionIcon] = useState("📚");
  const [selectedCollection, setSelectedCollection] = useState(null);
  const { gamepadConnected, registerListener } = useGamepad();

  // Ref pour éviter de réenregistrer le listener
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose; // Mise à jour directe pendant le render

  // 🎮 Écoute du bouton B pour fermer
  useEffect(() => {
    if (!gamepadConnected) return;

    console.log("🎮 [CollectionsManager] Enregistrement du listener pour bouton B (priorité: 100)");

    const unregister = registerListener(
      {
        onB: () => {
          console.log("🎮 [CollectionsManager] Bouton B pressé - fermeture");
          onCloseRef.current();
        },
      },
      100
    ); // Priorité 100 (haute) pour fermer le modal

    return unregister;
  }, [gamepadConnected, registerListener]);

  // 🎨 Icônes disponibles pour les collections
  const availableIcons = [
    "📚",
    "🎮",
    "⭐",
    "🔥",
    "💎",
    "🏆",
    "🎯",
    "🎪",
    "🎨",
    "🎭",
    "🎬",
    "🎸",
    "🎲",
    "🎰",
    "🏅",
    "🎫",
    "💼",
    "🎒",
    "🎁",
    "🎉",
    "🎊",
    "🎈",
    "🎀",
    "🎗️",
  ];

  // ➕ Créer une nouvelle collection
  const handleCreateCollection = () => {
    if (!newCollectionName.trim()) return;

    const newCollection = {
      id: Date.now(),
      name: newCollectionName.trim(),
      icon: newCollectionIcon,
      gameIds: [],
      createdAt: new Date().toISOString(),
    };

    setLocalCollections([...localCollections, newCollection]);
    setNewCollectionName("");
    setNewCollectionIcon("📚");
  };

  // ✏️ Commencer l'édition d'une collection
  const handleStartEdit = (collection) => {
    setEditingId(collection.id);
    setEditName(collection.name);
    setEditIcon(collection.icon);
  };

  // 💾 Sauvegarder les modifications d'une collection
  const handleSaveEdit = () => {
    setLocalCollections(
      localCollections.map((c) =>
        c.id === editingId ? { ...c, name: editName, icon: editIcon } : c
      )
    );
    setEditingId(null);
  };

  // ❌ Annuler l'édition
  const handleCancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditIcon("");
  };

  // 🗑️ Supprimer une collection
  const handleDeleteCollection = (id) => {
    if (confirm("Voulez-vous vraiment supprimer cette collection ?")) {
      setLocalCollections(localCollections.filter((c) => c.id !== id));
      if (selectedCollection?.id === id) {
        setSelectedCollection(null);
      }
    }
  };

  // 💾 Sauvegarder toutes les modifications
  const handleSaveAll = () => {
    onSave(localCollections);
    onClose();
  };

  // 🎮 Gérer les jeux d'une collection
  const handleManageGames = (collection) => {
    setSelectedCollection(collection);
  };

  // ✅ Toggle un jeu dans la collection sélectionnée
  const handleToggleGame = (gameId) => {
    const updated = localCollections.map((c) => {
      if (c.id === selectedCollection.id) {
        const hasGame = c.gameIds.includes(gameId);
        return {
          ...c,
          gameIds: hasGame ? c.gameIds.filter((id) => id !== gameId) : [...c.gameIds, gameId],
        };
      }
      return c;
    });
    setLocalCollections(updated);
    setSelectedCollection(updated.find((c) => c.id === selectedCollection.id));
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.85)",
        backdropFilter: "blur(12px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
        padding: "20px",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: theme.cardBg,
          borderRadius: "16px",
          border: `2px solid ${theme.border}`,
          boxShadow: `0 0 40px ${theme.shadow}`,
          maxWidth: selectedCollection ? "900px" : "700px",
          width: "100%",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: "24px",
            borderBottom: `1px solid ${theme.border}`,
            background: `linear-gradient(135deg, ${theme.primary}22, ${theme.accent}22)`,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontSize: "24px",
              fontWeight: "bold",
              color: theme.text,
              display: "flex",
              alignItems: "center",
              gap: "12px",
            }}
          >
            📚 Gestion des Collections
            {selectedCollection && (
              <span style={{ fontSize: "18px", opacity: 0.7 }}>
                → {selectedCollection.icon} {selectedCollection.name}
              </span>
            )}
          </h2>
          <p style={{ margin: "8px 0 0 0", fontSize: "14px", color: theme.textSecondary }}>
            {selectedCollection
              ? "Ajoutez ou retirez des jeux de cette collection"
              : "Organisez vos jeux en collections personnalisées"}
          </p>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflow: "auto", padding: "24px" }}>
          {selectedCollection ? (
            /* Mode gestion des jeux */
            <>
              <button
                onClick={() => setSelectedCollection(null)}
                style={{
                  background: theme.cardBg,
                  border: `1px solid ${theme.border}`,
                  borderRadius: "8px",
                  padding: "8px 16px",
                  color: theme.text,
                  cursor: "pointer",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                ← Retour aux collections
              </button>

              <div
                style={{
                  display: "grid",
                  gap: "12px",
                  gridTemplateColumns: "repeat(auto-fill, minmax(250px, 1fr))",
                }}
              >
                {allGames.map((game) => {
                  const isInCollection = selectedCollection.gameIds.includes(game.id);
                  return (
                    <div
                      key={game.id}
                      onClick={() => handleToggleGame(game.id)}
                      style={{
                        background: isInCollection ? `${theme.accent}22` : theme.cardBg,
                        border: `2px solid ${isInCollection ? theme.accent : theme.border}`,
                        borderRadius: "12px",
                        padding: "12px",
                        cursor: "pointer",
                        transition: "all 0.2s",
                        display: "flex",
                        alignItems: "center",
                        gap: "12px",
                      }}
                    >
                      <div
                        style={{
                          width: "24px",
                          height: "24px",
                          borderRadius: "6px",
                          border: `2px solid ${isInCollection ? theme.accent : theme.border}`,
                          background: isInCollection ? theme.accent : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: theme.text,
                          fontWeight: "bold",
                          flexShrink: 0,
                        }}
                      >
                        {isInCollection && "✓"}
                      </div>
                      <div style={{ flex: 1, overflow: "hidden" }}>
                        <div
                          style={{
                            color: theme.text,
                            fontWeight: "500",
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}
                        >
                          {game.name}
                        </div>
                        <div
                          style={{
                            fontSize: "12px",
                            color: theme.textSecondary,
                            marginTop: "2px",
                          }}
                        >
                          {game.category}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          ) : (
            /* Mode liste des collections */
            <>
              {/* Créer une nouvelle collection */}
              <div
                style={{
                  background: `${theme.primary}11`,
                  border: `2px dashed ${theme.primary}`,
                  borderRadius: "12px",
                  padding: "20px",
                  marginBottom: "24px",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 16px 0",
                    color: theme.text,
                    fontSize: "18px",
                  }}
                >
                  ➕ Nouvelle Collection
                </h3>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <select
                    value={newCollectionIcon}
                    onChange={(e) => setNewCollectionIcon(e.target.value)}
                    style={{
                      background: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      padding: "10px",
                      color: theme.text,
                      fontSize: "18px",
                      cursor: "pointer",
                      width: "60px",
                    }}
                  >
                    {availableIcons.map((icon) => (
                      <option key={icon} value={icon}>
                        {icon}
                      </option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                    onKeyPress={(e) => e.key === "Enter" && handleCreateCollection()}
                    placeholder="Nom de la collection..."
                    style={{
                      flex: 1,
                      minWidth: "200px",
                      background: theme.cardBg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "8px",
                      padding: "10px 16px",
                      color: theme.text,
                      fontSize: "14px",
                    }}
                  />
                  <button
                    onClick={handleCreateCollection}
                    disabled={!newCollectionName.trim()}
                    style={{
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                      border: "none",
                      borderRadius: "8px",
                      padding: "10px 24px",
                      color: theme.text,
                      fontWeight: "600",
                      cursor: newCollectionName.trim() ? "pointer" : "not-allowed",
                      opacity: newCollectionName.trim() ? 1 : 0.5,
                    }}
                  >
                    Créer
                  </button>
                </div>
              </div>

              {/* Liste des collections */}
              {localCollections.length === 0 ? (
                <div
                  style={{
                    textAlign: "center",
                    padding: "40px",
                    color: theme.textSecondary,
                  }}
                >
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📚</div>
                  <div style={{ fontSize: "16px" }}>Aucune collection pour le moment</div>
                  <div style={{ fontSize: "14px", marginTop: "8px", opacity: 0.7 }}>
                    Créez votre première collection ci-dessus !
                  </div>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {localCollections.map((collection) => (
                    <div
                      key={collection.id}
                      style={{
                        background: theme.cardBg,
                        border: `2px solid ${theme.border}`,
                        borderRadius: "12px",
                        padding: "16px",
                        transition: "all 0.2s",
                      }}
                    >
                      {editingId === collection.id ? (
                        /* Mode édition */
                        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                          <select
                            value={editIcon}
                            onChange={(e) => setEditIcon(e.target.value)}
                            style={{
                              background: theme.cardBg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: "8px",
                              padding: "8px",
                              color: theme.text,
                              fontSize: "18px",
                              cursor: "pointer",
                            }}
                          >
                            {availableIcons.map((icon) => (
                              <option key={icon} value={icon}>
                                {icon}
                              </option>
                            ))}
                          </select>
                          <input
                            type="text"
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            onKeyPress={(e) => e.key === "Enter" && handleSaveEdit()}
                            style={{
                              flex: 1,
                              background: theme.cardBg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: "8px",
                              padding: "8px 12px",
                              color: theme.text,
                              fontSize: "14px",
                            }}
                          />
                          <button
                            onClick={handleSaveEdit}
                            style={{
                              background: theme.accent,
                              border: "none",
                              borderRadius: "8px",
                              padding: "8px 16px",
                              color: theme.text,
                              cursor: "pointer",
                            }}
                          >
                            ✓
                          </button>
                          <button
                            onClick={handleCancelEdit}
                            style={{
                              background: theme.cardBg,
                              border: `1px solid ${theme.border}`,
                              borderRadius: "8px",
                              padding: "8px 16px",
                              color: theme.text,
                              cursor: "pointer",
                            }}
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        /* Mode affichage */
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <span style={{ fontSize: "24px" }}>{collection.icon}</span>
                            <div>
                              <div
                                style={{
                                  color: theme.text,
                                  fontWeight: "600",
                                  fontSize: "16px",
                                }}
                              >
                                {collection.name}
                              </div>
                              <div
                                style={{
                                  fontSize: "13px",
                                  color: theme.textSecondary,
                                  marginTop: "2px",
                                }}
                              >
                                {collection.gameIds.length} jeu
                                {collection.gameIds.length !== 1 ? "x" : ""}
                              </div>
                            </div>
                          </div>
                          <div style={{ display: "flex", gap: "8px" }}>
                            <button
                              onClick={() => handleManageGames(collection)}
                              style={{
                                background: `${theme.accent}22`,
                                border: `1px solid ${theme.accent}`,
                                borderRadius: "8px",
                                padding: "8px 16px",
                                color: theme.accent,
                                cursor: "pointer",
                                fontWeight: "500",
                              }}
                            >
                              🎮 Gérer les jeux
                            </button>
                            <button
                              onClick={() => handleStartEdit(collection)}
                              style={{
                                background: theme.cardBg,
                                border: `1px solid ${theme.border}`,
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: theme.text,
                                cursor: "pointer",
                              }}
                            >
                              ✏️
                            </button>
                            <button
                              onClick={() => handleDeleteCollection(collection.id)}
                              style={{
                                background: theme.cardBg,
                                border: `1px solid ${theme.border}`,
                                borderRadius: "8px",
                                padding: "8px 12px",
                                color: "#ff4444",
                                cursor: "pointer",
                              }}
                            >
                              🗑️
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        {!selectedCollection && (
          <div
            style={{
              padding: "20px 24px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              justifyContent: "flex-end",
              gap: "12px",
            }}
          >
            <button
              onClick={onClose}
              style={{
                background: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                padding: "10px 24px",
                color: theme.text,
                cursor: "pointer",
                fontWeight: "500",
              }}
            >
              Annuler
            </button>
            <button
              onClick={handleSaveAll}
              style={{
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})`,
                border: "none",
                borderRadius: "8px",
                padding: "10px 24px",
                color: theme.text,
                cursor: "pointer",
                fontWeight: "600",
              }}
            >
              💾 Sauvegarder
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CollectionsManager;
