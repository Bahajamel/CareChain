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
    setOnChainMsg(
      `Simulation enregistrement on-chain — tx (démo) : ${hash}. Remplacez par l’appel réel au contrat (ethers + ABI) quand il sera prêt.`
    );
  }

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Espace prestataire</h1>
      <p className="mvp-page__intro">
        Téléversez un document médical, renseignez le patient, le type d&apos;acte
        et le montant. Les données partent vers votre backend (Pinata / IPFS).
        Ensuite, déclenchez l&apos;étape on-chain (simulation tant que le contrat
        n&apos;est pas branché).
      </p>

      <div className="mvp-card">
        <h2 className="mvp-card__title">Nouvel acte médical</h2>
        <UploadMedicalRecord onSuccess={handleUploadSuccess} />
      </div>

      {lastClaimId && (
        <div className="mvp-card">
          <h2 className="mvp-card__title">Enregistrement on-chain</h2>
          <p className="mvp-muted">
            Après succès IPFS, votre collègue smart contracts exposera une
            fonction (ex. <code>createRecord(metadataHash, …)</code>). Ici :
            simulation locale pour la démo MVP.
          </p>
          <button
            type="button"
            className="mvp-btn mvp-btn--primary"
            onClick={handleOnChain}
          >
            Lancer la création du record (simulation)
          </button>
          {onChainMsg && <p className="mvp-ok mvp-mt">{onChainMsg}</p>}
        </div>
      )}
    </div>
  );
}
