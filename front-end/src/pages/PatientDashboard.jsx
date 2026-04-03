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

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Espace patient</h1>
      <p className="mvp-page__intro">
        Consultez vos dossiers médicaux déposés par un prestataire, le statut de
        traitement par l&apos;assureur et le montant remboursé lorsque la
        demande est approuvée.
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
        <p className="mvp-muted">Aucun dossier pour cette adresse pour l’instant.</p>
      )}

      {isConnected && mine.length > 0 && (
        <div className="mvp-table-wrap">
          <table className="mvp-table">
            <thead>
              <tr>
                <th>Acte</th>
                <th>Montant</th>
                <th>Statut demande</th>
                <th>Remboursement</th>
                <th>IPFS</th>
              </tr>
            </thead>
            <tbody>
              {mine.map((c) => (
                <tr key={c.id}>
                  <td>{c.actType}</td>
                  <td>{c.amount}</td>
                  <td>
                    <span className={`mvp-tag mvp-tag--${c.status}`}>
                      {c.status === "pending" && "En attente"}
                      {c.status === "approved" && "Approuvé"}
                      {c.status === "rejected" && "Refusé"}
                    </span>
                  </td>
                  <td>
                    {c.status === "approved"
                      ? `${c.amount} (MVP — même base que la demande)`
                      : "—"}
                  </td>
                  <td>
                    {c.metadataUrl ? (
                      <a
                        href={c.metadataUrl}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Métadonnées
                      </a>
                    ) : (
                      "—"
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
