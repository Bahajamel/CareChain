import { NavLink, Outlet } from "react-router-dom";
import { useWallet } from "../context/WalletContext.jsx";

function shortAddr(a) {
  if (!a) return "";
  return `${a.slice(0, 6)}…${a.slice(-4)}`;
}

export default function MvpLayout() {
  const { address, connect, disconnect, connecting, isConnected } = useWallet();

  return (
    <div className="mvp">
      <header className="mvp-nav">
        <div className="mvp-nav__brand">
          <div className="mvp-logo">
            <svg className="mvp-logo__svg" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M16 2L4 9L16 16L28 9L16 2Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M4 9V23L16 30L28 23V9" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              <path d="M16 16V30" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M10 12L16 8L22 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="16" cy="21" r="2" fill="currentColor"/>
              <path d="M12 24L14 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              <path d="M20 24L18 22" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </div>
          <span>CareChain</span>
        </div>
        <nav className="mvp-nav__links" aria-label="Rôles">
          <NavLink
            to="/patient"
            className={({ isActive }) =>
              `mvp-nav__link${isActive ? " mvp-nav__link--active" : ""}`
            }
          >
            Patient
          </NavLink>
          <NavLink
            to="/provider"
            className={({ isActive }) =>
              `mvp-nav__link${isActive ? " mvp-nav__link--active" : ""}`
            }
          >
            Prestataire
          </NavLink>
          <NavLink
            to="/insurer"
            className={({ isActive }) =>
              `mvp-nav__link${isActive ? " mvp-nav__link--active" : ""}`
            }
          >
            Assureur
          </NavLink>
          <NavLink
            to="/connect"
            className={({ isActive }) =>
              `mvp-nav__link mvp-nav__link--muted${isActive ? " mvp-nav__link--active" : ""}`
            }
          >
            Portefeuille
          </NavLink>
        </nav>
        <div className="mvp-nav__wallet">
          {isConnected ? (
            <>
              <span className="mvp-nav__addr" title={address}>
                {shortAddr(address)}
              </span>
              <button
                type="button"
                className="mvp-btn mvp-btn--ghost"
                onClick={disconnect}
              >
                Déconnecter
              </button>
            </>
          ) : (
            <button
              type="button"
              className="mvp-btn mvp-btn--primary"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? "…" : "Connecter"}
            </button>
          )}
        </div>
      </header>
      <main className="mvp-main">
        <Outlet />
      </main>
    </div>
  );
}