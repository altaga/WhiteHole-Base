// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.23;

// Import OpenZeppelin's ERC20 implementation for token interaction
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

// Contract for batching queries of token balances and decimals
contract BatchBalances {
    /**
     * @dev Retrieves the decimal values for a list of ERC20 token addresses.
     * @param _tokenAddresses Array of ERC20 token addresses.
     * @return An array of decimal values corresponding to each token address.
     */
    function batchDecimals(
        address[] memory _tokenAddresses
    ) public view returns (uint256[] memory) {
        // Initialize an array to store decimals for each token
        uint256[] memory decimals = new uint256[](_tokenAddresses.length);

        // Loop through each token address and fetch its decimals
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            decimals[i] = ERC20(_tokenAddresses[i]).decimals();
        }

        // Return the array of decimals
        return decimals;
    }

    /**
     * @dev Retrieves the balance of a specified address across multiple ERC20 tokens in a single call.
     * @param _owner The address of the account to check balances for.
     * @param _tokenAddresses Array of ERC20 token addresses.
     * @return An array of balances corresponding to each token for the specified address.
     */
    function batchBalanceOf(
        address _owner,
        address[] memory _tokenAddresses
    ) public view returns (uint256[] memory) {
        // Initialize an array to store balances for each token
        uint256[] memory balances = new uint256[](_tokenAddresses.length);

        // Loop through each token address and fetch the balance for _owner
        for (uint256 i = 0; i < _tokenAddresses.length; i++) {
            balances[i] = ERC20(_tokenAddresses[i]).balanceOf(_owner);
        }

        // Return the array of balances
        return balances;
    }
}
