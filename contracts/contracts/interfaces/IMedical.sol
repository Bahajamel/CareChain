// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMedical {
    function isRecordValid(uint256 recordId, address patient) external view returns (bool);

    event MedicalRecordAdded(
        uint256 indexed recordId,
        address indexed patient,
        address indexed doctor,
        string  ipfsHash,
        bytes32 fileHash,
        uint256 timestamp
    );

    event MedicalRecordRevoked(
        uint256 indexed recordId,
        address indexed revokedBy,
        uint256 timestamp
    );
}