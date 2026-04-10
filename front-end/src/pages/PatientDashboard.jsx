import { useCallback, useEffect, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import {
  useClaimContract,
  useMedicalRecord,
  usePolicyContract,
} from "../hooks/useContract.js";
import {
  CLAIM_STATUS_LABELS,
  CARE_TYPE_OPTIONS,
  POLICY_STATUS_LABELS,
  RECORD_TYPE_LABELS,
  formatAddr,
  ts,
} from "../insuranceUi.js";

export default function PatientDashboard() {
  const { address, isConnected } = useWallet();
  const policyContract = usePolicyContract();
  const claimContract = useClaimContract();
  const medicalRecord = useMedicalRecord();

  const [policies, setPolicies] = useState([]);
  const [records, setRecords] = useState([]);
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  const [claimForm, setClaimForm] = useState({
    policyId: "",
    recordId: "",
    amountEuros: "",
  });
  const [submitBusy, setSubmitBusy] = useState(false);
  const [submitMsg, setSubmitMsg] = useState(null);
  const [submitErr, setSubmitErr] = useState(null);
  const [simulated, setSimulated] = useState(null);

  const loadData = useCallback(async () => {
    if (!address || !policyContract || !claimContract || !medicalRecord) return;
    setLoading(true);
    setErr(null);
    try {
      const pIds = await policyContract.getPatientPolicies(address);
      const policyRows = [];
      for (const pid of pIds) {
        try {
          const p = await policyContract.getPolicy(pid);
          const active = await policyContract.isPolicyActive(pid);
          policyRows.push({ id: Number(pid), p, active });
        } catch (e) {
          console.warn(e);
        }
      }
      setPolicies(policyRows);

      const rIds = await medicalRecord.getPatientRecords(address);
      const recordRows = [];
      for (const rid of rIds) {
        try {
          const r = await medicalRecord.getRecord(rid);
          recordRows.push({ id: Number(rid), r });
        } catch (e) {
          console.warn(e);
        }
      }
      setRecords(recordRows);

      const cIds = await claimContract.getPatientClaims(address);
      const claimRows = [];
      for (const cid of cIds) {
        try {
          const c = await claimContract.getClaim(cid);
          claimRows.push({ id: Number(cid), c });
        } catch (e) {
          console.warn(e);
        }
      }
      claimRows.sort((a, b) => b.id - a.id);
      setClaims(claimRows);
    } catch (e) {
      console.error(e);
      setErr(e?.shortMessage || e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  }, [address, policyContract, claimContract, medicalRecord]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  async function onSimulate() {
    setSubmitErr(null);
    setSimulated(null);
    if (!claimContract) return;
    const policyId = BigInt(Math.floor(Number(claimForm.policyId)));
    const amountCentimes = eurosToCentimes(claimForm.amountEuros);
    if (policyId <= 0n || amountCentimes <= 0n) {
      setSubmitErr("Police et montant requis pour la simulation.");
      return;
    }
    try {
      const v = await claimContract.simulateReimbursement(policyId, amountCentimes);
      setSimulated(v.toString());
    } catch (e) {
      console.error(e);
      setSubmitErr(e?.shortMessage || e?.reason || e?.message || "Simulation impossible");
    }
  }

  async function onSubmitClaim(e) {
    e.preventDefault();
    setSubmitErr(null);
    setSubmitMsg(null);
    if (!claimContract || !isConnected) {
      setSubmitErr("Connectez le portefeuille patient.");
      return;
    }
    const policyId = BigInt(Math.floor(Number(claimForm.policyId)));
    const recordId = BigInt(Math.floor(Number(claimForm.recordId)));
    const amountCentimes = eurosToCentimes(claimForm.amountEuros);

    if (policyId <= 0n) {
      setSubmitErr("Choisissez une police.");
      return;
    }
    if (recordId <= 0n) {
      setSubmitErr("Choisissez un dossier médical.");
      return;
    }
    if (amountCentimes <= 0n) {
      setSubmitErr("Montant invalide.");
      return;
    }

    setSubmitBusy(true);
    try {
      const tx = await claimContract.submitClaim(policyId, recordId, amountCentimes);
      setSubmitMsg(`Transaction : ${formatAddr(tx.hash, 12)}`);
      const receipt = await tx.wait();
      setSubmitMsg(`Claim soumise — bloc ${receipt.blockNumber}`);
      setClaimForm((f) => ({ ...f, amountEuros: "" }));
      setSimulated(null);
      await loadData();
    } catch (e) {
      console.error(e);
      setSubmitErr(e?.shortMessage || e?.reason || e?.message || "Échec submitClaim");
    } finally {
      setSubmitBusy(false);
    }
  }

  const activePolicies = policies.filter((x) => x.active);

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Espace patient</h1>
      <p className="mvp-page__intro">
        Consultez vos <strong>polices</strong> créées par votre assureur, vos dossiers
        médicaux enregistrés par un praticien, et soumettez une{" "}
        <strong>demande de remboursement (claim)</strong> liée à une police et à un
        dossier.
      </p>

      {!isConnected && (
        <p className="mvp-muted">Connectez le portefeuille pour voir vos données on-chain.</p>
      )}

      {err && <p className="mvp-error">{err}</p>}
      {loading && <p className="mvp-muted">Chargement…</p>}

      <h2 className="mvp-section-title">Mes polices d&apos;assurance</h2>
      {!loading && policies.length === 0 && isConnected && (
        <p className="mvp-muted">Aucune police — votre assureur doit d&apos;abord en créer une.</p>
      )}
      {policies.length > 0 && (
        <div className="mvp-table-wrap">
          <table className="mvp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Assureur</th>
                <th>Type soins</th>
                <th>Plafond</th>
                <th>Déjà utilisé</th>
                <th>Taux %</th>
                <th>Statut</th>
                <th>Active (dates)</th>
              </tr>
            </thead>
            <tbody>
              {policies.map(({ id, p, active }) => (
                <tr key={id}>
                  <td>#{id}</td>
                  <td className="mvp-mono">{formatAddr(p.insurer)}</td>
                  <td>
                    {CARE_TYPE_OPTIONS.find((o) => o.value === Number(p.careType))?.label ??
                      `#${p.careType}`}
                  </td>
                  <td>{p.coverageAmount.toString()}</td>
                  <td>{p.usedAmount.toString()}</td>
                  <td>{p.coverageRate.toString()}</td>
                  <td>{POLICY_STATUS_LABELS[Number(p.status)] ?? p.status}</td>
                  <td>{active ? "Oui" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="mvp-card">
        <h2 className="mvp-card__title">Soumettre une demande (submitClaim)</h2>
        <p className="mvp-muted">
          Montant saisi en <strong>euros</strong> ; envoi à la chaîne en centimes (×100). Même
          base que le calcul du contrat (montant × taux, plafond restant).
        </p>
        <form className="mvp-form" onSubmit={onSubmitClaim}>
          <label className="mvp-label">Police</label>
          <select
            className="mvp-input"
            value={claimForm.policyId}
            onChange={(e) => setClaimForm((f) => ({ ...f, policyId: e.target.value }))}
            required
            disabled={submitBusy || activePolicies.length === 0}
          >
            <option value="">
              {activePolicies.length === 0 ? "Aucune police active" : "— Choisir —"}
            </option>
            {activePolicies.map(({ id, p }) => (
              <option key={id} value={String(id)}>
                #{id} — plafond {p.coverageAmount.toString()} —{" "}
                {CARE_TYPE_OPTIONS.find((o) => o.value === Number(p.careType))?.label ??
                  "soins"}
              </option>
            ))}
          </select>

          <label className="mvp-label">Dossier médical (recordId)</label>
          <select
            className="mvp-input"
            value={claimForm.recordId}
            onChange={(e) => setClaimForm((f) => ({ ...f, recordId: e.target.value }))}
            required
            disabled={submitBusy || records.length === 0}
          >
            <option value="">
              {records.length === 0 ? "Aucun dossier — un médecin doit en déposer" : "— Choisir —"}
            </option>
            {records.map(({ id, r }) => (
              <option key={id} value={String(id)}>
                #{id} — {RECORD_TYPE_LABELS[Number(r.recordType)] ?? r.recordType} —{" "}
                {formatAddr(r.doctor)}
              </option>
            ))}
          </select>

          <label className="mvp-label">Montant demandé (€)</label>
          <input
            className="mvp-input"
            type="number"
            min="0.01"
            step="0.01"
            value={claimForm.amountEuros}
            onChange={(e) => setClaimForm((f) => ({ ...f, amountEuros: e.target.value }))}
            required
            disabled={submitBusy}
          />

          {simulated != null && (
            <p className="mvp-ok">
              Remboursement estimé (centimes) : <strong>{simulated}</strong>
            </p>
          )}
          {submitErr && <p className="mvp-error">{submitErr}</p>}
          {submitMsg && <p className="mvp-ok">{submitMsg}</p>}

          <div className="mvp-row-btns">
            <button
              type="button"
              className="mvp-btn mvp-btn--ghost"
              onClick={onSimulate}
              disabled={
                submitBusy || !claimContract || !claimForm.policyId || !claimForm.amountEuros
              }
            >
              Simuler le remboursement
            </button>
            <button
              type="submit"
              className="mvp-btn mvp-btn--primary"
              disabled={
                submitBusy ||
                !claimContract ||
                activePolicies.length === 0 ||
                records.length === 0
              }
            >
              {submitBusy ? "Envoi…" : "Envoyer la demande"}
            </button>
          </div>
        </form>
      </div>

      <h2 className="mvp-section-title">Mes claims</h2>
      {!loading && claims.length === 0 && isConnected && (
        <p className="mvp-muted">Aucune demande de remboursement pour l&apos;instant.</p>
      )}
      {claims.length > 0 && (
        <div className="mvp-table-wrap">
          <table className="mvp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Police</th>
                <th>Dossier</th>
                <th>Demandé</th>
                <th>Montant approuvé (calcul)</th>
                <th>Statut</th>
                <th>Créée</th>
              </tr>
            </thead>
            <tbody>
              {claims.map(({ id, c }) => (
                <tr key={id}>
                  <td>#{id}</td>
                  <td>#{Number(c.policyId)}</td>
                  <td>#{Number(c.recordId)}</td>
                  <td>{c.amountRequested.toString()}</td>
                  <td>{c.amountApproved.toString()}</td>
                  <td>
                    <span className={`mvp-tag mvp-tag--${claimStatusClass(c.status)}`}>
                      {CLAIM_STATUS_LABELS[Number(c.status)] ?? c.status}
                    </span>
                  </td>
                  <td>{ts(c.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
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

function eurosToCentimes(eurosStr) {
  const n = Number(String(eurosStr).replace(",", "."));
  if (!Number.isFinite(n) || n <= 0) return 0n;
  return BigInt(Math.round(n * 100));
}
