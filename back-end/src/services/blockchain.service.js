const { ethers }  = require("ethers");
const contracts   = require("../config/contracts");

// connexion à la blockchain
const provider = new ethers.JsonRpcProvider(process.env.BLOCKCHAIN_RPC_URL);


const signer = new ethers.Wallet(
  process.env.BACKEND_PRIVATE_KEY,
  provider
);
//  Instances des contrats 
const accessControlContract = new ethers.Contract(
  contracts.accessControl.address,
  contracts.accessControl.abi,
  signer
);

const medicalRecordContract = new ethers.Contract(
  contracts.medicalRecord.address,
  contracts.medicalRecord.abi,
  signer
);

const policyContract = new ethers.Contract(
  contracts.policyContract.address,
  contracts.policyContract.abi,
  signer
);

const claimContract = new ethers.Contract(
  contracts.claimContract.address,
  contracts.claimContract.abi,
  signer
);

/**
 * Calcule le keccak256 (fonction de hachage cryptographique) d'un fichier.
 * Utilisé pour fileHash dans MedicalRecord.addRecord()
 * Cela garantit que le fichier sur IPFS est bien celui qui a été validé par le smart contract.
 */
function computeFileHash(fileBuffer) {
  return ethers.keccak256(fileBuffer);
}
/**
 * Vérifie que le backend est bien connecté à la blockchain
 */
async function checkConnection() {
  const network = await provider.getNetwork();
  console.log(`Connecté au réseau : ${network.name} (chainId: ${network.chainId})`);
  return network;
}

module.exports = {
  provider,
  signer,
  accessControlContract,
  medicalRecordContract,
  policyContract,
  claimContract,
  computeFileHash,
  checkConnection,
};