import React from "react";

/**
 * Composant de contrôle de la musique d'ambiance
 * Affiche un bouton flottant avec play/pause et un menu pour changer de piste
 */
export default function MusicPlayer({
  isPlaying,
  currentTrack,
  tracks,
  onPlay,
  onPause,
  onChangeTrack,
  onVolumeChange,
  volume = 0.15,
  theme,
}) {
  const [showMenu, setShowMenu] = React.useState(false);

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-end",
        gap: 10,
      }}
    >
      {/* Menu déroulant */}
      {showMenu && (
        <div
          style={{
            background: theme?.cardBg || "rgba(30,30,30,0.95)",
            color: theme?.text || "#fff",
            padding: 12,
            borderRadius: 12,
            boxShadow: `0 8px 24px ${theme?.shadow || "rgba(0,0,0,0.5)"}`,
            minWidth: 200,
            border: `2px solid ${theme?.border || "#444"}`,
          }}
        >
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 8 }}>🎵 Musique</div>
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => {
                onChangeTrack(track.id);
                setShowMenu(false);
              }}
              style={{
                width: "100%",
                padding: "8px 10px",
                margin: "4px 0",
                borderRadius: 8,
                background: currentTrack === track.id ? theme?.primary : "transparent",
                color: currentTrack === track.id ? theme?.text : theme?.textSecondary,
                border: `1px solid ${currentTrack === track.id ? theme?.accent : theme?.border}`,
                fontWeight: currentTrack === track.id ? 700 : 400,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
              onMouseEnter={(e) => {
                if (currentTrack !== track.id) {
                  e.currentTarget.style.background = theme?.cardHoverBg || "rgba(60,60,60,0.8)";
                }
              }}
              onMouseLeave={(e) => {
                if (currentTrack !== track.id) {
                  e.currentTarget.style.background = "transparent";
                }
              }}
            >
              {track.name}
            </button>
          ))}
          <div style={{ marginTop: 10, fontSize: 12, color: theme?.textSecondary }}>🔊 Volume</div>
          <input
            type="range"
            min="0"
            max="100"
            value={volume * 100}
            onChange={(e) => onVolumeChange(parseFloat(e.target.value) / 100)}
            style={{
              width: "100%",
              marginTop: 6,
            }}
          />
        </div>
      )}

      {/* Bouton principal */}
      <button
        onClick={() => setShowMenu(!showMenu)}
        title={isPlaying ? "Musique en cours" : "Musique en pause"}
        style={{
          width: 56,
          height: 56,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${theme?.primary || "#007bff"}, ${
            theme?.accent || "#00d4ff"
          })`,
          color: theme?.text || "#fff",
          fontSize: 24,
          border: "none",
          boxShadow: `0 6px 20px ${theme?.shadow || "rgba(0,0,0,0.4)"}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transition: "transform 0.2s, box-shadow 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
          e.currentTarget.style.boxShadow = `0 8px 28px ${theme?.shadow || "rgba(0,0,0,0.6)"}`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
          e.currentTarget.style.boxShadow = `0 6px 20px ${theme?.shadow || "rgba(0,0,0,0.4)"}`;
        }}
      >
        🎵
      </button>

      {/* Mini bouton play/pause */}
      <button
        onClick={isPlaying ? onPause : onPlay}
        title={isPlaying ? "Pause" : "Play"}
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: theme?.cardBg || "rgba(30,30,30,0.9)",
          color: theme?.text || "#fff",
          fontSize: 16,
          border: `2px solid ${theme?.border || "#444"}`,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 12px ${theme?.shadow || "rgba(0,0,0,0.3)"}`,
          transition: "transform 0.2s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = "scale(1.1)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = "scale(1)";
        }}
      >
        {isPlaying ? "⏸️" : "▶️"}
      </button>
    </div>
  );
}
