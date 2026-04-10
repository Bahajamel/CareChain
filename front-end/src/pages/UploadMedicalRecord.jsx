import { useState, useEffect }    from "react";
import { uploadMedicalRecord }    from "../api/client.js";
import { useWallet }              from "../context/WalletContext.jsx";
import { useMedicalRecord }       from "../hooks/useContract.js";

// Mapping actType → RecordType enum du smart contract
const RECORD_TYPE_MAP = {
  "Consultation":  0,
  "Prescription":  1,
  "LabResult":     2,
  "Imaging":       3,
  "Surgery":       4,
  "Other":         5,
};

export default function UploadMedicalRecord({ onSuccess }) {
  const { address }      = useWallet();
  const medicalRecord    = useMedicalRecord();
  // ↑ instance du contrat MedicalRecord signé par MetaMask

  const [form, setForm] = useState({
    patientAddress:  "",
    providerAddress: "",
    actType:         "Consultation",
    amount:          "",
  });
  const [file,    setFile]    = useState(null);
  const [loading, setLoading] = useState(false);
  const [step,    setStep]    = useState("");
  // ↑ message d'étape pour l'utilisateur
  const [err,     setErr]     = useState(null);

  useEffect(() => {
    if (address) {
      setForm(f => ({ ...f, providerAddress: address }));
    }
  }, [address]);

  function setField(name, value) {
    setForm(f => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) {
      setErr("Ajoutez un document.");
      return;
    }
    if (!form.providerAddress.trim()) {
      setErr("Adresse prestataire requise.");
      return;
    }
    if (!medicalRecord) {
      setErr("Contrat MedicalRecord non disponible.");
      return;
    }

    setLoading(true);
    setErr(null);

    try {
      // ── ETAPE 1 : Upload IPFS via backend ──────────────────
      setStep(" Upload du document sur IPFS...");
      const result = await uploadMedicalRecord(form, file);
      const { documentCid, fileHash } = result.data;

      // S'assurer que fileHash a le préfixe 0x
    const fileHashBytes32 = fileHash.startsWith("0x") 
  ? fileHash 
  : `0x${fileHash}`;

      console.log("IPFS upload OK :", documentCid);
      console.log("fileHash       :", fileHash);

      // ── ETAPE 2 : Appel addRecord() via MetaMask ───────────
      setStep(" Enregistrement sur la blockchain (MetaMask)...");

      const recordType = RECORD_TYPE_MAP[form.actType] ?? 5;
      // ↑ convertit "Consultation" → 0, "Prescription" → 1, etc.

      console.log("patient:", form.patientAddress.trim());
      console.log("ipfsHash:", documentCid);
      console.log("fileHash:", fileHashBytes32);
      console.log("recordType:", recordType);
      console.log("RECORD_TYPE_MAP:", RECORD_TYPE_MAP);
      console.log("medicalRecord runner:", medicalRecord?.runner);
      console.log("runner type:", medicalRecord?.runner?.constructor?.name);
      try {
        const addr = await medicalRecord?.runner?.getAddress?.();
        console.log("signer address:", addr);
      } catch(e) {
        console.log("pas de signer:", e.message);
}
      const tx = await medicalRecord.addRecord(
        form.patientAddress.trim(), // adresse du patient
        documentCid,                // ipfsHash
        fileHashBytes32,                   // fileHash keccak256
        recordType                  // enum RecordType
      );
      // ↑ MetaMask s'ouvre et demande confirmation au Doctor

      setStep("⏳ Transaction en cours de validation...");
      const receipt = await tx.wait();
      // ↑ attend que la transaction soit minée

      console.log("Transaction minée :", receipt.hash);

      // ── ETAPE 3 : Récupérer le recordId depuis l'event ─────
      const iface    = medicalRecord.interface;
      const event    = receipt.logs
        .map(log => { try { return iface.parseLog(log); } catch { return null; } })
        .filter(Boolean)
        .find(e => e.name === "MedicalRecordAdded");

      const recordId = event?.args?.recordId?.toString() ?? null;

      setStep("✅ Dossier médical enregistré !");

      // ── ETAPE 4 : Notifier le parent ───────────────────────
      onSuccess?.({
        ...result,
        data: {
          ...result.data,
          recordId,
          txHash:      receipt.hash,
          blockNumber: receipt.blockNumber.toString(),
        }
      }, { ...form });

    } catch (e) {
  console.error("Erreur complète:", e);
  console.error("Raison:", e?.reason);
  console.error("Data:", e?.data);
  console.error("Error args:", e?.revert?.args);
  
  // Pour décoder le revert manuellement
  if (e?.data) {
    try {
      const decoded = medicalRecord.interface.parseError(e.data);
      console.error("Erreur décodée:", decoded);
    } catch {
      console.error("Data brute:", e.data);
    }
  }
} finally {
      setLoading(false);
      setStep("");
    }
  }

  return (
    <form className="mvp-form" onSubmit={onSubmit}>

      <label className="mvp-label">Adresse patient (wallet)</label>
      <input
        className="mvp-input"
        value={form.patientAddress}
        onChange={e => setField("patientAddress", e.target.value)}
        placeholder="0x…"
        autoComplete="off"
        required
      />
      {address && (
        <button
          type="button"
          className="mvp-btn mvp-btn--ghost mvp-btn--small mvp-btn--block"
          onClick={() => setField("patientAddress", address)}
        >
          Utiliser mon adresse (test)
        </button>
      )}

      <label className="mvp-label">Adresse prestataire (wallet)</label>
      <input
        className="mvp-input"
        value={form.providerAddress}
        onChange={e => setField("providerAddress", e.target.value)}
        placeholder="0x…"
        autoComplete="off"
        required
      />

      <label className="mvp-label">Type d'acte</label>
      <select
        className="mvp-input"
        value={form.actType}
        onChange={e => setField("actType", e.target.value)}
      >
        {Object.keys(RECORD_TYPE_MAP).map(type => (
          <option key={type} value={type}>{type}</option>
        ))}
      </select>

      <label className="mvp-label">Montant (€)</label>
      <input
        className="mvp-input"
        type="number"
        min="0"
        step="any"
        value={form.amount}
        onChange={e => setField("amount", e.target.value)}
        required
      />

      <label className="mvp-label">
        Document (PDF, PNG, JPEG — max 5 Mo)
      </label>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg"
        onChange={e => setFile(e.target.files?.[0] || null)}
        required
      />

      {step && <p style={{ color: "blue" }}>{step}</p>}
      {err  && <p className="mvp-error">{err}</p>}

      <button
        type="submit"
        className="mvp-btn mvp-btn--primary"
        disabled={loading || !medicalRecord}
      >
        {loading ? step || "En cours..." : "Envoyer le dossier médical"}
      </button>

    </form>
  );
}