import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { network } from "hardhat";

const { ethers } = await network.connect();

describe("MedicalRecord", function () {

    // Variables partagées
    let accessControl: any;
    let medicalRecord: any;
    let admin:   SignerWithAddress;
    let doctor:  SignerWithAddress;
    let doctor2: SignerWithAddress;
    let patient: SignerWithAddress;
    let insurer: SignerWithAddress;
    let other:   SignerWithAddress;

    //Helpers 
    const makeFileHash = (content: string) =>
        ethers.keccak256(ethers.toUtf8Bytes(content));

    //Déploiement avant chaque test
    beforeEach(async function () {
        [admin, doctor, doctor2, patient, insurer, other] =
            await ethers.getSigners();

        const AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy();

        const MedicalRecord = await ethers.getContractFactory("MedicalRecord");
        medicalRecord = await MedicalRecord.deploy(
            await accessControl.getAddress()
        );

        // Enregistrer les utilisateurs
        await accessControl.registerUser(doctor.address,  2);
        await accessControl.registerUser(doctor2.address, 2);
        await accessControl.registerUser(patient.address, 1);
        await accessControl.registerUser(insurer.address, 3);
    });


    // addRecord

    describe("addRecord", function () {

        it("should add a record correctly", async function () {
            const fileHash = makeFileHash("document1");

            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash123", fileHash, 0);

            // isRecordValid est public — on peut le lire
            expect(
                await medicalRecord.isRecordValid(1, patient.address)
            ).to.be.true;
        });

        it("should emit MedicalRecordAdded event", async function () {
            const fileHash = makeFileHash("document2");

            await expect(
                medicalRecord
                    .connect(doctor)
                    .addRecord(patient.address, "QmHash456", fileHash, 0)
            ).to.emit(medicalRecord, "MedicalRecordAdded");
        });

        it("should increment record counter", async function () {
            const hash1 = makeFileHash("doc1");
            const hash2 = makeFileHash("doc2");

            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash1", hash1, 0);
            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash2", hash2, 1);

            expect(await medicalRecord.totalRecords()).to.equal(2n);
        });

        it("should add record to patientRecords", async function () {
            const fileHash = makeFileHash("doc_patient");

            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash789", fileHash, 0);

            const records = await medicalRecord
                .connect(doctor)
                .getPatientRecords(patient.address);

            expect(records.length).to.equal(1);
            expect(records[0]).to.equal(1n);
        });

        it("should fail if caller is not a doctor", async function () {
            const fileHash = makeFileHash("doc_fail");

            await expect(
                medicalRecord
                    .connect(other)
                    .addRecord(patient.address, "QmHash", fileHash, 0)
            ).to.be.revertedWith("MedicalRecord: caller is not a doctor");
        });

        it("should fail if patient address is zero", async function () {
            const fileHash = makeFileHash("doc_zero");

            await expect(
                medicalRecord
                    .connect(doctor)
                    .addRecord(ethers.ZeroAddress, "QmHash", fileHash, 0)
            ).to.be.revertedWith("MedicalRecord: invalid patient address");
        });

        it("should fail if address is not a registered patient", async function () {
            const fileHash = makeFileHash("doc_nopatient");

            await expect(
                medicalRecord
                    .connect(doctor)
                    .addRecord(other.address, "QmHash", fileHash, 0)
            ).to.be.revertedWith("MedicalRecord: address is not a registered patient");
        });

        it("should fail if IPFS hash is empty", async function () {
            const fileHash = makeFileHash("doc_noipfs");

            await expect(
                medicalRecord
                    .connect(doctor)
                    .addRecord(patient.address, "", fileHash, 0)
            ).to.be.revertedWith("MedicalRecord: IPFS hash cannot be empty");
        });

        it("should fail if file hash is empty (bytes32 zero)", async function () {
            await expect(
                medicalRecord
                    .connect(doctor)
                    .addRecord(
                        patient.address,
                        "QmHash",
                        ethers.ZeroHash, // bytes32(0)
                        0
                    )
            ).to.be.revertedWith("MedicalRecord: file hash cannot be empty");
        });

        it("should fail if document already registered (duplicate hash)", async function () {
            const fileHash = makeFileHash("doc_duplicate");

            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash1", fileHash, 0);

            await expect(
                medicalRecord
                    .connect(doctor)
                    .addRecord(patient.address, "QmHash2", fileHash, 0)
            ).to.be.revertedWith("MedicalRecord: document already registered");
        });
    });


    // revokeRecord

    describe("revokeRecord", function () {

        beforeEach(async function () {
            const fileHash = makeFileHash("doc_revoke");
            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHashRevoke", fileHash, 0);
        });

        it("should revoke a valid record", async function () {
            await medicalRecord.connect(admin).revokeRecord(1);

            expect(
                await medicalRecord.isRecordValid(1, patient.address)
            ).to.be.false;
        });

        it("should emit MedicalRecordRevoked event", async function () {
            await expect(
                medicalRecord.connect(admin).revokeRecord(1)
            ).to.emit(medicalRecord, "MedicalRecordRevoked")
             .withArgs(1n, admin.address, await getTimestamp());
        });

        it("should fail if caller is not admin", async function () {
            await expect(
                medicalRecord.connect(doctor).revokeRecord(1)
            ).to.be.revertedWith("MedicalRecord: caller is not admin");
        });

        it("should fail if record does not exist", async function () {
            await expect(
                medicalRecord.connect(admin).revokeRecord(99)
            ).to.be.revertedWith("MedicalRecord: record does not exist");
        });

        it("should fail if record already revoked", async function () {
            await medicalRecord.connect(admin).revokeRecord(1);
            await expect(
                medicalRecord.connect(admin).revokeRecord(1)
            ).to.be.revertedWith("MedicalRecord: record already revoked");
        });
    });


    // isRecordValid

    describe("isRecordValid", function () {

        beforeEach(async function () {
            const fileHash = makeFileHash("doc_valid");
            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHashValid", fileHash, 0);
        });

        it("should return true for valid record", async function () {
            expect(
                await medicalRecord.isRecordValid(1, patient.address)
            ).to.be.true;
        });

        it("should return false for wrong patient", async function () {
            expect(
                await medicalRecord.isRecordValid(1, other.address)
            ).to.be.false;
        });

        it("should return false for revoked record", async function () {
            await medicalRecord.connect(admin).revokeRecord(1);
            expect(
                await medicalRecord.isRecordValid(1, patient.address)
            ).to.be.false;
        });

        it("should return false for non-existent record", async function () {
            expect(
                await medicalRecord.isRecordValid(99, patient.address)
            ).to.be.false;
        });
    });


    // getRecord — contrôle d'accès

    describe("getRecord access control", function () {

        beforeEach(async function () {
            const fileHash = makeFileHash("doc_access");
            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHashAccess", fileHash, 0);
        });

        it("patient can read own record", async function () {
            const record = await medicalRecord
                .connect(patient)
                .getRecord(1);
            expect(record.patient).to.equal(patient.address);
        });

        it("doctor who created record can read it", async function () {
            const record = await medicalRecord
                .connect(doctor)
                .getRecord(1);
            expect(record.doctor).to.equal(doctor.address);
        });

        it("insurer can read any record", async function () {
            const record = await medicalRecord
                .connect(insurer)
                .getRecord(1);
            expect(record.id).to.equal(1n);
        });

        it("admin can read any record", async function () {
            const record = await medicalRecord
                .connect(admin)
                .getRecord(1);
            expect(record.id).to.equal(1n);
        });

        it("other doctor cannot read record he did not create", async function () {
            await expect(
                medicalRecord.connect(doctor2).getRecord(1)
            ).to.be.revertedWith("MedicalRecord: not authorized to view");
        });

        it("unauthorized user cannot read record", async function () {
            await expect(
                medicalRecord.connect(other).getRecord(1)
            ).to.be.revertedWith("MedicalRecord: not authorized to view");
        });
    });

    
    // verifyFileHash
  
    describe("verifyFileHash", function () {

        it("should return true for correct hash", async function () {
            const fileHash = makeFileHash("doc_verify");
            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHashVerify", fileHash, 0);

            expect(
                await medicalRecord.verifyFileHash(1, fileHash)
            ).to.be.true;
        });

        it("should return false for wrong hash", async function () {
            const fileHash    = makeFileHash("doc_verify2");
            const wrongHash   = makeFileHash("wrong_content");

            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHashVerify2", fileHash, 0);

            expect(
                await medicalRecord.verifyFileHash(1, wrongHash)
            ).to.be.false;
        });
    });

   
    // getPatientRecords — contrôle d'accès
    
    describe("getPatientRecords access control", function () {

        beforeEach(async function () {
            const hash1 = makeFileHash("doc_list1");
            const hash2 = makeFileHash("doc_list2");

            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash_L1", hash1, 0);
            await medicalRecord
                .connect(doctor)
                .addRecord(patient.address, "QmHash_L2", hash2, 1);
        });

        it("patient can get own records list", async function () {
            const records = await medicalRecord
                .connect(patient)
                .getPatientRecords(patient.address);
            expect(records.length).to.equal(2);
        });

        it("doctor can get patient records list", async function () {
            const records = await medicalRecord
                .connect(doctor)
                .getPatientRecords(patient.address);
            expect(records.length).to.equal(2);
        });

        it("insurer can get patient records list", async function () {
            const records = await medicalRecord
                .connect(insurer)
                .getPatientRecords(patient.address);
            expect(records.length).to.equal(2);
        });

        it("unauthorized user cannot get records list", async function () {
            await expect(
                medicalRecord
                    .connect(other)
                    .getPatientRecords(patient.address)
            ).to.be.revertedWith("MedicalRecord: not authorized");
        });
    });
});

// Helper timestamp
async function getTimestamp(): Promise<number> {
    const block = await ethers.provider.getBlock("latest");
    return block!.timestamp + 1;
    // +1 car le timestamp du prochain bloc sera légèrement supérieur
}
