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
  const [provider, setProvider] = useState(null);
  const [signer, setSigner] = useState(null);
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
      await window.ethereum.request({ method: "eth_requestAccounts" });

      const browserProvider = new BrowserProvider(window.ethereum);
      const walletSigner = await browserProvider.getSigner();
      const addr = await walletSigner.getAddress();

      setProvider(browserProvider);
      setSigner(walletSigner);
      setAddress(addr);
    } catch (e) {
      setError(e?.shortMessage || e?.message || "Connexion annulée ou refusée.");
    } finally {
      setConnecting(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setAddress(null);
    setProvider(null);
    setSigner(null);
    setError(null);
  }, []);

  useEffect(() => {
    const loadExistingConnection = async () => {
      if (typeof window === "undefined" || !window.ethereum) return;

      try {
        const accounts = await window.ethereum.request({
          method: "eth_accounts",
        });

        if (!accounts || !accounts.length) return;

        const browserProvider = new BrowserProvider(window.ethereum);
        const walletSigner = await browserProvider.getSigner();
        const addr = await walletSigner.getAddress();

        setProvider(browserProvider);
        setSigner(walletSigner);
        setAddress(addr);
      } catch (e) {
        console.error("Erreur lors du chargement du wallet existant :", e);
      }
    };

    loadExistingConnection();
  }, []);

  useEffect(() => {
    const eth = typeof window !== "undefined" ? window.ethereum : null;
    if (!eth?.on) return undefined;

    const onAccountsChanged = async (accounts) => {
      if (!accounts?.length) {
        setAddress(null);
        setProvider(null);
        setSigner(null);
        return;
      }

      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const walletSigner = await browserProvider.getSigner();
        const addr = await walletSigner.getAddress();

        setProvider(browserProvider);
        setSigner(walletSigner);
        setAddress(addr);
        setError(null);
      } catch (e) {
        setError(e?.shortMessage || e?.message || "Erreur lors du changement de compte.");
      }
    };

    const onChainChanged = async () => {
      try {
        const browserProvider = new BrowserProvider(window.ethereum);
        const walletSigner = await browserProvider.getSigner();
        const addr = await walletSigner.getAddress();

        setProvider(browserProvider);
        setSigner(walletSigner);
        setAddress(addr);
        setError(null);
      } catch (e) {
        console.error("Erreur lors du changement de réseau :", e);
      }
    };

    eth.on("accountsChanged", onAccountsChanged);
    eth.on("chainChanged", onChainChanged);

    return () => {
      eth.removeListener?.("accountsChanged", onAccountsChanged);
      eth.removeListener?.("chainChanged", onChainChanged);
    };
  }, []);

  const value = useMemo(
    () => ({
      address,
      account: address,
      provider,
      signer,
      error,
      connecting,
      connect,
      disconnect,
      isConnected: Boolean(address),
    }),
    [address, provider, signer, error, connecting, connect, disconnect]
  );

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const ctx = useContext(WalletContext);
  if (!ctx) {
    throw new Error("useWallet doit être utilisé dans WalletProvider");
  }
  return ctx;
}