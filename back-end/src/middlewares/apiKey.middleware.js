const config = require("../config");

/**
 * When API_KEY is set in env, protects mutating API routes. Omitted in dev if unset.
 */
function optionalApiKey(req, res, next) {
  if (!config.apiKey) {
    return next();
  }

  const headerKey = req.headers["x-api-key"];
  const auth = req.headers.authorization;
  const bearer =
    typeof auth === "string" && auth.startsWith("Bearer ")
      ? auth.slice(7).trim()
      : null;
  const key = headerKey || bearer;

  if (key && key === config.apiKey) {
    return next();
  }

  return res.status(401).json({
    success: false,
    message: "Unauthorized",
  });
}

module.exports = { optionalApiKey };
