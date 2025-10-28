// index.js — รวมทั้ง Discord Bot + Express Server
import express from "express";
import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";

// ===== CONFIG =====
const DISCORD_BOT_TOKEN = "MTQzMjc4NjY3Mjc1MTM0OTg5Mg.GUrdy_.qhJvoF3e2lR_9V45URltiC6QHbjjB717CKdQ0k";
const DISCORD_WEBHOOK_URL = "https://discord.com/api/webhooks/1432816819458019491/HkabKcQN1vPkafP4FIf-4no_BcjwHZ-A8hTQfBNHrNJD4ffBE3nv-Rhf2Vm9xNAIVd0G"; // ใช้ Webhook หรือให้ bot พิมพ์ก็ได้
const SHARED_SECRET = "222554";

// ===== SETUP EXPRESS SERVER =====
const app = express();
app.use(express.json());

// คิวข้อความรอ Roblox มาดึง
let pendingMessagesForRoblox = [];

// middleware auth
function verifyKey(req, res, next) {
  const key = req.header("x-relay-key");
  if (!key || key !== SHARED_SECRET) {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}

// Roblox -> Discord
app.post("/to-discord", verifyKey, async (req, res) => {
  const { author, text } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: "missing author or text" });
  }

  const payload = {
    content: `🎮 **${author}**: ${text}`
  };

  try {
    const resp = await fetch(DISCORD_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      const body = await resp.text();
      console.error("Discord webhook error:", resp.status, body);
      return res.status(500).json({ error: "discord_failed" });
    }

    return res.json({ ok: true });
  } catch (err) {
    console.error("ERR /to-discord:", err);
    return res.status(500).json({ error: "internal" });
  }
});

// Discord bot -> relay
app.post("/from-discord", verifyKey, (req, res) => {
  const { author, text } = req.body;
  if (!author || !text) {
    return res.status(400).json({ error: "missing author or text" });
  }

  pendingMessagesForRoblox.push({
    author,
    text,
    ts: Date.now()
  });

  return res.json({ ok: true });
});

// Roblox -> get new messages
app.get("/messages", verifyKey, (req, res) => {
  const out = pendingMessagesForRoblox;
  pendingMessagesForRoblox = [];
  return res.json({ ok: true, messages: out });
});

// test
app.get("/", (req, res) => {
  res.send("Relay server + bot is running 😎");
});

// ===== START EXPRESS =====
const PORT = process.env.PORT || 10000;
app.listen(PORT, "0.0.0.0", () => {
  console.log("🌐 Server running on port", PORT);
});

// ===== DISCORD BOT =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
});

client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild) return;
  //if (msg.channel.name !== "relay-chat") return;

  const payload = {
    author: msg.author.username,
    text: msg.content,
  };

  try {
    const res = await fetch("https://dxd-index.onrender.com/from-discord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-key": SHARED_SECRET,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      console.log("✅ ส่งข้อความจาก Discord ไป Roblox:", msg.content);
    } else {
      console.error("❌ ส่งไม่สำเร็จ:", await res.text());
    }
  } catch (err) {
    console.error("🔥 Error:", err);
  }
});

client.login(DISCORD_BOT_TOKEN);  if (key !== RELAY_KEY) return res.status(403).json({ error: "invalid key" });

  const { author, text } = req.body;
  if (!author || !text) return res.status(400).json({ error: "invalid payload" });

  console.log(`[จาก Roblox] ${author}: ${text}`);
  res.json({ ok: true });
});

// health check
app.get("/", (_, res) => {
  res.send("Relay + Bot Server is running 😎");
});

// start express + bot
app.listen(PORT, () => {
  console.log(`🌐 Server running on http://localhost:${PORT}`);
  client.login(DISCORD_BOT_TOKEN);
});
