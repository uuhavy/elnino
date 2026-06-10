const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const provider = new ethers.JsonRpcProvider(process.env.BASE_RPC_URL);
  const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

  console.log("Deployer:", wallet.address);
  const balance = await provider.getBalance(wallet.address);
  console.log("Balance:", ethers.formatEther(balance), "ETH");

  const artifactPath = path.join(__dirname, "../artifacts/contracts/SnakeFees.sol/SnakeFees.json");
  if (!fs.existsSync(artifactPath)) {
      console.log("Please run 'npx hardhat compile' first to generate artifacts.");
      return;
  }

  const artifact = JSON.parse(fs.readFileSync(artifactPath));
  const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, wallet);
  
  console.log("Deploying contract...");
  const contract = await factory.deploy();
  await contract.waitForDeployment();
  
  const address = await contract.getAddress();
  console.log("\n✅ SnakeFees deployed at:", address);
}

main().catch(console.error);
