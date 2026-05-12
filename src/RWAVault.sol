// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract RWAVault is ERC4626, AccessControl {
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");

    constructor(IERC20 asset, address admin)
    ERC4626(asset)
    ERC20("RWA Yield Token", "yRWA")
    {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        require(hasRole(MINTER_ROLE, msg.sender), "Not authorized issuer");
        return super.deposit(assets, receiver);
    }

    function mint(uint256 shares, address receiver) public override returns (uint256) {
        require(hasRole(MINTER_ROLE, msg.sender), "Not authorized issuer");
        return super.mint(shares, receiver);
    }
}