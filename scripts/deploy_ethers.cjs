const fs = require('fs');
const path = require('path');
require('dotenv').config();
const solc = require('solc');
const { ethers } = require('ethers');

async function main() {
  const rpc = process.env.BASE_RPC_URL || 'https://mainnet.base.org';
  const pk = process.env.PRIVATE_KEY;
  if (!pk) throw new Error('PRIVATE_KEY not set in .env');

  console.log('Compiling SnakeFees.sol...');
  const sourcePath = path.join(__dirname, '..', 'contracts', 'SnakeFees.sol');
  const source = fs.readFileSync(sourcePath, 'utf8');

  const input = {
    language: 'Solidity',
    sources: {
      'SnakeFees.sol': { content: source },
    },
    settings: {
      outputSelection: {
        '*': {
          '*': ['abi', 'evm.bytecode.object'],
        },
      },
      optimizer: { enabled: true, runs: 200 },
    },
  };

  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const hasError = output.errors.some((e) => e.severity === 'error');
    console.log('Compiler messages:');
    output.errors.forEach((e) => console.log(e.formattedMessage || e.message));
    if (hasError) throw new Error('Compilation failed');
  }

  const contractOut = output.contracts['SnakeFees.sol']['SnakeFees'];
  const abi = contractOut.abi;
  const bytecode = contractOut.evm.bytecode.object;

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(pk, provider);

  console.log('Deployer:', await wallet.getAddress());
  const bal = await provider.getBalance(await wallet.getAddress());
  console.log('Balance:', ethers.formatEther(bal), 'ETH');

  const factory = new ethers.ContractFactory(abi, bytecode, wallet);
  console.log('Deploying...');
  const contract = await factory.deploy();
  await contract.waitForDeployment();

  console.log(
    '\n✅ Deployed at:',
    contract.target || contract.address || contract.address,
  );
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
