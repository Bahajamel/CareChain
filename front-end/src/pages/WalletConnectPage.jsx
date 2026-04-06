import { useWallet } from "../context/WalletContext.jsx";

export default function WalletConnectPage() {
  const { connect, disconnect, address, error, connecting, isConnected } =
    useWallet();

  return (
    <div className="mvp-page">
      <h1 className="mvp-page__title">Connexion portefeuille</h1>
      <p className="mvp-page__intro">
        Le patient utilise son adresse pour voir ses dossiers et le statut des
        remboursements. Le prestataire peut utiliser le même portefeuille pour
        signer plus tard les transactions on-chain lorsque les smart contracts
        seront branchés.
      </p>

      <div className="mvp-card">
        {!isConnected ? (
          <>
            <p className="mvp-muted">
              Utilisez MetaMask (ou un wallet compatible EIP-1193) sur le réseau
              de test convenu avec votre équipe.
            </p>
            {error && <p className="mvp-error">{error}</p>}
            <button
              type="button"
              className="mvp-btn mvp-btn--primary"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "Connexion…" : "Connecter le portefeuille"}
            </button>
          </>
        ) : (
          <>
            <p className="mvp-ok">Connecté.</p>
            <p className="mvp-mono">{address}</p>
            <button
              type="button"
              className="mvp-btn mvp-btn--ghost"
              onClick={disconnect}
            >
              Déconnecter
            </button>
          </>
        )}
      </div>
    </div>
  );
}
