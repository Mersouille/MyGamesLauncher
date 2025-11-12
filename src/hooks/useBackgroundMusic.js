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
  const tracks = [
    { id: "track1", name: "Ambiance 1", file: "./music/track1.mp3" },
    { id: "track2", name: "Ambiance 2", file: "./music/track2.mp3" },
    { id: "track3", name: "Ambiance 3", file: "./music/track3.mp3" },
    { id: "track4", name: "Ambiance 4", file: "./music/track4.mp3" },
  ];

  // Fonction pour obtenir une piste aléatoire
  const getRandomTrack = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * tracks.length);
    return tracks[randomIndex].id;
  }, []);

  // État initial : piste aléatoire si pas définie
  const [currentTrack, setCurrentTrack] = useState(() => {
    return settings.currentTrack || getRandomTrack();
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

  // Charger la piste actuelle quand elle change (évite l'erreur play() interrompu)
  useEffect(() => {
    if (!audioRef.current || !currentTrack) return;

    const track = tracks.find((t) => t.id === currentTrack) || tracks[0];
    const wasPlaying = !audioRef.current.paused || settings.musicEnabled;

    const loadTrack = () => {
      isLoadingRef.current = true;
      try {
        // Arrêter et remplacer la source proprement
        audioRef.current.pause();
        audioRef.current.src = track.file;
        audioRef.current.load();

        const onCanPlay = () => {
          audioRef.current.removeEventListener("canplay", onCanPlay);
          if (wasPlaying) {
            audioRef.current
              .play()
              .then(() => setIsPlaying(true))
              .catch((err) => console.warn("⚠️ Lecture auto échouée:", err))
              .finally(() => (isLoadingRef.current = false));
          } else {
            isLoadingRef.current = false;
          }
        };
        audioRef.current.addEventListener("canplay", onCanPlay, { once: true });
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
  }, [currentTrack, settings.musicEnabled, tracks]);

  // Gérer l'activation/désactivation de la musique
  useEffect(() => {
    if (!audioRef.current || isLoadingRef.current) return; // ⏭️ Skip si déjà en chargement

    if (settings.musicEnabled && audioRef.current.paused) {
      audioRef.current.play().catch((err) => {
        console.warn("⚠️ Impossible de lancer la musique automatiquement:", err);
      });
      setIsPlaying(true);
    } else if (!settings.musicEnabled && !audioRef.current.paused) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [settings.musicEnabled]);

  // Jouer
  const play = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.play().catch((err) => {
        console.error("❌ Erreur lecture musique:", err);
      });
      setIsPlaying(true);
      if (onSettingsChange) {
        onSettingsChange({ ...settings, musicEnabled: true });
      }
    }
  }, [settings, onSettingsChange]);

  // Pause
  const pause = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
      if (onSettingsChange) {
        onSettingsChange({ ...settings, musicEnabled: false });
      }
    }
  }, [settings, onSettingsChange]);

  // Stop (pause + retour au début)
  const stop = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
      if (onSettingsChange) {
        onSettingsChange({ ...settings, musicEnabled: false });
      }
    }
  }, [settings, onSettingsChange]);

  // Changer de piste
  const changeTrack = useCallback(
    (trackId) => {
      // Ne pas toucher directement à l'élément audio ici
      setCurrentTrack(trackId);
      if (onSettingsChange) {
        onSettingsChange({ ...settings, currentTrack: trackId });
      }
    },
    [settings, onSettingsChange]
  );

  // Piste suivante
  const nextTrack = useCallback(() => {
    const currentIndex = tracks.findIndex((t) => t.id === currentTrack);
    const nextIndex = (currentIndex + 1) % tracks.length;
    changeTrack(tracks[nextIndex].id);
  }, [currentTrack, changeTrack]);

  // Changer le volume
  const changeVolume = useCallback(
    (volume) => {
      if (audioRef.current) {
        audioRef.current.volume = Math.max(0, Math.min(1, volume));
        if (onSettingsChange) {
          onSettingsChange({ ...settings, musicVolume: volume });
        }
      }
    },
    [settings, onSettingsChange]
  );

  return {
    play,
    pause,
    stop,
    nextTrack,
    changeTrack,
    changeVolume,
    currentTrack,
    isPlaying,
    tracks,
  };
}
