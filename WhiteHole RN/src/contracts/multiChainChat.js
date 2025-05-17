export const abiMultiChainChat = [
    {
        "type": "constructor",
        "inputs": [
            {
                "name": "_wormholeRelayer",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "_wormholeChainId",
                "type": "uint16",
                "internalType": "uint16"
            }
        ],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "addMessage",
        "inputs": [
            {
                "name": "to",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "messFrom",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "messTo",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "iv",
                "type": "string",
                "internalType": "string"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "chatCounter",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "chatHistory",
        "inputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "fromChainId",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "toChainId",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "from",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "to",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "messFrom",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "messTo",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "iv",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "blocktime",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "counter",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "garbage",
        "inputs": [],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "owner",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "address"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "quoteCrossChainCost",
        "inputs": [
            {
                "name": "targetChain",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "_GAS_LIMIT",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [
            {
                "name": "cost",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "receiveWormholeMessages",
        "inputs": [
            {
                "name": "payload",
                "type": "bytes",
                "internalType": "bytes"
            },
            {
                "name": "",
                "type": "bytes[]",
                "internalType": "bytes[]"
            },
            {
                "name": "sourceAddress",
                "type": "bytes32",
                "internalType": "bytes32"
            },
            {
                "name": "sourceChain",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "registeredSenders",
        "inputs": [
            {
                "name": "",
                "type": "uint16",
                "internalType": "uint16"
            }
        ],
        "outputs": [
            {
                "name": "",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "sendMessage",
        "inputs": [
            {
                "name": "targetChain",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "targetAddress",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "_GAS_LIMIT",
                "type": "uint256",
                "internalType": "uint256"
            },
            {
                "name": "to",
                "type": "address",
                "internalType": "address"
            },
            {
                "name": "messFrom",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "messTo",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "iv",
                "type": "string",
                "internalType": "string"
            },
            {
                "name": "amount",
                "type": "uint256",
                "internalType": "uint256"
            }
        ],
        "outputs": [],
        "stateMutability": "payable"
    },
    {
        "type": "function",
        "name": "setRegisteredSender",
        "inputs": [
            {
                "name": "sourceChain",
                "type": "uint16",
                "internalType": "uint16"
            },
            {
                "name": "sourceAddress",
                "type": "bytes32",
                "internalType": "bytes32"
            }
        ],
        "outputs": [],
        "stateMutability": "nonpayable"
    },
    {
        "type": "function",
        "name": "wormholeChainId",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "uint16",
                "internalType": "uint16"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "function",
        "name": "wormholeRelayer",
        "inputs": [],
        "outputs": [
            {
                "name": "",
                "type": "address",
                "internalType": "contract IWormholeRelayer"
            }
        ],
        "stateMutability": "view"
    },
    {
        "type": "event",
        "name": "MessageReceived",
        "inputs": [
            {
                "name": "message",
                "type": "string",
                "indexed": false,
                "internalType": "string"
            }
        ],
        "anonymous": false
    },
    {
        "type": "event",
        "name": "SourceChainLogged",
        "inputs": [
            {
                "name": "sourceChain",
                "type": "uint16",
                "indexed": false,
                "internalType": "uint16"
            }
        ],
        "anonymous": false
    }
]