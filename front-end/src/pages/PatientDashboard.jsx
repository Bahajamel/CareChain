import { useMemo } from "react";
import { useWallet } from "../context/WalletContext.jsx";
import { useClaims } from "../context/ClaimsContext.jsx";
import { Link } from "react-router-dom";

function sameAddr(a, b) {
  if (!a || !b) return false;
  return a.toLowerCase() === b.toLowerCase();
}

export default function PatientDashboard() {
  const { address, isConnected } = useWallet();
  const { claims } = useClaims();

  const mine = useMemo(
    () => claims.filter((c) => sameAddr(c.patientAddress, address)),
    [claims, address]
  );

  // Statistiques
  const stats = useMemo(() => {
    const total = mine.length;
    const approved = mine.filter(c => c.status === "approved").length;
    const pending = mine.filter(c => c.status === "pending").length;
    const rejected = mine.filter(c => c.status === "rejected").length;
    return { total, approved, pending, rejected };
  }, [mine]);

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">
        <span className="mvp-page__icon">👤</span>Espace patient</h1>
      <p className="mvp-page__intro">
        Consultez vos dossiers médicaux déposés par un prestataire, le statut de
        traitement par l'assureur et le montant remboursé lorsque la demande est
        approuvée.
      </p>

      {!isConnected && (
        <div className="mvp-card mvp-card--warn">
          <p>
            Connectez votre portefeuille pour filtrer vos dossiers.{" "}
            <Link to="/connect">Page portefeuille</Link>
          </p>
        </div>
      )}

      {isConnected && mine.length === 0 && (
        <div className="mvp-empty-state">
          <p className="mvp-muted">Aucun dossier pour cette adresse pour l'instant.</p>
        </div>
      )}

      {isConnected && mine.length > 0 && (
        <>
          {/* Cartes statistiques */}
          <div className="mvp-stats-grid">
            <div className="mvp-stat-card">
              <div className="mvp-stat-card__value">{stats.total}</div>
              <div className="mvp-stat-card__label">Dossiers totaux</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--approved">
              <div className="mvp-stat-card__value">{stats.approved}</div>
              <div className="mvp-stat-card__label">Approuvés</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--pending">
              <div className="mvp-stat-card__value">{stats.pending}</div>
              <div className="mvp-stat-card__label">En attente</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--rejected">
              <div className="mvp-stat-card__value">{stats.rejected}</div>
              <div className="mvp-stat-card__label">Refusés</div>
            </div>
          </div>

          {/* Section dossiers actifs */}
          <div className="mvp-section">
            <h2 className="mvp-section__title">Dossiers actifs</h2>
            <div className="mvp-cards-list">
              {mine.map((c) => (
                <div key={c.id} className="mvp-claim-card">
                  <div className="mvp-claim-card__header">
                    <span className={`mvp-status-badge mvp-status-badge--${c.status}`}>
                      {c.status === "pending" && "En attente"}
                      {c.status === "approved" && "Approuvé"}
                      {c.status === "rejected" && "Refusé"}
                    </span>
                  </div>
                  
                  <div className="mvp-claim-card__body">
                    <div className="mvp-claim-field">
                      <span className="mvp-claim-field__label">ACTE MÉDICAL</span>
                      <span className="mvp-claim-field__value">{c.actType}</span>
                    </div>
                    
                    <div className="mvp-claim-field">
                      <span className="mvp-claim-field__label">MONTANT</span>
                      <span className="mvp-claim-field__value">{c.amount} €</span>
                    </div>
                    
                    <div className="mvp-claim-field">
                      <span className="mvp-claim-field__label">STATUT</span>
                      <span className="mvp-claim-field__value">
                        {c.status === "pending" && "En attente"}
                        {c.status === "approved" && "Approuvé"}
                        {c.status === "rejected" && "Refusé"}
                      </span>
                    </div>
                    
                    <div className="mvp-claim-field">
                      <span className="mvp-claim-field__label">REMBOURSEMENT</span>
                      <span className="mvp-claim-field__value mvp-claim-field__value--amount">
                        {c.status === "approved" ? `${c.amount} €` : "—"}
                      </span>
                    </div>
                    
                    {c.metadataUrl && (
                      <div className="mvp-claim-field">
                        <span className="mvp-claim-field__label">Métadonnées</span>
                        <a
                          href={c.metadataUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="mvp-link"
                        >
                          Voir les métadonnées
                        </a>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}