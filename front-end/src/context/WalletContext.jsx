import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { BrowserProvider } from "ethers";

const WalletContext = createContext(null);

export function WalletProvider({ children }) {
  const [address, setAddress] = useState(null);
  const [error, setError] = useState(null);
  const [connecting, setConnecting] = useState(false);

  const connect = useCallback(async () => {
    setError(null);
    if (typeof window === "undefined" || !window.ethereum) {
      setError("Aucun portefeuille détecté (installez MetaMask ou équivalent).");
      return;
    }
    setConnecting(true);
    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const addr = await signer.getAddress();
      setAddress(addr);
    } catch (e) {
      setError(e?.shortMessage || e?.message || "Connexion annulée ou refusée.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setError(null);
  }, []);

  useEffect(() => {
    const eth = window.ethereum;
    if (!eth?.on) return undefined;
    const onAccounts = (accounts) => {
      if (!accounts?.length) {
        setAddress(null);
      } else {
        setAddress(accounts[0]);
      }
    };
    eth.on("accountsChanged", onAccounts);
    return () => {
      eth.removeListener?.("accountsChanged", onAccounts);
    };
  }, []);

  const value = useMemo(
    () => ({
      address,
      error,
      connecting,
      connect,
      disconnect,
      isConnected: Boolean(address),
    }),
    [address, error, connecting, connect, disconnect]
  );

  return (
    <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet doit être utilisé dans WalletProvider");
  }
  return ctx;
}