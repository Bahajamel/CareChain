import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "carechain_mvp_claims_v1";

function loadClaims() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveClaims(claims) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(claims));
}

const ClaimsContext = createContext(null);

export function ClaimsProvider({ children }) {
  const [claims, setClaims] = useState(loadClaims);

  useEffect(() => {
    saveClaims(claims);
  }, [claims]);

  const addClaimFromUpload = useCallback((form, apiResponse) => {
    const data = apiResponse?.data ?? apiResponse;
    const metadata = data?.metadata ?? {};
    const claim = {
      id: crypto.randomUUID(),
      patientAddress: form.patientAddress.trim(),
      providerAddress: form.providerAddress.trim(),
      actType: form.actType.trim(),
      amount: Number(metadata.amount ?? form.amount) || 0,
      documentCid: data.documentCid ?? null,
      metadataCid: data.metadataCid ?? null,
      documentUrl: data.documentUrl ?? null,
      metadataUrl: data.metadataUrl ?? null,
      metadata,
      status: "pending",
      onChainTxHash: null,
      createdAt: new Date().toISOString(),
      decidedAt: null,
    };
    setClaims((prev) => [claim, ...prev]);
    return claim.id;
  }, []);

  const setClaimOnChainDemo = useCallback((claimId) => {
    const fakeHash = `0x${Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")}`;
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId ? { ...c, onChainTxHash: fakeHash } : c
      )
    );
    return fakeHash;
  }, []);

  const setClaimStatus = useCallback((claimId, status) => {
    setClaims((prev) =>
      prev.map((c) =>
        c.id === claimId
          ? {
              ...c,
              status,
              decidedAt: new Date().toISOString(),
            }
          : c
      )
    );
  }, []);

  const value = useMemo(
    () => ({
      claims,
      addClaimFromUpload,
      setClaimOnChainDemo,
      setClaimStatus,
    }),
    [claims, addClaimFromUpload, setClaimOnChainDemo, setClaimStatus]
  );

  return (
    <ClaimsContext.Provider value={value}>{children}</ClaimsContext.Provider>
  );
}

export function useClaims() {
  const ctx = useContext(ClaimsContext);
  if (!ctx) {
    throw new Error("useClaims doit être utilisé dans ClaimsProvider");
  }
  return ctx;
}
