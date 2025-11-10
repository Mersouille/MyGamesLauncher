import { useState, useEffect, useCallback, useRef } from "react";

// État global pour éviter les conflits entre multiples instances
let globalGamepadIndex = null;
let globalLastButtonState = {};
let globalListeners = [];
let globalAnimationFrameId = null;
let globalButtonConsumed = {}; // 🎮 Marquer les boutons consommés ce frame
let globalGamepadConnected = false; // 🎮 État global de connexion partagé
let globalSetters = []; // 🎮 Liste des setters pour notifier tous les composants
let globalListenerIdCounter = 0; // 🎮 Compteur pour générer des IDs uniques

/**
 * Hook personnalisé pour gérer les manettes de jeu via l'API Gamepad
 * Compatible avec Xbox, PlayStation, manettes génériques
 * Utilise une boucle globale unique pour éviter les conflits
 */
export function useGamepad() {
  const [gamepadConnected, setGamepadConnected] = useState(globalGamepadConnected);
  const listenerId = useRef(`listener-${++globalListenerIdCounter}`);
  const lastAxisTime = useRef({ horizontal: 0, vertical: 0 });
  const axisDeadzone = 0.3; // Zone morte pour éviter les drifts
  const axisRepeatDelay = 200; // Délai entre les répétitions (ms)

  // Synchroniser avec l'état global au montage
  useEffect(() => {
    // Forcer la synchronisation avec l'état global
    if (globalGamepadConnected !== gamepadConnected) {
      setGamepadConnected(globalGamepadConnected);
    }

    // Enregistrer le setter de ce composant dans la liste globale
    globalSetters.push(setGamepadConnected);

    return () => {
      globalSetters = globalSetters.filter((s) => s !== setGamepadConnected);
    };
  }, []);

  // Détection de connexion/déconnexion (une seule fois globalement)
  useEffect(() => {
    const handleGamepadConnected = (e) => {
      console.log("🎮 Manette connectée:", e.gamepad.id);
      globalGamepadIndex = e.gamepad.index;
      globalGamepadConnected = true;
      // Notifier TOUS les composants
      globalSetters.forEach((setter) => setter(true));
      startGlobalGameLoop();
    };

    const handleGamepadDisconnected = (e) => {
      console.log("🎮 Manette déconnectée:", e.gamepad.id);
      globalGamepadIndex = null;
      globalGamepadConnected = false;
      // Notifier TOUS les composants
      globalSetters.forEach((setter) => setter(false));
      stopGlobalGameLoop();
    };

    window.addEventListener("gamepadconnected", handleGamepadConnected);
    window.addEventListener("gamepaddisconnected", handleGamepadDisconnected);

    // Vérifier si une manette est déjà connectée
    const gamepads = navigator.getGamepads();
    for (let i = 0; i < gamepads.length; i++) {
      if (gamepads[i]) {
        globalGamepadIndex = i;
        globalGamepadConnected = true;
        setGamepadConnected(true);
        // NOTIFIER aussi les autres composants qui sont peut-être déjà montés
        globalSetters.forEach((setter) => {
          if (setter !== setGamepadConnected) {
            setter(true);
          }
        });
        startGlobalGameLoop();
        break;
      }
    }

    return () => {
      window.removeEventListener("gamepadconnected", handleGamepadConnected);
      window.removeEventListener("gamepaddisconnected", handleGamepadDisconnected);
      // Ne pas arrêter la boucle ici car d'autres composants peuvent l'utiliser
    };
  }, []);

  /**
   * Enregistrer un listener pour ce composant
   * @param {Object} callbacks - Les callbacks à appeler pour chaque bouton
   * @param {number} priority - Priorité du listener (plus élevé = prioritaire). Default: 0
   */
  const registerListener = useCallback((callbacks, priority = 0) => {
    const listener = {
      id: listenerId.current,
      callbacks,
      priority,
      lastAxisTime: { horizontal: 0, vertical: 0 },
    };

    // Retirer l'ancien listener s'il existe
    globalListeners = globalListeners.filter((l) => l.id !== listenerId.current);
    // Ajouter le nouveau et trier par priorité (plus haute priorité en premier)
    globalListeners.push(listener);
    globalListeners.sort((a, b) => b.priority - a.priority);

    // 🎮 Redémarrer la boucle si elle est arrêtée et qu'une manette est connectée
    if (globalGamepadConnected && globalAnimationFrameId === null) {
      startGlobalGameLoop();
    }

    // Retourner la fonction de nettoyage
    return () => {
      globalListeners = globalListeners.filter((l) => l.id !== listenerId.current);
      // ⚠️ NE PLUS arrêter la boucle quand il n'y a plus de listeners
      // La boucle doit tourner tant qu'une manette est connectée
      // Cela évite les problèmes de timing lors des transitions entre pages
    };
  }, []);

  return {
    gamepadConnected,
    registerListener,
  };
}

/**
 * Mapping des boutons (compatible Xbox et PlayStation)
 */
const buttons = {
  A: 0,
  B: 1,
  X: 2,
  Y: 3,
  LB: 4,
  RB: 5,
  LT: 6,
  RT: 7,
  SELECT: 8,
  START: 9,
  L3: 10,
  R3: 11,
  DPAD_UP: 12,
  DPAD_DOWN: 13,
  DPAD_LEFT: 14,
  DPAD_RIGHT: 15,
};

const axisDeadzone = 0.3;
const axisRepeatDelay = 200;

/**
 * Boucle globale qui poll la manette et notifie tous les listeners
 */
let gameLoopIterations = 0; // Compteur de debug

