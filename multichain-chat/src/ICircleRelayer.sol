// SPDX-License-Identifier: Apache 2
pragma solidity ^0.8.17;

// Import IERC20Metadata from OpenZeppelin for extended ERC20 token functionality
import "lib/openzeppelin-contracts/contracts/token/ERC20/extensions/IERC20Metadata.sol";

// Interface for the ICircleRelayer contract, enabling cross-chain token relaying and token swaps
interface ICircleRelayer {
    /**
     * @dev Event emitted when a token swap is successfully executed.
     * @param recipient The recipient of the token swap.
     * @param relayer The address of the relayer performing the swap.
     * @param token The token involved in the swap.
     * @param tokenAmount The amount of tokens swapped.
     * @param nativeAmount The amount of native token received (if applicable).
     */
    event SwapExecuted(
        address indexed recipient,
        address indexed relayer,
        address indexed token,
        uint256 tokenAmount,
        uint256 nativeAmount
    );

    /**
     * @dev Returns the version of the relayer contract.
     * @return A string representing the version.
     */
    function VERSION() external view returns (string memory);

    /**
     * @dev Transfers tokens with relay support, allowing cross-chain transfers to a specified recipient.
     * @param token The ERC20 token to be transferred.
     * @param amount The amount of tokens to transfer.
     * @param toNativeTokenAmount The amount of native tokens to swap in the target chain.
     * @param targetChain The target blockchain's chain ID.
     * @param targetRecipientWallet The recipient's wallet address on the target chain in bytes32 format.
     * @return messageSequence A unique sequence number for the transfer message.
     */
    function transferTokensWithRelay(
        IERC20Metadata token,
        uint256 amount,
        uint256 toNativeTokenAmount,
        uint16 targetChain,
        bytes32 targetRecipientWallet
    ) external payable returns (uint64 messageSequence);

    /**
     * @dev Converts a bytes32 address format to a standard address type.
     * @param address_ The address in bytes32 format.
     * @return The converted address in standard address format.
     */
    function bytes32ToAddress(bytes32 address_) external pure returns (address);
}
