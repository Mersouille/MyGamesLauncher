// src/components/Controllers/ControllerProfilesManager.jsx
import React, { useState, useEffect, useRef } from "react";
import { getTheme } from "../../data/themes";
import { useGamepad } from "../../hooks/useGamepad";

/**
 * ControllerProfilesManager - Gestionnaire de profils de contrôleurs
 * Permet de créer, éditer et supprimer des profils de mapping de boutons
 * et d'assigner ces profils aux jeux
 */
const ControllerProfilesManager = ({
  profiles = [],
  onSave,
  onClose,
  currentTheme = "dark",
  games = [],
}) => {
  const theme = getTheme(currentTheme);
  const [localProfiles, setLocalProfiles] = useState(profiles);
  const [editingProfile, setEditingProfile] = useState(null);
  const [isCreating, setIsCreating] = useState(false);
  const [selectedGame, setSelectedGame] = useState(null);
  const [connectedControllers, setConnectedControllers] = useState([]);
  const [listeningForButton, setListeningForButton] = useState(null);
  const { gamepadConnected, registerListener } = useGamepad();

  // Ref pour éviter de réenregistrer le listener
  const onCloseRef = React.useRef(onClose);
  onCloseRef.current = onClose; // Mise à jour directe pendant le render

  // 🎮 Écoute du bouton B pour fermer
  useEffect(() => {
    if (!gamepadConnected) return;

    console.log(
      "🎮 [ControllerProfilesManager] Enregistrement du listener pour bouton B (priorité: 100)"
    );

    const unregister = registerListener(
      {
        onB: () => {
          console.log("🎮 [ControllerProfilesManager] Bouton B pressé - fermeture");
          if (onCloseRef.current) {
            onCloseRef.current();
          }
        },
      },
      100
    ); // Priorité 100 (haute) pour fermer le modal

    return unregister;
  }, [gamepadConnected, registerListener]);

  // Détecter les contrôleurs connectés
  useEffect(() => {
    const checkControllers = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : [];
      const connected = Array.from(gamepads).filter((gp) => gp !== null);

      console.log("🎮 [Controller] Vérification des contrôleurs:", {
        total: gamepads.length,
        connected: connected.length,
        ids: connected.map((gp) => gp.id),
      });

      setConnectedControllers(connected);
    };

    console.log("🎮 [Controller] Initialisation de la détection");
    checkControllers();
    const interval = setInterval(checkControllers, 1000);

    const onConnect = (e) => {
      console.log("🎮 [Controller] Contrôleur connecté:", e.gamepad.id);
      checkControllers();
    };

    const onDisconnect = (e) => {
      console.log("🎮 [Controller] Contrôleur déconnecté:", e.gamepad.id);
      checkControllers();
    };

    window.addEventListener("gamepadconnected", onConnect);
    window.addEventListener("gamepaddisconnected", onDisconnect);

    return () => {
      clearInterval(interval);
      window.removeEventListener("gamepadconnected", onConnect);
      window.removeEventListener("gamepaddisconnected", onDisconnect);
    };
  }, []);

  // Liste des boutons standards d'une manette
  const standardButtons = [
    { id: "button_a", label: "A / Cross", icon: "🅰️" },
    { id: "button_b", label: "B / Circle", icon: "🅱️" },
    { id: "button_x", label: "X / Square", icon: "❌" },
    { id: "button_y", label: "Y / Triangle", icon: "🆈" },
    { id: "lb", label: "LB / L1", icon: "⬅️" },
    { id: "rb", label: "RB / R1", icon: "➡️" },
    { id: "lt", label: "LT / L2", icon: "⬅️⬇️" },
    { id: "rt", label: "RT / R2", icon: "➡️⬇️" },
    { id: "select", label: "Select / Share", icon: "◀️" },
    { id: "start", label: "Start / Options", icon: "▶️" },
    { id: "l3", label: "L3 (Stick gauche)", icon: "🕹️" },
    { id: "r3", label: "R3 (Stick droit)", icon: "🕹️" },
    { id: "dpad_up", label: "D-pad Haut", icon: "⬆️" },
    { id: "dpad_down", label: "D-pad Bas", icon: "⬇️" },
    { id: "dpad_left", label: "D-pad Gauche", icon: "⬅️" },
    { id: "dpad_right", label: "D-pad Droite", icon: "➡️" },
  ];

  const handleCreateProfile = () => {
    setIsCreating(true);
    setEditingProfile({
      id: Date.now(),
      name: "",
      description: "",
      mappings: {},
      assignedGames: [],
    });
  };

  const handleSaveProfile = () => {
    if (!editingProfile.name.trim()) {
      alert("Veuillez donner un nom au profil");
      return;
    }

    let updated;
    if (isCreating) {
      updated = [...localProfiles, editingProfile];
    } else {
      updated = localProfiles.map((p) => (p.id === editingProfile.id ? editingProfile : p));
    }

    setLocalProfiles(updated);
    setEditingProfile(null);
    setIsCreating(false);
  };

  const handleDeleteProfile = (profileId) => {
    if (window.confirm("Supprimer ce profil de contrôleur ?")) {
      setLocalProfiles(localProfiles.filter((p) => p.id !== profileId));
    }
  };

  const handleAssignToGame = (gameId, profileId) => {
    const updated = localProfiles.map((profile) => {
      if (profile.id === profileId) {
        const assignedGames = profile.assignedGames || [];
        if (assignedGames.includes(gameId)) {
          return { ...profile, assignedGames: assignedGames.filter((id) => id !== gameId) };
        } else {
          return { ...profile, assignedGames: [...assignedGames, gameId] };
        }
      }
      return profile;
    });
    setLocalProfiles(updated);
  };

  const handleSaveAll = () => {
    onSave(localProfiles);
    onClose();
  };

  // Écouter les boutons du contrôleur
  useEffect(() => {
    if (!listeningForButton) {
      console.log("🎮 [Controller] Pas d'écoute active");
      return;
    }

    console.log("🎮 [Controller] ⭐ DÉMARRAGE de l'écoute pour:", listeningForButton);

    let isListening = true;
    let checkCount = 0;

    const checkButtons = () => {
      if (!isListening) return;

      checkCount++;
      if (checkCount % 60 === 0) {
        console.log("🎮 [Controller] Vérification #", checkCount, "- toujours en écoute");
      }

      const gamepads = navigator.getGamepads();

      if (checkCount === 1) {
        console.log(
          "🎮 [Controller] Gamepads disponibles:",
          Array.from(gamepads)
            .map((gp, i) => (gp ? `[${i}] ${gp.id}` : null))
            .filter(Boolean)
        );
      }

      // Vérifier TOUS les gamepads disponibles
      for (let i = 0; i < gamepads.length; i++) {
        const gamepad = gamepads[i];
        if (!gamepad) continue;

        // Vérifier tous les boutons
        for (let buttonIndex = 0; buttonIndex < gamepad.buttons.length; buttonIndex++) {
          const button = gamepad.buttons[buttonIndex];
          if (button.pressed) {
            console.log("✅ [Controller] ⭐ BOUTON DÉTECTÉ:", {
              gamepadIndex: i,
              gamepadId: gamepad.id,
              buttonIndex: buttonIndex,
              mappingTo: listeningForButton,
            });

            setEditingProfile((prev) => ({
              ...prev,
              mappings: { ...prev.mappings, [listeningForButton]: buttonIndex },
            }));
            setListeningForButton(null);
            isListening = false;
            return;
          }
        }
      }

      // Continuer à vérifier
      requestAnimationFrame(checkButtons);
    };

    // Démarrer la boucle avec requestAnimationFrame
    requestAnimationFrame(checkButtons);

    return () => {
      console.log("🛑 [Controller] Arrêt de l'écoute après", checkCount, "vérifications");
      isListening = false;
    };
  }, [listeningForButton]);

  // Vue : Liste des profils
  if (!editingProfile && !selectedGame) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
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
            maxWidth: "900px",
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            padding: "24px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div style={{ marginBottom: "24px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "8px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "24px", color: theme.text }}>
                🎮 Profils de Contrôleurs
              </h2>
              <button
                onClick={onClose}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "24px",
                  cursor: "pointer",
                  color: theme.textSecondary,
                }}
              >
                ✕
              </button>
            </div>
            <p style={{ margin: 0, color: theme.textSecondary, fontSize: "14px" }}>
              Créez des profils de mapping de boutons pour vos différents contrôleurs
            </p>
          </div>

          {/* État des contrôleurs */}
          <div
            style={{
              background: theme.bg,
              padding: "16px",
              borderRadius: "12px",
              marginBottom: "20px",
              border: `1px solid ${theme.border}`,
            }}
          >
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: theme.text,
                marginBottom: "8px",
              }}
            >
              📡 Contrôleurs détectés : {connectedControllers.length}
            </div>
            {connectedControllers.length === 0 ? (
              <div style={{ fontSize: "13px", color: theme.textSecondary }}>
                Aucun contrôleur connecté. Branchez un contrôleur pour le configurer.
              </div>
            ) : (
              connectedControllers.map((controller, idx) => (
                <div key={idx} style={{ fontSize: "13px", color: theme.accent, marginTop: "4px" }}>
                  ✓ {controller.id}
                </div>
              ))
            )}
          </div>

          {/* Bouton créer un profil */}
          <button
            onClick={handleCreateProfile}
            style={{
              background: theme.accent,
              color: "white",
              border: "none",
              padding: "12px 24px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginBottom: "20px",
              width: "100%",
            }}
          >
            ➕ Créer un nouveau profil
          </button>

          {/* Liste des profils */}
          {localProfiles.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "40px 20px",
                color: theme.textSecondary,
              }}
            >
              Aucun profil de contrôleur. Créez-en un pour commencer !
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {localProfiles.map((profile) => {
                const assignedCount = profile.assignedGames?.length || 0;
                const mappingCount = Object.keys(profile.mappings || {}).length;

                return (
                  <div
                    key={profile.id}
                    style={{
                      background: theme.bg,
                      border: `1px solid ${theme.border}`,
                      borderRadius: "12px",
                      padding: "16px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <div
                        style={{
                          fontSize: "16px",
                          fontWeight: "600",
                          color: theme.text,
                          marginBottom: "4px",
                        }}
                      >
                        {profile.name}
                      </div>
                      {profile.description && (
                        <div
                          style={{
                            fontSize: "13px",
                            color: theme.textSecondary,
                            marginBottom: "8px",
                          }}
                        >
                          {profile.description}
                        </div>
                      )}
                      <div
                        style={{
                          display: "flex",
                          gap: "12px",
                          fontSize: "12px",
                          color: theme.textSecondary,
                        }}
                      >
                        <span>🎯 {mappingCount} boutons mappés</span>
                        <span>
                          🎮 {assignedCount} jeu{assignedCount > 1 ? "x" : ""} assigné
                          {assignedCount > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => setEditingProfile(profile)}
                        style={{
                          background: theme.accent,
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        ✏️ Éditer
                      </button>
                      <button
                        onClick={() => setSelectedGame(profile.id)}
                        style={{
                          background: theme.primary,
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        🎮 Assigner
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile.id)}
                        style={{
                          background: "#ef4444",
                          color: "white",
                          border: "none",
                          padding: "8px 16px",
                          borderRadius: "6px",
                          fontSize: "13px",
                          cursor: "pointer",
                        }}
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Footer */}
          <div
            style={{
              marginTop: "24px",
              paddingTop: "16px",
              borderTop: `1px solid ${theme.border}`,
              display: "flex",
              gap: "12px",
            }}
          >
            <button
              onClick={handleSaveAll}
              style={{
                flex: 1,
                background: theme.accent,
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={onClose}
              style={{
                flex: 1,
                background: theme.border,
                color: theme.text,
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue : Édition d'un profil
  if (editingProfile) {
    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={() => {
          setEditingProfile(null);
          setIsCreating(false);
        }}
      >
        <div
          style={{
            background: theme.cardBg,
            borderRadius: "16px",
            border: `2px solid ${theme.border}`,
            maxWidth: "700px",
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            padding: "24px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", color: theme.text }}>
            {isCreating ? "➕ Nouveau profil" : "✏️ Éditer le profil"}
          </h2>

          {/* Nom du profil */}
          <div style={{ marginBottom: "16px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: theme.textSecondary,
                marginBottom: "6px",
              }}
            >
              Nom du profil *
            </label>
            <input
              type="text"
              value={editingProfile.name}
              onChange={(e) => setEditingProfile({ ...editingProfile, name: e.target.value })}
              placeholder="Ex: Xbox Elite, PlayStation 5, Pro Controller..."
              style={{
                width: "100%",
                padding: "10px",
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                color: theme.text,
                fontSize: "14px",
              }}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontSize: "13px",
                color: theme.textSecondary,
                marginBottom: "6px",
              }}
            >
              Description (optionnel)
            </label>
            <input
              type="text"
              value={editingProfile.description}
              onChange={(e) =>
                setEditingProfile({ ...editingProfile, description: e.target.value })
              }
              placeholder="Ex: Configuration optimale pour les jeux de combat"
              style={{
                width: "100%",
                padding: "10px",
                background: theme.bg,
                border: `1px solid ${theme.border}`,
                borderRadius: "8px",
                color: theme.text,
                fontSize: "14px",
              }}
            />
          </div>

          {/* Status contrôleur */}
          {connectedControllers.length === 0 && (
            <div
              style={{
                background: "#ef444422",
                border: "1px solid #ef4444",
                padding: "12px",
                borderRadius: "8px",
                marginBottom: "20px",
                fontSize: "13px",
                color: "#ef4444",
              }}
            >
              ⚠️ Branchez un contrôleur pour configurer les mappings
            </div>
          )}

          {/* Mappings des boutons */}
          <div style={{ marginBottom: "20px" }}>
            <div
              style={{
                fontSize: "14px",
                fontWeight: "600",
                color: theme.text,
                marginBottom: "12px",
              }}
            >
              🎯 Mapping des boutons
            </div>
            <div style={{ fontSize: "12px", color: theme.textSecondary, marginBottom: "12px" }}>
              Cliquez sur "Mapper" puis appuyez sur le bouton de votre contrôleur
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: "8px",
              }}
            >
              {standardButtons.map((button) => {
                const mapped = editingProfile.mappings?.[button.id];
                const isListening = listeningForButton === button.id;

                return (
                  <div
                    key={button.id}
                    style={{
                      background: theme.bg,
                      border: `1px solid ${isListening ? theme.accent : theme.border}`,
                      borderRadius: "8px",
                      padding: "10px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <div style={{ fontSize: "12px", color: theme.text }}>
                      <div>
                        {button.icon} {button.label}
                      </div>
                      {mapped !== undefined && (
                        <div style={{ fontSize: "10px", color: theme.accent, marginTop: "2px" }}>
                          → Bouton {mapped}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        console.log("🎮 [Controller] Clic sur Mapper pour:", button.id);
                        setListeningForButton(button.id);
                      }}
                      disabled={connectedControllers.length === 0}
                      style={{
                        background: isListening ? theme.accent : theme.primary,
                        color: "white",
                        border: "none",
                        padding: "4px 8px",
                        borderRadius: "4px",
                        fontSize: "10px",
                        cursor: connectedControllers.length === 0 ? "not-allowed" : "pointer",
                        opacity: connectedControllers.length === 0 ? 0.5 : 1,
                      }}
                    >
                      {isListening ? "..." : mapped !== undefined ? "✓" : "Mapper"}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Boutons */}
          <div style={{ display: "flex", gap: "12px", marginTop: "20px" }}>
            <button
              onClick={handleSaveProfile}
              style={{
                flex: 1,
                background: theme.accent,
                color: "white",
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              💾 Sauvegarder
            </button>
            <button
              onClick={() => {
                setEditingProfile(null);
                setIsCreating(false);
              }}
              style={{
                flex: 1,
                background: theme.border,
                color: theme.text,
                border: "none",
                padding: "12px",
                borderRadius: "8px",
                fontSize: "14px",
                fontWeight: "600",
                cursor: "pointer",
              }}
            >
              Annuler
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Vue : Assigner aux jeux
  if (selectedGame) {
    const profile = localProfiles.find((p) => p.id === selectedGame);

    return (
      <div
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(8px)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 9999,
          padding: "20px",
        }}
        onClick={() => setSelectedGame(null)}
      >
        <div
          style={{
            background: theme.cardBg,
            borderRadius: "16px",
            border: `2px solid ${theme.border}`,
            maxWidth: "700px",
            width: "100%",
            maxHeight: "80vh",
            overflow: "auto",
            padding: "24px",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <h2 style={{ margin: "0 0 20px 0", fontSize: "20px", color: theme.text }}>
            🎮 Assigner le profil : {profile?.name}
          </h2>

          <div style={{ marginBottom: "16px", fontSize: "13px", color: theme.textSecondary }}>
            Cochez les jeux qui utiliseront ce profil de contrôleur
          </div>

          {/* Liste des jeux */}
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            {games.map((game) => {
              const isAssigned = profile?.assignedGames?.includes(game.id);

              return (
                <div
                  key={game.id}
                  onClick={() => handleAssignToGame(game.id, profile.id)}
                  style={{
                    background: isAssigned ? `${theme.accent}22` : theme.bg,
                    border: `1px solid ${isAssigned ? theme.accent : theme.border}`,
                    borderRadius: "8px",
                    padding: "12px",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "12px",
                    cursor: "pointer",
                    transition: "all 0.2s",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={isAssigned}
                    onChange={() => {}}
                    style={{ cursor: "pointer" }}
                  />
                  <div style={{ fontSize: "14px", color: theme.text }}>{game.name}</div>
                </div>
              );
            })}
          </div>

          {/* Bouton fermer */}
          <button
            onClick={() => setSelectedGame(null)}
            style={{
              width: "100%",
              background: theme.accent,
              color: "white",
              border: "none",
              padding: "12px",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "20px",
            }}
          >
            ✓ Terminé
          </button>
        </div>
      </div>
    );
  }

  return null;
};

export default ControllerProfilesManager;
