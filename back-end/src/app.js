const express = require("express");
const cors = require("cors");
const config = require("./config");
const { optionalApiKey } = require("./middlewares/apiKey.middleware");
const { notFound, errorHandler } = require("./middlewares/error.middleware");
const filesRoutes = require("./routes/files.routes");
const medicalRecordsRoutes = require("./routes/medicalRecords.routes");

const app = express();

const corsOptions =
  config.corsOrigin === true
    ? { origin: true }
    : {
        origin(origin, callback) {
          if (!origin) {
            return callback(null, true);
          }
          if (config.corsOrigin.includes(origin)) {
            return callback(null, true);
          }
          callback(null, false);
        },
      };

app.use(cors(corsOptions));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ message: "Backend is running" });
});

app.use("/api/files", optionalApiKey, filesRoutes);
app.use("/api/medical-records", optionalApiKey, medicalRecordsRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
