import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useClaimContract, usePolicyContract } from "../hooks/useContract.js";
import {
  CARE_TYPE_OPTIONS,
  CLAIM_STATUS_LABELS,
  POLICY_STATUS_LABELS,
  formatAddr,
  ts,
} from "../insuranceUi.js";

export default function InsurerDashboard() {
  const { address, isConnected } = useWallet();
  const policyContract = usePolicyContract();
  const claimContract = useClaimContract();

  const [policyForm, setPolicyForm] = useState({
    patient: "",
    coverageAmount: "",
    coverageRate: "80",
    durationDays: "365",
    careType: 0,
  });
  const [policyBusy, setPolicyBusy] = useState(false);
  const [policyMsg, setPolicyMsg] = useState(null);
  const [policyErr, setPolicyErr] = useState(null);

  const [myPolicyIds, setMyPolicyIds] = useState([]);
  const [policiesLoading, setPoliciesLoading] = useState(false);

  const [pendingClaims, setPendingClaims] = useState([]);
  const [historyClaims, setHistoryClaims] = useState([]);
  const [claimsLoading, setClaimsLoading] = useState(false);
  const [claimBusyId, setClaimBusyId] = useState(null);
  const [rejectingId, setRejectingId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [claimErr, setClaimErr] = useState(null);

  const loadMyPolicies = useCallback(async () => {
    if (!policyContract || !address) return;
    setPoliciesLoading(true);
    try {
      const ids = await policyContract.getInsurerPolicies(address);
      setMyPolicyIds([...ids].map((x) => Number(x)));
    } catch (e) {
      console.error(e);
      setMyPolicyIds([]);
    } finally {
      setPoliciesLoading(false);
    }
  }, [policyContract, address]);

  const loadClaims = useCallback(async () => {
    if (!claimContract || !policyContract || !address) return;
    setClaimsLoading(true);
    setClaimErr(null);
    try {
      const total = Number(await claimContract.totalClaims());
      const pending = [];
      const done = [];
      for (let i = 1; i <= total; i++) {
        const c = await claimContract.getClaim(i);
        const insurer = await policyContract.getPolicyInsurer(c.policyId);
        if (insurer.toLowerCase() !== address.toLowerCase()) continue;
        const row = { raw: c, claimId: i };
        if (Number(c.status) === 0) pending.push(row);
        else done.push(row);
      }
      setPendingClaims(pending);
      setHistoryClaims(done.reverse());
    } catch (e) {
      console.error(e);
      setClaimErr(e?.shortMessage || e?.message || "Erreur chargement des claims");
    } finally {
      setClaimsLoading(false);
    }
  }, [claimContract, policyContract, address]);

  useEffect(() => {
    loadMyPolicies();
  }, [loadMyPolicies]);

  useEffect(() => {
    loadClaims();
  }, [loadClaims]);

  function setField(name, value) {
    setPolicyForm((f) => ({ ...f, [name]: value }));
  }

  async function onCreatePolicy(e) {
    e.preventDefault();
    setPolicyErr(null);
    setPolicyMsg(null);
    if (!policyContract || !isConnected) {
      setPolicyErr("Connectez-vous avec le wallet assureur.");
      return;
    }
    const patient = policyForm.patient.trim();
    const coverageAmount = BigInt(
      Math.max(0, Math.floor(Number(policyForm.coverageAmount)))
    );
    const coverageRate = BigInt(
      Math.min(100, Math.max(1, Math.floor(Number(policyForm.coverageRate))))
    );
    const durationDays = BigInt(
      Math.max(1, Math.floor(Number(policyForm.durationDays)))
    );
    const careType = Number(policyForm.careType);

    if (!patient.startsWith("0x") || patient.length !== 42) {
      setPolicyErr("Adresse patient invalide.");
      return;
    }
    if (coverageAmount <= 0n) {
      setPolicyErr("Montant de couverture > 0 requis.");
      return;
    }

    setPolicyBusy(true);
    try {
      const tx = await policyContract.createPolicy(
        patient,
        coverageAmount,
        coverageRate,
        durationDays,
        careType
      );
      setPolicyMsg(`Transaction envoyée : ${formatAddr(tx.hash, 10)}`);
      const receipt = await tx.wait();
      setPolicyMsg(`Police créée — bloc ${receipt.blockNumber}`);
      await loadMyPolicies();
    } catch (e) {
      console.error(e);
      setPolicyErr(e?.shortMessage || e?.reason || e?.message || "Échec createPolicy");
    } finally {
      setPolicyBusy(false);
    }
  }

  async function onApprove(claimId) {
    if (!claimContract) return;
    setClaimErr(null);
    setClaimBusyId(claimId);
    try {
      const tx = await claimContract.approveClaim(claimId);
      await tx.wait();
      await loadClaims();
    } catch (e) {
      console.error(e);
      setClaimErr(e?.shortMessage || e?.reason || e?.message || "Échec approveClaim");
    } finally {
      setClaimBusyId(null);
    }
  }

  async function onReject(claimId) {
    if (!claimContract) return;
    const reason = rejectReason.trim();
    if (!reason) {
      setClaimErr("Motif de rejet obligatoire.");
      return;
    }
    setClaimErr(null);
    setClaimBusyId(claimId);
    try {
      const tx = await claimContract.rejectClaim(claimId, reason);
      await tx.wait();
      setRejectingId(null);
      setRejectReason("");
      await loadClaims();
    } catch (e) {
      console.error(e);
      setClaimErr(e?.shortMessage || e?.reason || e?.message || "Échec rejectClaim");
    } finally {
      setClaimBusyId(null);
    }
  }

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Espace assureur</h1>
      <p className="mvp-page__intro">
        Créez des polices pour des patients enregistrés, puis traitez les{" "}
        <strong>demandes de remboursement (claims)</strong> enregistrées sur la
        chaîne — pas les dossiers médicaux bruts.
      </p>

      {!isConnected && (
        <p className="mvp-muted">Connectez le portefeuille assureur pour agir on-chain.</p>
      )}

      <div className="mvp-card">
        <h2 className="mvp-card__title">Créer une police (createPolicy)</h2>
        <form className="mvp-form" onSubmit={onCreatePolicy}>
          <label className="mvp-label">Adresse patient (wallet)</label>
          <input
            className="mvp-input"
            value={policyForm.patient}
            onChange={(e) => setField("patient", e.target.value)}
            placeholder="0x…"
            required
            disabled={policyBusy}
          />
          <label className="mvp-label">Plafond de couverture (unité entière, ex. €)</label>
          <input
            className="mvp-input"
            type="number"
            min="1"
            step="1"
            value={policyForm.coverageAmount}
            onChange={(e) => setField("coverageAmount", e.target.value)}
            required
            disabled={policyBusy}
          />
          <label className="mvp-label">Taux de remboursement (%)</label>
          <input
            className="mvp-input"
            type="number"
            min="1"
            max="100"
            value={policyForm.coverageRate}
            onChange={(e) => setField("coverageRate", e.target.value)}
            required
            disabled={policyBusy}
          />
          <label className="mvp-label">Durée (jours)</label>
          <input
            className="mvp-input"
            type="number"
            min="1"
            value={policyForm.durationDays}
            onChange={(e) => setField("durationDays", e.target.value)}
            required
            disabled={policyBusy}
          />
          <label className="mvp-label">Type de soins</label>
          <select
            className="mvp-input"
            value={policyForm.careType}
            onChange={(e) => setField("careType", Number(e.target.value))}
            disabled={policyBusy}
          >
            {CARE_TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          {policyErr && <p className="mvp-error">{policyErr}</p>}
            {policyMsg && <p className="mvp-ok">{policyMsg}</p>}
          <button
            type="submit"
            className="mvp-btn mvp-btn--primary"
            disabled={policyBusy || !policyContract}
          >
            {policyBusy ? "Envoi…" : "Créer la police"}
          </button>
        </form>
      </div>

      <div className="mvp-card">
        <h2 className="mvp-card__title">Mes polices</h2>
        <p className="mvp-muted">
          IDs des polices dont vous êtes l&apos;assureur (lecture chaîne).
        </p>
        {policiesLoading && <p>Chargement…</p>}
        {!policiesLoading && myPolicyIds.length === 0 && (
          <p className="mvp-muted">Aucune police pour l&apos;instant.</p>
        )}
        {!policiesLoading && myPolicyIds.length > 0 && (
          <PolicySummaryList policyContract={policyContract} ids={myPolicyIds} />
        )}
      </div>

      <h2 className="mvp-section-title">Claims en attente (même assureur)</h2>
      {claimErr && <p className="mvp-error">{claimErr}</p>}
      {claimsLoading && <p className="mvp-muted">Chargement des claims…</p>}
      {!claimsLoading && pendingClaims.length === 0 && (
        <p className="mvp-muted">Aucune demande en attente pour vos polices.</p>
      )}
      {!claimsLoading && pendingClaims.length > 0 && (
        <div className="mvp-table-wrap">
          <table className="mvp-table">
            <thead>
              <tr>
                <th>Claim</th>
                <th>Police</th>
                <th>Dossier médical</th>
                <th>Patient</th>
                <th>Demandé</th>
                <th>Remb. calculé</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {pendingClaims.map(({ raw, claimId }) => (
                <tr key={claimId}>
                  <td>#{claimId}</td>
                  <td>#{Number(raw.policyId)}</td>
                  <td>#{Number(raw.recordId)}</td>
                  <td className="mvp-mono">{formatAddr(raw.patient)}</td>
                  <td>{raw.amountRequested.toString()}</td>
                  <td>{raw.amountApproved.toString()}</td>
                  <td>
                    <div className="mvp-row-btns">
                      <button
                        type="button"
                        className="mvp-btn mvp-btn--small mvp-btn--primary"
                        disabled={claimBusyId != null}
                        onClick={() => onApprove(claimId)}
                      >
                        {claimBusyId === claimId ? "…" : "Approuver"}
                      </button>
                      <button
                        type="button"
                        className="mvp-btn mvp-btn--small mvp-btn--danger"
                        disabled={claimBusyId != null}
                        onClick={() =>
                          setRejectingId((id) => (id === claimId ? null : claimId))
                        }
                      >
                        Rejeter
                      </button>
                    </div>
                    {rejectingId === claimId && (
                      <div className="mvp-card mvp-card--meta" style={{ marginTop: "0.5rem" }}>
                        <label className="mvp-label">Motif du rejet</label>
                        <input
                          className="mvp-input"
                          value={rejectReason}
                          onChange={(e) => setRejectReason(e.target.value)}
                          placeholder="Ex. Pièce incomplète"
                        />
                        <div className="mvp-row-btns">
                          <button
                            type="button"
                            className="mvp-btn mvp-btn--small mvp-btn--danger"
                            onClick={() => onReject(claimId)}
                            disabled={claimBusyId != null}
                          >
                            Confirmer le rejet
                          </button>
                          <button
                            type="button"
                            className="mvp-btn mvp-btn--small mvp-btn--ghost"
                            onClick={() => {
                              setRejectingId(null);
                              setRejectReason("");
                            }}
                          >
                            Annuler
                          </button>
                        </div>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {historyClaims.length > 0 && (
        <>
          <h2 className="mvp-section-title">Historique des claims</h2>
          <div className="mvp-table-wrap">
            <table className="mvp-table">
              <thead>
                <tr>
                  <th>Claim</th>
                  <th>Police</th>
                  <th>Dossier</th>
                  <th>Statut</th>
                  <th>Montant approuvé</th>
                  <th>Date décision</th>
                </tr>
              </thead>
              <tbody>
                {historyClaims.map(({ raw, claimId }) => (
                  <tr key={claimId}>
                    <td>#{claimId}</td>
                    <td>#{Number(raw.policyId)}</td>
                    <td>#{Number(raw.recordId)}</td>
                    <td>
                      <span className={`mvp-tag mvp-tag--${claimStatusClass(raw.status)}`}>
                        {CLAIM_STATUS_LABELS[Number(raw.status)] ?? raw.status}
                      </span>
                    </td>
                    <td>
                      {Number(raw.status) === 1 ? raw.amountApproved.toString() : "—"}
                    </td>
                    <td>{ts(raw.decidedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

function claimStatusClass(status) {
  const n = Number(status);
  if (n === 1) return "approved";
  if (n === 2) return "rejected";
  return "pending";
}

function PolicySummaryList({ policyContract, ids }) {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const list = [];
      for (const id of ids) {
        try {
          const p = await policyContract.getPolicy(id);
          list.push({ id, p });
        } catch (e) {
          console.warn(e);
        }
      }
      if (!cancelled) setRows(list);
    })();
    return () => {
      cancelled = true;
    };
  }, [policyContract, ids]);

  return (
    <div className="mvp-table-wrap">
      <table className="mvp-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Patient</th>
            <th>Plafond</th>
            <th>Utilisé</th>
            <th>Taux %</th>
            <th>Statut</th>
            <th>Fin</th>
          </tr>
        </thead>
        <tbody>
          {rows.map(({ id, p }) => (
            <tr key={id}>
              <td>#{id}</td>
              <td className="mvp-mono">{formatAddr(p.patient)}</td>
              <td>{p.coverageAmount.toString()}</td>
              <td>{p.usedAmount.toString()}</td>
              <td>{p.coverageRate.toString()}</td>
              <td>{POLICY_STATUS_LABELS[Number(p.status)] ?? p.status}</td>
              <td>{ts(p.endDate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
