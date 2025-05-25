// agent/rebalance.js

require("dotenv").config();
const { ethers } = require("ethers");
const axios = require("axios");

const RPC_URL               = process.env.RPC_URL;
const PRIVATE_KEY           = process.env.PRIVATE_KEY;
const VAULT_ADDRESS         = process.env.VAULT_CONTRACT_ADDRESS;
const ADVISOR_URL           = process.env.ADVISOR_URL || "http://localhost:3333/choose";

// Define your mock strategies with their deployed addresses
const strategies = [
  { name: "AlphaYield",  address: "0x8FBE514b89fE16AF232420B498D43c0D684939DD" },
  { name: "BetaBoost",   address: "0x88D56C9Eb481cfd05dA7827247f67fE63ed62C81" },
  { name: "GammaGrowth", address: "0x80B341ad21437ff14C22E9f77ed6940B38A667A1" },
];

const strategyAbi = [
  // each strategy must implement a view `apy()` returning its APY in basis points (e.g. 500 = 5.00%)
  "function apy() external view returns (uint256)"
];
const vaultAbi = [
  "function harvest(address strategy) external"
];

async function rebalance() {
  const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
  const wallet   = new ethers.Wallet(PRIVATE_KEY, provider);
  const vault    = new ethers.Contract(VAULT_ADDRESS, vaultAbi, wallet);

  // 1. Fetch APYs from each strategy
  const apyPromises = strategies.map(async ({ name, address }) => {
    const strat = new ethers.Contract(address, strategyAbi, provider);
    const raw  = await strat.apy();             // e.g. 500 for 5.00%
    const apy  = Number(raw) / 100;             // convert to percent
    return { name, address, apy };
  });
  const withApys = await Promise.all(apyPromises);
  console.log("Fetched APYs:", withApys);

  // 2. Ask the AI advisor which strategy to choose
  const { data } = await axios.post(ADVISOR_URL, { strategies: withApys });
  console.log("AI recommendation:", data);

  // 3. Find the recommended strategy object
  const choice = withApys.find(s => s.name === data.strategy);
  if (!choice) {
    console.error("Advisor returned unknown strategy:", data.strategy);
    return;
  }

  // 4. Execute harvest on the vault for that strategy
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
