import { useState, useEffect } from "react";
import { uploadMedicalRecord } from "../api/client.js";
import { useWallet } from "../context/WalletContext.jsx";

/**
 * Formulaire prestataire : envoi au backend (IPFS + métadonnées).
 * parent peut passer onSuccess(apiResponse, formSnapshot)
 */
export default function UploadMedicalRecord({ onSuccess }) {
  const { address } = useWallet();
  const [form, setForm] = useState({
    patientAddress: "",
    providerAddress: "",
    actType: "",
    amount: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState(null);

  useEffect(() => {
    if (address) {
      setForm((f) => ({ ...f, providerAddress: address }));
    }
  }, [address]);

  function setField(name, value) {
    setForm((f) => ({ ...f, [name]: value }));
  }

  async function onSubmit(e) {
    e.preventDefault();
    if (!file) {
      setErr("Ajoutez un document.");
      return;
    }
    if (!form.providerAddress.trim()) {
      setErr("Adresse prestataire requise (connectez le portefeuille ou saisissez-la).");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const data = await uploadMedicalRecord(form, file);
      const snapshot = { ...form };
      onSuccess?.(data, snapshot);
    } catch (e) {
      setErr(e.message || "Échec de l’envoi au backend.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mvp-form" onSubmit={onSubmit}>
      <label className="mvp-label">Adresse patient (wallet)</label>
      <p className="mvp-form-hint">
        À saisir pour la personne concernée. En démo solo : utilisez le bouton
        ci-dessous pour mettre votre propre adresse et voir le dossier dans
        l’onglet Patient.
      </p>
      <input
        className="mvp-input"
        value={form.patientAddress}
        onChange={(e) => setField("patientAddress", e.target.value)}
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
          Remplir avec mon portefeuille (test patient)
        </button>
      )}

      <label className="mvp-label">Adresse prestataire (wallet)</label>
      <p className="mvp-form-hint">
        Pré-remplie avec votre portefeuille : c’est le médecin / établissement
        qui envoie l’acte au backend.
      </p>
      <input
        className="mvp-input"
        value={form.providerAddress}
        onChange={(e) => setField("providerAddress", e.target.value)}
        placeholder="0x…"
        autoComplete="off"
        required
      />

      <label className="mvp-label">Type d&apos;acte</label>
      <input
        className="mvp-input"
        value={form.actType}
        onChange={(e) => setField("actType", e.target.value)}
        placeholder="Consultation, imagerie…"
        required
      />

      <label className="mvp-label">Montant</label>
      <input
        className="mvp-input"
        type="number"
        min="0"
        step="any"
        value={form.amount}
        onChange={(e) => setField("amount", e.target.value)}
        required
      />

      <label className="mvp-label">Document (PDF, PNG, JPEG — max 5 Mo)</label>
      <input
        type="file"
        accept=".pdf,.png,.jpg,.jpeg,image/png,image/jpeg,application/pdf"
        onChange={(e) => setFile(e.target.files?.[0] || null)}
        required
      />

      {err && <p className="mvp-error">{err}</p>}

      <button
        type="submit"
        className="mvp-btn mvp-btn--primary"
        disabled={loading}
      >
        {loading ? "Envoi au backend…" : "Envoyer au backend (IPFS)"}
      </button>
    </form>
  );
}
