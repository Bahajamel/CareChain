// test/workflow.test.ts
import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { network } from "hardhat";

const { ethers } = await network.connect();

describe("Workflow complet", function () {

    let accessControl:  any;
    let policyContract: any;
    let medicalRecord:  any;
    let claimContract:  any;
    let admin:   SignerWithAddress;
    let insurer: SignerWithAddress;
    let doctor:  SignerWithAddress;
    let patient: SignerWithAddress;

    beforeEach(async function () {
        [admin, insurer, doctor, patient] = await ethers.getSigners();

        const AccessControl  = await ethers.getContractFactory("AccessControl");
        const MedicalRecord  = await ethers.getContractFactory("MedicalRecord");
        const PolicyContract = await ethers.getContractFactory("PolicyContract");
        const ClaimContract  = await ethers.getContractFactory("ClaimContract");

        accessControl  = await AccessControl.deploy();
        medicalRecord  = await MedicalRecord.deploy(await accessControl.getAddress());
        policyContract = await PolicyContract.deploy(await accessControl.getAddress());
        claimContract  = await ClaimContract.deploy(
            await accessControl.getAddress(),
            await policyContract.getAddress(),
            await medicalRecord.getAddress()
        );

        await policyContract.setClaimContract(await claimContract.getAddress());
    });

  
    // Flux complet : du début à la fin

    it("flux complet : enregistrement → police → dossier → claim → approbation", async function () {

        // ETAPE 1 : Admin enregistre les acteurs 
        await accessControl.registerUser(insurer.address, 3);
        await accessControl.registerUser(doctor.address,  2);
        await accessControl.registerUser(patient.address, 1);

        expect(await accessControl.isInsurer(insurer.address)).to.be.true;
        expect(await accessControl.isDoctor(doctor.address)).to.be.true;
        expect(await accessControl.isPatient(patient.address)).to.be.true;

        //  ETAPE 2 : Insurer crée une police 
        await policyContract
            .connect(insurer)
            .createPolicy(patient.address, 10000n, 80n, 30n, 0);

        const policy = await policyContract.getPolicy(1);
        expect(policy.status).to.equal(0); // Active
        expect(policy.coverageAmount).to.equal(10000n);

        //  ETAPE 3 : Doctor soumet un dossier médical 
        const fileHash = ethers.keccak256(ethers.toUtf8Bytes("document_medical_1"));
        await medicalRecord
            .connect(doctor)
            .addRecord(patient.address, "QmIPFSHash123", fileHash, 0);

        expect(
            await medicalRecord.isRecordValid(1, patient.address)
        ).to.be.true;

        //  ETAPE 4 : Patient soumet une claim 
        await claimContract.connect(patient).submitClaim(1, 1, 2000n);

        const claim = await claimContract.connect(patient).getClaim(1);
        expect(claim.status).to.equal(0);        // Pending
        expect(claim.amountRequested).to.equal(2000n);
        expect(claim.amountApproved).to.equal(1600n); // 80%

        //  ETAPE 5 : Insurer approuve la claim 
        await claimContract.connect(insurer).approveClaim(1);

        const approvedClaim = await claimContract.connect(insurer).getClaim(1);
        expect(approvedClaim.status).to.equal(1);    // Approved
        expect(approvedClaim.decisionBy).to.equal(insurer.address);

        //  ETAPE 6 : Vérifier la couverture utilisée 
        const used      = await claimContract.getUsedCoverage(1);
        const remaining = await policyContract.getRemainingCoverage(1);

        expect(used).to.equal(1600n);
        expect(remaining).to.equal(8400n); // 10000 - 1600

        //  ETAPE 7 : Patient consulte son historique 
        const patientClaims = await claimContract
            .connect(patient)
            .getPatientClaims(patient.address);

        expect(patientClaims.length).to.equal(1);
        expect(patientClaims[0]).to.equal(1n);
    });


    // Flux rejet

    it("flux rejet : claim soumise puis rejetée", async function () {

        await accessControl.registerUser(insurer.address, 3);
        await accessControl.registerUser(doctor.address,  2);
        await accessControl.registerUser(patient.address, 1);

        await policyContract
            .connect(insurer)
            .createPolicy(patient.address, 10000n, 80n, 30n, 0);

        const fileHash = ethers.keccak256(ethers.toUtf8Bytes("doc2"));
        await medicalRecord
            .connect(doctor)
            .addRecord(patient.address, "QmHash456", fileHash, 0);

        await claimContract.connect(patient).submitClaim(1, 1, 5000n);

        await claimContract
            .connect(insurer)
            .rejectClaim(1, "Dossier incomplet");

        const claim = await claimContract.connect(insurer).getClaim(1);
        expect(claim.status).to.equal(2);                    // Rejected
        expect(claim.decisionReason).to.equal("Dossier incomplet");

        // La couverture ne doit PAS être consommée après rejet
        const used = await claimContract.getUsedCoverage(1);
        expect(used).to.equal(0n);
    });


    // Flux multi-claims

    it("flux multi-claims : plusieurs remboursements sur une police", async function () {

        await accessControl.registerUser(insurer.address, 3);
        await accessControl.registerUser(doctor.address,  2);
        await accessControl.registerUser(patient.address, 1);

        // Police avec 10000 de couverture à 80%
        await policyContract
            .connect(insurer)
            .createPolicy(patient.address, 10000n, 80n, 30n, 0);

        // Dossier 1
        const hash1 = ethers.keccak256(ethers.toUtf8Bytes("doc_1"));
        await medicalRecord
            .connect(doctor)
            .addRecord(patient.address, "QmHash1", hash1, 0);

        // Dossier 2
        const hash2 = ethers.keccak256(ethers.toUtf8Bytes("doc_2"));
        await medicalRecord
            .connect(doctor)
            .addRecord(patient.address, "QmHash2", hash2, 1);

        // Claim 1 → 2000 demandés → 1600 approuvés (80%)
        await claimContract.connect(patient).submitClaim(1, 1, 2000n);
        await claimContract.connect(insurer).approveClaim(1);

        // Claim 2 → 3000 demandés → 2400 approuvés (80%)
        await claimContract.connect(patient).submitClaim(1, 2, 3000n);
        await claimContract.connect(insurer).approveClaim(2);

        const used      = await claimContract.getUsedCoverage(1);
        const remaining = await policyContract.getRemainingCoverage(1);

        expect(used).to.equal(4000n);      // 1600 + 2400
        expect(remaining).to.equal(6000n); // 10000 - 4000
    });


    // Sécurité : useCoverage restreinte

    it("security : useCoverage ne peut pas être appelée directement", async function () {

        await accessControl.registerUser(insurer.address, 3);
        await accessControl.registerUser(patient.address, 1);

        await policyContract
            .connect(insurer)
            .createPolicy(patient.address, 10000n, 80n, 30n, 0);

        // Un attaquant essaie d'appeler useCoverage directement
        await expect(
            policyContract.connect(admin).useCoverage(1, 5000n)
        ).to.be.revertedWith("Reserve au ClaimContract");
    });
});