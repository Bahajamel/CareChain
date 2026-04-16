export default function GuestLayout({ children }) {
  return (
    <div className="mvp">
      <a href="#contenu" className="mvp-skip-link">
        Aller au contenu
      </a>
      <header className="mvp-nav mvp-nav--elevated" aria-label="CareChain">
        <div className="mvp-nav__leading">
          <div className="mvp-nav__brand">CareChain</div>
          <p className="mvp-nav__tagline">
            Assurance santé et dossiers médicaux sur chaîne
          </p>
        </div>
      </header>
      <main id="contenu" className="mvp-main">
        {children}
      </main>
    </div>
  );
}
