import { useState, useEffect, useCallback } from 'react';
import { BrowserProvider, Contract, parseUnits, formatUnits } from 'ethers';
import axios from 'axios';
import { 
  VAULT_ADDR, 
  USDCE_ADDR, 
  STRATEGIES, 
  ADVISOR_URL 
} from '../constants/contracts';
import { Strategy, RecommendationResponse } from '../types';

// Import ABIs
const VaultABI = [
  "function totalAssets() external view returns (uint256)",
  "function balanceOf(address) external view returns (uint256)",
  "function totalSupply() external view returns (uint256)",
  "function deposit(uint256) external",
  "function withdraw(uint256) external"
];

const StrategyABI = [
  "function apy() external view returns (uint256)"
];

export default function useVault(provider: BrowserProvider | null, account: string) {
  const [tvl, setTvl] = useState<string>("…");
  const [apys, setApys] = useState<Strategy[]>([]);
  const [recommendation, setRecommendation] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [userShares, setUserShares] = useState<string>("0");
  const [shareValue, setShareValue] = useState<string>("0");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isTransacting, setIsTransacting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [advisorError, setAdvisorError] = useState<string | null>(null);

  // Load vault data whenever provider or account changes
  useEffect(() => {
    if (!provider) return;
    
    async function fetchVaultData() {
      setIsLoading(true);
      setError(null);
      setAdvisorError(null);
      
      try {
        const vault = new Contract(VAULT_ADDR, VaultABI, provider);

        // 1) TVL
        const assets = await vault.totalAssets();
        const tvlFormatted = formatUnits(assets, 6);
        setTvl(tvlFormatted);

        // 2) APYs
        const apyList = await Promise.all(
          STRATEGIES.map(async ({ name, address }) => {
            const strat = new Contract(address, StrategyABI, provider);
            const raw = await strat.apy(); // basis points
            return { name, address, apy: Number(raw) / 100 };
          })
        );
        setApys(apyList);

        // 3) AI recommendation with enhanced error handling
        try {
          const { data } = await axios.post<RecommendationResponse>(
            ADVISOR_URL, 
            { strategies: apyList },
            {
              timeout: 5000, // 5 second timeout
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          
          if (data && data.strategy) {
            setRecommendation(data.strategy);
            setReason(data.reason || '');
            setAdvisorError(null);
          } else {
            throw new Error('Invalid response from advisor service');
          }
        } catch (err: any) {
          console.warn("Advisor service error:", err);
          setAdvisorError(
            err.code === 'ECONNABORTED' 
              ? 'Advisor service timeout - using highest APY strategy'
              : 'Advisor service unavailable - using highest APY strategy'
          );
          
          // Fallback: Recommend strategy with highest APY
          const highestApy = apyList.reduce((prev, current) => 
            prev.apy > current.apy ? prev : current
          );
          setRecommendation(highestApy.name);
          setReason(`This strategy currently offers the highest APY of ${highestApy.apy}%`);
        }

        // 4) User shares & share value
        if (account) {
          const [shares, totalSupply] = await Promise.all([
            vault.balanceOf(account),
            vault.totalSupply()
          ]);
          const sharesFmt = formatUnits(shares, 18);
          setUserShares(sharesFmt);
          
          // shareValue = (TVL * shares) / totalSupply
          const totalSupplyFmt = Number(formatUnits(totalSupply, 18));
          const val = totalSupplyFmt > 0
            ? (Number(tvlFormatted) * Number(sharesFmt) / totalSupplyFmt).toFixed(6)
            : "0";
          setShareValue(val);
        }
      } catch (err) {
        console.error("Error fetching vault data:", err);
        setError("Failed to load vault data. Please try again.");
      } finally {
        setIsLoading(false);
      }
    }

    fetchVaultData();
  }, [provider, account]);

  // Handle deposit/withdraw
  const handleAction = useCallback(async (action: 'deposit' | 'withdraw', amount: string) => {
    if (!provider || !account) {
      throw new Error("Please connect your wallet first");
    }
    if (!amount || parseFloat(amount) <= 0) {
      throw new Error("Please enter a valid amount");
    }
    
    setIsTransacting(true);
    setError(null);
    
    try {
      const signer = await provider.getSigner();
      const vault = new Contract(VAULT_ADDR, VaultABI, signer);
      const amt = parseUnits(amount, 6);

      if (action === "deposit") {
        const usdcE = new Contract(
          USDCE_ADDR,
          ["function approve(address,uint256) external returns (bool)"],
          signer
        );
        const approveTx = await usdcE.approve(VAULT_ADDR, amt);
        await approveTx.wait();
        
        const depositTx = await vault.deposit(amt);
        await depositTx.wait();
      } else {
        const withdrawTx = await vault.withdraw(amt);
        await withdrawTx.wait();
      }

      // Refresh vault data
      const assets = await vault.totalAssets();
      setTvl(formatUnits(assets, 6));
      
      const [shares, totalSupply] = await Promise.all([
        vault.balanceOf(account),
        vault.totalSupply()
      ]);
      const sharesFmt = formatUnits(shares, 18);
      setUserShares(sharesFmt);
      
      const totalSupplyFmt = Number(formatUnits(totalSupply, 18));
      const val = totalSupplyFmt > 0
        ? (Number(formatUnits(assets, 6)) * Number(sharesFmt) / totalSupplyFmt).toFixed(6)
        : "0";
      setShareValue(val);
      
      return true;
    } catch (err: any) {
      console.error(`Failed to ${action}:`, err);
      setError(`Failed to ${action}: ${err.message || "Unknown error"}`);
      throw err;
    } finally {
      setIsTransacting(false);
    }
  }, [provider, account]);

  return {
    tvl,
    apys,
    recommendation,
    reason,
    userShares,
    shareValue,
    isLoading,
    isTransacting,
    error,
    advisorError,
    handleAction
  };
}