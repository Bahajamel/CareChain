const express = require("express");
const { uploadSingle } = require("../middlewares/upload.middleware");
const {
  uploadMedicalRecord,
} = require("../controllers/medicalRecords.controller");

const router = express.Router();

router.post("/upload", uploadSingle("file"), uploadMedicalRecord);

module.exports = router;