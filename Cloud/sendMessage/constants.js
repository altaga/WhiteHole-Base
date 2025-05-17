const abiMultiChainChat = [ // Multi Chain Chat Contract ABI
  {
    type: "constructor",
    inputs: [
      {
        name: "_wormholeRelayer",
        type: "address",
        internalType: "address",
      },
      {
        name: "_wormholeChainId",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "addMessage",
    inputs: [
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "messFrom",
        type: "string",
        internalType: "string",
      },
      {
        name: "messTo",
        type: "string",
        internalType: "string",
      },
      {
        name: "iv",
        type: "string",
        internalType: "string",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "chatCounter",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "chatHistory",
    inputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "fromChainId",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "toChainId",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "from",
        type: "address",
        internalType: "address",
      },
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "messFrom",
        type: "string",
        internalType: "string",
      },
      {
        name: "messTo",
        type: "string",
        internalType: "string",
      },
      {
        name: "iv",
        type: "string",
        internalType: "string",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "blocktime",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "counter",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "garbage",
    inputs: [],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "owner",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "address",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "quoteCrossChainCost",
    inputs: [
      {
        name: "targetChain",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "_GAS_LIMIT",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [
      {
        name: "cost",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "receiveWormholeMessages",
    inputs: [
      {
        name: "payload",
        type: "bytes",
        internalType: "bytes",
      },
      {
        name: "",
        type: "bytes[]",
        internalType: "bytes[]",
      },
      {
        name: "sourceAddress",
        type: "bytes32",
        internalType: "bytes32",
      },
      {
        name: "sourceChain",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "registeredSenders",
    inputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    outputs: [
      {
        name: "",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "sendMessage",
    inputs: [
      {
        name: "targetChain",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "targetAddress",
        type: "address",
        internalType: "address",
      },
      {
        name: "_GAS_LIMIT",
        type: "uint256",
        internalType: "uint256",
      },
      {
        name: "to",
        type: "address",
        internalType: "address",
      },
      {
        name: "messFrom",
        type: "string",
        internalType: "string",
      },
      {
        name: "messTo",
        type: "string",
        internalType: "string",
      },
      {
        name: "iv",
        type: "string",
        internalType: "string",
      },
      {
        name: "amount",
        type: "uint256",
        internalType: "uint256",
      },
    ],
    outputs: [],
    stateMutability: "payable",
  },
  {
    type: "function",
    name: "setRegisteredSender",
    inputs: [
      {
        name: "sourceChain",
        type: "uint16",
        internalType: "uint16",
      },
      {
        name: "sourceAddress",
        type: "bytes32",
        internalType: "bytes32",
      },
    ],
    outputs: [],
    stateMutability: "nonpayable",
  },
  {
    type: "function",
    name: "wormholeChainId",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "uint16",
        internalType: "uint16",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "function",
    name: "wormholeRelayer",
    inputs: [],
    outputs: [
      {
        name: "",
        type: "address",
        internalType: "contract IWormholeRelayer",
      },
    ],
    stateMutability: "view",
  },
  {
    type: "event",
    name: "MessageReceived",
    inputs: [
      {
        name: "message",
        type: "string",
        indexed: false,
        internalType: "string",
      },
    ],
    anonymous: false,
  },
  {
    type: "event",
    name: "SourceChainLogged",
    inputs: [
      {
        name: "sourceChain",
        type: "uint16",
        indexed: false,
        internalType: "uint16",
      },
    ],
    anonymous: false,
  },
];

const abiCircleRelayer = [ // Circle relayer contract
  {
    inputs: [
      { internalType: "address", name: "circleIntegration_", type: "address" },
      { internalType: "uint8", name: "nativeTokenDecimals_", type: "uint8" },
      { internalType: "address", name: "feeRecipient_", type: "address" },
      { internalType: "address", name: "ownerAssistant_", type: "address" },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        internalType: "address",
        name: "previousAdmin",
        type: "address",
      },
      {
        indexed: false,
        internalType: "address",
        name: "newAdmin",
        type: "address",
      },
    ],
    name: "AdminChanged",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "beacon",
        type: "address",
      },
    ],
    name: "BeaconUpgraded",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldRecipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newRecipient",
        type: "address",
      },
    ],
    name: "FeeRecipientUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "oldOwner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "newOwner",
        type: "address",
      },
    ],
    name: "OwnershipTransfered",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "relayer",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "tokenAmount",
        type: "uint256",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "nativeAmount",
        type: "uint256",
      },
    ],
    name: "SwapExecuted",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "token",
        type: "address",
      },
      {
        indexed: true,
        internalType: "uint256",
        name: "swapRate",
        type: "uint256",
      },
    ],
    name: "SwapRateUpdated",
    type: "event",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "implementation",
        type: "address",
      },
    ],
    name: "Upgraded",
    type: "event",
  },
  {
    inputs: [],
    name: "VERSION",
    outputs: [{ internalType: "string", name: "", type: "string" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes32", name: "address_", type: "bytes32" }],
    name: "bytes32ToAddress",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Metadata",
        name: "token",
        type: "address",
      },
    ],
    name: "calculateMaxSwapAmountIn",
    outputs: [{ internalType: "uint256", name: "maxAllowed", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Metadata",
        name: "token",
        type: "address",
      },
      { internalType: "uint256", name: "toNativeAmount", type: "uint256" },
    ],
    name: "calculateNativeSwapAmountOut",
    outputs: [
      { internalType: "uint256", name: "nativeAmount", type: "uint256" },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint16", name: "chainId_", type: "uint16" }],
    name: "cancelOwnershipTransferRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "chainId",
    outputs: [{ internalType: "uint16", name: "", type: "uint16" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "circleIntegration",
    outputs: [
      {
        internalType: "contract ICircleIntegration",
        name: "",
        type: "address",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "confirmOwnershipTransferRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "bytes", name: "encoded", type: "bytes" }],
    name: "decodeTransferTokensWithRelay",
    outputs: [
      {
        components: [
          { internalType: "uint8", name: "payloadId", type: "uint8" },
          {
            internalType: "uint256",
            name: "targetRelayerFee",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toNativeTokenAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "targetRecipientWallet",
            type: "bytes32",
          },
        ],
        internalType: "struct CircleRelayerStructs.TransferTokensWithRelay",
        name: "transfer",
        type: "tuple",
      },
    ],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          { internalType: "uint8", name: "payloadId", type: "uint8" },
          {
            internalType: "uint256",
            name: "targetRelayerFee",
            type: "uint256",
          },
          {
            internalType: "uint256",
            name: "toNativeTokenAmount",
            type: "uint256",
          },
          {
            internalType: "bytes32",
            name: "targetRecipientWallet",
            type: "bytes32",
          },
        ],
        internalType: "struct CircleRelayerStructs.TransferTokensWithRelay",
        name: "transfer",
        type: "tuple",
      },
    ],
    name: "encodeTransferTokensWithRelay",
    outputs: [{ internalType: "bytes", name: "encoded", type: "bytes" }],
    stateMutability: "pure",
    type: "function",
  },
  {
    inputs: [],
    name: "feeRecipient",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "getPaused",
    outputs: [{ internalType: "bool", name: "paused", type: "bool" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "emitterChainId", type: "uint16" },
    ],
    name: "getRegisteredContract",
    outputs: [{ internalType: "bytes32", name: "", type: "bytes32" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "maxNativeSwapAmount",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "address", name: "token", type: "address" }],
    name: "nativeSwapRate",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nativeSwapRatePrecision",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nativeTokenDecimals",
    outputs: [{ internalType: "uint8", name: "", type: "uint8" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "ownerAssistant",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "pendingOwner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        components: [
          {
            internalType: "bytes",
            name: "encodedWormholeMessage",
            type: "bytes",
          },
          { internalType: "bytes", name: "circleBridgeMessage", type: "bytes" },
          { internalType: "bytes", name: "circleAttestation", type: "bytes" },
        ],
        internalType: "struct ICircleIntegration.RedeemParameters",
        name: "redeemParams",
        type: "tuple",
      },
    ],
    name: "redeemTokens",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "bytes32", name: "contractAddress", type: "bytes32" },
    ],
    name: "registerContract",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "token", type: "address" },
    ],
    name: "relayerFee",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "bool", name: "paused", type: "bool" },
    ],
    name: "setPauseForTransfers",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "newOwner", type: "address" },
    ],
    name: "submitOwnershipTransferRequest",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "contract IERC20Metadata",
        name: "token",
        type: "address",
      },
      { internalType: "uint256", name: "amount", type: "uint256" },
      { internalType: "uint256", name: "toNativeTokenAmount", type: "uint256" },
      { internalType: "uint16", name: "targetChain", type: "uint16" },
      {
        internalType: "bytes32",
        name: "targetRecipientWallet",
        type: "bytes32",
      },
    ],
    name: "transferTokensWithRelay",
    outputs: [
      { internalType: "uint64", name: "messageSequence", type: "uint64" },
    ],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "newFeeRecipient", type: "address" },
    ],
    name: "updateFeeRecipient",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "maxAmount", type: "uint256" },
    ],
    name: "updateMaxNativeSwapAmount",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "swapRate", type: "uint256" },
    ],
    name: "updateNativeSwapRate",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      {
        internalType: "uint256",
        name: "nativeSwapRatePrecision_",
        type: "uint256",
      },
    ],
    name: "updateNativeSwapRatePrecision",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "newAssistant", type: "address" },
    ],
    name: "updateOwnerAssistant",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint16", name: "chainId_", type: "uint16" },
      { internalType: "address", name: "token", type: "address" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "updateRelayerFee",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [],
    name: "wormhole",
    outputs: [
      { internalType: "contract IWormhole", name: "", type: "address" },
    ],
    stateMutability: "view",
    type: "function",
  },
];
const abiERC20 = [ // ERC20 interface
  {
    inputs: [
      {
        internalType: "string",
        name: "name",
        type: "string",
      },
      {
        internalType: "string",
        name: "symbol",
        type: "string",
      },
    ],
    stateMutability: "nonpayable",
    type: "constructor",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Approval",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "approve",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "subtractedValue",
        type: "uint256",
      },
    ],
    name: "decreaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "addedValue",
        type: "uint256",
      },
    ],
    name: "increaseAllowance",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transfer",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        internalType: "address",
        name: "from",
        type: "address",
      },
      {
        indexed: true,
        internalType: "address",
        name: "to",
        type: "address",
      },
      {
        indexed: false,
        internalType: "uint256",
        name: "value",
        type: "uint256",
      },
    ],
    name: "Transfer",
    type: "event",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "sender",
        type: "address",
      },
      {
        internalType: "address",
        name: "recipient",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "amount",
        type: "uint256",
      },
    ],
    name: "transferFrom",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "address",
        name: "spender",
        type: "address",
      },
    ],
    name: "allowance",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "account",
        type: "address",
      },
    ],
    name: "balanceOf",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "decimals",
    outputs: [
      {
        internalType: "uint8",
        name: "",
        type: "uint8",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "name",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "symbol",
    outputs: [
      {
        internalType: "string",
        name: "",
        type: "string",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "totalSupply",
    outputs: [
      {
        internalType: "uint256",
        name: "",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];

const chains = { // RPC URLs by Wormhole chain ID
  2: "https://ethereum-rpc.publicnode.com/",
  6: "https://avalanche-c-chain-rpc.publicnode.com/",
  5: "https://polygon-bor-rpc.publicnode.com/",
  23: "https://arbitrum-one-rpc.publicnode.com/",
};

const chainSelector = { // Chain names by Wormhole chain ID
  2: "eth",
  6: "avax",
  5: "pol",
  23: "arb",
};

const chatSelector = { // Chat contract address by Wormhole chain ID
  2: "0x66AB0dB3A3D9E489B32D4415AFd673968338c69E",
  6: "0x66AB0dB3A3D9E489B32D4415AFd673968338c69E",
  5: "0x3f2721a16F877aCf2D06244d4C5648A30805B3Be",
  23: "0x3f2721a16F877aCf2D06244d4C5648A30805B3Be",
};

const usdcSelector = { // USDC contract address by Wormhole chain ID
  2: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
  6: "0xB97EF9Ef8734C71904D8002F8b6Bc66Dd9c48a6E",
  5: "0x3c499c542cef5e3811e1192ce70d8cc03d5c3359",
  23: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831",
};

module.exports = {
  abiMultiChainChat,
  abiCircleRelayer,
  chains,
  chainSelector,
  chatSelector,
  abiERC20,
  usdcSelector,
};
