import { useCallback, useEffect, useMemo, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import {
  useClaimContract,
  useMedicalRecord,
  usePolicyContract,
} from "../hooks/useContract.js";
import { fetchIpfsJson } from "../api/client.js";
import {
  CARE_TO_RECORD_COMPAT,
  CLAIM_STATUS_LABELS,
  CARE_TYPE_OPTIONS,
  POLICY_STATUS_LABELS,
  RECORD_TYPE_LABELS,
  eurosToCentimes,
  formatAddr,
  formatEuros,
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
  const [recordMeta, setRecordMeta] = useState({}); // recordId -> metadata JSON
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
  const [simulated, setSimulated] = useState(null); // bigint (centimes)

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

  // Charge les métadonnées IPFS (montant, actType, etc.) depuis r.ipfsHash (CID).
  useEffect(() => {
    if (!records.length) return undefined;
    let cancelled = false;

    (async () => {
      for (const { id, r } of records) {
        if (cancelled) return;
        if (Object.prototype.hasOwnProperty.call(recordMeta, id)) continue;
        const cid = r?.ipfsHash;
        if (!cid) continue;
        try {
          const meta = await fetchIpfsJson(cid);
          if (cancelled) return;
          setRecordMeta((prev) => ({ ...prev, [id]: meta }));
        } catch {
          // anciens records: ipfsHash peut être le documentCid (PDF/image) => pas de JSON
          if (cancelled) return;
          setRecordMeta((prev) => ({ ...prev, [id]: null }));
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [records, recordMeta]);

  function findActivePolicyById(idNumber) {
    return activePolicies.find((row) => row.id === idNumber) || null;
  }

  function findRecordById(idNumber) {
    return records.find((row) => row.id === idNumber) || null;
  }

  function isPolicyRecordCompatible(policy, record) {
    if (!policy || !record) return false;
    const careType = Number(policy.p.careType);
    const recordType = Number(record.r.recordType);
    const allowed = CARE_TO_RECORD_COMPAT[careType];
    if (!Array.isArray(allowed)) return true;
    return allowed.includes(recordType);
  }

  function getCompatibleRecordsForSelectedPolicy() {
    const pidNum = Number(claimForm.policyId);
    const policy = Number.isFinite(pidNum) ? findActivePolicyById(pidNum) : null;
    if (!policy) return records;
    return records.filter((row) => isPolicyRecordCompatible(policy, row));
  }

  const activePolicies = policies.filter((x) => x.active);
  const compatibleRecords = getCompatibleRecordsForSelectedPolicy();

  const recordsSorted = useMemo(
    () => records.slice().sort((a, b) => b.id - a.id),
    [records]
  );

  async function onSimulate() {
    setSubmitErr(null);
    setSimulated(null);
    if (!claimContract) return;
    const policyIdNum = Number(claimForm.policyId);
    const policyId = BigInt(Math.floor(policyIdNum));
    const amountCentimes = eurosToCentimes(claimForm.amountEuros);
    if (policyId <= 0n || amountCentimes <= 0n) {
      setSubmitErr("Police et montant requis pour la simulation.");
      return;
    }
    const policy = findActivePolicyById(policyIdNum);
    if (!policy) {
      setSubmitErr("Police invalide ou inactive.");
      return;
    }
    try {
      const v = await claimContract.simulateReimbursement(policyId, amountCentimes);
      setSimulated(v);
      if (v === 0n && amountCentimes > 0n) {
        setSubmitErr(
          "Le montant demandé ne génère aucun remboursement pour cette police (plafond déjà atteint ou taux nul)."
        );
      }
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
    const policyIdNum = Number(claimForm.policyId);
    const recordIdNum = Number(claimForm.recordId);
    const policyId = BigInt(Math.floor(policyIdNum));
    const recordId = BigInt(Math.floor(recordIdNum));
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

    const selectedPolicy = findActivePolicyById(policyIdNum);
    const selectedRecord = findRecordById(recordIdNum);
    if (!selectedPolicy) {
      setSubmitErr("Police invalide ou inactive.");
      return;
    }
    if (!selectedRecord) {
      setSubmitErr("Dossier médical introuvable.");
      return;
    }
    if (!isPolicyRecordCompatible(selectedPolicy, selectedRecord)) {
      setSubmitErr(
        "Cette police n'est pas compatible avec le type de dossier médical sélectionné."
      );
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
      {loading && (
        <p className="mvp-muted mvp-loading-caption" aria-live="polite">
          <span className="mvp-spinner mvp-spinner--inline" aria-hidden />
          Chargement des données on-chain…
        </p>
      )}

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
                  <td>{formatEuros(p.coverageAmount)}</td>
                  <td>{formatEuros(p.usedAmount)}</td>
                  <td>{p.coverageRate.toString()}</td>
                  <td>{POLICY_STATUS_LABELS[Number(p.status)] ?? p.status}</td>
                  <td>{active ? "Oui" : "Non"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <h2 className="mvp-section-title">Mes dossiers médicaux</h2>
      {!loading && records.length === 0 && isConnected && (
        <p className="mvp-muted">Aucun dossier — un médecin doit en déposer un.</p>
      )}
      {records.length > 0 && (
        <div className="mvp-table-wrap">
          <table className="mvp-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Type</th>
                <th>Montant</th>
                <th>Médecin</th>
                <th>CID / IPFS</th>
                <th>Date</th>
                <th>Valide</th>
              </tr>
            </thead>
            <tbody>
              {recordsSorted.map(({ id, r }) => (
                  <tr key={id}>
                    <td>#{id}</td>
                    <td>{RECORD_TYPE_LABELS[Number(r.recordType)] ?? r.recordType}</td>
                    <td>
                      {recordMeta[id]?.amount != null
                        ? `${Number(recordMeta[id].amount).toLocaleString()} €`
                        : "—"}
                    </td>
                    <td className="mvp-mono">{formatAddr(r.doctor)}</td>
                    <td className="mvp-mono" title={r.ipfsHash}>
                      {String(r.ipfsHash || "—")}
                    </td>
                    <td>{ts(r.timestamp)}</td>
                    <td>{r.isValid ? "Oui" : "Non"}</td>
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
                #{id} — plafond {formatEuros(p.coverageAmount)} —{" "}
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
            disabled={submitBusy || compatibleRecords.length === 0}
          >
            <option value="">
              {compatibleRecords.length === 0
                ? "Aucun dossier compatible avec la police sélectionnée"
                : "— Choisir —"}
            </option>
            {compatibleRecords.map(({ id, r }) => (
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
              Remboursement estimé : <strong>{formatEuros(simulated)}</strong>
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
                  <td>{formatEuros(c.amountRequested)}</td>
                  <td>{formatEuros(c.amountApproved)}</td>
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

// eurosToCentimes est maintenant centralisé dans insuranceUi.js
