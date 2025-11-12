import React from "react";
import { getConversationHistory, clearConversationHistory } from "../services/conversationLogger";

export default function ConversationJournal({ open, onClose, theme }) {
  const [entries, setEntries] = React.useState([]);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    const list = await getConversationHistory();
    setEntries(list.sort((a, b) => (a.time < b.time ? 1 : -1)));
    setLoading(false);
  }, []);

  React.useEffect(() => {
    if (open) load();
  }, [open, load]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(2px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        style={{
          width: "min(920px, 92vw)",
          maxHeight: "86vh",
          background: theme?.panel || "#111827",
          color: theme?.text || "#e5e7eb",
          border: "1px solid #374151",
          borderRadius: 12,
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div
          style={{
            padding: "12px 16px",
            borderBottom: "1px solid #374151",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ fontWeight: 700 }}>📝 Journal</div>
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={load}
              style={{
                background: "#374151",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
              title="Rafraîchir"
            >
              🔄
            </button>
            <button
              onClick={async () => {
                if (await clearConversationHistory()) load();
              }}
              style={{
                background: "#991b1b",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
              title="Vider"
            >
              🗑️
            </button>
            <button
              onClick={onClose}
              style={{
                background: "#374151",
                color: "white",
                border: "none",
                padding: "6px 10px",
                borderRadius: 6,
                cursor: "pointer",
              }}
            >
              ✕
            </button>
          </div>
        </div>
        <div style={{ padding: 16, overflow: "auto" }}>
          {loading ? (
            <div style={{ padding: 20, opacity: 0.8 }}>Chargement…</div>
          ) : entries.length === 0 ? (
            <div style={{ padding: 20, opacity: 0.8 }}>
              Aucune entrée enregistrée pour le moment.
            </div>
          ) : (
            <ul
              style={{
                listStyle: "none",
                padding: 0,
                margin: 0,
                display: "flex",
                flexDirection: "column",
                gap: 10,
              }}
            >
              {entries.map((e) => (
                <li
                  key={e.id}
                  style={{
                    border: "1px solid #374151",
                    borderRadius: 10,
                    padding: 12,
                    background: "#0b1220",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontWeight: 600 }}>
                      <span>{iconForType(e.type)}</span>
                      <span>{e.title || e.type}</span>
                    </div>
                    <div style={{ fontSize: 12, opacity: 0.7 }}>{formatDate(e.time)}</div>
                  </div>
                  {e.message && (
                    <div
                      style={{
                        whiteSpace: "pre-wrap",
                        lineHeight: 1.4,
                        marginBottom: e.meta ? 8 : 0,
                      }}
                    >
                      {e.message}
                    </div>
                  )}
                  {e.meta && (
                    <pre
                      style={{
                        margin: 0,
                        background: "#111827",
                        padding: 8,
                        borderRadius: 8,
                        overflow: "auto",
                      }}
                    >
                      {JSON.stringify(e.meta, null, 2)}
                    </pre>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}

function iconForType(type) {
  switch ((type || "").toLowerCase()) {
    case "error":
      return "❌";
    case "warn":
    case "warning":
      return "⚠️";
    case "success":
      return "✅";
    case "action":
      return "👉";
    default:
      return "📝";
  }
}

function formatDate(ts) {
  try {
    const d = new Date(ts);
    return d.toLocaleString();
  } catch (e) {
    return String(ts);
  }
}
