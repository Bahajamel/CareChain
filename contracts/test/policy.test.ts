import { expect } from "chai";
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

import { network } from "hardhat";

const { ethers } = await network.connect();


describe("PolicyContract", function () {

    // Variables partagées 
    let accessControl: any;
    let policyContract: any;
    let admin:   SignerWithAddress;
    let insurer: SignerWithAddress;
    let doctor:  SignerWithAddress;
    let patient: SignerWithAddress;
    let other:   SignerWithAddress;

    //Déploiement avant chaque test 
    beforeEach(async function () {
        [admin, insurer, doctor, patient, other] = await ethers.getSigners();

        const AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy();

        const PolicyContract = await ethers.getContractFactory("PolicyContract");
        policyContract = await PolicyContract.deploy(
            await accessControl.getAddress()
        );

        // Enregistrer les utilisateurs
        await accessControl.registerUser(insurer.address, 3); // Insurer
        await accessControl.registerUser(doctor.address,  2); // Doctor
        await accessControl.registerUser(patient.address, 1); // Patient
    });


    // createPolicy

    describe("createPolicy", function () {

        it("should create a policy with correct data", async function () {
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);

            const policy = await policyContract.getPolicy(1);

            expect(policy.id).to.equal(1n);
            expect(policy.insurer).to.equal(insurer.address);
            expect(policy.patient).to.equal(patient.address);
            expect(policy.coverageAmount).to.equal(10000n);
            expect(policy.coverageRate).to.equal(80n);
            expect(policy.usedAmount).to.equal(0n);
            expect(policy.status).to.equal(0); // Active
        });

        it("should emit PolicyCreated event", async function () {
            await expect(
                policyContract
                    .connect(insurer)
                    .createPolicy(patient.address, 10000n, 80n, 30n, 0)
            ).to.emit(policyContract, "PolicyCreated")
             .withArgs(1n, insurer.address, patient.address);
        });

        it("should add policy to patientPolicies and insurerPolicies", async function () {
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);

            const patientPols = await policyContract.getPatientPolicies(patient.address);
            const insurerPols = await policyContract.getInsurerPolicies(insurer.address);

            expect(patientPols.length).to.equal(1);
            expect(patientPols[0]).to.equal(1n);
            expect(insurerPols[0]).to.equal(1n);
        });

        it("should fail if caller is not insurer", async function () {
            await expect(
                policyContract
                    .connect(patient)
                    .createPolicy(patient.address, 10000n, 80n, 30n, 0)
            ).to.be.revertedWith("Reserve a l'assureur");
        });

        it("should fail if patient address is zero", async function () {
            await expect(
                policyContract
                    .connect(insurer)
                    .createPolicy(ethers.ZeroAddress, 10000n, 80n, 30n, 0)
            ).to.be.revertedWith("Adresse invalide");
        });

        it("should fail if coverageAmount is zero", async function () {
            await expect(
                policyContract
                    .connect(insurer)
                    .createPolicy(patient.address, 0n, 80n, 30n, 0)
            ).to.be.revertedWith("Couverture invalide");
        });

        it("should fail if coverageRate is zero", async function () {
            await expect(
                policyContract
                    .connect(insurer)
                    .createPolicy(patient.address, 10000n, 0n, 30n, 0)
            ).to.be.revertedWith("Couverture invalide");
        });

        it("should fail if coverageRate is above 100", async function () {
            await expect(
                policyContract
                    .connect(insurer)
                    .createPolicy(patient.address, 10000n, 101n, 30n, 0)
            ).to.be.revertedWith("Couverture invalide");
        });

        it("should fail if address is not a patient", async function () {
            await expect(
                policyContract
                    .connect(insurer)
                    .createPolicy(doctor.address, 10000n, 80n, 30n, 0)
            ).to.be.revertedWith("L'adresse n'est pas un patient");
        });
    });


    // cancelPolicy

    describe("cancelPolicy", function () {

        beforeEach(async function () {
            // Créer une police avant chaque test de ce groupe
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);
        });

        it("should cancel an active policy", async function () {
            await policyContract.connect(insurer).cancelPolicy(1);
            const policy = await policyContract.getPolicy(1);
            expect(policy.status).to.equal(2); // Cancelled
        });

        it("should emit PolicyCancelled event", async function () {
            await expect(
                policyContract.connect(insurer).cancelPolicy(1)
            ).to.emit(policyContract, "PolicyCancelled").withArgs(1n);
        });

        it("should fail if caller is not the policy insurer", async function () {
            await expect(
                policyContract.connect(other).cancelPolicy(1)
            ).to.be.revertedWith("Non autorise");
        });

        it("should fail if policy does not exist", async function () {
            await expect(
                policyContract.connect(insurer).cancelPolicy(99)
            ).to.be.revertedWith("Police inexistante");
        });

        it("should fail if policy already cancelled", async function () {
            await policyContract.connect(insurer).cancelPolicy(1);
            await expect(
                policyContract.connect(insurer).cancelPolicy(1)
            ).to.be.revertedWith("Police non active");
        });
    });


    // isPolicyActive

    describe("isPolicyActive", function () {

        it("should return true for active policy", async function () {
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);

            expect(await policyContract.isPolicyActive(1)).to.be.true;
        });

        it("should return false for cancelled policy", async function () {
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);
            await policyContract.connect(insurer).cancelPolicy(1);

            expect(await policyContract.isPolicyActive(1)).to.be.false;
        });
    });


    // getRemainingCoverage

    describe("getRemainingCoverage", function () {

        it("should return full coverage initially", async function () {
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);

            const remaining = await policyContract.getRemainingCoverage(1);
            expect(remaining).to.equal(10000n);
        });
    });


    // getters

    describe("getters", function () {

        beforeEach(async function () {
            await policyContract
                .connect(insurer)
                .createPolicy(patient.address, 10000n, 80n, 30n, 0);
        });

        it("getPolicyPatient should return correct patient", async function () {
            expect(await policyContract.getPolicyPatient(1))
                .to.equal(patient.address);
        });

        it("getPolicyCoverageRate should return correct rate", async function () {
            expect(await policyContract.getPolicyCoverageRate(1))
                .to.equal(80n);
        });

        it("getPolicyMaxAmount should return correct amount", async function () {
            expect(await policyContract.getPolicyMaxAmount(1))
                .to.equal(10000n);
        });

        it("getPolicyInsurer should return correct insurer", async function () {
            expect(await policyContract.getPolicyInsurer(1))
                .to.equal(insurer.address);
        });
    });
});