// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {RWAVault} from "../src/RWAVault.sol";
import {RwaAMM} from "../src/RwaAMM.sol";
import {PriceConsumer} from "../src/PriceConsumer.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockToken is ERC20 {
    constructor(string memory name, string memory symbol) ERC20(name, symbol) {
        _mint(msg.sender, 1000000 ether);
    }
}

contract DeFiTest is Test {
    RWAVault vault;
    RwaAMM amm;
    MockToken usdc;
    MockToken rwa;

    function setUp() public {
        usdc = new MockToken("USDC", "USDC");
        rwa = new MockToken("RWA Asset", "RWA");

        // ВАЖНО: передаем только один аргумент, как в коде RWAVault выше
        vault = new RWAVault(usdc);
        amm = new RwaAMM(address(usdc), address(rwa));
    }

    function test_VaultDeposit() public {
        usdc.approve(address(vault), 100 ether);
        uint256 shares = vault.deposit(100 ether, address(this));
        assertEq(shares, 100 ether);
    }

    function test_SqrtYul() public {
        assertEq(amm.sqrtYul(100), 10);
        assertEq(amm.sqrtYul(10000), 100);
    }

    function test_AMMSwapSlippage() public {
        usdc.approve(address(amm), 1000 ether);
        rwa.approve(address(amm), 1000 ether);
        amm.addLiquidity(1000 ether, 1000 ether);

        usdc.approve(address(amm), 10 ether);
        // Проверяем проскальзывание (ожидаем ошибку при завышенном лимите)
        vm.expectRevert("Slippage too high");
        amm.swap(10 ether, true, 20 ether);
    }
}