// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPolicy {
    function isPolicyActive(uint256 policyId) external view returns (bool);
    function getPolicyPatient(uint256 policyId) external view returns (address);
    function getPolicyCoverageRate(uint256 policyId) external view returns (uint256);
    function getPolicyMaxAmount(uint256 policyId) external view returns (uint256);
}