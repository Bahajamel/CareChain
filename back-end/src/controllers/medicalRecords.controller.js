const fs   = require("fs");
const { uploadToPinata, uploadJsonToPinata } = require("../services/ipfs.service");
const AppError = require("../utils/AppError");
const { ethers } = require("ethers");

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

    // ── 1. Calculer le fileHash ───────────────────────────────
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash   = ethers.keccak256(fileBuffer);
    // ↑ hash du fichier — sera vérifié par le smart contract
    console.log("fileHash:", fileHash);

    // ── 2. Upload document sur IPFS ───────────────────────────
    const documentResult = await uploadToPinata(
      req.file.path,
      req.file.originalname
    );

    // ── 3. Construire et uploader les métadonnées ─────────────
    const metadata = {
      patientAddress,
      providerAddress,
      actType,
      amount:      parsedAmount,
      documentCid: documentResult.cid,
      documentUrl: documentResult.gatewayUrl,
      fileName:    req.file.originalname,
      mimeType:    req.file.mimetype,
      fileHash,    // ← inclure dans les métadonnées
      createdAt:   new Date().toISOString(),
    };

    const metadataResult = await uploadJsonToPinata(
      metadata,
      `medical-record-${Date.now()}`
    );

    // ── 4. Supprimer le fichier temporaire ────────────────────
    fs.unlink(req.file.path, err => {
      if (err) console.error("Failed to delete local file:", err.message);
    });

    // ── 5. Retourner CID + fileHash au frontend ───────────────
    // Le frontend appellera addRecord() lui-même via MetaMask
    return res.status(200).json({
      success: true,
      message: "File uploaded to IPFS — call addRecord() from frontend",
      data: {
        documentCid:  documentResult.cid,
        documentUrl:  documentResult.gatewayUrl,
        metadataCid:  metadataResult.cid,
        metadataUrl:  metadataResult.gatewayUrl,
        fileHash,     // ← bytes32 pour addRecord()
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

module.exports = { uploadMedicalRecord };