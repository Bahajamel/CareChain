import { useCallback, useState } from "react";
import { useWallet } from "../context/WalletContext.jsx";

const ROLE_LABELS = {
  0: "Administrateur",
  1: "Patient",
  2: "Médecin",
  3: "Assureur",
};

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function AuthenticatedLayout({ role, roleLoading, children }) {
  const { address, disconnect } = useWallet();
  const [copied, setCopied] = useState(false);

  const onCopy = useCallback(async () => {
    if (!address || !navigator.clipboard?.writeText) return;
    try {
      await navigator.clipboard.writeText(address);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [address]);

  return (
    <div className="mvp">
      <a href="#contenu" className="mvp-skip-link">
        Aller au contenu
      </a>
      <header className="mvp-nav mvp-nav--elevated" aria-label="En-tête CareChain">
        <div className="mvp-nav__leading">
          <div className="mvp-nav__brand">CareChain</div>
        </div>
        <div className="mvp-nav__rolezone" aria-live="polite">
          {roleLoading && (
            <span className="mvp-nav__role-hint">
              <span className="mvp-spinner mvp-spinner--inline" aria-hidden />
              Vérification du rôle…
            </span>
          )}
          {!roleLoading && role !== null && (
            <span className="mvp-role-badge">{ROLE_LABELS[role] ?? `Rôle #${role}`}</span>
          )}
          {!roleLoading && role === null && (
            <span className="mvp-role-badge mvp-role-badge--warn">Compte non enregistré</span>
          )}
        </div>
        <div className="mvp-nav__wallet">
          <span className="mvp-nav__addr" title={address}>
            {shortAddr(address)}
          </span>
          <button
            type="button"
            className="mvp-btn mvp-btn--ghost mvp-btn--small"
            onClick={onCopy}
            disabled={!address}
            title="Copier l’adresse complète"
          >
            {copied ? "Copié" : "Copier"}
          </button>
          <button type="button" className="mvp-btn mvp-btn--ghost" onClick={disconnect}>
            Déconnexion
          </button>
        </div>
      </header>
      <main id="contenu" className="mvp-main">
        {children}
      </main>
    </div>
  );
}
