// scripts/deploy-strategies.js

require("dotenv").config();
const { ethers } = require("hardhat");

async function main() {
  const vaultAddr = process.env.VAULT_CONTRACT_ADDRESS;
  if (!vaultAddr) throw new Error("Please set VAULT_CONTRACT_ADDRESS in .env");

  const Strategy = await ethers.getContractFactory("Strategy");

  // Deploy three mocks with different APYs (in bps)
 const configs = [
    { name: "AlphaYield",   apy: 500 },   // 5.00%
    { name: "BetaBoost",    apy: 750 },   // 7.50%
    { name: "GammaGrowth",  apy: 1000 },  // 10.00%
  ];

  for (const cfg of configs) {
    const strat = await Strategy.deploy(cfg.apy, vaultAddr);
    await strat.deployed();
    console.log(`${cfg.name} deployed at:`, strat.address);
  }
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
