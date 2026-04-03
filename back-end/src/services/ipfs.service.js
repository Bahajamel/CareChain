const fs = require("fs");
const axios = require("axios");
const FormData = require("form-data");

async function uploadToPinata(filePath, originalName) {
  const data = new FormData();
  data.append("file", fs.createReadStream(filePath));

  data.append(
    "pinataMetadata",
    JSON.stringify({
      name: originalName,
    })
  );

  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinFileToIPFS",
    data,
    {
      maxBodyLength: Infinity,
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        ...data.getHeaders(),
      },
    }
  );

  return {
    cid: response.data.IpfsHash,
    size: response.data.PinSize,
    timestamp: response.data.Timestamp,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
  };
}

async function uploadJsonToPinata(jsonData, name = "metadata.json") {
  const response = await axios.post(
    "https://api.pinata.cloud/pinning/pinJSONToIPFS",
    {
      pinataContent: jsonData,
      pinataMetadata: {
        name,
      },
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.PINATA_JWT}`,
        "Content-Type": "application/json",
      },
    }
  );

  return {
    cid: response.data.IpfsHash,
    timestamp: response.data.Timestamp,
    isDuplicate: response.data.isDuplicate,
    gatewayUrl: `https://gateway.pinata.cloud/ipfs/${response.data.IpfsHash}`,
  };
}

module.exports = {
  uploadToPinata,
  uploadJsonToPinata,
};