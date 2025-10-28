// index.js

import express from "express";
import fetch from "node-fetch";
import { Client, GatewayIntentBits } from "discord.js";

// === CONFIG ===
const RELAY_KEY = "222554";
const PORT = process.env.PORT || 3000;

// ถ้าใช้ Render ต้องใช้ token จาก env
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;

// === Discord Bot Setup ===
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ],
});

client.on("ready", () => {
  console.log(`🤖 Logged in as ${client.user.tag}`);
});

// Discord → Roblox (ผ่าน POST ไป localhost)
client.on("messageCreate", async (msg) => {
  if (msg.author.bot || !msg.guild || msg.channel.name !== "relay-chat") return;

  const payload = {
    author: msg.author.username,
    text: msg.content,
  };

  try {
    const res = await fetch("http://localhost:" + PORT + "/from-discord", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-relay-key": RELAY_KEY
      },
      body: JSON.stringify(payload)
    });

    console.log("📤 ส่งข้อความจาก Discord ไป Roblox แล้ว:", msg.content);
  } catch (err) {
    console.error("❌ Error ส่งข้อความไป Roblox:", err);
  }
});

// === Express Web Server ===
const app = express();
app.use(express.json());

let pendingMessagesForRoblox = [];

// รับข้อความจาก Discord แล้วเก็บไว้ให้ Roblox ดึง
app.post("/from-discord", (req, res) => {
  const key = req.header("x-relay-key");
  if (key !== RELAY_KEY) return res.status(403).json({ error: "invalid key" });

  const { author, text } = req.body;
  if (!author || !text) return res.status(400).json({ error: "invalid payload" });

  pendingMessagesForRoblox.push({ author, text });
  res.json({ ok: true });
});

// Roblox ดึงข้อความจากคิว
app.get("/messages", (req, res) => {
  const key = req.header("x-relay-key");
  if (key !== RELAY_KEY) return res.status(403).json({ error: "invalid key" });

  const out = pendingMessagesForRoblox;
  pendingMessagesForRoblox = [];
  res.json({ ok: true, messages: out });
});

// Roblox ส่งข้อความ → Discord (ผ่าน webhook ก็ได้ แต่ที่นี่แค่ log)
app.post("/to-discord", (req, res) => {
  const key = req.header("x-relay-key");
  if (key !== RELAY_KEY) return res.status(403).json({ error: "invalid key" });

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
