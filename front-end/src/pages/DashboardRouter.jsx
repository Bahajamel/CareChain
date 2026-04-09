import { useUserRole } from "../hooks/useUserRole";
import { useWallet } from "../context/WalletContext";
import AdminDashboard from "./AdminDashboard";
import DoctorDashboard from "./ProviderDashboard";
import InsurerDashboard from "./InsurerDashboard";
import PatientDashboard from "./PatientDashboard";

export default function DashboardRouter() {

  const { address } = useWallet();
  const { role, loading } = useUserRole();

  if (loading) return <p>Loading...</p>;
  if (role === null) return <p>Utilisateur non enregistré</p>;

  switch (role) {
    case 0:
      return <AdminDashboard />;
    case 1:
      return <PatientDashboard />;
    case 2:
      return <DoctorDashboard />;
    case 3:
      return <InsurerDashboard />;
    default:
      return <p>Rôle inconnu</p>;
  }
}