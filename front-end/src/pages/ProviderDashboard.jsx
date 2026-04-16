import UploadMedicalRecord from "./UploadMedicalRecord.jsx";

export default function ProviderDashboard() {
  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Espace prestataire</h1>
      <p className="mvp-page__intro">
        Téléversez un document médical, renseignez le patient, le type d&apos;acte et le
        montant. Les données sont envoyées au backend (IPFS), puis enregistrées on-chain avec
        le contrat <strong>MedicalRecord</strong>. Les demandes de remboursement (claims) sont
        gérées par le patient et l&apos;assureur.
      </p>

      <div className="mvp-card">
        <h2 className="mvp-card__title">Nouvel acte médical</h2>
        <UploadMedicalRecord />
      </div>
    </div>
  );
}