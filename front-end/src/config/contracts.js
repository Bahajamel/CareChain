// src/config/contracts.js

// Importer les fichiers générés par deploy.ts
import AccessControlABI  from "../../../contracts/deployments/abis/AccessControl.json";
import MedicalRecordABI  from "../../../contracts/deployments/abis/MedicalRecord.json";
import PolicyContractABI from "../../../contracts/deployments/abis/PolicyContract.json";
import ClaimContractABI  from "../../../contracts/deployments/abis/ClaimContract.json";


export const CONTRACTS = {
  accessControl: {
    address: AccessControlABI.address,
    abi:     AccessControlABI.abi,
  },
  medicalRecord: {
    address: MedicalRecordABI.address,
    abi:     MedicalRecordABI.abi,
  },
  policyContract: {
    address: PolicyContractABI.address,
    abi:     PolicyContractABI.abi,
  },
  claimContract: {
    address: ClaimContractABI.address,
    abi:     ClaimContractABI.abi,
  },
};
console.log("AccessControl address:", AccessControlABI.address);
console.log("MedicalRecord address:", MedicalRecordABI.address);
console.log("PolicyContract address:", PolicyContractABI.address);
console.log("ClaimContract address:", ClaimContractABI.address);

// Mapping des rôles (correspond à l'enum Role dans IAccess.sol)
export const ROLES = {
  0: "Admin",
  1: "Patient",
  2: "Doctor",
  3: "Insurer",
};