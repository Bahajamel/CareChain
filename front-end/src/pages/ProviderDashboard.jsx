import { useState } from "react";
import UploadMedicalRecord from "./UploadMedicalRecord.jsx";
import { useClaims } from "../context/ClaimsContext.jsx";

export default function ProviderDashboard() {
  const { addClaimFromUpload, setClaimOnChainDemo } = useClaims();
  const [lastClaimId, setLastClaimId] = useState(null);
  const [onChainMsg, setOnChainMsg] = useState(null);

  function handleUploadSuccess(apiResponse, formSnapshot) {
    const id = addClaimFromUpload(formSnapshot, apiResponse);
    setLastClaimId(id);
    setOnChainMsg(null);
  }

  function handleOnChain() {
    if (!lastClaimId) return;
    const hash = setClaimOnChainDemo(lastClaimId);
    setOnChainMsg(hash);
  }

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">
        <span className="mvp-page__icon">🏥</span>
        Espace prestataire
      </h1>

      <div className="mvp-card">
        <h2 className="mvp-card__title">Nouvel acte médical</h2>
        <UploadMedicalRecord onSuccess={handleUploadSuccess} />
      </div>

      {lastClaimId && (
        <div className="mvp-card mvp-card--compact">
          <div className="mvp-card__row">
            <span className="mvp-badge-success">✓ Dossier créé</span>
            <span className="mvp-card__id">ID: {lastClaimId}</span>
          </div>
          <button
            type="button"
            className="mvp-btn-mini mvp-btn-mini--chain"
            onClick={handleOnChain}
          >
            ⛓️ Enregistrer sur la blockchain
          </button>
          {onChainMsg && (
            <div className="mvp-tx-success">
              <span className="mvp-tx-success__icon">✓</span>
              <span className="mvp-tx-success__hash">{onChainMsg}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}