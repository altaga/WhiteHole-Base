// Import necessary modules for cloud functions, Circle SDK, Firestore, crypto, and Ethereum
const functions = require("@google-cloud/functions-framework");
const { initiateDeveloperControlledWalletsClient } = require("@circle-fin/developer-controlled-wallets");
const { apiKey, entitySecret } = require("./secrets");
const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({ apiKey, entitySecret });
const crypto = require("crypto");
const Firestore = require("@google-cloud/firestore");
const {
  abiMultiChainChat,
  abiCircleRelayer,
  chains,
  chainSelector,
  chatSelector,
  abiERC20,
  usdcSelector,
} = require("./constants.js");
const ethers = require("ethers");

// Circle relayer contract address used across all supported chains
const circleRelayerAddress = "0x4cb69FaE7e7Af841e44E1A1c30Af640739378bb2";
const privateKey = `xxxxxxxx`; // Placeholder for private key used in decryption

// Initialize Firestore database with specified project credentials
const db = new Firestore({
  projectId: "whitehole-XXXXXXXXXXXXX",
  keyFilename: "credential.json",
});

// Define an HTTP-triggered function named 'helloHttp'
functions.http("helloHttp", async (req, res) => {
  try {
    // Decrypt and validate user data from the request body
    const decrypted = decryptText(req.body.user).toString();
    const fromChain = req.body.fromChain;  // Origin chain for transaction
    const toChain = req.body.toChain;      // Destination chain for transaction
    const data = req.body.data;            // Data for contract execution
    const amount = ethers.utils.parseUnits(req.body.usdc, 6); // USDC amount in correct units
    const to = req.body.to;                // Recipient address

    // Determine Firestore collection based on decrypted user input, this information is used to determine the user's wallet
    let collection;
    let query;
    if (decrypted.indexOf("user_") >= 0) {
      collection = db.collection("Accounts");
      query = await collection.where("user", "==", decrypted).get();
    } else {
      throw "Bad User"; // Invalid user identifier
    }

    // Validate Firestore query result
    if (query.empty) {
      throw "Query Empty"; // No matching documents found
    } else {
      let txHash = ""; // Placeholder for transaction hash
      const provider = new ethers.providers.JsonRpcProvider(chains[fromChain]); // Initialize provider for the specified chain
      const chat = new ethers.Contract(chatSelector[fromChain], abiMultiChainChat, provider); // Chat contract instance
      const walletId = query.docs[0].data().wallets[chainSelector[fromChain]].id; // User's wallet ID
      const crossChainFlag = fromChain !== toChain; // Check if cross-chain transaction
      let myamount = "0";

      if (crossChainFlag) {
        // Estimate cross-chain transaction cost and transfer USDC if necessary
        const gas_limit = 700_000;
        const quote = await chat.quoteCrossChainCost(toChain, gas_limit);
        myamount = ethers.utils.formatEther(quote);

        if (parseFloat(req.body.usdc) > 0) {
          // Approve transfer of specified amount of USDC, to use circle relayer
          let interface = new ethers.utils.Interface(abiERC20);
          let transaction = interface.encodeFunctionData("approve", [circleRelayerAddress, amount]);
          let response = await circleDeveloperSdk.createContractExecutionTransaction({
            walletId,
            callData: transaction,
            contractAddress: usdcSelector[fromChain],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          // Wait for transaction confirmation
          const { id: myId } = response.data;
          await new Promise((resolve) => {
            const interval = setInterval(async () => {
              response = await circleDeveloperSdk.getTransaction({ id: myId });
              if (response.data.transaction.state === "CONFIRMED") {
                clearInterval(interval);
                resolve(response.data.transaction.txHash);
              }
            }, 1000);
          });

          // Encode and execute cross-chain token transfer using relayer contract
          interface = new ethers.utils.Interface(abiCircleRelayer);
          transaction = interface.encodeFunctionData("transferTokensWithRelay", [
            usdcSelector[fromChain],
            amount,
            0,
            toChain,
            addressToBytes32(to),
          ]);
          response = await circleDeveloperSdk.createContractExecutionTransaction({
            walletId,
            callData: transaction,
            contractAddress: circleRelayerAddress,
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          // Wait for cross-chain transaction confirmation
          const { id: myId2 } = response.data;
          await new Promise((resolve) => {
            const interval = setInterval(async () => {
              response = await circleDeveloperSdk.getTransaction({ id: myId2 });
              if (response.data.transaction?.txHash) {
                clearInterval(interval);
                resolve(response.data.transaction.txHash);
              }
            }, 1000);
          });
        }
      } else {
        // Single-chain USDC transfer to specified address
        if (parseFloat(req.body.usdc) > 0) {
          let interface = new ethers.utils.Interface(abiERC20);
          let transaction = interface.encodeFunctionData("transfer", [to, amount]);
          let response = await circleDeveloperSdk.createContractExecutionTransaction({
            walletId,
            callData: transaction,
            contractAddress: usdcSelector[fromChain],
            fee: { type: "level", config: { feeLevel: "MEDIUM" } },
          });

          // Wait for transaction confirmation
          let id = response.data.id;
          await new Promise((resolve) => {
            const interval = setInterval(async () => {
              response = await circleDeveloperSdk.getTransaction({ id });
              if (response.data.transaction?.txHash) {
                clearInterval(interval);
                resolve(response.data.transaction.txHash);
              }
            }, 1000);
          });
        }
      }

      // Final contract execution with accumulated data on the chat contract
      let response = await circleDeveloperSdk.createContractExecutionTransaction({
        walletId,
        amount: myamount,
        callData: data,
        contractAddress: chatSelector[fromChain],
        fee: { type: "level", config: { feeLevel: "MEDIUM" } },
      });

      // Wait for final transaction confirmation and return hash
      const { id } = response.data;
      txHash = await new Promise((resolve) => {
        const interval = setInterval(async () => {
          response = await circleDeveloperSdk.getTransaction({ id });
          if (response.data.transaction?.txHash) {
            clearInterval(interval);
            resolve(response.data.transaction.txHash);
          }
        }, 1000);
      });

      // Send final response with transaction hash
      res.send({ error: null, result: txHash });
    }
  } catch (e) {
    console.log(e); // Log any errors
    res.send({ error: e, result: null }); // Send error response if failure occurs
  }
});

// Decrypt function for incoming encrypted text
function decryptText(encryptedText) {
  return crypto.privateDecrypt(
    { key: privateKey },
    Buffer.from(encryptedText, "base64")
  );
}

// Utility to format Ethereum address to 32-byte hex string
function addressToBytes32(address) {
  address = address.toLowerCase();
  if (address.startsWith("0x")) {
    address = address.slice(2);
  }
  return "0x" + address.padStart(64, "0");
}