const express = require("express");
const crypto = require("crypto");
const path = require("path");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

const SYMBOLS = ["flag", "crown", "heart", "spade", "diamond", "club"];
// Set ADMIN_KEY as an environment variable on Render.
const ADMIN_KEY = process.env.ADMIN_KEY || "change-me";

let queued = null; // the host's chosen result for the next draw
let round = 0;

const randomSymbol = () => SYMBOLS[crypto.randomInt(SYMBOLS.length)];

function requireAdmin(req, res, next) {
  if (req.get("x-admin-key") !== ADMIN_KEY) {
    return res.status(401).json({ error: "Wrong admin key" });
  }
  next();
}

// Players press Draw: uses the host's chosen result if one is set, otherwise random.
app.post("/api/draw", (req, res) => {
  let dice;
  if (queued) {
    dice = queued;
    queued = null;
  } else {
    dice = Array.from({ length: 6 }, randomSymbol);
  }
  round += 1;
  res.json({ round, dice });
});

app.get("/api/admin/status", requireAdmin, (req, res) => {
  res.json({ queued, round });
});

app.post("/api/admin/set", requireAdmin, (req, res) => {
  const dice = req.body && req.body.dice;
  const valid =
    Array.isArray(dice) && dice.length === 6 && dice.every((d) => SYMBOLS.includes(d));
  if (!valid) return res.status(400).json({ error: "Send 6 valid symbols" });
  queued = dice;
  res.json({ ok: true, queued });
});

app.post("/api/admin/clear", requireAdmin, (req, res) => {
  queued = null;
  res.json({ ok: true, queued });
});

const port = process.env.PORT || 3000;
app.listen(port, () => console.log("Listening on " + port));
