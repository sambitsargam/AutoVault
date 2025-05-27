// frontend/src/App.js

import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BrowserProvider,
  Contract,
  parseUnits,
  formatUnits
} from "ethers";
import VaultABI from "./abis/Vault.json";
import StrategyABI from "./abis/Strategy.json";

const RPC_URL     = "https://rpc.xinfin.network";
const VAULT_ADDR  = "0xc8824EbFE83212F45Ba43f8A501f18A08497D2D9";
const USDCE_ADDR  = "0x2a8e898b6242355c290e1f4fc966b8788729a4d4";
const ADVISOR_URL = "http://localhost:3333/choose";

const STRATEGIES = [
  { name: "AlphaYield",  address: "0x8FBE514b89fE16AF232420B498D43c0D684939DD" },
  { name: "BetaBoost",   address: "0x88D56C9Eb481cfd05dA7827247f67fE63ed62C81" },
  { name: "GammaGrowth", address: "0x80B341ad21437ff14C22E9f77ed6940B38A667A1" },
];

function App() {
  const [provider, setProvider] = useState(null);
  const [account, setAccount]   = useState("");
  const [network, setNetwork]   = useState("");
  const [tvl, setTvl]           = useState("…");
  const [apys, setApys]         = useState([]);
  const [recommendation, setRecommendation] = useState("");
  const [reason, setReason]     = useState("");
  const [userShares, setUserShares] = useState("0");
  const [shareValue, setShareValue] = useState("0");
  const [amount, setAmount]     = useState("");
  const [theme, setTheme]       = useState("light");

  // Initialize provider on mount
  useEffect(() => {
    if (window.ethereum) {
      const p = new BrowserProvider(window.ethereum);
      setProvider(p);
      p.getNetwork().then(net => setNetwork(`${net.name} (chainId ${net.chainId})`));
    } else {
      const p = new BrowserProvider(RPC_URL);
      setProvider(p);
      p.getNetwork().then(net => setNetwork(`${net.name} (chainId ${net.chainId})`));
    }
  }, []);

  // Load vault data whenever provider or account changes
  useEffect(() => {
    if (!provider) return;

    async function fetchAll() {
      const vault = new Contract(VAULT_ADDR, VaultABI, provider);

      // 1) TVL
      const assets = await vault.totalAssets();
      const tvlFormatted = formatUnits(assets, 6);
      setTvl(tvlFormatted);

      // 2) APYs
      const apyList = await Promise.all(
        STRATEGIES.map(async ({ name, address }) => {
          const strat = new Contract(address, StrategyABI, provider);
          const raw   = await strat.apy(); // basis points
          return { name, apy: Number(raw) / 100 };
        })
      );
      setApys(apyList);

      // 3) AI recommendation
      try {
        const { data } = await axios.post(ADVISOR_URL, { strategies: apyList });
        setRecommendation(data.strategy);
        setReason(data.reason);
      } catch {
        setRecommendation("Error");
        setReason("");
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
    }

    fetchAll();
  }, [provider, account]);

  // Connect wallet
  async function connectWallet() {
    if (!window.ethereum) {
      return alert("Install MetaMask");
    }
    const ethProvider = new BrowserProvider(window.ethereum);
    await ethProvider.send("eth_requestAccounts", []);
    const signer = await ethProvider.getSigner();
    const addr   = await signer.getAddress();
    setAccount(addr);
    setProvider(ethProvider);
  }

  // Deposit or Withdraw
  async function handleAction(action) {
    if (!provider || !account) return alert("Connect your wallet first");
    const signer = await provider.getSigner();
    const vault  = new Contract(VAULT_ADDR, VaultABI, signer);
    const amt    = parseUnits(amount || "0", 6);

    try {
      if (action === "deposit") {
        const usdcE = new Contract(
          USDCE_ADDR,
          ["function approve(address,uint256) external returns (bool)"],
          signer
        );
        await usdcE.approve(VAULT_ADDR, amt);
        await vault.deposit(amt);
      } else {
        await vault.withdraw(amt);
      }
      setAmount("");
      // Refresh TVL & shares
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
    } catch (err) {
      console.error(err);
      alert(`Failed to ${action}: ${err.message}`);
    }
  }

  // Toggle theme
  const toggleTheme = () => setTheme(t => (t === "light" ? "dark" : "light"));

  const styles = {
    light: { background: "#fff", color: "#000" },
    dark:  { background: "#121212", color: "#eee" }
  }[theme];

  return (
    <div style={{ ...styles, minHeight: "100vh", padding: 20, fontFamily: "Arial, sans-serif" }}>
      <button onClick={toggleTheme} style={{ float: "right" }}>
        {theme === "light" ? "🌙 Dark" : "☀️ Light"}
      </button>
      <h1>USDC.e Auto-Yield Vault</h1>
      <p><em>Network:</em> {network}</p>
      {account
        ? <p>Connected: {account.substring(0,6)}…{account.slice(-4)}</p>
        : <button onClick={connectWallet}>Connect Wallet</button>
      }

      <h2>Vault Overview</h2>
      <p><strong>TVL:</strong> {tvl} USDC.e</p>
      {account && (
        <p>
          <strong>Your Shares:</strong> {userShares} vUSDC.e  
          {" — Value: "}{shareValue} USDC.e
        </p>
      )}

      <h2>Strategy APYs</h2>
      <ul>
        {apys.map(s => (
          <li key={s.name}>
            {s.name}: {s.apy.toFixed(2)}%
            {recommendation === s.name && (
              <span style={{ marginLeft: 8, cursor: "pointer" }} title={reason}>
                ← Recommended ℹ️
              </span>
            )}
          </li>
        ))}
      </ul>

      <h2>Actions</h2>
      <input
        type="number"
        placeholder="Amount (USDC.e)"
        value={amount}
        onChange={e => setAmount(e.target.value)}
        style={{ marginRight: 8 }}
      />
      <button onClick={() => handleAction("deposit")}>Deposit</button>
      <button onClick={() => handleAction("withdraw")} style={{ marginLeft: 8 }}>
        Withdraw
      </button>
    </div>
  );
}

export default App;
