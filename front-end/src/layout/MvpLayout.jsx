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
        <div className="mvp-nav__brand">CareChain — MVP</div>
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
