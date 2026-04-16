import { useState } from "react";
import { useClaims } from "../context/ClaimsContext.jsx";

export default function InsurerDashboard() {
  const { claims, setClaimStatus } = useClaims();
  const [expandedId, setExpandedId] = useState(null);

  function decide(id, status) {
    setClaimStatus(id, status);
    setExpandedId(null);
  }

  const pending = claims.filter((c) => c.status === "pending");
  const done = claims.filter((c) => c.status !== "pending");

  // Statistiques
  const stats = {
    total: claims.length,
    pending: pending.length,
    treated: done.length,
    approved: done.filter(c => c.status === "approved").length,
    rejected: done.filter(c => c.status === "rejected").length
  };

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">
        <span className="mvp-page__icon">🏛️</span>
        Espace assureur</h1>
      <p className="mvp-page__intro">
        {pending.length} demande(s) en attente de validation
      </p>

      {claims.length === 0 && (
        <div className="mvp-empty-state">
          <p className="mvp-muted">
            Aucune demande. Un prestataire doit d'abord envoyer un dossier
            depuis l'onglet Prestataire.
          </p>
        </div>
      )}

      {claims.length > 0 && (
        <>
          {/* Cartes statistiques compactes */}
          <div className="mvp-stats-grid mvp-stats-grid--compact">
            <div className="mvp-stat-card mvp-stat-card--compact">
              <div className="mvp-stat-card__value">{stats.total}</div>
              <div className="mvp-stat-card__label">Dossiers totaux</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--compact mvp-stat-card--pending">
              <div className="mvp-stat-card__value">{stats.pending}</div>
              <div className="mvp-stat-card__label">À traiter</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--compact">
              <div className="mvp-stat-card__value">{stats.treated}</div>
              <div className="mvp-stat-card__label">Traités</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--compact mvp-stat-card--approved">
              <div className="mvp-stat-card__value">{stats.approved}</div>
              <div className="mvp-stat-card__label">Approuvés</div>
            </div>
            <div className="mvp-stat-card mvp-stat-card--compact mvp-stat-card--rejected">
              <div className="mvp-stat-card__value">{stats.rejected}</div>
              <div className="mvp-stat-card__label">Refusés</div>
            </div>
          </div>

          {/* Section À traiter */}
          {pending.length > 0 && (
            <div className="mvp-section">
              <h2 className="mvp-section__title">À traiter</h2>
              <div className="mvp-cards-list mvp-cards-list--compact">
                {pending.map((c) => (
                  <div key={c.id} className="mvp-claim-card mvp-claim-card--compact mvp-claim-card--pending">
                    <div className="mvp-claim-card__body mvp-claim-card__body--compact">
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">PATIENT</span>
                        <span className="mvp-claim-field__value mvp-mono">
                          {short(c.patientAddress)}
                        </span>
                      </div>
                      
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">PRESTATAIRE</span>
                        <span className="mvp-claim-field__value mvp-mono">
                          {short(c.providerAddress)}
                        </span>
                      </div>
                      
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">ACTE</span>
                        <span className="mvp-claim-field__value">
                          {c.actType}
                        </span>
                      </div>
                      
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">MONTANT</span>
                        <span className="mvp-claim-field__value mvp-claim-field__value--amount">
                          {c.amount} €
                        </span>
                      </div>
                    </div>
                    
                    <div className="mvp-claim-card__actions mvp-claim-card__actions--compact">
                      <button
                        type="button"
                        className="mvp-btn mvp-btn--compact mvp-btn--approved"
                        onClick={() => decide(c.id, "approved")}
                      >
                        Approuver
                      </button>
                      <button
                        type="button"
                        className="mvp-btn mvp-btn--compact mvp-btn--rejected"
                        onClick={() => decide(c.id, "rejected")}
                      >
                        Rejeter
                      </button>
                      <button
                        type="button"
                        className="mvp-btn mvp-btn--compact mvp-btn--ghost"
                        onClick={() =>
                          setExpandedId((id) => (id === c.id ? null : c.id))
                        }
                      >
                        Métadonnées
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {expandedId && (
                <MetadataPanel
                  claim={claims.find((x) => x.id === expandedId)}
                  onClose={() => setExpandedId(null)}
                />
              )}
            </div>
          )}

          {/* Section Historique */}
          {done.length > 0 && (
            <div className="mvp-section">
              <h2 className="mvp-section__title">Historique</h2>
              <div className="mvp-cards-list mvp-cards-list--compact">
                {done.map((c) => (
                  <div key={c.id} className="mvp-claim-card mvp-claim-card--compact mvp-claim-card--history">
                    <div className="mvp-claim-card__header mvp-claim-card__header--compact">
                      <span className={`mvp-status-badge mvp-status-badge--compact mvp-status-badge--${c.status}`}>
                        {c.status === "approved" ? "Approuvé" : "Refusé"}
                      </span>
                    </div>
                    <div className="mvp-claim-card__body mvp-claim-card__body--compact">
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">PATIENT</span>
                        <span className="mvp-claim-field__value mvp-mono">
                          {short(c.patientAddress)}
                        </span>
                      </div>
                      
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">ACTE</span>
                        <span className="mvp-claim-field__value">
                          {c.actType}
                        </span>
                      </div>
                      
                      <div className="mvp-claim-field mvp-claim-field--compact">
                        <span className="mvp-claim-field__label">MONTANT</span>
                        <span className="mvp-claim-field__value">
                          {c.amount} €
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function short(s, n = 6) {
  if (!s) return "—";
  if (s.length <= 2 * n + 3) return s;
  return `${s.slice(0, n)}…${s.slice(-n)}`;
}

function MetadataPanel({ claim, onClose }) {
  if (!claim) return null;
  return (
    <div className="mvp-card mvp-card--meta">
      <div className="mvp-meta-head">
        <h3 className="mvp-card__title">Métadonnées (demande)</h3>
        <button type="button" className="mvp-btn mvp-btn--close" onClick={onClose}>
          ✕
        </button>
      </div>
      {claim.metadataUrl && (
        <p>
          <a href={claim.metadataUrl} target="_blank" rel="noreferrer" className="mvp-link">
            Ouvrir sur IPFS (gateway)
          </a>
        </p>
      )}
      <pre className="mvp-pre">{JSON.stringify(claim.metadata, null, 2)}</pre>
    </div>
  );
}