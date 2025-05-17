const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

var myHeaders = new Headers();
myHeaders.append('accept', 'application/json'); // Set headers for the fetch request, this is required for the API to work
var requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow',
};

/**
 * Main function to deploy MultiChainChat contracts and calculate gas fees.
 */
async function main() {
    // Load blockchain configuration from JSON file
    const blockchains = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../deploy-config/chains.json'))
    );

    // Create a provider and wallet for each blockchain, you need to have the PRIVATE_KEY in your .env file
    const providers = blockchains.chains.map((chain) => new ethers.providers.JsonRpcProvider(chain.rpc));
    const wallets = providers.map((provider) => new ethers.Wallet(process.env.PRIVATE_KEY, provider));

    // Load contract ABI and bytecode
    const multiChainChatJson = JSON.parse(
        fs.readFileSync(
            path.resolve(__dirname, '../out/MultiChainChat.sol/MultiChainChat.json'),
            'utf8'
        )
    );
    const abi = multiChainChatJson.abi;
    const bytecode = multiChainChatJson.bytecode;

    // Create a contract factory for each wallet
    const MultiChainChatContract = wallets.map((wallet) => new ethers.ContractFactory(abi, bytecode, wallet));

    // Get current gas prices from each provider
    const gasPrices = await Promise.all(providers.map((provider) => provider.getGasPrice()));

    // Prepare deployment transactions
    const deployTransactions = await Promise.all(MultiChainChatContract.map((contract, index) =>
        contract.getDeployTransaction(blockchains.chains[index].wormholeRelayer, blockchains.chains[index].chainId)
    ));

    // Estimate gas for each transaction
    const gasEstimations = await Promise.all(deployTransactions.map((transaction, index) =>
        providers[index].estimateGas(transaction)
    ));

    // Calculate gas fees in Ether
    const gasFees = gasPrices.map((gasPrice, index) => ethers.utils.formatEther(gasPrice.mul(gasEstimations[index])));

    // Prepare an array of chain IDs for the CoinGecko API request
    const array = blockchains.chains.map(chain => chain.coingecko);

    // Fetch current USD prices for the cryptocurrencies from CoinGecko
    const response = await fetch(
        `https://api.coingecko.com/api/v3/simple/price?ids=${array.toString()}&vs_currencies=usd`,
        requestOptions
    );

    const result = await response.json(); // Parse the JSON response
    const usdConversionTemp = array.map(x => result[x].usd); // Extract USD prices

    // Log gas fees, including total cost in USD for each chain
    console.log(gasFees.map((gas, index) => {
        return {
            chain: blockchains.chains[index].description,
            gasTotal: gas,
            gas: gasEstimations[index].toNumber(),
            gasPrice: gasPrices[index].toNumber(),
            usd: usdConversionTemp[index] * gas // Calculate total cost in USD
        };
    }));
}

// Execute the main function and handle errors
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
