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

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Espace assureur</h1>
      <p className="mvp-page__intro">
        Liste des demandes soumises (MVP : données issues des envois prestataire
        + stockage navigateur). Consultez les métadonnées, puis approuvez ou
        refusez. La synchronisation blockchain pourra remplacer ce stockage
        local plus tard.
      </p>

      {claims.length === 0 && (
        <p className="mvp-muted">
          Aucune demande. Un prestataire doit d&apos;abord envoyer un dossier
          depuis l&apos;onglet Prestataire.
        </p>
      )}

      {pending.length > 0 && (
        <>
          <h2 className="mvp-section-title">À traiter</h2>
          <div className="mvp-table-wrap">
            <table className="mvp-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Prestataire</th>
                  <th>Acte</th>
                  <th>Montant</th>
                  <th>On-chain (démo)</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pending.map((c) => (
                  <tr key={c.id}>
                    <td className="mvp-mono">{short(c.patientAddress)}</td>
                    <td className="mvp-mono">{short(c.providerAddress)}</td>
                    <td>{c.actType}</td>
                    <td>{c.amount}</td>
                    <td>{c.onChainTxHash ? short(c.onChainTxHash, 8) : "—"}</td>
                    <td>
                      <div className="mvp-row-btns">
                        <button
                          type="button"
                          className="mvp-btn mvp-btn--small mvp-btn--primary"
                          onClick={() => decide(c.id, "approved")}
                        >
                          Approuver
                        </button>
                        <button
                          type="button"
                          className="mvp-btn mvp-btn--small mvp-btn--danger"
                          onClick={() => decide(c.id, "rejected")}
                        >
                          Rejeter
                        </button>
                        <button
                          type="button"
                          className="mvp-btn mvp-btn--small mvp-btn--ghost"
                          onClick={() =>
                            setExpandedId((id) => (id === c.id ? null : c.id))
                          }
                        >
                          Métadonnées
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {expandedId && (
            <MetadataPanel
              claim={claims.find((x) => x.id === expandedId)}
              onClose={() => setExpandedId(null)}
            />
          )}
        </>
      )}

      {done.length > 0 && (
        <>
          <h2 className="mvp-section-title">Historique</h2>
          <div className="mvp-table-wrap">
            <table className="mvp-table">
              <thead>
                <tr>
                  <th>Patient</th>
                  <th>Acte</th>
                  <th>Montant</th>
                  <th>Décision</th>
                </tr>
              </thead>
              <tbody>
                {done.map((c) => (
                  <tr key={c.id}>
                    <td className="mvp-mono">{short(c.patientAddress)}</td>
                    <td>{c.actType}</td>
                    <td>{c.amount}</td>
                    <td>
                      <span className={`mvp-tag mvp-tag--${c.status}`}>
                        {c.status === "approved" ? "Approuvé" : "Refusé"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
        <button type="button" className="mvp-btn mvp-btn--ghost" onClick={onClose}>
          Fermer
        </button>
      </div>
      {claim.metadataUrl && (
        <p>
          <a href={claim.metadataUrl} target="_blank" rel="noreferrer">
            Ouvrir sur IPFS (gateway)
          </a>
        </p>
      )}
      <pre className="mvp-pre">{JSON.stringify(claim.metadata, null, 2)}</pre>
    </div>
  );
}
