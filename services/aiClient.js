// backend/services/aiClient.js
const fetch = require("node-fetch");

async function askAI(systemPrompt, message) {
  try {
    const res = await fetch("http://ai-service:7000/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ systemPrompt, message })
    });

    if (!res.ok) throw new Error("AI down");
    return (await res.json()).answer;
  } catch {
    return null;
  }
}

module.exports = { askAI };
