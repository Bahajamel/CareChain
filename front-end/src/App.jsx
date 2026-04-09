import { useWallet } from "./context/WalletContext";
import DashboardRouter from "./pages/DashboardRouter";

function App() {
  const { connect, isConnected } = useWallet();

  if (!isConnected) {
    return <button onClick={connect}>Connect Wallet</button>;
  }

  return <DashboardRouter />;
}

export default App;