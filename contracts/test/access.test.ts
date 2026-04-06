import { expect } from "chai";
import { network } from "hardhat";

const { ethers } = await network.connect();
import { SignerWithAddress } from "@nomicfoundation/hardhat-ethers/signers";

describe("AccessControl", function () {

    // Variables partagées 
    let accessControl: any;
    let admin:   SignerWithAddress;
    let insurer: SignerWithAddress;
    let doctor:  SignerWithAddress;
    let patient: SignerWithAddress;
    let other:   SignerWithAddress;

    // Déploiement avant chaque test 
    beforeEach(async function () {
        [admin, insurer, doctor, patient, other] = await ethers.getSigners();

        const AccessControl = await ethers.getContractFactory("AccessControl");
        accessControl = await AccessControl.deploy();
        //  admin = msg.sender = compte 0 automatiquement
    });


    // Constructor

    describe("constructor", function () {

        it("should set deployer as admin", async function () {
            const role = await accessControl.checkRole(admin.address);
            expect(role).to.equal(0); // Role.Admin = 0
        });

        it("should set deployer as active", async function () {
            expect(await accessControl.isActive(admin.address)).to.be.true;
        });

        it("should emit UserRegistered event on deploy", async function () {
    const AccessControl = await ethers.getContractFactory("AccessControl");
    const ac = await AccessControl.deploy();
    
    // Récupérer la transaction de déploiement via deploymentTransaction()
    const deployTx = ac.deploymentTransaction();
    
    await expect(deployTx)
        .to.emit(ac, "UserRegistered")
        .withArgs(admin.address, 0); // admin, Role.Admin = 0
});
    });


    // registerUser

    describe("registerUser", function () {

        it("should register an insurer correctly", async function () {
            await accessControl.registerUser(insurer.address, 3);

            expect(await accessControl.isInsurer(insurer.address)).to.be.true;
            expect(await accessControl.isActive(insurer.address)).to.be.true;
            expect(await accessControl.checkRole(insurer.address)).to.equal(3);
        });

        it("should register a doctor correctly", async function () {
            await accessControl.registerUser(doctor.address, 2);

            expect(await accessControl.isDoctor(doctor.address)).to.be.true;
            expect(await accessControl.checkRole(doctor.address)).to.equal(2);
        });

        it("should register a patient correctly", async function () {
            await accessControl.registerUser(patient.address, 1);

            expect(await accessControl.isPatient(patient.address)).to.be.true;
            expect(await accessControl.checkRole(patient.address)).to.equal(1);
        });

        it("should emit UserRegistered event", async function () {
            await expect(
                accessControl.registerUser(insurer.address, 3)
            ).to.emit(accessControl, "UserRegistered")
             .withArgs(insurer.address, 3);
        });

        it("should fail if caller is not admin", async function () {
             await accessControl.registerUser(patient.address, 1); // patient actif, rôle patient
            await expect(
                    accessControl.connect(patient).registerUser(other.address, 1)
            ).to.be.revertedWith("Acces admin requis");
        });

        it("should fail if address is zero", async function () {
            await expect(
                accessControl.registerUser(ethers.ZeroAddress, 1)
            ).to.be.revertedWith("Adresse invalide");
        });

        it("should fail if user already registered", async function () {
            await accessControl.registerUser(patient.address, 1);
            await expect(
                accessControl.registerUser(patient.address, 1)
            ).to.be.revertedWith("Utilisateur deja enregistre");
        });

        it("should fail if admin is inactive", async function () {
    const AccessControl = await ethers.getContractFactory("AccessControl");
    const ac2 = await AccessControl.deploy();

    await ac2.registerUser(other.address, 0);
    await ac2.setUserActive(other.address, false);

    await expect(
        ac2.connect(other).registerUser(patient.address, 1)
    ).to.be.revertedWith("Utilisateur inactif"); // ← message réel du contrat
});


    // changeUserRole

    describe("changeUserRole", function () {

        beforeEach(async function () {
            await accessControl.registerUser(patient.address, 1);
        });

        it("should change role correctly", async function () {
            await accessControl.changeUserRole(patient.address, 2); // → Doctor
            expect(await accessControl.checkRole(patient.address)).to.equal(2);
            expect(await accessControl.isDoctor(patient.address)).to.be.true;
            expect(await accessControl.isPatient(patient.address)).to.be.false;
        });

        it("should emit RoleChanged event", async function () {
            await expect(
                accessControl.changeUserRole(patient.address, 2)
            ).to.emit(accessControl, "RoleChanged")
             .withArgs(patient.address, 1, 2);
            //                          ↑  ↑
            //                    oldRole  newRole
        });

        it("should fail if caller is not admin", async function () {
             
            await expect(
                    accessControl.connect(patient).changeUserRole(other.address, 1)
            ).to.be.revertedWith("Acces admin requis");
        });

        it("should fail if user is not registered", async function () {
            await expect(
                accessControl.changeUserRole(other.address, 2)
            ).to.be.revertedWith("Utilisateur non enregistre");
        });

        it("should fail if admin tries to change own role", async function () {
            await expect(
                accessControl.changeUserRole(admin.address, 1)
            ).to.be.revertedWith("Impossible de modifier son propre role");
        });
    });


    // setUserActive
    describe("setUserActive", function () {

        beforeEach(async function () {
            await accessControl.registerUser(patient.address, 1);
        });

        it("should deactivate a user", async function () {
            await accessControl.setUserActive(patient.address, false);
            expect(await accessControl.isActive(patient.address)).to.be.false;
            expect(await accessControl.isPatient(patient.address)).to.be.false;
            // ↑ isPatient vérifie isActive ET role → false car inactif
        });

        it("should reactivate a user", async function () {
            await accessControl.setUserActive(patient.address, false);
            await accessControl.setUserActive(patient.address, true);
            expect(await accessControl.isActive(patient.address)).to.be.true;
        });

        it("should emit UserStatusChanged event", async function () {
            await expect(
                accessControl.setUserActive(patient.address, false)
            ).to.emit(accessControl, "UserStatusChanged")
             .withArgs(patient.address, false);
        });

        it("should fail if caller is not admin", async function () {
            await expect(
                    accessControl.connect(patient).setUserActive(other.address, 1)
            ).to.be.revertedWith("Acces admin requis");
        });

        it("should fail if admin tries to deactivate himself", async function () {
            await expect(
                accessControl.setUserActive(admin.address, false)
            ).to.be.revertedWith("Impossible de se desactiver soi-meme");
        });
    });


    // Helpers isAdmin, isPatient, isDoctor, isInsurer
    describe("role helpers", function () {

        beforeEach(async function () {
            await accessControl.registerUser(insurer.address, 3);
            await accessControl.registerUser(doctor.address,  2);
            await accessControl.registerUser(patient.address, 1);
        });

        it("isAdmin should return true for admin", async function () {
            expect(await accessControl.isAdmin(admin.address)).to.be.true;
        });

        it("isAdmin should return false for non-admin", async function () {
            expect(await accessControl.isAdmin(patient.address)).to.be.false;
        });

        it("isPatient should return true for patient", async function () {
            expect(await accessControl.isPatient(patient.address)).to.be.true;
        });

        it("isDoctor should return true for doctor", async function () {
            expect(await accessControl.isDoctor(doctor.address)).to.be.true;
        });

        it("isInsurer should return true for insurer", async function () {
            expect(await accessControl.isInsurer(insurer.address)).to.be.true;
        });

        it("all helpers should return false for inactive user", async function () {
            await accessControl.setUserActive(patient.address, false);

            // isPatient vérifie isActive ET role
            expect(await accessControl.isPatient(patient.address)).to.be.false;
        });

        it("helpers should return false for unregistered address", async function () {
            expect(await accessControl.isPatient(other.address)).to.be.false;
            expect(await accessControl.isDoctor(other.address)).to.be.false;
            expect(await accessControl.isInsurer(other.address)).to.be.false;
        });
    });
});
})