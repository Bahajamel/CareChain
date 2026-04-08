const fs = require("fs");
const {
  uploadToPinata,
  uploadJsonToPinata,
} = require("../services/ipfs.service");
const { medicalRecordContract, computeFileHash } = require("../services/blockchain.service");
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

      //  1. Lire le fichier pour calculer le hash 
    const fileBuffer = fs.readFileSync(req.file.path);
    const fileHash   = computeFileHash(fileBuffer);
    // keccak256 du fichier — stocké dans MedicalRecord.sol
    //   permet de vérifier l'intégrité plus tard

    // 2 Upload document to IPFS
    const documentResult = await uploadToPinata(
      req.file.path,
      req.file.originalname
    );

    // 3) Build metadata JSON
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

    // 4) Upload metadata JSON to IPFS
    const metadataResult = await uploadJsonToPinata(
      metadata,
      `medical-record-${Date.now()}`
    );
// 5. Déterminer le RecordType 
    // Correspond à l'enum RecordType dans MedicalRecord.sol
    const recordTypeMap = {
      "Consultation":  0,
      "Prescription":  1,
      "LabResult":     2,
      "Imaging":       3,
      "Surgery":       4,
      "Other":         5,
    };
    const recordType = recordTypeMap[actType] ?? 5;

     // 6. Appeler MedicalRecord.addRecord() 
    const tx = await medicalRecordContract.addRecord(
      patientAddress,          // adresse du patient
      documentResult.cid,      // ipfsHash — CID du document
      fileHash,                // fileHash — keccak256 du fichier
      recordType               // type de document
    );

    const receipt = await tx.wait();
    // attend que la transaction soit minée
    //   receipt.hash = hash de la transaction

    //  7. Récupérer le recordId depuis l'event 
    const event = receipt.logs
      .map(log => {
        try {
          return medicalRecordContract.interface.parseLog(log);
        } catch {
          return null;
        }
      })
      .find(e => e?.name === "MedicalRecordAdded");

    const recordId = event ? event.args.recordId.toString() : null;


    // 8) Delete local temp file
    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete local file:", err.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: "Medical record uploaded successfully",
      data: {
        recordId,                          // ID dans le smart contract
        documentCid: documentResult.cid,
        documentUrl: documentResult.gatewayUrl,
        metadataCid: metadataResult.cid,
        metadataUrl: metadataResult.gatewayUrl,
        metadata,
        txHash:       receipt.hash,        // hash de la transaction
        blockNumber:  receipt.blockNumber.toString(),
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