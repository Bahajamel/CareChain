const fs = require("fs");
const { uploadToPinata } = require("../services/ipfs.service");
const AppError = require("../utils/AppError");

async function uploadFileToIPFS(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const result = await uploadToPinata(req.file.path, req.file.originalname);

    fs.unlink(req.file.path, (err) => {
      if (err) {
        console.error("Failed to delete local file:", err.message);
      }
    });

    return res.status(200).json({
      success: true,
      message: "File uploaded to IPFS successfully",
      data: {
        filename: req.file.originalname,
        mimetype: req.file.mimetype,
        cid: result.cid,
        size: result.size,
        timestamp: result.timestamp,
        url: result.gatewayUrl,
      },
    });
  } catch (error) {
    if (req.file?.path) {
      fs.unlink(req.file.path, () => {});
    }
    next(new AppError("Failed to upload file to IPFS", 502));
  }
}

async function getFileByCid(req, res, next) {
  try {
    const { cid } = req.params;

    return res.status(200).json({
      success: true,
      data: {
        cid,
        url: `https://gateway.pinata.cloud/ipfs/${cid}`,
      },
    });
  } catch (error) {
    next(error);
  }
}

module.exports = {
  uploadFileToIPFS,
  getFileByCid,
};