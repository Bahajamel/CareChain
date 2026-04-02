+import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { network } from "hardhat";

const { ethers } = await network.connect();

describe("ClaimContract", function () {

    // Variables partagées 
    let accessControl:  any;
    let policyContract: any;
    let medicalRecord:  any;
    let claimContract:  any;
    let admin:   SignerWithAddress;
    let insurer: SignerWithAddress;
    let doctor:  SignerWithAddress;
    let patient: SignerWithAddress;
    let other:   SignerWithAddress;

    // Déploiement avant chaque test 
    beforeEach(async function () {
        [admin, insurer, doctor, patient, other] = await ethers.getSigners();

        // 1. Déployer tous les contrats
        const AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy();

        const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
        medicalRecord = await MedicalRecord.deploy(
            await accessControl.getAddress()
        );

        const PolicyContract = await ethers.getContractFactory("PolicyContract");
        policyContract = await PolicyContract.deploy(
            await accessControl.getAddress()
        );

        const ClaimContract = await ethers.getContractFactory("ClaimContract");
        claimContract = await ClaimContract.deploy(
            await accessControl.getAddress(),
            await policyContract.getAddress(),
            await medicalRecord.getAddress()
        );

        // 2. Lier PolicyContract et ClaimContract
        await policyContract.setClaimContract(
            await claimContract.getAddress()
        );

        // 3. Enregistrer les utilisateurs
        await accessControl.registerUser(insurer.address, 3);
        await accessControl.registerUser(doctor.address,  2);
        await accessControl.registerUser(patient.address, 1);

        // 4. Créer une police
        await policyContract
            .connect(insurer)
            .createPolicy(patient.address, 10000n, 80n, 30n, 0);

        // 5. Créer un dossier médical
        const fileHash = ethers.keccak256(ethers.toUtf8Bytes("document1"));
        await medicalRecord
            .connect(doctor)
            .addRecord(
                patient.address,
                "QmHash123",
                fileHash,
                0 // Consultation
            );
    });


    // submitClaim

    describe("submitClaim", function () {

        it("should submit a claim correctly", async function () {
            await claimContract
                .connect(patient)
                .submitClaim(1, 1, 2000n);

            const claim = await claimContract
                .connect(patient)
                .getClaim(1);

            expect(claim.id).to.equal(1n);
            expect(claim.policyId).to.equal(1n);
            expect(claim.recordId).to.equal(1n);
            expect(claim.patient).to.equal(patient.address);
            expect(claim.amountRequested).to.equal(2000n);
            expect(claim.amountApproved).to.equal(1600n); // 2000 * 80% = 1600
            expect(claim.status).to.equal(0); // Pending
        });

        it("should emit ClaimSubmitted event", async function () {
            await expect(
                claimContract.connect(patient).submitClaim(1, 1, 2000n)
            ).to.emit(claimContract, "ClaimSubmitted");
        });

        it("should emit ReimbursementCalculated event", async function () {
            await expect(
                claimContract.connect(patient).submitClaim(1, 1, 2000n)
            ).to.emit(claimContract, "ReimbursementCalculated")
             .withArgs(1n, 2000n, 1600n);
        });

        it("should cap amountApproved at remaining coverage", async function () {
            // Demander plus que le plafond disponible
            await claimContract.connect(patient).submitClaim(1, 1, 99999n);
            const claim = await claimContract.connect(patient).getClaim(1);
            // 99999 * 80% = 79999 > 10000 → plafonné à 10000
            expect(claim.amountApproved).to.equal(10000n);
        });

        it("should fail if caller is not patient", async function () {
            await expect(
                claimContract.connect(insurer).submitClaim(1, 1, 2000n)
            ).to.be.revertedWith("ClaimContract: caller is not a patient");
        });

        it("should fail if amount is zero", async function () {
            await expect(
                claimContract.connect(patient).submitClaim(1, 1, 0n)
            ).to.be.revertedWith("ClaimContract: amount must be > 0");
        });

        it("should fail if policy does not belong to patient", async function () {
            // Créer un second patient
            const [,,,, patient2] = await ethers.getSigners();
            await accessControl.registerUser(patient2.address, 1);

            await expect(
                claimContract.connect(patient2).submitClaim(1, 1, 2000n)
            ).to.be.revertedWith("ClaimContract: policy does not belong to caller");
        });

        it("should fail on double submission for same policy and record", async function () {
            await claimContract.connect(patient).submitClaim(1, 1, 2000n);
            await expect(
                claimContract.connect(patient).submitClaim(1, 1, 2000n)
            ).to.be.revertedWith(
                "ClaimContract: claim already submitted for this record and policy"
            );
        });
    });


    // approveClaim

    describe("approveClaim", function () {

        beforeEach(async function () {
            await claimContract.connect(patient).submitClaim(1, 1, 2000n);
        });

        it("should approve a pending claim", async function () {
            await claimContract.connect(insurer).approveClaim(1);
            const claim = await claimContract.connect(insurer).getClaim(1);
            expect(claim.status).to.equal(1); // Approved
            expect(claim.decisionBy).to.equal(insurer.address);
        });

        it("should emit ClaimApproved event", async function () {
    const tx = await claimContract.connect(insurer).approveClaim(1);
    await tx.wait(); 

    await expect(tx)
        .to.emit(claimContract, "ClaimApproved")
        .withArgs(1n, insurer.address, 1600n, await getTimestamp()); 
});

        it("should update policyUsedCoverage", async function () {
            await claimContract.connect(insurer).approveClaim(1);
            const used = await claimContract.getUsedCoverage(1);
            expect(used).to.equal(1600n);
        });

        it("should fail if caller is not the policy insurer", async function () {
            // Créer un second insurer
            const insurer2 = (await ethers.getSigners())[5];
            await accessControl.registerUser(insurer2.address, 3);

            await expect(
                claimContract.connect(insurer2).approveClaim(1)
            ).to.be.revertedWith("ClaimContract: not the policy insurer");
        });

        it("should fail if claim is not pending", async function () {
            await claimContract.connect(insurer).approveClaim(1);
            await expect(
                claimContract.connect(insurer).approveClaim(1)
            ).to.be.revertedWith("ClaimContract: claim is not pending");
        });

        it("should fail if claim does not exist", async function () {
            await expect(
                claimContract.connect(insurer).approveClaim(99)
            ).to.be.revertedWith("ClaimContract: claim does not exist");
        });
    });


    // rejectClaim

    describe("rejectClaim", function () {

        beforeEach(async function () {
            await claimContract.connect(patient).submitClaim(1, 1, 2000n);
        });

        it("should reject a pending claim with reason", async function () {
            await claimContract
                .connect(insurer)
                .rejectClaim(1, "Dossier incomplet");

            const claim = await claimContract.connect(insurer).getClaim(1);
            expect(claim.status).to.equal(2); // Rejected
            expect(claim.decisionReason).to.equal("Dossier incomplet");
        });

        it("should emit ClaimRejected event", async function () {
            await expect(
                claimContract.connect(insurer).rejectClaim(1, "Dossier incomplet")
            ).to.emit(claimContract, "ClaimRejected");
        });

        it("should NOT update policyUsedCoverage on rejection", async function () {
            await claimContract.connect(insurer).rejectClaim(1, "Motif");
            const used = await claimContract.getUsedCoverage(1);
            expect(used).to.equal(0n); // rien consommé
        });

        it("should fail if reason is empty", async function () {
            await expect(
                claimContract.connect(insurer).rejectClaim(1, "")
            ).to.be.revertedWith("ClaimContract: rejection reason cannot be empty");
        });

        it("should fail if caller is not the policy insurer", async function () {
            const insurer2 = (await ethers.getSigners())[5];
            await accessControl.registerUser(insurer2.address, 3);

            await expect(
                claimContract.connect(insurer2).rejectClaim(1, "Motif")
            ).to.be.revertedWith("ClaimContract: not the policy insurer");
        });
    });

    
    // simulateReimbursement
  
    describe("simulateReimbursement", function () {

        it("should calculate correctly at 80%", async function () {
            const result = await claimContract.simulateReimbursement(1, 2000n);
            expect(result).to.equal(1600n); // 2000 * 80% = 1600
        });

        it("should cap at remaining coverage", async function () {
            const result = await claimContract.simulateReimbursement(1, 99999n);
            expect(result).to.equal(10000n); // plafonné au max
        });
    });
});

// Helper pour récupérer le timestamp du dernier bloc
async function getTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp;
}