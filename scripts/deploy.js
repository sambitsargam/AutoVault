const { ethers } = require("hardhat");

async function main() {
  const Vault = await ethers.getContractFactory("Vault");
  const vault = await Vault.deploy(process.env.USDCe_ADDRESS);
  await vault.deployed();
  console.log("Vault deployed to:", vault.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
