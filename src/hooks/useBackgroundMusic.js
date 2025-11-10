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
  const [currentTrack, setCurrentTrack] = useState(settings.currentTrack || "track1");

  // Liste des pistes disponibles (à placer dans public/music/)
  const tracks = [
    { id: "track1", name: "Ambiance 1", file: "music/track1.mp3" },
    { id: "track2", name: "Ambiance 2", file: "music/track2.mp3" },
    { id: "track3", name: "Ambiance 3", file: "music/track3.mp3" },
  ];

  // Initialiser l'audio au montage
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.loop = true;
      audioRef.current.volume = settings.musicVolume || 0.3;

      // Événement de fin de piste (si pas en loop)
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });
    }

    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, []);

  // Charger et démarrer la musique si activée dans les settings
  useEffect(() => {
    if (settings.musicEnabled && audioRef.current) {
      const track = tracks.find((t) => t.id === currentTrack) || tracks[0];
      audioRef.current.src = track.file;
      audioRef.current.play().catch((err) => {
        console.warn("⚠️ Impossible de lancer la musique automatiquement:", err);
      });
      setIsPlaying(true);
    } else if (!settings.musicEnabled && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [settings.musicEnabled, currentTrack]);

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
      const track = tracks.find((t) => t.id === trackId);
      if (track && audioRef.current) {
        setCurrentTrack(trackId);
        audioRef.current.src = track.file;
        if (isPlaying) {
          audioRef.current.play();
        }
        if (onSettingsChange) {
          onSettingsChange({ ...settings, currentTrack: trackId });
        }
      }
    },
    [isPlaying, settings, onSettingsChange]
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
