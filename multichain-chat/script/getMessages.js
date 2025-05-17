const { ethers } = require('ethers');
const fs = require('fs');
const path = require('path');
require('dotenv').config();
const crypto = require("crypto");

// Your Decryption Algorithm
function decrypt(encryptedText, _secret, myIV) {
    const secret = ethers.utils.getAddress(_secret);
    const iv = Buffer.from(myIV, 'base64');  // Convert IV back to a buffer

    // Create the key from the secret
    const key = crypto.createHash('sha256').update(secret).digest();

    // Create the decipher object
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);

    // Decrypt the ciphertext
    let decrypted = decipher.update(encryptedText, 'base64', 'utf8');
    decrypted += decipher.final('utf8');

    return decrypted;
}

/**
 * Main function to fetch and decrypt messages from the MultiChainChat contract.
 */
async function main() {
    // Load the chain configuration and deployed contract addresses
    const chains = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../deploy-config/chains.json'))
    );
    const deployedContracts = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../deploy-config/deployedContracts.json'))
    );

    console.log('Receiver Contract Address: ', deployedContracts.arb.MultiChainChat);
    console.log('...');

    // Find the Arbitrum Sepolia chain
    const arbChain = chains.chains.find((chain) =>
        chain.description.includes("Arbitrum Sepolia")
    );

    // Set up the provider and wallet
    const provider = new ethers.providers.JsonRpcProvider(arbChain.rpc);
    const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

    // Load the ABI of the MultiChainChat contract
    const multiChainChatJson = JSON.parse(
        fs.readFileSync(path.resolve(__dirname, '../out/MultiChainChat.sol/MultiChainChat.json'), 'utf8')
    );
    const abi = multiChainChatJson.abi;

    // Create a contract instance for MultiChainChat
    const MessageReceiver = new ethers.Contract(
        deployedContracts.arb.MultiChainChat, // Automatically use the deployed address
        abi,
        wallet
    );

    const address = "0xd871d276c8dba0daa93828ce87f9f064bf4bfe38";
    const counterByAddress = await MessageReceiver.chatCounter(address);
    let messages = [];

    // Fetch and decrypt messages
    for (let i = 0; i < counterByAddress; i++) {
        const message = await MessageReceiver.chatHistory(address, i);
        const messageData = {
            fromChainId: message.fromChainId,
            toChainId: message.toChainId,
            from: message.from,
            to: message.to,
            amount: message.amount,
            blocktime: message.blocktime,
            index: i,
        };

        // Decrypt based on the message sender and receiver
        if (address === message.to.toLowerCase()) {
            messageData.message = decrypt(message.messTo, address, message.iv);
        } else {
            messageData.message = decrypt(message.messFrom, address, message.iv);
        }
        
        messages.push(messageData);
    }

    // Log the decrypted messages
    console.log(messages);
}

// Execute the main function and handle errors
main().catch((error) => {
    console.error(error);
    process.exit(1);
});
