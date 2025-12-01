import { useState, useEffect, useRef, useCallback } from "react";

/**
 * Hook pour gérer la musique d'ambiance de l'application
 * @param {object} settings - Les paramètres utilisateur (contient musicEnabled, currentTrack, volume)
 * @param {function} onSettingsChange - Callback pour sauvegarder les changements de settings
 * @returns {object} - { play, pause, stop, nextTrack, changeVolume, currentTrack, isPlaying }
 */
export function useBackgroundMusic(settings = {}, onSettingsChange) {
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const isLoadingRef = useRef(false); // 🔒 Flag pour éviter les doubles play()

  // Liste des pistes disponibles (à placer dans public/music/)
  const tracks = useRef([
    { id: "track1", name: "Ambiance 1", file: "./music/track1.mp3" },
    { id: "track2", name: "Ambiance 2", file: "./music/track2.mp3" },
    { id: "track3", name: "Ambiance 3", file: "./music/track3.mp3" },
    { id: "track4", name: "Ambiance 4", file: "./music/track4.mp3" },
  ]).current;

  // Fonction pour obtenir une piste aléatoire
  const getRandomTrack = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    return tracks[randomIndex].id;
  }, [tracks]);

  // État initial : piste aléatoire si pas définie (ne s'exécute qu'une fois)
  const [currentTrack, setCurrentTrack] = useState(() => {
    return (
      settings.currentTrack ||
      (() => {
        const randomIndex = Math.floor(Math.random() * tracks.length);
        return tracks[randomIndex].id;
      })()
    );
  });

  // Initialiser l'audio au montage
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = false; // Désactiver loop pour changement auto
      audioRef.current.volume = settings.musicVolume || 0.15;
    }

    // 🎵 CRITIQUE: Réattacher l'événement ended à chaque changement de piste
    const handleEnded = () => {
      console.log("🎵 Piste terminée, changement automatique...");
      const nextRandomTrack = getRandomTrack();
      setCurrentTrack(nextRandomTrack);
      console.log("🎵 Nouvelle piste:", nextRandomTrack);
    };

    audioRef.current.addEventListener("ended", handleEnded);

    return () => {
      if (audioRef.current) {
        audioRef.current.removeEventListener("ended", handleEnded);
      }
    };
  }, [getRandomTrack, currentTrack]); // ✅ Réattacher quand currentTrack change

  // Charger la piste actuelle UNIQUEMENT quand currentTrack change (pas settings!)
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const track = tracks.find((t) => t.id === currentTrack) || tracks[0];
    const wasPlaying = !audioRef.current.paused;

    const loadTrack = () => {
      isLoadingRef.current = true;
      console.log("🎵 Chargement de la piste:", track.name);

      try {
        // Arrêter proprement sans déclencher une nouvelle lecture immédiate
        audioRef.current.pause();
        // Vider l'ancienne source pour éviter l'interruption race (DOMException)
        audioRef.current.removeAttribute("src");
        audioRef.current.load();

        // Appliquer la nouvelle source puis attendre canplay + petit timeout de stabilisation
        setTimeout(() => {
          audioRef.current.src = track.file;
          audioRef.current.load();

          const onCanPlay = () => {
            audioRef.current.removeEventListener("canplay", onCanPlay);
            // Attendre un micro tick pour éviter le conflit "play() interrupted by load request"
            setTimeout(() => {
              if (wasPlaying) {
                audioRef.current
                  .play()
                  .then(() => setIsPlaying(true))
                  .catch((err) => console.warn("⚠️ Lecture auto échouée:", err))
                  .finally(() => (isLoadingRef.current = false));
              } else {
                isLoadingRef.current = false;
              }
            }, 50); // court délai pour laisser la source se stabiliser
          };
          audioRef.current.addEventListener("canplay", onCanPlay, { once: true });
        }, 30); // délai initial pour s'assurer que l'ancienne lecture est bien stoppée
      } catch (e) {
        console.warn("⚠️ Erreur lors du chargement de la piste:", e);
        isLoadingRef.current = false;
      }
    };

    if (isLoadingRef.current) {
      setTimeout(loadTrack, 120);
    } else {
      loadTrack();
    }
  }, [currentTrack]); // ⚠️ SEULEMENT currentTrack - PAS settings!

  // 🎵 Démarrage automatique au premier chargement si musicEnabled est true
  const hasAutoStartedRef = useRef(false);

  useEffect(() => {
    if (!hasAutoStartedRef.current && settings.musicEnabled && audioRef.current) {
      hasAutoStartedRef.current = true;
      // Attendre un court instant pour que la piste soit chargée
      setTimeout(() => {
        if (audioRef.current && audioRef.current.paused) {
          console.log("🎵 Démarrage automatique de la musique...");
          audioRef.current.play().catch((err) => {
            console.warn("⚠️ Impossible de lancer la musique automatiquement:", err);
          });
          setIsPlaying(true);
        }
      }, 500);
    }
  }, [settings.musicEnabled]);

  // Gérer l'activation/désactivation de la musique (UNIQUEMENT au changement du toggle)
  const musicEnabledRef = useRef(settings.musicEnabled);

  useEffect(() => {
    if (!audioRef.current || isLoadingRef.current) return; // ⏭️ Skip si déjà en chargement

    // Ne déclencher que si le statut a réellement changé
    if (settings.musicEnabled !== musicEnabledRef.current) {
      musicEnabledRef.current = settings.musicEnabled;

      if (settings.musicEnabled && audioRef.current.paused) {
        audioRef.current.play().catch((err) => {
          console.warn("⚠️ Impossible de lancer la musique automatiquement:", err);
        });
        setIsPlaying(true);
      } else if (!settings.musicEnabled && !audioRef.current.paused) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [settings.musicEnabled]);

  // Ref pour avoir toujours les derniers settings sans déclencher de re-renders
  const settingsRef = useRef(settings);
  settingsRef.current = settings;

  const onSettingsChangeRef = useRef(onSettingsChange);
  onSettingsChangeRef.current = onSettingsChange;

  // Jouer
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("❌ Erreur lecture musique:", err);
      });
      setIsPlaying(true);
      if (onSettingsChangeRef.current) {
        onSettingsChangeRef.current({ ...settingsRef.current, musicEnabled: true });
      }
    }
  }, []); // ✅ Pas de dépendances - utilise refs

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onSettingsChangeRef.current) {
        onSettingsChangeRef.current({ ...settingsRef.current, musicEnabled: false });
      }
    }
  }, []); // ✅ Pas de dépendances - utilise refs

  // Stop (pause + retour au début)
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      if (onSettingsChangeRef.current) {
        onSettingsChangeRef.current({ ...settingsRef.current, musicEnabled: false });
      }
    }
  }, []); // ✅ Pas de dépendances - utilise refs

  // Changer de piste
  const changeTrack = useCallback(
    (trackId) => {
      // Ne pas toucher directement à l'élément audio ici
      setCurrentTrack(trackId);
      if (onSettingsChangeRef.current) {
        onSettingsChangeRef.current({ ...settingsRef.current, currentTrack: trackId });
      }
    },
    [] // ✅ Pas de dépendances - utilise refs
  );

  // Piste suivante
  const nextTrack = useCallback(() => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack);
    const nextIndex = (currentIndex + 1) % tracks.length;
    changeTrack(tracks[nextIndex].id);
  }, [currentTrack, changeTrack, tracks]);

  // Changer le volume
  const changeVolume = useCallback(
    (volume) => {
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, volume));
        if (onSettingsChangeRef.current) {
          onSettingsChangeRef.current({ ...settingsRef.current, musicVolume: volume });
        }
      }
    },
    [] // ✅ Pas de dépendances - utilise refs
  );

  // ⏩ Avancer de X secondes
  const forward = useCallback((seconds = 10) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.min(
        audioRef.current.duration,
        audioRef.current.currentTime + seconds
      );
    }
  }, []);

  // ⏪ Reculer de X secondes
  const backward = useCallback((seconds = 10) => {
    if (audioRef.current) {
      audioRef.current.currentTime = Math.max(0, audioRef.current.currentTime - seconds);
    }
  }, []);

  // 📍 Obtenir la position actuelle
  const getCurrentTime = useCallback(() => {
    return audioRef.current ? audioRef.current.currentTime : 0;
  }, []);

  // ⏱️ Obtenir la durée totale
  const getDuration = useCallback(() => {
    return audioRef.current ? audioRef.current.duration : 0;
  }, []);

  return {
    play,
    pause,
    stop,
    nextTrack,
    changeTrack,
    changeVolume,
    forward,
    backward,
    getCurrentTime,
    getDuration,
    currentTrack,
    isPlaying,
    tracks,
  };
}
