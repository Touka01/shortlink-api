const crypto = require("crypto");

const ALPHABET = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

/** Generate a random short code (base62). */
function makeCode(length = 6) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

/** Only http and https URLs are accepted, and they must parse. */
function isValidUrl(value) {
  try {
    const u = new URL(value);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

/** A custom alias must be url-safe and a sensible length. */
function isValidAlias(value) {
  return /^[a-zA-Z0-9_-]{3,32}$/.test(value);
}

module.exports = { makeCode, isValidUrl, isValidAlias };
