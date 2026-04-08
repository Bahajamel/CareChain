// config/contracts.js
const path = require("path");
const fs   = require("fs");

const deploymentsPath = path.join(
  __dirname,        
  "..",            
  "..",   
  "..",          
  "contracts",      
  "deployments",    
  "abis"            // = contracts/deployments/abis/
);


//Fonction qui charge un contrat 
function loadContract(name) {
  const filePath = path.join(deploymentsPath, `${name}.json`);
 

  // Vérifier que le fichier existe
  if (!fs.existsSync(filePath)) {
    throw new Error(
      `Fichier introuvable : ${filePath}
      → Lance d'abord : npx hardhat run scripts/deploy.ts`
    );
  }

  // Lire et parser le JSON
  const data = JSON.parse(fs.readFileSync(filePath, "utf-8"));

  // Retourner seulement ce dont le backend a besoin
  return {
    abi:     data.abi,      // comment parler au contrat
    address: data.address,  // où est le contrat
  };
}

// Charger les 4 contrats 
module.exports = {
  accessControl:  loadContract("AccessControl"),
  medicalRecord:  loadContract("MedicalRecord"),
  policyContract: loadContract("PolicyContract"),
  claimContract:  loadContract("ClaimContract"),
};