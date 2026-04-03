const express = require("express");
const { uploadSingle } = require("../middlewares/upload.middleware");
const {
  uploadFileToIPFS,
  getFileByCid,
} = require("../controllers/files.controller");

const router = express.Router();

router.post("/upload", uploadSingle("file"), uploadFileToIPFS);

// Get file info from a CID
router.get("/:cid", getFileByCid);

module.exports = router;