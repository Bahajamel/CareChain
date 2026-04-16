// src/hooks/useContract.js
import { useEffect, useMemo } from "react";
import { Contract } from "ethers";
import { CONTRACTS } from "../config/contracts";
import { useWallet } from "../context/WalletContext";

export function useContract(contractKey) {
  const { signer, provider } = useWallet();

  useEffect(() => {
    if (!signer?.provider) return;
    signer.provider.getNetwork().then((n) => {
      console.log(`ChainId actuel: ${n.chainId}`);
    });
  }, [signer]);

  return useMemo(() => {
    const config = CONTRACTS[contractKey];
    if (!config) throw new Error(`Contrat inconnu : ${contractKey}`);

    if (signer) {
      //  signer disponible → lecture + écriture
      return new Contract(config.address, config.abi, signer);
    }

    if (provider) {
      //  provider seul → lecture uniquement
      return new Contract(config.address, config.abi, provider);
    }

    //  ni signer ni provider → null
    return null;

  }, [signer, provider, contractKey]);
}



export function useAccessControl()  { return useContract("accessControl");  }
export function useMedicalRecord()  { return useContract("medicalRecord");  }
export function usePolicyContract() { return useContract("policyContract"); }
export function useClaimContract()  { return useContract("claimContract");  }