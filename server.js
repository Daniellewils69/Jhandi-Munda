const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json({ limit: "2kb" }));
app.use(express.static(path.join(__dirname, "public")));

const SYMBOLS = ["flag", "crown", "heart", "spade", "diamond", "club"];
// Admin key. If you set an ADMIN_KEY environment variable on Render, that value is used instead.
const ADMIN_KEY = process.env.ADMIN_KEY || "78789898";

const MAX_PLAYERS = 300;
const KEEP_MS = 24 * 60 * 60 * 1000; // forget players idle for 24 hours
const ID_RE = /^[A-Za-z0-9_-]{8,64}$/;

const players = new Map(); // id -> { id, name, lastSeen, queued, draws }
let anyQueued = null;      // result for the next draw by whoever draws first
let round = 0;

const randomSymbol = () => SYMBOLS[crypto.randomInt(SYMBOLS.length)];
const cleanName = (n) => String(n || "").replace(/[\u0000-\u001f\u007f<>]/g, "").replace(/\s+/g, " ").trim().slice(0, 20);
const validDice = (d) => Array.isArray(d) && d.length === 6 && d.every((x) => SYMBOLS.includes(x));

function prune() {
  const now = Date.now();
  for (const [id, p] of players) if (now - p.lastSeen > KEEP_MS) players.delete(id);
}

function requireAdmin(req, res, next) {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Wrong admin key" });
  }
  next();
}

// A player registers with a name (the app keeps the same id on that phone).
app.post("/api/join", (req, res) => {
  const name = cleanName(req.body && req.body.name);
  const id = req.body && req.body.id;
  if (!name || typeof id !== "string" || !ID_RE.test(id)) {
    return res.status(400).json({ error: "Bad request" });
  }
  prune();
  let p = players.get(id);
  if (!p) {
    if (players.size >= MAX_PLAYERS) return res.status(503).json({ error: "Full" });
    p = { id, name, lastSeen: Date.now(), queued: null, draws: 0 };
    players.set(id, p);
  } else {
    p.name = name;
    p.lastSeen = Date.now();
  }
  res.json({ ok: true, id: p.id, name: p.name });
});

// A player presses Draw: their own chosen result, else the "any player" result, else random.
app.post("/api/draw", (req, res) => {
  const id = req.body && req.body.id;
  const p = typeof id === "string" ? players.get(id) : null;
  if (!p) return res.status(404).json({ error: "join" });
  p.lastSeen = Date.now();
  p.draws += 1;
  let dice;
  if (p.queued) {
    dice = p.queued;
    p.queued = null;
  } else if (anyQueued) {
    dice = anyQueued;
    anyQueued = null;
  } else {
    dice = Array.from({ length: 6 }, randomSymbol);
  }
  round += 1;
  res.json({ round, dice });
});

app.get("/api/admin/players", requireAdmin, (req, res) => {
  prune();
  const list = [...players.values()]
    .map((p) => ({ id: p.id, name: p.name, lastSeen: p.lastSeen, draws: p.draws, queued: p.queued }))
    .sort((a, b) => b.lastSeen - a.lastSeen);
  res.json({ players: list, anyQueued, round, now: Date.now() });
});

app.post("/api/admin/set", requireAdmin, (req, res) => {
  const { playerId, dice } = req.body || {};
  if (!validDice(dice)) return res.status(400).json({ error: "Send 6 valid symbols" });
  if (playerId === "any") {
    anyQueued = dice;
  } else {
    const p = players.get(playerId);
    if (!p) return res.status(404).json({ error: "Player not found" });
    p.queued = dice;
  }
  res.json({ ok: true });
});

app.post("/api/admin/clear", requireAdmin, (req, res) => {
  const { playerId } = req.body || {};
  if (playerId === "all") {
    anyQueued = null;
    for (const p of players.values()) p.queued = null;
  } else if (playerId === "any") {
    anyQueued = null;
  } else {
    const p = players.get(playerId);
    if (!p) return res.status(404).json({ error: "Player not found" });
    p.queued = null;
  }
  res.json({ ok: true });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Listening on " + port));
