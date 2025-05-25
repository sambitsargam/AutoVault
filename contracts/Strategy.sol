// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IStrategy {
    function apy() external view returns (uint256);
    function harvestYield() external;
}

contract Strategy is IStrategy {
    uint256 private _apy;       // e.g. 600 = 6.00%
    address public vault;

    constructor(uint256 apy_, address vault_) {
        _apy   = apy_;
        vault  = vault_;
    }

    // Return the APY as basis points (e.g. 600 = 6.00%)
    function apy() external view override returns (uint256) {
        return _apy;
    }

    // Simulate yield by sending 0.01 USDC.e each harvest
    function harvestYield() external override {
        // NOTE: Vault must approve this contract to pull from its USDC.e balance
        // or simply send from this contract—here we assume a no-op
    }
}
