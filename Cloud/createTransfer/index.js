// Importing required modules for cloud functions, developer wallets, crypto, Firestore, and Ethereum libraries
const functions = require("@google-cloud/functions-framework");
const {
  initiateDeveloperControlledWalletsClient,
} = require("@circle-fin/developer-controlled-wallets");
const { apiKey, entitySecret } = require("./secrets");
const circleDeveloperSdk = initiateDeveloperControlledWalletsClient({
  apiKey,
  entitySecret,
});
const crypto = require("crypto");
const Firestore = require("@google-cloud/firestore");
const { abiERC20, tokens } = require("./constants.js");
const ethers = require("ethers");

const privateKey = ``; // Private key for decryption, replace with your private key

// Initialize Firestore with project credentials for database access
const db = new Firestore({
  projectId: "whitehole-XXXXXXXXXXXXX",
  keyFilename: "credential.json",
});

// Supported blockchain networks, circle and wormhole will support more in the future
const chains = ["eth", "avax", "pol", "arb"];
const blockchains = ["ETH", "AVAX", "MATIC", "ARB"];

// Define an HTTP-triggered function named 'helloHttp', this is defined by Cloud Functions, don't change
functions.http("helloHttp", async (req, res) => {
  try {
    // Decrypts and verifies the user input to select the appropriate database collection
    const decrypted = decryptText(req.body.user).toString();
    let collection;
    let query;

    // Determines collection based on identifier prefix in decrypted input
    if (decrypted.indexOf("user_") >= 0) {
      collection = db.collection("Accounts");
      query = await collection.where("user", "==", decrypted).get();
    } else if (decrypted.indexOf("saving_") >= 0) {
      collection = db.collection("Savings");
      query = await collection.where("user", "==", decrypted).get();
    } else if (decrypted.indexOf("card_") >= 0) {
      collection = db.collection("Cards");
      query = await collection.where("user", "==", decrypted).get();
    } else if (req.body.card) {
      collection = db.collection("Cards");
      query = await collection.where("cardHash", "==", decrypted).get();
    } else {
      throw "Bad User"; // Invalid input condition, throws error
    }

    // Validates if any matching records were found
    if (query.empty) {
      throw "Query Empty"; // No matching documents in the collection, throws error
    } else {
      let txHash = "";
      const command = req.body.command;                        // Requested transaction type
      const chain = chains[req.body.chain];                    // Target chain for the transaction
      const token = tokens[req.body.chain][req.body.token];    // Token to be transferred
      const amount = req.body.amount;                          // Amount of token
      const destinationAddress = req.body.destinationAddress;  // Recipient address
      const walletId = query.docs[0].data().wallets[chain].id; // User wallet ID on specified chain
      console.log({ token, walletId, amount });

      // Process based on requested command
      if (command === "transfer") {
        // Execute transfer via Circle SDK with transaction fee level configuration
        const transaction = {
          amount: [amount],
          destinationAddress,
          walletId,
          blockchain: blockchains[req.body.chain],
        };

        let response = await circleDeveloperSdk.createTransaction({
          ...transaction,
          fee: {
            type: "level",
            config: { feeLevel: "MEDIUM" },
          },
        });

        // Polling for transaction hash confirmation
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
      } else if (command === "tokenTransfer") {
        // Token transfer using ERC20 interface with encoded function call
        const interface = new ethers.utils.Interface(abiERC20);
        const transaction = interface.encodeFunctionData("transfer", [
          destinationAddress,
          ethers.utils.parseUnits(amount, token.decimals),
        ]);

        // Executing smart contract transaction
        let response =
          await circleDeveloperSdk.createContractExecutionTransaction({
            walletId,
            callData: transaction,
            contractAddress: token.address,
            fee: {
              type: "level",
              config: { feeLevel: "MEDIUM" },
            },
          });
        console.log(response);

        // Polling for contract execution transaction hash
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
      } else {
        throw "Bad Command"; // Invalid command input, throws error
      }
      // Response with transaction hash result if successful
      res.send({ error: null, result: txHash });
    }
  } catch (e) {
    console.log(e);                         // Log error details
    res.send({ error: e, result: null });  // Send error response if failure occurs
  }
});

// Function to decrypt incoming text using private key
function decryptText(encryptedText) {
  return crypto.privateDecrypt(
    {
      key: privateKey,
    },
    Buffer.from(encryptedText, "base64")
  );
}
