const config = require("../config");
const AppError = require("../utils/AppError");

function notFound(req, res) {
  res.status(404).json({
    success: false,
    message: "Not found",
  });
}

function errorHandler(err, req, res, next) {
  if (res.headersSent) {
    return next(err);
  }

  const isAppError = err instanceof AppError;
  const statusCode = isAppError ? err.statusCode : 500;

  if (!isAppError || statusCode >= 500) {
    console.error(err);
  }

  const clientMessage = isAppError
    ? err.message
    : config.isProd
      ? "Internal server error"
      : err.message || "Internal server error";

  res.status(statusCode).json({
    success: false,
    message: clientMessage,
  });
}

module.exports = { notFound, errorHandler };
