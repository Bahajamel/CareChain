const nodeEnv = process.env.NODE_ENV || "development";
const isProd = nodeEnv === "production";

/**
 * CORS: unset or "*" → permissive (reflect origin). Otherwise comma-separated origins.
 */
function getCorsOrigin() {
  const raw = process.env.ALLOWED_ORIGINS;
  if (raw === undefined || raw === null || raw.trim() === "" || raw.trim() === "*") {
    return true;
  }
  return raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

module.exports = {
  nodeEnv,
  isProd,
  port: Number(process.env.PORT) || 5000,
  corsOrigin: getCorsOrigin(),
  /** If set, /api/files and /api/medical-records require X-API-Key or Authorization: Bearer */
  apiKey: process.env.API_KEY?.trim() || null,
};
