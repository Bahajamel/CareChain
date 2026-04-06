// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IAccess.sol";

contract MedicalRecord {

    // ─────────────────────────────────────────
    //  ENUMS
    // ─────────────────────────────────────────

    enum RecordType { Consultation, Prescription, LabResult, Imaging, Surgery, Other }

    // ─────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────

    struct Record {
        uint256 id;
        address patient;
        address doctor;
        string  ipfsHash;      // CID IPFS du document
        bytes32 fileHash;      // Hash du fichier (intégrité)
        RecordType recordType;
        uint256 timestamp;
        bool    isValid;       // false si révoqué
    }

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IAccess public accessControl;

    uint256 private _recordCounter;

    // recordId => Record
    mapping(uint256 => Record) private records;

    // patient => list of recordIds
    mapping(address => uint256[]) private patientRecords;

    // fileHash => recordId  (évite les doublons)
    mapping(bytes32 => uint256) private hashToRecord;



    // ─────────────────────────────────────────
    //  MODIFIERS
    // ─────────────────────────────────────────

    modifier onlyDoctor() {
        require(accessControl.isDoctor(msg.sender), "MedicalRecord: caller is not a doctor");
        _;
    }

    modifier onlyAdmin() {
        require(accessControl.isAdmin(msg.sender), "MedicalRecord: caller is not admin");
        _;
    }

    modifier onlyAuthorized(uint256 recordId) {
        Record storage r = records[recordId];
        require(
            msg.sender == r.patient ||
            msg.sender == r.doctor  ||
            accessControl.isAdmin(msg.sender)   ||
            accessControl.isInsurer(msg.sender),
            "MedicalRecord: not authorized to view"
        );
        _;
    }

    modifier recordExists(uint256 recordId) {
        require(records[recordId].id != 0, "MedicalRecord: record does not exist");
        _;
    }


    event MedicalRecordAdded(
        uint256 indexed recordId,
        address indexed patient,
        address indexed doctor,
        string  ipfsHash,
        bytes32 fileHash,
        RecordType recordType,
        uint256 timestamp
    );

event MedicalRecordRevoked(
        uint256 indexed recordId,
        address indexed revokedBy,
        uint256 timestamp
    );
    
    // ─────────────────────────────────────────
    //  CONSTRUCTOR
    // ─────────────────────────────────────────

    constructor(address _accessControl) {
        require(_accessControl != address(0), "MedicalRecord: invalid access control address");
        accessControl = IAccess(_accessControl);
    }

    // ─────────────────────────────────────────
    //  WRITE FUNCTIONS
    // ─────────────────────────────────────────

    /**
     * @notice Le médecin dépose un dossier médical lié à un patient.
     * @param patient      Adresse du patient concerné
     * @param ipfsHash     CID IPFS du document
     * @param fileHash     Hash keccak256 du fichier (intégrité)
     * @param recordType   Type de document médical
     */
    function addRecord(
        address   patient,
        string    calldata ipfsHash,
        bytes32   fileHash,
        RecordType recordType
    )
        external
        onlyDoctor
        returns (uint256)
    {
        require(patient != address(0),         "MedicalRecord: invalid patient address");
        require(accessControl.isPatient(patient), "MedicalRecord: address is not a registered patient");
        require(bytes(ipfsHash).length > 0,    "MedicalRecord: IPFS hash cannot be empty");
        require(fileHash != bytes32(0),        "MedicalRecord: file hash cannot be empty");
        require(hashToRecord[fileHash] == 0,   "MedicalRecord: document already registered");

        _recordCounter++;
        uint256 newId = _recordCounter;

        records[newId] = Record({
            id:         newId,
            patient:    patient,
            doctor:     msg.sender,
            ipfsHash:   ipfsHash,
            fileHash:   fileHash,
            recordType: recordType,
            timestamp:  block.timestamp,
            isValid:    true
        });

        patientRecords[patient].push(newId);
        hashToRecord[fileHash] = newId;

        emit MedicalRecordAdded(
            newId,
            patient,
            msg.sender,
            ipfsHash,
            fileHash,
            recordType,
            block.timestamp
        );

        return newId;
    }

    /**
     * @notice Révoque un dossier médical (admin seulement).
     */
    function revokeRecord(uint256 recordId)
        external
        onlyAdmin
        recordExists(recordId)
    {
        require(records[recordId].isValid, "MedicalRecord: record already revoked");
        records[recordId].isValid = false;

        emit MedicalRecordRevoked(recordId, msg.sender, block.timestamp);
    }

    // ─────────────────────────────────────────
    //  READ FUNCTIONS
    // ─────────────────────────────────────────

    /**
     * @notice Récupère un dossier médical complet.
     */
    function getRecord(uint256 recordId)
        external
        view
        recordExists(recordId)
        onlyAuthorized(recordId)
        returns (Record memory)
    {
        return records[recordId];
    }

    /**
     * @notice Retourne tous les IDs de dossiers d'un patient.
     */
    function getPatientRecords(address patient)
        external
        view
        returns (uint256[] memory)
    {
        require(
            msg.sender == patient ||
            accessControl.isDoctor(msg.sender)  ||
            accessControl.isAdmin(msg.sender)   ||
            accessControl.isInsurer(msg.sender),
            "MedicalRecord: not authorized"
        );
        return patientRecords[patient];
    }

    /**
     * @notice Vérifie l'intégrité d'un fichier à partir de son hash.
     */
    function verifyFileHash(uint256 recordId, bytes32 fileHash)
        external
        view
        recordExists(recordId)
        returns (bool)
    {
        return records[recordId].fileHash == fileHash;
    }

    /**
     * @notice Vérifie qu'un dossier est valide et appartient bien à ce patient.
     */
    function isRecordValid(uint256 recordId, address patient)
        external
        view
        returns (bool)
    {
        if (records[recordId].id == 0) return false;
        Record storage r = records[recordId];
        return r.isValid && r.patient == patient;
    }

    /**
     * @notice Retourne le nombre total de dossiers créés.
     */
    function totalRecords() external view returns (uint256) {
        return _recordCounter;
    }
}