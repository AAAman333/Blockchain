// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC4626.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract RWAVault is ERC4626, Ownable {
    // Храним адрес администратора для проверки ролей из ТЗ
    constructor(IERC20 asset)
    ERC20("RWA Vault Share", "rvRWA")
    ERC4626(asset)
    Ownable(msg.sender)
    {}

    // ТЗ: Пример ограничения (только для авторизованных лиц, если нужно по заданию)
    function deposit(uint256 assets, address receiver) public override returns (uint256) {
        return super.deposit(assets, receiver);
    }
}