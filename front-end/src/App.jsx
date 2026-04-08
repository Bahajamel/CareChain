import { Routes, Route, Navigate } from "react-router-dom";
import MvpLayout from "./layout/MvpLayout.jsx";
import WalletConnectPage from "./pages/WalletConnectPage.jsx";
import PatientDashboard from "./pages/PatientDashboard.jsx";
import ProviderDashboard from "./pages/ProviderDashboard.jsx";
import InsurerDashboard from "./pages/InsurerDashboard.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<MvpLayout />}>
        <Route index element={<Navigate to="/patient" replace />} />
        <Route path="connect" element={<WalletConnectPage />} />
        <Route path="patient" element={<PatientDashboard />} />
        <Route path="provider" element={<ProviderDashboard />} />
        <Route path="insurer" element={<InsurerDashboard />} />
      </Route>
      <Route path="*" element={<Navigate to="/patient" replace />} />
    </Routes>
  );
}