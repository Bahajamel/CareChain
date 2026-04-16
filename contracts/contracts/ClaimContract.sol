// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "./interfaces/IAccess.sol";
import "./interfaces/IPolicy.sol";
import "./interfaces/IMedical.sol";


contract ClaimContract {

    // ─────────────────────────────────────────
    //  ENUMS
    // ─────────────────────────────────────────

    enum Status { Pending, Approved, Rejected }

    // ─────────────────────────────────────────
    //  STRUCTS
    // ─────────────────────────────────────────

    struct Claim {
        uint256 id;
        uint256 policyId;
        uint256 recordId;
        address patient;
        uint256 amountRequested;   // en unité monétaire entière (ex: centimes)
        uint256 amountApproved;    // calculé par le contrat
        Status  status;
        address decisionBy;        // adresse de l'assureur qui a statué
        string  decisionReason;    // motif de rejet ou note
        uint256 createdAt;
        uint256 decidedAt;
    }

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────

    IAccess public accessControl;
    IPolicy public policyContract;
    IMedical public medicalContract;

    uint256 private _claimCounter;

    // claimId => Claim
    mapping(uint256 => Claim) private claims;

    // patient => list of claimIds
    mapping(address => uint256[]) private patientClaims;

    // policyId => cumul des remboursements approuvés
    mapping(uint256 => uint256) private policyUsedCoverage;

    // évite la double soumission d'un même dossier médical sur la même police
    mapping(uint256 => mapping(uint256 => bool)) private claimExists; // policyId => recordId => bool

   

    event ClaimSubmitted(
        uint256 indexed claimId,
        address indexed patient,
        uint256 indexed policyId,
        uint256 recordId,
        uint256 amountRequested,
        uint256 timestamp
    );

    event ReimbursementCalculated(
        uint256 indexed claimId,
        uint256 amountRequested,
        uint256 amountApproved
    );

    event ClaimApproved(
        uint256 indexed claimId,
        address indexed approvedBy,
        uint256 amountApproved,
        uint256 timestamp
    );

    event ClaimRejected(
        uint256 indexed claimId,
        address indexed rejectedBy,
        string  reason,
        uint256 timestamp
    );

  

    modifier onlyInsurer() {
        require(accessControl.isInsurer(msg.sender), "ClaimContract: caller is not an insurer");
        _;
    }

    modifier onlyPatient() {
        require(accessControl.isPatient(msg.sender), "ClaimContract: caller is not a patient");
        _;
    }

    modifier claimExistsCheck(uint256 claimId) {
        require(claims[claimId].id != 0, "ClaimContract: claim does not exist");
        _;
    }

    modifier onlyPending(uint256 claimId) {
        require(claims[claimId].status == Status.Pending, "ClaimContract: claim is not pending");
        _;
    }



    constructor(
        address _accessControl,
        address _policyContract,
        address _medicalContract
    ) {
        require(_accessControl  != address(0), "ClaimContract: invalid access address");
        require(_policyContract  != address(0), "ClaimContract: invalid policy address");
        require(_medicalContract != address(0), "ClaimContract: invalid medical address");

        accessControl   = IAccess(_accessControl);
        policyContract  = IPolicy(_policyContract);
        medicalContract = IMedical(_medicalContract);
    }

  

    /**
     * @notice Le patient soumet une demande de remboursement.
     * @param policyId        ID de sa police d'assurance
     * @param recordId        ID du dossier médical lié
     * @param amountRequested Montant réclamé (en centimes ou unité entière)
     */
    function submitClaim(
        uint256 policyId,
        uint256 recordId,
        uint256 amountRequested
    )
        external
        onlyPatient
        returns (uint256)
    {
        require(amountRequested > 0, "ClaimContract: amount must be > 0");

        // 1. La police existe et est active
        require(policyContract.isPolicyActive(policyId), "ClaimContract: policy is not active");

        // 2. La police appartient bien à ce patient
        require(
            policyContract.getPolicyPatient(policyId) == msg.sender,
            "ClaimContract: policy does not belong to caller"
        );

        // 3. Le dossier médical est valide et appartient au patient
        require(
            medicalContract.isRecordValid(recordId, msg.sender),
            "ClaimContract: medical record is invalid or does not belong to patient"
        );

        // 4. Pas de double soumission sur la même paire (police, dossier)
        require(
            !claimExists[policyId][recordId],
            "ClaimContract: claim already submitted for this record and policy"
        );

        // ── Calcul du remboursement ─────────────────────────────────
        uint256 amountApproved = _calculateReimbursement(policyId, amountRequested);

        _claimCounter++;
        uint256 newId = _claimCounter;

        claims[newId] = Claim({
            id:               newId,
            policyId:         policyId,
            recordId:         recordId,
            patient:          msg.sender,
            amountRequested:  amountRequested,
            amountApproved:   amountApproved,
            status:           Status.Pending,
            decisionBy:       address(0),
            decisionReason:   "",
            createdAt:        block.timestamp,
            decidedAt:        0
        });

        patientClaims[msg.sender].push(newId);
        claimExists[policyId][recordId] = true;

        emit ClaimSubmitted(newId, msg.sender, policyId, recordId, amountRequested, block.timestamp);
        emit ReimbursementCalculated(newId, amountRequested, amountApproved);

        return newId;
    }

    /**
     * @notice L'assureur approuve une claim en attente.
     */
    function approveClaim(uint256 claimId)
        external
        onlyInsurer
        claimExistsCheck(claimId)
        onlyPending(claimId)
    {
        Claim storage c = claims[claimId];

       require(
        policyContract.getPolicyInsurer(c.policyId) == msg.sender,
        "ClaimContract: not the policy insurer"
    );
    
        // Vérifier que la police n'a pas expiré entre-temps
        require(
            policyContract.isPolicyActive(c.policyId),
            "ClaimContract: policy expired before approval"
        );
        

        // notifier PolicyContract pour mettre à jour usedAmount
    policyContract.useCoverage(c.policyId, c.amountApproved);

        // Incrémenter le cumul de couverture utilisée
        policyUsedCoverage[c.policyId] += c.amountApproved;

        c.status        = Status.Approved;
        c.decisionBy    = msg.sender;
        c.decidedAt     = block.timestamp;

        emit ClaimApproved(claimId, msg.sender, c.amountApproved, block.timestamp);
    }

    /**
     * @notice L'assureur rejette une claim en attente.
     * @param reason Motif du rejet (string courte)
     */
    function rejectClaim(uint256 claimId, string calldata reason)
        external
        onlyInsurer
        claimExistsCheck(claimId)
        onlyPending(claimId)
    {
        require(bytes(reason).length > 0, "ClaimContract: rejection reason cannot be empty");

        Claim storage c = claims[claimId];
       require(
        policyContract.getPolicyInsurer(c.policyId) == msg.sender,
        "ClaimContract: not the policy insurer"
    );


        c.status         = Status.Rejected;
        c.decisionBy     = msg.sender;
        c.decisionReason = reason;
        c.decidedAt      = block.timestamp;

        emit ClaimRejected(claimId, msg.sender, reason, block.timestamp);
    }

  

    /**
     * @dev Calcule le montant remboursable selon les règles de la police :
     *      reimbursable = min(amountRequested * coverageRate / 100, remainingCoverage)
     *
     *      coverageRate  = taux de remboursement en % (ex: 80)
     *      maxAmount     = plafond total de la police
     *      usedCoverage  = montant déjà remboursé sur cette police
     */
    function _calculateReimbursement(uint256 policyId, uint256 amountRequested)
        internal
        view
        returns (uint256)
    {
        uint256 coverageRate  = policyContract.getPolicyCoverageRate(policyId);   // ex: 80
        uint256 maxAmount     = policyContract.getPolicyMaxAmount(policyId);       // plafond
        uint256 usedCoverage  = policyUsedCoverage[policyId];

        uint256 remainingCoverage = maxAmount > usedCoverage ? maxAmount - usedCoverage : 0;

        // Calcul du montant éligible selon le taux (pas de float, multiplication d'abord)
        uint256 eligible = (amountRequested * coverageRate) / 100;

        // Plafonnement au reste de couverture disponible
        return eligible < remainingCoverage ? eligible : remainingCoverage;
    }



    /**
     * @notice Retourne une claim complète.
     */
    function getClaim(uint256 claimId)
        external
        view
        claimExistsCheck(claimId)
        returns (Claim memory)
    {
        Claim storage c = claims[claimId];
        require(
            msg.sender == c.patient ||
            accessControl.isInsurer(msg.sender) ||
            accessControl.isAdmin(msg.sender),
            "ClaimContract: not authorized"
        );
        return c;
    }

    /**
     * @notice Retourne tous les IDs de claims d'un patient.
     */
    function getPatientClaims(address patient)
        external
        view
        returns (uint256[] memory)
    {
        require(
            msg.sender == patient ||
            accessControl.isInsurer(msg.sender) ||
            accessControl.isAdmin(msg.sender),
            "ClaimContract: not authorized"
        );
        return patientClaims[patient];
    }

    /**
     * @notice Retourne le montant de couverture déjà utilisé sur une police.
     */
    function getUsedCoverage(uint256 policyId) external view returns (uint256) {
        return policyUsedCoverage[policyId];
    }

    /**
     * @notice Simule le calcul de remboursement sans créer de claim.
     */
    function simulateReimbursement(uint256 policyId, uint256 amountRequested)
        external
        view
        returns (uint256)
    {
        require(policyContract.isPolicyActive(policyId), "ClaimContract: policy not active");
        return _calculateReimbursement(policyId, amountRequested);
    }

    /**
     * @notice Retourne le nombre total de claims créées.
     */
    function totalClaims() external view returns (uint256) {
        return _claimCounter;
    }
}