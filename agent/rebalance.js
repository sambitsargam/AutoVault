// agent/rebalance.js

require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");

const RPC_URL               = process.env.RPC_URL;
const PRIVATE_KEY           = process.env.PRIVATE_KEY;
const VAULT_ADDRESS         = process.env.VAULT_CONTRACT_ADDRESS;
const ADVISOR_URL           = process.env.ADVISOR_URL || "http://localhost:3333/choose";

// Define your strategies here, with the on-chain contract addresses and human-readable names
const strategies = [
  { name: "XSwap",    address: "0xa87514B63275bD11623a91558861Ac26c125d486" },
  { name: "LendPool", address: "0xa87514B63275bD11623a91558861Ac26c125d486" },
  { name: "HighRisk", address: "0xa87514B63275bD11623a91558861Ac26c125d486" }
];

const strategyAbi = [
  // each strategy must implement a view `apy()` returning its APY as a percentage, e.g. 520 = 5.20%
  "function apy() external view returns (uint256)"
];
const vaultAbi = [
  "function harvest(address strategy) external"
];

async function rebalance() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const vault    = new ethers.Contract(VAULT_ADDRESS, vaultAbi, wallet);

  // 1. Fetch APYs
  const apyPromises = strategies.map(async ({ name, address }) => {
    const strat = new ethers.Contract(address, strategyAbi, provider);
    const raw  = await strat.apy();            // e.g. 520 for 5.20%
    const apy  = Number(raw) / 100;            // convert to percent
    return { name, address, apy };
  });
  const withApys = await Promise.all(apyPromises);
  console.log("Fetched APYs:", withApys);

  // 2. Ask your AI advisor
  const { data } = await axios.post(ADVISOR_URL, { strategies: withApys });
  console.log("AI recommendation:", data);

  // 3. Find recommended strategy address
  const choice = withApys.find(s => s.name === data.strategy);
  if (!choice) {
    console.error("Advisor returned unknown strategy:", data.strategy);
    return;
  }

  // 4. Execute harvest
  console.log(`Calling harvest on strategy ${choice.name} (${choice.address})...`);
  const tx = await vault.harvest(choice.address);
  await tx.wait();
  console.log("✅ Harvest tx mined:", tx.hash);
}

async function main() {
  // Run once immediately
  await rebalance();

  // Then every hour
  setInterval(rebalance, 60 * 60 * 1000);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
