import { useState, useEffect } from "react";
import { uploadMedicalRecord } from "../api/client.js";
import { useWallet } from "../context/WalletContext.jsx";

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
      setErr("Adresse prestataire requise");
      return;
    }
    setLoading(true);
    setErr(null);
    try {
      const data = await uploadMedicalRecord(form, file);
      const snapshot = { ...form };
      onSuccess?.(data, snapshot);
      // Reset form
      setForm({
        patientAddress: "",
        providerAddress: address || "",
        actType: "",
        amount: "",
      });
      setFile(null);
    } catch (e) {
      setErr(e.message || "Échec de l'envoi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mvp-form" onSubmit={onSubmit}>
      <div className="mvp-field-group">
        <label className="mvp-label">Patient</label>
        <div className="mvp-field-with-btn">
          <input
            className="mvp-input"
            value={form.patientAddress}
            onChange={(e) => setField("patientAddress", e.target.value)}
            placeholder="0x..."
            required
          />
          {address && (
            <button
              type="button"
              className="mvp-btn-mini mvp-btn-mini--fill"
              onClick={() => setField("patientAddress", address)}
            >
              👤 Moi
            </button>
          )}
        </div>
        <span className="mvp-hint">Adresse wallet du patient</span>
      </div>

      <div className="mvp-field-group">
        <label className="mvp-label">Prestataire</label>
        <input
          className="mvp-input"
          value={form.providerAddress}
          onChange={(e) => setField("providerAddress", e.target.value)}
          placeholder="0x..."
          required
          disabled={!!address}
        />
        <span className="mvp-hint">Votre adresse wallet</span>
      </div>

      <div className="mvp-row-2cols">
        <div className="mvp-field-group">
          <label className="mvp-label">Acte médical</label>
          <input
            className="mvp-input"
            value={form.actType}
            onChange={(e) => setField("actType", e.target.value)}
            placeholder="Consultation générale"
            required
          />
        </div>

        <div className="mvp-field-group">
          <label className="mvp-label">Montant (€)</label>
          <input
            className="mvp-input"
            type="number"
            min="0"
            step="any"
            value={form.amount}
            onChange={(e) => setField("amount", e.target.value)}
            placeholder="0.00"
            required
          />
        </div>
      </div>

      <div className="mvp-field-group">
        <label className="mvp-label">Document</label>
        <div className="mvp-file-input">
          <input
            type="file"
            id="file-upload"
            accept=".pdf,.png,.jpg,.jpeg"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            style={{ display: 'none' }}
          />
          <label htmlFor="file-upload" className="mvp-file-label">
            📄 {file ? file.name : "Choisir un fichier"}
          </label>
        </div>
        <span className="mvp-hint">PDF, PNG ou JPG (max 5 Mo)</span>
      </div>

      {err && <div className="mvp-error-msg">{err}</div>}

      <button
        type="submit"
        className="mvp-btn mvp-btn--primary mvp-btn--full"
        disabled={loading}
      >
        {loading ? "⏳ Envoi en cours..." : "📤 Envoyer"}
      </button>
    </form>
  );
}