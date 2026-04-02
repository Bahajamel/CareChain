// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "../interfaces/IAccess.sol";
import "../interfaces/IPolicy.sol";

contract PolicyContract is IPolicy {

     IAccess  public accessControl;
     address  public claimContract;   //ajouté pour sécuriser useCoverage
    uint256 private nextPolicyId;

    enum CareType    { General, Dental, Vision, Surgery, Pharmacy }
    enum PolicyStatus { Active, Expired, Cancelled }


    struct Policy {
        uint256 id;
        address insurer;
        address patient;
        uint256 coverageAmount;
        uint256 usedAmount;      // montant déjà remboursé
        uint256 coverageRate;
        uint256 startDate;
        uint256 endDate;
        CareType careType;
        PolicyStatus status;
    }


    mapping(uint256 => Policy)    public policies;
    mapping(address => uint256[]) public patientPolicies;
    mapping(address => uint256[]) public insurerPolicies;

 

 
    constructor(address _accessControl) {
        require(_accessControl != address(0), "Adresse invalide");
        accessControl = IAccess(_accessControl);
        nextPolicyId  = 1;
    }

    // Modifiers
modifier onlyInsurer() {
        require(accessControl.isInsurer(msg.sender), "Reserve a l'assureur");
        _;
    }

    modifier onlyPatient() {
        require(accessControl.isActive(msg.sender), "Utilisateur inactif");
        require(
            accessControl.checkRole(msg.sender) == AccessControl.Role.Patient,
            "Reserve au patient"
        );
        _;
    }

    modifier policyExists(uint256 _policyId) {
        require(_policyId > 0 && _policyId < nextPolicyId, "Police inexistante");
        _;
    }

    modifier onlyPolicyInsurer(uint256 _policyId) {
        require(policies[_policyId].insurer == msg.sender, "Non autorise");
        _;
    }

    modifier onlyClaimContract() {
    require(msg.sender == claimContract, "Reservé au ClaimContract");
    _;
}



    // Setup post-déploiement 
    /// @notice À appeler une seule fois après le déploiement de ClaimContract
    function setClaimContract(address _claimContract) external {
        require(claimContract == address(0),    "Deja configure");
        require(_claimContract != address(0),   "Adresse invalide");
        require(
            accessControl.isAdmin(msg.sender),
            "Reserve a l'admin"
        );
        claimContract = _claimContract;
    }



    // Fonctions principales 

    function createPolicy(
        address _patient,
        uint256 _coverageAmount,
        uint256 _coverageRate, 
        uint256 _durationDays,
        CareType _careType
    ) external onlyInsurer {
        require(_patient != address(0), "Adresse invalide");
        require(_coverageAmount > 0, "Couverture invalide");
        require(_durationDays > 0, "Duree invalide");
        require(accessControl.isActive(_patient), "Patient inactif");
        require(
            accessControl.checkRole(_patient) == AccessControl.Role.Patient,
            "L'adresse n'est pas un patient"
        );

        uint256 policyId = nextPolicyId;


        policies[policyId] = Policy({
            id:             policyId,
            insurer:        msg.sender,
            patient:        _patient,
            coverageAmount: _coverageAmount,
            usedAmount:     0,
            coverageRate: _coverageRate,
            startDate:      block.timestamp,
            endDate:        block.timestamp + (_durationDays * 1 days),
            careType:       _careType,
            status:         PolicyStatus.Active
        });

        patientPolicies[_patient].push(policyId);
        insurerPolicies[msg.sender].push(policyId);

        nextPolicyId++;

        emit PolicyCreated(policyId, msg.sender, _patient);
    }

    function cancelPolicy(uint256 _policyId)
        external
        policyExists(_policyId)
        onlyPolicyInsurer(_policyId)
    {
        Policy storage p = policies[_policyId];
        require(p.status == PolicyStatus.Active, "Police non active");
        p.status = PolicyStatus.Cancelled;
        emit PolicyCancelled(_policyId);
    }

    /// @notice Appelé par ClaimContract pour déduire le montant remboursé
    function useCoverage(uint256 _policyId, uint256 _amount)
        external
        onlyClaimContract
        policyExists(_policyId)
    {
        Policy storage p = policies[_policyId];
        _checkAndUpdateExpiry(p);

        require(p.status == PolicyStatus.Active, "Police non active");
        require(
            p.usedAmount + _amount <= p.coverageAmount,
            "Plafond de couverture atteint"
        );

        p.usedAmount += _amount;
        emit CoverageUsed(_policyId, _amount);
    }



    function getPolicy(uint256 _policyId)
        external
        view
        policyExists(_policyId)
        returns (Policy memory)
    {
        return policies[_policyId];
    }

    function getRemainingCoverage(uint256 _policyId)
        external
        view
        policyExists(_policyId)
        returns (uint256)
    {
        Policy memory p = policies[_policyId];
        return p.coverageAmount - p.usedAmount;
    }

    function isPolicyActive(uint256 _policyId)
        external
        view
        policyExists(_policyId)
        returns (bool)
    {
        Policy memory p = policies[_policyId];
        return p.status == PolicyStatus.Active && block.timestamp <= p.endDate;
    }

    function getPatientPolicies(address _patient)
        external
        view
        returns (uint256[] memory)
    {
        return patientPolicies[_patient];
    }

    function getInsurerPolicies(address _insurer)
        external
        view
        returns (uint256[] memory)
    {
        return insurerPolicies[_insurer];
    }


    function _checkAndUpdateExpiry(Policy storage p) internal {
        if (p.status == PolicyStatus.Active && block.timestamp > p.endDate) {
            p.status = PolicyStatus.Expired;
            emit PolicyExpired(p.id);
        }
    }

    function getPolicyPatient(uint256 _policyId)
    external view policyExists(_policyId) returns (address)
{
    return policies[_policyId].patient;
}

function getPolicyCoverageRate(uint256 _policyId)
    external view policyExists(_policyId) returns (uint256)
{
    return policies[_policyId].coverageRate;
}

function getPolicyMaxAmount(uint256 _policyId)
    external view policyExists(_policyId) returns (uint256)
{
    return policies[_policyId].coverageAmount;
}
function getPolicyInsurer(uint256 policyId)
    external view
    policyExists(policyId)
    returns (address)
{
    return policies[policyId].insurer;
}
}