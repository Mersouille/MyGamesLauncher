// src/services/conversationLogger.js
// Petit utilitaire côté front pour consigner des entrées dans le journal JSON

export async function logConversation({ type = "info", title = "", message = "", meta = null }) {
  try {
    const res = await window.electronAPI.saveConversationEntry({ type, title, message, meta });
    return res?.ok;
  } catch (e) {
    console.warn("logConversation error:", e);
    return false;
  }
}

export async function getConversationHistory() {
  try {
    const res = await window.electronAPI.getConversationHistory();
    return res?.ok ? res.entries : [];
  } catch (e) {
    console.warn("getConversationHistory error:", e);
    return [];
  }
}

export async function clearConversationHistory() {
  try {
    const res = await window.electronAPI.clearConversationHistory();
    return !!res?.ok;
  } catch (e) {
    console.warn("clearConversationHistory error:", e);
    return false;
  }
}
