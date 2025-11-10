// test-sgdb.js
import fetch from "node-fetch";

const API_KEY = "4be33b52db8e612bd59b8dc3ce0e62be"; // ta clé SteamGridDB

async function testSGDB() {
  try {
    const res = await fetch("https://www.steamgriddb.com/api/v2/search/autocomplete/Hades", {
      headers: {
        Authorization: `Bearer ${API_KEY}`,
      },
    });

    const data = await res.json();
    console.log("✅ Réponse SteamGridDB :", data);
  } catch (err) {
    console.error("❌ Erreur :", err);
  }
}

testSGDB();
