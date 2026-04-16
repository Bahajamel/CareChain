import { useWallet } from "../context/WalletContext.jsx";
import AdminDashboard from "./AdminDashboard.jsx";
import DoctorDashboard from "./ProviderDashboard.jsx";
import InsurerDashboard from "./InsurerDashboard.jsx";
import PatientDashboard from "./PatientDashboard.jsx";

const ROLE_LABELS = {
  0: "administrateur",
  1: "patient",
  2: "médecin",
  3: "assureur",
};

export default function DashboardRouter({ role, loading }) {
  const { address } = useWallet();

  if (loading) {
    return (
      <div className="mvp-page" aria-busy="true" aria-label="Chargement du tableau de bord">
        <div className="mvp-card mvp-card--loading">
          <div className="mvp-skeleton mvp-skeleton--title" />
          <div className="mvp-skeleton mvp-skeleton--line" />
          <div className="mvp-skeleton mvp-skeleton--line mvp-skeleton--short" />
          <p className="mvp-muted mvp-loading-caption">
            <span className="mvp-spinner mvp-spinner--inline" aria-hidden />
            Lecture de votre rôle sur la blockchain…
          </p>
        </div>
      </div>
    );
  }

  if (role === null) {
    return (
      <div className="mvp-page">
        <h1 className="mvp-page__title">Accès non configuré</h1>
        <p className="mvp-page__intro">
          Cette adresse n&apos;est pas enregistrée ou n&apos;est plus active dans le contrat
          d&apos;accès. Contactez un administrateur pour obtenir un rôle (patient, médecin ou
          assureur).
        </p>
        <div className="mvp-card mvp-card--warn">
          <p className="mvp-card__title">Adresse connectée</p>
          <p className="mvp-mono">{address}</p>
        </div>
      </div>
    );
  }

  switch (role) {
    case 0:
      return <AdminDashboard />;
    case 1:
      return <PatientDashboard />;
    case 2:
      return <DoctorDashboard />;
    case 3:
      return <InsurerDashboard />;
    default: {
      const label = ROLE_LABELS[role] ?? "inconnu";
      return (
        <div className="mvp-page">
          <h1 className="mvp-page__title">Rôle non pris en charge</h1>
          <p className="mvp-page__intro">
            Le rôle « {label} » (#{role}) n&apos;est pas encore branché dans cette interface.
          </p>
        </div>
      );
    }
  }
}
