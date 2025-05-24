// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

interface IStrategy {
    function harvestYield() external;
}

contract Vault is ERC20 {
    IERC20 public usdcE;
    address public owner;

    constructor(address _usdcE) ERC20("vUSDC.e", "vUSDCe") {
        usdcE = IERC20(_usdcE);
        owner = msg.sender;
    }

    function totalAssets() public view returns (uint256) {
        return usdcE.balanceOf(address(this));
    }

    function deposit(uint256 amount) external {
        require(amount > 0, "ZERO");
        uint256 shares = totalSupply() == 0
            ? amount
            : (amount * totalSupply()) / totalAssets();
        _mint(msg.sender, shares);
        require(usdcE.transferFrom(msg.sender, address(this), amount), "TRANSFER_FAILED");
    }

    function withdraw(uint256 shares) external {
        require(shares > 0, "ZERO");
        uint256 amount = (totalAssets() * shares) / totalSupply();
        _burn(msg.sender, shares);
        require(usdcE.transfer(msg.sender, amount), "TRANSFER_FAILED");
    }

    function harvest(address strategy) external {
        require(msg.sender == owner, "ONLY_OWNER");
        IStrategy(strategy).harvestYield();
    }
}
