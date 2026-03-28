// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IMedical {
    function isRecordValid(uint256 recordId, address patient) external view returns (bool);
}