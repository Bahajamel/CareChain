// services/blockchain.service.js
const { ethers } = require("ethers");
const contracts  = require("../config/contracts");

const provider = new ethers.JsonRpcProvider(
  process.env.RPC_URL || "http://127.0.0.1:8545"
);

// Signer optionnel — seulement si la clé est définie
let signer = null;
if (process.env.BACKEND_PRIVATE_KEY) {
  signer = new ethers.Wallet(process.env.BACKEND_PRIVATE_KEY, provider);
}

// Fonction utilitaire — calcule le keccak256 d'un fichier
function computeFileHash(fileBuffer) {
  return ethers.keccak256(fileBuffer);
}

async function checkConnection() {
  const network = await provider.getNetwork();
  console.log(`Connecté au réseau : ${network.name} (chainId: ${network.chainId})`);
  return network;
}

module.exports = {
  provider,
  signer,
  computeFileHash,
  checkConnection,
};