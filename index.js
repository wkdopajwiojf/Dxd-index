// ✅ Discord ↔ Roblox Relay Bot (index.js) // ต้องใช้: express, discord.js v14+, dotenv

import express from 'express'; import { Client, GatewayIntentBits, Partials } from 'discord.js'; import bodyParser from 'body-parser'; import dotenv from 'dotenv';

dotenv.config();

const app = express(); const PORT = process.env.PORT || 10000; const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN; const RELAY_KEY = process.env.RELAY_KEY || '222554'; const CHANNEL_ID = process.env.DISCORD_CHANNEL_ID; // ช่องที่จะ relay ไปหา

app.use(bodyParser.json());

// 🚀 Discord Bot Setup const client = new Client({ intents: [ GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent ], partials: [Partials.Channel] });

client.on('ready', () => { console.log(✅ Logged in as ${client.user.tag}); });

// 🌐 รับข้อความจาก Roblox app.post('/from-roblox', async (req, res) => { const key = req.headers['x-relay-key']; if (key !== RELAY_KEY) { return res.status(403).json({ error: 'invalid key' }); }

const { author, message } = req.body; if (!author || !message) { return res.status(400).json({ error: 'missing author or message' }); }

try { const channel = await client.channels.fetch(CHANNEL_ID); if (!channel || !channel.isTextBased()) { return res.status(500).json({ error: 'channel not found or not text-based' }); }

await channel.send(`📦 **${author}**: ${message}`);
res.json({ success: true });

} catch (err) { console.error('Error sending message to Discord:', err); res.status(500).json({ error: 'failed to send message' }); } });

// 🌐 ส่งข้อความกลับไปหา Roblox (จาก Discord) app.post('/from-discord', (req, res) => { const key = req.headers['x-relay-key']; if (key !== RELAY_KEY) { return res.status(403).json({ error: 'invalid key' }); }

const { author, message } = req.body; console.log(💬 ข้อความจาก Discord ไป Roblox แล้ว: ${author}: ${message}); // ที่นี่สามารถ broadcast ไปยัง WebSocket หรือ queue ตามระบบที่ตั้งไว้ res.json({ received: true }); });

// ✅ Start Express Server app.listen(PORT, () => { console.log(🌐 Listening on http://localhost:${PORT}); });

client.login(DISCORD_BOT_TOKEN);
