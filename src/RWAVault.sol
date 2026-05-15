// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "./PriceConsumer.sol";

contract RWAVault is ERC4626 {
    PriceConsumer public immutable priceOracle;

    constructor(IERC20 asset, address _oracle)
    ERC20("RWA Vault Share", "rvRWA")
    ERC4626(asset)
    {
        priceOracle = PriceConsumer(_oracle);
    }
    function convertToShares(uint256 assets) public view override returns (uint256) {
        uint256 supply = totalSupply();
        int price = priceOracle.getLatestPrice();
        require(price > 0, "Invalid oracle price");

        uint256 adjustedPrice = uint256(price) * 10**10;

        if (supply == 0) {
            return (assets * adjustedPrice) / 1e18;
        }
        return super.convertToShares(assets);
    }

    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        require(assets > 0, "Deposit must be > 0");
        return super.deposit(assets, receiver);
    }
}