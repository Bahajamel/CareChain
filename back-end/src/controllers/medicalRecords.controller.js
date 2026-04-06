const fs = require("fs");
const {
  uploadToPinata,
  uploadJsonToPinata,
} = require("../services/ipfs.service");
const AppError = require("../utils/AppError");

async function uploadMedicalRecord(req, res, next) {
  try {
    const { patientAddress, providerAddress, actType, amount } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    if (!patientAddress || !providerAddress || !actType || !amount) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const parsedAmount = Number(amount);

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: "Amount must be a valid positive number",
      });
    }

    // 1) Upload document to IPFS
    const documentResult = await uploadToPinata(
      req.file.path,
      req.file.originalname
    );

    // 2) Build metadata JSON
    const metadata = {
      patientAddress,
      providerAddress,
      actType,
      amount: parsedAmount,
      documentCid: documentResult.cid,
      documentUrl: documentResult.gatewayUrl,
      fileName: req.file.originalname,
      mimeType: req.file.mimetype,
      createdAt: new Date().toISOString(),
    };

    // 3) Upload metadata JSON to IPFS
    const metadataResult = await uploadJsonToPinata(
      metadata,
      `medical-record-${Date.now()}`
    );

    // 4) Delete local temp file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete local file:", err.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Medical record uploaded successfully",
      data: {
        documentCid: documentResult.cid,
        documentUrl: documentResult.gatewayUrl,
        metadataCid: metadataResult.cid,
        metadataUrl: metadataResult.gatewayUrl,
        metadata,
      },
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(new AppError("Failed to upload medical record", 502));
  }
}

module.exports = {
  uploadMedicalRecord,
};