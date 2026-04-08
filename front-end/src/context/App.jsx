// src/App.jsx
import { useWallet } from "./context/WalletContext";
import WalletConnectPage  from "./pages/WalletConnectPage";
//import AdminDashboard     from "./pages/AdminDashboard";
import InsurerDashboard   from "./pages/InsurerDashboard";
import ProviderDashboard  from "./pages/ProviderDashboard";
import PatientDashboard   from "./pages/PatientDashboard";

export default function App() {
  const { isConnected, role, roleLoading, address } = useWallet();

  // 1. Pas encore connecté
  if (!isConnected) {
    return <WalletConnectPage />;
  }

  // 2. Connecté mais rôle en cours de chargement
  if (roleLoading) {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>Vérification du rôle sur la blockchain...</p>
      </div>
    );
  }

  // 3. Connecté mais pas enregistré dans AccessControl
  if (!role || role === "inactive") {
    return (
      <div style={{ padding: "2rem", textAlign: "center" }}>
        <p>⚠️ Adresse non enregistrée : <code>{address}</code></p>
        <p>Demandez à l'admin de vous enregistrer dans le contrat.</p>
      </div>
    );
  }

  // 4. Redirection selon le rôle
  //if (role === "Admin")   return <AdminDashboard />;
  if (role === "Insurer") return <InsurerDashboard />;
  if (role === "Doctor")  return <ProviderDashboard />;
  if (role === "Patient") return <PatientDashboard />;
}