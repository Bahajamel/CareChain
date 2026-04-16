import { useWallet } from "./context/WalletContext.jsx";
import { useUserRole } from "./hooks/useUserRole.js";
import AuthenticatedLayout from "./layout/AuthenticatedLayout.jsx";
import GuestLayout from "./layout/GuestLayout.jsx";
import DashboardRouter from "./pages/DashboardRouter.jsx";
import WalletConnectPage from "./pages/WalletConnectPage.jsx";

function ConnectedApp() {
  const { role, loading } = useUserRole();

  return (
    <AuthenticatedLayout role={role} roleLoading={loading}>
      <DashboardRouter role={role} loading={loading} />
    </AuthenticatedLayout>
  );
}

export default function App() {
  const { isConnected } = useWallet();

  if (!isConnected) {
    return (
      <GuestLayout>
        <WalletConnectPage />
      </GuestLayout>
    );
  }

  return <ConnectedApp />;
}
