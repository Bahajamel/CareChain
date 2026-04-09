import { useEffect, useState } from "react";
import { useAccessControl } from "./useContract";
import { useWallet } from "../context/WalletContext";

export function useUserRole() {
  const { address } = useWallet();
  const accessControl = useAccessControl();

  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Réinitialise le loading si address/contrat change
    if (!address || !accessControl) {
      setLoading(false);
      return;
    }

    setLoading(true);

const fetchRole = async () => {
  try {
    const r = await accessControl.checkRole(address);
    setRole(Number(r)); 
  } catch (e) {
    console.error("Erreur récupération rôle:", e);
    setRole(null);
  } finally {
    setLoading(false);
  }
};

    fetchRole();
  }, [address, accessControl]);

  return { role, loading };
}