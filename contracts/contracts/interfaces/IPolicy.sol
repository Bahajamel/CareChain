// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IPolicy {
    function isPolicyActive(uint256 policyId) external view returns (bool);
    function getPolicyPatient(uint256 policyId) external view returns (address);
    function getPolicyCoverageRate(uint256 policyId) external view returns (uint256);
    function getPolicyMaxAmount(uint256 policyId) external view returns (uint256);
    function getPolicyInsurer(uint256 policyId) external view returns (address);


    function useCoverage(uint256 policyId, uint256 amount) external;

    event PolicyCreated(
        uint256 indexed policyId,
        address indexed insurer,
        address indexed patient
    );
    event PolicyCancelled(uint256 indexed policyId);
    event PolicyExpired(uint256 indexed policyId);
    event CoverageUsed(uint256 indexed policyId, uint256 amount);




}