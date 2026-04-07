import { network } from "hardhat";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const { ethers } = await network.connect();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log("🚀 Déploiement CareChain sur le réseau...\n");

  const [deployer] = await ethers.getSigners();
  console.log(`📦 Déployeur : ${deployer.address}`);
  console.log(
    `💰 Solde     : ${ethers.formatEther(await ethers.provider.getBalance(deployer.address))} ETH\n`
  );

  // ─────────────────────────────────────────────
  // 1. AccessControl
  // ─────────────────────────────────────────────
  console.log("1️⃣  Déploiement de AccessControl...");
  const AccessControl = await ethers.getContractFactory("AccessControl");
  const accessControl = await AccessControl.deploy();
  await accessControl.waitForDeployment();
  const accessControlAddress = await accessControl.getAddress();
  console.log(`   ✅ AccessControl déployé : ${accessControlAddress}\n`);

  // ─────────────────────────────────────────────
  // 2. MedicalRecord  (dépend de AccessControl)
  // ─────────────────────────────────────────────
  console.log("2️⃣  Déploiement de MedicalRecord...");
  const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
  const medicalRecord = await MedicalRecord.deploy(accessControlAddress);
  await medicalRecord.waitForDeployment();
  const medicalRecordAddress = await medicalRecord.getAddress();
  console.log(`   ✅ MedicalRecord déployé : ${medicalRecordAddress}\n`);

  // ─────────────────────────────────────────────
  // 3. PolicyContract  (dépend de AccessControl)
  // ─────────────────────────────────────────────
  console.log("3️⃣  Déploiement de PolicyContract...");
  const PolicyContract = await ethers.getContractFactory("PolicyContract");
  const policyContract = await PolicyContract.deploy(accessControlAddress);
  await policyContract.waitForDeployment();
  const policyContractAddress = await policyContract.getAddress();
  console.log(`   ✅ PolicyContract déployé : ${policyContractAddress}\n`);

  // ─────────────────────────────────────────────
  // 4. ClaimContract  (dépend des 3 précédents)
  // ─────────────────────────────────────────────
  console.log("4️⃣  Déploiement de ClaimContract...");
  const ClaimContract = await ethers.getContractFactory("ClaimContract");
  const claimContract = await ClaimContract.deploy(
    accessControlAddress,
    policyContractAddress,
    medicalRecordAddress
  );
  await claimContract.waitForDeployment();
  const claimContractAddress = await claimContract.getAddress();
  console.log(`   ✅ ClaimContract déployé : ${claimContractAddress}\n`);

  // ─────────────────────────────────────────────
  // 5. Liaison PolicyContract ↔ ClaimContract
  // ─────────────────────────────────────────────
  console.log("🔗 Liaison PolicyContract ↔ ClaimContract...");
  const tx = await policyContract.setClaimContract(claimContractAddress);
  await tx.wait();
  console.log("   ✅ setClaimContract() appelé avec succès\n");

  // ─────────────────────────────────────────────
  // 6. Résumé des adresses
  // ─────────────────────────────────────────────
  const addresses = {
    network: (await ethers.provider.getNetwork()).name,
    deployer: deployer.address,
    contracts: {
      AccessControl: accessControlAddress,
      MedicalRecord: medicalRecordAddress,
      PolicyContract: policyContractAddress,
      ClaimContract: claimContractAddress,
    },
    deployedAt: new Date().toISOString(),
  };

  console.log("📋 Adresses des contrats déployés :");
  console.table(addresses.contracts);

  // ─────────────────────────────────────────────
  // 7. Export → deployment.json  (pour le backend)
  // ─────────────────────────────────────────────
  const outputDir = path.join(__dirname, "..", "deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(addresses, null, 2));
  console.log(`\n💾 deployment.json sauvegardé → ${outputPath}`);

  // ─────────────────────────────────────────────
  // 8. Copie des ABIs → deployments/abis/  (pour le backend & frontend)
  // ─────────────────────────────────────────────
  const abiDir = path.join(outputDir, "abis");
  if (!fs.existsSync(abiDir)) {
    fs.mkdirSync(abiDir, { recursive: true });
  }

  const contractNames = [
    "AccessControl",
    "MedicalRecord",
    "PolicyContract",
    "ClaimContract",
  ];

  for (const name of contractNames) {
    const artifactPath = path.join(
      __dirname,
      "..",
      "artifacts",
      "contracts",
      `${name}.sol`,
      `${name}.json`
    );

    if (fs.existsSync(artifactPath)) {
      const artifact = JSON.parse(fs.readFileSync(artifactPath, "utf-8"));
      const abiOut = path.join(abiDir, `${name}.json`);
      fs.writeFileSync(
        abiOut,
        JSON.stringify({ abi: artifact.abi, address: addresses.contracts[name as keyof typeof addresses.contracts] }, null, 2)
      );
      console.log(`   📄 ABI exportée : deployments/abis/${name}.json`);
    } else {
      console.warn(`   ⚠️  Artifact introuvable pour ${name} — compile d'abord avec npx hardhat compile`);
    }
  }

  console.log("\n✅ Déploiement terminé avec succès !\n");
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Erreur lors du déploiement :", err);
    process.exit(1);
  });