function startGlobalGameLoop() {
  if (globalAnimationFrameId !== null) {
    console.log("⚠️ [startGlobalGameLoop] Boucle DÉJÀ active!");
    return;
  }

  console.log("✅ [startGlobalGameLoop] DÉMARRAGE de la boucle");
  gameLoopIterations = 0;

  const gameLoop = () => {
    try {
      gameLoopIterations++;
      // Log périodique pour debug du plantage
      if (gameLoopIterations % 180 === 0) {
        console.log(
          `🔄 [gameLoop] ${gameLoopIterations} itérations, ${globalListeners.length} listeners actifs`
        );
      }

      if (globalGamepadIndex === null) {
        console.log("❌ [gameLoop] gamepadIndex null, arrêt...");
        stopGlobalGameLoop();
        return;
      }

      const gamepads = navigator.getGamepads();

      // ✅ FILTRE : Ignorer le casque Jabra, chercher la vraie manette Xbox
      let gamepad = null;
      for (let i = 0; i < gamepads.length; i++) {
        if (
          gamepads[i] &&
          gamepads[i].id &&
          !gamepads[i].id.includes("Jabra") &&
          !gamepads[i].id.includes("Evolve")
        ) {
          gamepad = gamepads[i];
          globalGamepadIndex = i; // Mettre à jour l'index pour la prochaine itération
          break;
        }
      }

      if (!gamepad) {
        console.log("❌ [gameLoop] Manette Xbox perdue (seul Jabra détecté), arrêt...");
        stopGlobalGameLoop();
        return;
      }

      // Log périodique pour debug: vérifier l'état de la manette
      if (gameLoopIterations % 180 === 0) {
        console.log(
          `🎮 [gameLoop] Manette présente: ${gamepad.id}, ${gamepad.buttons.length} boutons, connected: ${gamepad.connected}`
        );
      }

      // Mettre à jour l'état des boutons
      const currentButtonState = {};
      let anyButtonPressed = false;
      gamepad.buttons.forEach((button, index) => {
        currentButtonState[index] = button.pressed;
        if (button.pressed) anyButtonPressed = true;
        // Debug: Logger TOUS les boutons qui changent d'état
        const wasPressed = globalLastButtonState[index] || false;
        if (button.pressed && !wasPressed) {
          console.log(`🔵 [gameLoop] Bouton INDEX ${index} PRESSÉ (transition OFF→ON)`);
        } else if (!button.pressed && wasPressed) {
          console.log(`⚪ [gameLoop] Bouton INDEX ${index} RELÂCHÉ (transition ON→OFF)`);
        }
      });

      // Log périodique: afficher si AU MOINS un bouton est pressé
      if (gameLoopIterations % 180 === 0 && anyButtonPressed) {
        console.log(`⚠️ [gameLoop] AU MOINS UN BOUTON EST PRESSÉ!`);
      }

      // Réinitialiser les boutons consommés à chaque frame
      globalButtonConsumed = {};

      // Notifier tous les listeners (par ordre de priorité - déjà triés)
      globalListeners.forEach((listener) => {
        const { callbacks } = listener;

        // Boutons avec edge detection
        Object.entries(buttons).forEach(([name, index]) => {
          const isPressed = currentButtonState[index];
          const wasPressed = globalLastButtonState[index] || false;

          if (isPressed && !wasPressed) {
            // Transition OFF -> ON
            const callbackName = `on${name}`;

            // 🎮 Vérifier si le bouton n'a pas déjà été consommé ce frame
            if (!globalButtonConsumed[name] && callbacks[callbackName]) {
              try {
                console.log(
                  `🎯 [gameLoop] Appel ${callbackName} (listener ${listener.id}, priorité ${listener.priority})`
                );
                callbacks[callbackName]();
                // Marquer comme consommé pour empêcher les autres listeners de réagir
                globalButtonConsumed[name] = true;
                console.log(`✅ [gameLoop] ${callbackName} terminé avec succès`);
              } catch (error) {
                console.error(`❌ Erreur dans callback ${callbackName}:`, error);
              }
            }
          }
        }); // Axes (stick gauche)
        const now = Date.now();
        const horizontal = gamepad.axes[0] || 0;
        const vertical = gamepad.axes[1] || 0;

        if (Math.abs(horizontal) > axisDeadzone) {
          if (now - listener.lastAxisTime.horizontal > axisRepeatDelay) {
            const direction = horizontal > 0 ? 1 : -1;
            if (callbacks.onHorizontal) {
              try {
                callbacks.onHorizontal(direction);
              } catch (error) {
                console.error("❌ Erreur dans onHorizontal:", error);
              }
            }
            listener.lastAxisTime.horizontal = now;
          }
        } else {
          listener.lastAxisTime.horizontal = 0;
        }

        if (Math.abs(vertical) > axisDeadzone) {
          if (now - listener.lastAxisTime.vertical > axisRepeatDelay) {
            const direction = vertical > 0 ? 1 : -1;
            if (callbacks.onVertical) {
              try {
                callbacks.onVertical(direction);
              } catch (error) {
                console.error("❌ Erreur dans onVertical:", error);
              }
            }
            listener.lastAxisTime.vertical = now;
          }
        } else {
          listener.lastAxisTime.vertical = 0;
        }
      });

      // Sauvegarder l'état pour la prochaine frame
      globalLastButtonState = currentButtonState;

      globalAnimationFrameId = requestAnimationFrame(gameLoop);
    } catch (error) {
      console.error("❌ Erreur critique dans la boucle gamepad:", error);
      // Continuer la boucle même en cas d'erreur
      globalAnimationFrameId = requestAnimationFrame(gameLoop);
    }
  };

  gameLoop();
}

function stopGlobalGameLoop() {
  if (globalAnimationFrameId !== null) {
    console.log("🎮 [Global] Arrêt de la boucle gamepad globale");
    cancelAnimationFrame(globalAnimationFrameId);
    globalAnimationFrameId = null;
  }
}
