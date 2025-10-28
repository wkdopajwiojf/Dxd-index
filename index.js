// index.js
import express from "express";
import { Client, GatewayIntentBits } from "discord.js";
import bodyParser from "body-parser";
import cors from "cors";

const PORT = process.env.PORT || 10000;
const RELAY_KEY = "222554";
const DISCORD_BOT_TOKEN = "MTQzMjc4NjY3Mjc1MTM0OTg5Mg.GUrdy_.qhJvoF3e2lR_9V45URltiC6QHbjjB717CKdQ0k"; // 🔥 อย่าลืมใส่

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🌐 Endpoint ที่ Roblox จะดึงข้อความจาก Discord
let latestMessage = "ยังไม่มีข้อความจาก Discord";

app.get("/from-discord", (req, res) => {
  const key = req.headers["x-relay-key"];
  if (key !== RELAY_KEY) {
    return res.status(403).json({ error: "invalid key" });
  }
  res.json({ message: latestMessage });
});

// 📩 Endpoint ที่ Roblox ส่งข้อความมาให้ Discord
app.post("/to-discord", (req, res) => {
  const key = req.headers["x-relay-key"];
  if (key !== RELAY_KEY) {
    return res.status(403).json({ error: "invalid key" });
  }

  const { username, text } = req.body;
  const channel = client.channels.cache.find((c) => c.name === "relay-chat");

  if (channel && channel.isTextBased()) {
    channel.send(`💬 **${username}**: ${text}`);
    res.json({ success: true });
  } else {
    res.status(500).json({ error: "relay-chat channel not found" });
  }
});

client.on("messageCreate", (msg) => {
  if (msg.author.bot || msg.channel.name !== "relay-chat") return;
  latestMessage = `${msg.author.username}: ${msg.content}`;
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

client.login(DISCORD_BOT_TOKEN);

app.listen(PORT, () =>
  console.log(`🚀 Server ready on http://localhost:${PORT}`)
);
