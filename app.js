const express = require("express");
const rateLimit = require("express-rate-limit");
const { createDb } = require("./db");
const { makeCode, isValidUrl, isValidAlias } = require("./util");

/**
 * Build the Express app. The database is injected so tests can pass an
 * in-memory instance and the real server can pass a file-backed one.
 */
function createApp(db) {
  const app = express();
  app.use(express.json());
  app.set("trust proxy", 1);

  // Writing links is the expensive, abusable path, so it is rate limited.
  const createLimiter = rateLimit({
    windowMs: 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: "Too many links created from this IP, please slow down." },
  });

  const insertLink = db.prepare(
    "INSERT INTO links (code, url, created_at, expires_at) VALUES (?, ?, ?, ?)"
  );
  const getLink = db.prepare("SELECT * FROM links WHERE code = ?");
  const bumpClicks = db.prepare("UPDATE links SET clicks = clicks + 1 WHERE code = ?");
  const logClick = db.prepare(
    "INSERT INTO clicks (code, ts, referrer, user_agent) VALUES (?, ?, ?, ?)"
  );
  const recentClicks = db.prepare(
    "SELECT ts, referrer, user_agent FROM clicks WHERE code = ? ORDER BY ts DESC LIMIT 10"
  );

  app.get("/api/health", (req, res) => res.json({ status: "ok" }));

  // Create a short link.
  app.post("/api/shorten", createLimiter, (req, res) => {
    const { url, customAlias, expiresInDays } = req.body || {};

    if (!isValidUrl(url)) {
      return res.status(400).json({ error: "A valid http or https url is required." });
    }

    let code = customAlias;
    if (code !== undefined) {
      if (!isValidAlias(code)) {
        return res.status(400).json({ error: "Alias must be 3 to 32 characters: letters, numbers, dashes, underscores." });
      }
      if (getLink.get(code)) {
        return res.status(409).json({ error: "That alias is already taken." });
      }
    } else {
      do { code = makeCode(); } while (getLink.get(code));
    }

    let expiresAt = null;
    if (expiresInDays !== undefined) {
      const days = Number(expiresInDays);
      if (!Number.isFinite(days) || days <= 0 || days > 3650) {
        return res.status(400).json({ error: "expiresInDays must be a number between 1 and 3650." });
      }
      expiresAt = Date.now() + days * 86400000;
    }

    insertLink.run(code, url, Date.now(), expiresAt);
    const base = `${req.protocol}://${req.get("host")}`;
    res.status(201).json({ code, url, shortUrl: `${base}/${code}`, expiresAt });
  });

  // Stats for a link.
  app.get("/api/stats/:code", (req, res) => {
    const link = getLink.get(req.params.code);
    if (!link) return res.status(404).json({ error: "No link with that code." });
    res.json({
      code: link.code,
      url: link.url,
      clicks: link.clicks,
      createdAt: link.created_at,
      expiresAt: link.expires_at,
      recentClicks: recentClicks.all(link.code),
    });
  });

  // The redirect. Kept last so it never shadows the /api routes.
  app.get("/:code", (req, res) => {
    const link = getLink.get(req.params.code);
    if (!link) return res.status(404).json({ error: "This short link does not exist." });
    if (link.expires_at && link.expires_at < Date.now()) {
      return res.status(410).json({ error: "This short link has expired." });
    }
    bumpClicks.run(link.code);
    logClick.run(link.code, Date.now(), req.get("referer") || null, req.get("user-agent") || null);
    res.redirect(302, link.url);
  });

  return app;
}

module.exports = { createApp, createDb };
