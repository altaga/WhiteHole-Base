const { ethers } = require("ethers");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

/**
 * Converts an Ethereum address to a 32-byte representation.
 * @param {string} address - The Ethereum address to convert.
 * @returns {string} - The address as a bytes32 string.
 */
function addressToBytes32(address) {
  // Ensure the address is in lower case for consistent formatting
  address = address.toLowerCase();

  // Remove the '0x' prefix if present
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }

  // Pad the address with leading zeros to make it 32 bytes (64 hex characters)
  return "0x" + address.padStart(64, "0");
}

/**
 * Pauses execution for a specified number of milliseconds.
 * @param {number} ms - The number of milliseconds to sleep.
 * @returns {Promise} - A promise that resolves after the specified duration.
 */
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Main function to deploy MultiChainChat contracts across multiple blockchains. This can take a while, depending on the number of chains and chains to deploy.
 */
async function main() {
  // Load blockchain configuration from JSON file
  const blockchains = JSON.parse(
    fs.readFileSync(path.resolve(__dirname, "../deploy-config/chains.json"))
  );

  // Create a provider and wallet for each blockchain
  const providers = blockchains.chains.map(
    (chain) => new ethers.providers.JsonRpcProvider(chain.rpc)
  );
  const wallets = providers.map(
    (provider) => new ethers.Wallet(process.env.PRIVATE_KEY, provider)
  );

  // Load contract ABI and bytecode
  const multiChainChatJson = JSON.parse(
    fs.readFileSync(
      path.resolve(__dirname, "../out/MultiChainChat.sol/MultiChainChat.json"),
      "utf8"
    )
  );
  const abi = multiChainChatJson.abi;
  const bytecode = multiChainChatJson.bytecode;

  // Create a contract factory for each wallet
  const MultiChainChatContractsFactory = wallets.map(
    (wallet) => new ethers.ContractFactory(abi, bytecode, wallet)
  );

  // Prepare deployment transactions
  const deployTransactions = await Promise.all(
    MultiChainChatContractsFactory.map((contract, index) =>
      contract.getDeployTransaction(
        blockchains.chains[index].wormholeRelayer,
        blockchains.chains[index].chainId
      )
    )
  );

  // Estimate gas for deployment
  const gasEstimations = await Promise.all(
    deployTransactions.map((transaction, index) =>
      providers[index].estimateGas(transaction)
    )
  );

  // Retrieve current gas prices from each provider
  const gasPrices = await Promise.all(
    providers.map((provider) => provider.getGasPrice())
  );
  console.log(gasPrices); // Log gas prices for reference

  // Deploy contracts with estimated gas limits and prices
  const MultiChainChatContracts = await Promise.all(
    MultiChainChatContractsFactory.map((contract, index) =>
      contract.deploy(
        blockchains.chains[index].wormholeRelayer,
        blockchains.chains[index].chainId,
        {
          gasLimit: gasEstimations[index].mul(ethers.BigNumber.from(2)), // Double gas estimate for safety
          gasPrice: gasPrices[index],
        }
      )
    )
  );

  // Wait for all contracts to be deployed
  await Promise.all(
    MultiChainChatContracts.map((contract) => contract.deployTransaction.wait())
  );

  // Load existing deployed contracts data
  const deployedContractsPath = path.resolve(
    __dirname,
    "../deploy-config/deployedContracts.json"
  );
  const deployedContracts = JSON.parse(
    fs.readFileSync(deployedContractsPath, "utf8")
  );

  // Update deployed contracts information
  MultiChainChatContracts.forEach((contract, index) => {
    deployedContracts[blockchains.chains[index].name] = {
      MultiChainChat: contract.address,
      deployedAt: new Date().getTime(),
    };
  });

  // Save updated deployed contracts information
  fs.writeFileSync(
    deployedContractsPath,
    JSON.stringify(deployedContracts, null, 2)
  );

  // Prepare an array to hold addresses by chain
  const addressByChain = [];
  MultiChainChatContracts.forEach((_, index) => {
    let acc = [];
    MultiChainChatContracts.forEach((contract, indexs) => {
      if (index !== indexs) {
        acc.push({
          address: contract.address,
          chainId: blockchains.chains[indexs].chainId,
        });
      }
    });
    addressByChain.push(acc);
  });

  // Register senders across chains
  for (let i = 0; MultiChainChatContracts.length > i; i++) {
    for (let j = 0; addressByChain[i].length > j; j++) {
      console.log({
        receiveChain: blockchains.chains[i].chainId,
        sourceChain: addressByChain[i][j].chainId,
        sourceContract: addressToBytes32(addressByChain[i][j].address),
      });

      // Estimate gas for registering sender
      const gasEstimate = await MultiChainChatContracts[
        i
      ].estimateGas.setRegisteredSender(
        addressByChain[i][j].chainId,
        addressToBytes32(addressByChain[i][j].address)
      );

      // Send transaction to register the sender
      const tx = await MultiChainChatContracts[i].setRegisteredSender(
        addressByChain[i][j].chainId,
        addressToBytes32(addressByChain[i][j].address),
        {
          gasPrice: gasPrices[i],
          gasLimit: gasEstimate.mul(ethers.BigNumber.from(2)), // Double gas estimate for safety
        }
      );
      await tx.wait(); // Wait for transaction confirmation
      await sleep(5000); // Avoid excessive use of public RPC
    }
  }
  console.log("Everything OK");
}

// Execute the main function and handle errors
main().catch((error) => {
  console.error(error);
  process.exit(1);
});
