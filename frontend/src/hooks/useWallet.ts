import { useState, useEffect, useCallback } from 'react';
import {
  BrowserProvider,
  JsonRpcProvider,
  Contract,
  Interface,
  formatUnits
} from 'ethers';
import { RPC_URL, USDCE_ADDR } from '../constants/contracts';

/* ------------------------------------------------------------
 *  Minimal ERC‑20 ABI (balanceOf + Transfer event)
 * ---------------------------------------------------------- */
const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'event Transfer(address indexed from, address indexed to, uint256 value)'
];

export default function useWallet() {
  const [provider, setProvider] = useState<BrowserProvider | JsonRpcProvider | null>(null);
  const [account, setAccount] = useState('');
  const [network, setNetwork] = useState('');
  const [balance, setBalance] = useState('0');
  const [usdceBalance, setUsdceBalance] = useState('0');
  const [transactions, setTransactions] = useState<any[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);

  /* --------------------------- Initialise provider -------------------------- */
  useEffect(() => {
    (async () => {
      if (window.ethereum) {
        const p = new BrowserProvider(window.ethereum);
        setProvider(p);
        const net = await p.getNetwork();
        setNetwork(`${net.name} (chainId ${net.chainId})`);

        // Pre‑populate account if already authorised
        const accs = await p.listAccounts();
        if (accs.length) setAccount(accs[0].address);
      } else {
        const p = new JsonRpcProvider(RPC_URL);
        setProvider(p);
        const net = await p.getNetwork();
        setNetwork(`${net.name} (chainId ${net.chainId})`);
      }
    })().catch(console.error);
  }, []);

  /* ---------------- Fetch balances + recent USDCE transfers ----------------- */
  useEffect(() => {
    if (!provider || !account) return;

    const iface = new Interface(ERC20_ABI);
    const usdce = new Contract(USDCE_ADDR, ERC20_ABI, provider);

    const fetchAccountDetails = async () => {
      try {
        /* 1 — native currency balance */
        const nativeBal = await provider.getBalance(account);
        setBalance(formatUnits(nativeBal, 18));

        /* 2 — USDCE balance */
        const usdBal = await usdce.balanceOf(account);
        setUsdceBalance(formatUnits(usdBal, 6));

        /* 3 — USDCE Transfer events (last ~5 000 blocks) */
        const latest = await provider.getBlockNumber();
        const addressTopic = account.toLowerCase().replace('0x', '').padStart(64, '0');
        const transferTopic = iface.getEvent('Transfer').topicHash; // <‑‑ FIX: ethers‑v6

        const [outgoing, incoming] = await Promise.all([
          provider.getLogs({
            address: USDCE_ADDR,
            fromBlock: latest - 5_000,
            toBlock: latest,
            topics: [transferTopic, `0x${addressTopic}`, null]
          }),
          provider.getLogs({
            address: USDCE_ADDR,
            fromBlock: latest - 5_000,
            toBlock: latest,
            topics: [transferTopic, null, `0x${addressTopic}`]
          })
        ]);

        const logs = [...outgoing, ...incoming];

        const txs = await Promise.all(
          logs.map(async (log) => {
            const parsed = iface.parseLog(log);
            const blk = await provider.getBlock(log.blockNumber);
            return {
              hash: log.transactionHash,
              from: parsed.args[0],
              to: parsed.args[1],
              value: formatUnits(parsed.args[2], 6),
              timestamp: new Date(Number(blk.timestamp) * 1000).toISOString()
            };
          })
        );

        txs.sort((a, b) => (a.timestamp < b.timestamp ? 1 : -1));
        setTransactions(txs);
      } catch (err) {
        console.error('fetchAccountDetails():', err);
      }
    };

    fetchAccountDetails();
    const id = setInterval(fetchAccountDetails, 30_000);
    return () => clearInterval(id);
  }, [provider, account]);

  /* -------------------- Handle MetaMask account changes -------------------- */
  useEffect(() => {
    if (!window.ethereum) return;

    const handler = (accounts: string[]) => {
      if (accounts.length) {
        setAccount(accounts[0]);
      } else {
        setAccount('');
        setBalance('0');
        setUsdceBalance('0');
        setTransactions([]);
      }
    };

    window.ethereum.on('accountsChanged', handler);
    return () => window.ethereum.removeListener('accountsChanged', handler);
  }, []);

  /* ------------------------- connectWallet helper ------------------------- */
  const connectWallet = useCallback(async () => {
    if (!window.ethereum) {
      alert('Please install MetaMask to use this feature');
      return;
    }
    setIsConnecting(true);
    try {
      const ethProvider = new BrowserProvider(window.ethereum);
      await ethProvider.send('eth_requestAccounts', []);
      const signer = await ethProvider.getSigner();
      const addr = await signer.getAddress();
      setAccount(addr);
      setProvider(ethProvider);
      const net = await ethProvider.getNetwork();
      setNetwork(`${net.name} (chainId ${net.chainId})`);
    } catch (err) {
      console.error('connectWallet():', err);
    } finally {
      setIsConnecting(false);
    }
  }, []);

  /* ---------------------------- public contract ---------------------------- */
  return {
    provider,
    account,
    network,
    balance,
    usdceBalance,
    transactions,
    isConnecting,
    connectWallet
  } as const;
}
