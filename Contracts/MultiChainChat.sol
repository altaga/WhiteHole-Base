// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;

// Import Wormhole SDK interfaces for relaying and receiving messages across chains
import "lib/wormhole-solidity-sdk/src/interfaces/IWormholeRelayer.sol";
import "lib/wormhole-solidity-sdk/src/interfaces/IWormholeReceiver.sol";

// MultiChainChat contract enabling cross-chain chat messaging through Wormhole
contract MultiChainChat is IWormholeReceiver {
    // Wormhole Settings
    IWormholeRelayer public wormholeRelayer;             // Interface for cross-chain communication relayer
    uint16 public wormholeChainId;                       // Chain ID for Wormhole, set during contract deployment
    mapping(uint16 => bytes32) public registeredSenders; // Maps each chain ID to a registered sender address

    // Contract owner
    address public owner;

    // Events for tracking messages
    event MessageReceived(string message);       // Emitted when a message is received
    event SourceChainLogged(uint16 sourceChain); // Logs the source chain of received messages

    // Chat message counter
    uint256 public counter;

    // Only allows contract owner to call certain functions
    modifier onlyOwner() {
        require(msg.sender == owner, "Caller is not owner");
        _;
    }

    // Message struct defining the properties of each chat message
    struct Message {
        uint16 fromChainId; // ID of the source chain
        uint16 toChainId;   // ID of the destination chain
        address from;       // Address of the sender
        address to;         // Address of the recipient
        string messFrom;    // Message content from sender (this can be encrypted)
        string messTo;      // Message content for recipient (this can be encrypted)
        string iv;          // Initialization vector for encrypted message, or any additional data to decrypt
        uint256 amount;     // Amount associated with the message
        uint256 blocktime;  // Timestamp of when the message was sent
    }

    // Stores chat history and message counters for each address
    mapping(address => Message[]) public chatHistory;
    mapping(address => uint256) public chatCounter;

    // Contract constructor to set the Wormhole relayer and chain ID
    constructor(address _wormholeRelayer, uint16 _wormholeChainId) {
        wormholeRelayer = IWormholeRelayer(_wormholeRelayer);
        wormholeChainId = _wormholeChainId;
        owner = msg.sender;
    }

    // Local Message Handling

    /**
     * @dev Adds a local (same-chain) message to chat history for both sender and recipient.
     * @param to Recipient's address.
     * @param amount Amount associated with the message. (USDC)
     * @param messFrom Message content from the sender.
     * @param messTo Message content for the recipient.
     * @param iv Initialization vector for encryption.
     */
    function addMessage(
        address to,
        uint256 amount,
        string memory messFrom,
        string memory messTo,
        string memory iv
    ) public payable {
        uint16 fromChainId = wormholeChainId;
        uint16 toChainId = wormholeChainId;
        address from = msg.sender;

        counter += 1;
        chatCounter[from] += 1;
        chatCounter[to] += 1;

        Message memory newMessage = Message(
            fromChainId,
            toChainId,
            from,
            to,
            messFrom,
            messTo,
            iv,
            amount,
            block.timestamp
        );

        chatHistory[from].push(newMessage);
        chatHistory[to].push(newMessage);
    }

    // Cross-Chain Message Handling

    /**
     * @dev Internal function to add a cross-chain message to chat history.
     * @param input The message struct containing message details.
     */
    function addMessageWormhole(Message memory input) internal {
        counter += 1;
        chatCounter[input.to] += 1;
        chatCounter[input.from] += 1;
        chatHistory[input.to].push(input);
        chatHistory[input.from].push(input);
    }

    // Cross-Chain Cost Estimation

    /**
     * @dev Estimates the cost of sending a cross-chain message.
     * @param targetChain The target chain ID.
     * @param _GAS_LIMIT The gas limit required for cross-chain delivery.
     * @return cost The estimated cost for cross-chain message delivery.
     */
    function quoteCrossChainCost(
        uint16 targetChain,
        uint256 _GAS_LIMIT
    ) public view returns (uint256 cost) {
        (cost, ) = wormholeRelayer.quoteEVMDeliveryPrice(
            targetChain,
            0,
            _GAS_LIMIT
        );
    }

    /**
     * @dev Sends a message from this chain to another chain.
     * @param targetChain The destination chain ID.
     * @param targetAddress The recipient contract address on the destination chain.
     * @param _GAS_LIMIT The gas limit for the message delivery.
     * @param to Recipient's address on the target chain.
     * @param messFrom Message content from the sender.
     * @param messTo Message content for the recipient.
     * @param iv Initialization vector for encryption.
     * @param amount Amount associated with the message.
     */
    function sendMessage(
        uint16 targetChain,
        address targetAddress,
        uint256 _GAS_LIMIT,
        address to,
        string memory messFrom,
        string memory messTo,
        string memory iv,
        uint256 amount
    ) external payable {
        uint256 cost = quoteCrossChainCost(targetChain, _GAS_LIMIT);
        require(
            msg.value >= cost,
            "Insufficient funds for cross-chain delivery"
        );

        wormholeRelayer.sendPayloadToEvm{value: cost}(
            targetChain,
            targetAddress,
            abi.encode(
                wormholeChainId,
                targetChain,
                msg.sender,
                to,
                messFrom,
                messTo,
                iv,
                amount,
                block.timestamp
            ),
            0,
            _GAS_LIMIT
        );
    }

    // Cross-Chain Message Reception

    /**
     * @dev Modifier to check if the sender is registered for the specified source chain.
     */
    modifier isRegisteredSender(uint16 sourceChain, bytes32 sourceAddress) {
        require(
            registeredSenders[sourceChain] == sourceAddress,
            "Sender is not registered"
        );
        _;
    }

    /**
     * @dev Registers a trusted sender address for a specific source chain.
     * @param sourceChain The ID of the source chain.
     * @param sourceAddress The address of the registered sender on the source chain.
     */
    function setRegisteredSender(
        uint16 sourceChain,
        bytes32 sourceAddress
    ) public onlyOwner {
        registeredSenders[sourceChain] = sourceAddress;
    }

    /**
     * @dev Receives cross-chain messages and validates the sender's source address.
     * @param payload Encoded message payload containing message details.
     * @param sourceAddress The address of the sender on the source chain.
     * @param sourceChain The ID of the source chain.
     */
    function receiveWormholeMessages(
        bytes memory payload,
        bytes[] memory,
        bytes32 sourceAddress,
        uint16 sourceChain,
        bytes32
    ) public payable override isRegisteredSender(sourceChain, sourceAddress) {
        require(
            msg.sender == address(wormholeRelayer),
            "Only the Wormhole relayer can call this function"
        );

        (
            uint16 fromChainId,
            uint16 toChainId,
            address from,
            address to,
            string memory messFrom,
            string memory messTo,
            string memory iv,
            uint256 amount,
            uint256 blocktime
        ) = abi.decode(
                payload,
                (
                    uint16,
                    uint16,
                    address,
                    address,
                    string,
                    string,
                    string,
                    uint256,
                    uint256
                )
            );

        Message memory message = Message(
            fromChainId,
            toChainId,
            from,
            to,
            messFrom,
            messTo,
            iv,
            amount,
            blocktime
        );

        addMessageWormhole(message);

        if (sourceChain != 0) {
            emit SourceChainLogged(sourceChain);
        }

        emit MessageReceived(message.iv);
    }

    // Garbage Collection

    /**
     * @dev Allows the owner to withdraw the contract's balance, if necessary, because the contract balance is not used.
     */
    function garbage() public payable onlyOwner {
        payable(owner).transfer(address(this).balance);
    }
}
