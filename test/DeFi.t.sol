// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import {RWAVault} from "../src/RWAVault.sol";
import {RwaAMM} from "../src/RwaAMM.sol";
import {PriceConsumer} from "src/PriceConsumer.sol";
import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";

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

    // Официальный тестовый адрес Chainlink, который используется в кодовой базе
    address mockOracle = 0x694AA1769357215DE4FAC081bf1f309aDC325306;

    function setUp() public {
        // 1. Сначала инициализируем ERC20 токены
        usdc = new MockToken("USDC", "USDC");
        rwa = new MockToken("RWA", "RWA");

        // 2. Настраиваем Mock для Chainlink оракула
        // Имитируем, что getLatestPrice() возвращает цену $2000 (с учетом 8 знаков Chainlink: 2000 * 1e8)
        int256 fakePrice = 2000 * 1e8;
        vm.mockCall(
            mockOracle,
            abi.encodeWithSignature("getLatestPrice()"),
            abi.encode(fakePrice)
        );

        // 3. Деплоим основные контракты DeFi-системы с правильным количеством аргументов
        vault = new RWAVault(IERC20(address(usdc)), mockOracle);
        amm = new RwaAMM(address(usdc), address(rwa));
    }

    function test_VaultDeposit() public {
        uint256 depositAmount = 100 ether;
        usdc.approve(address(vault), depositAmount);

        // Согласно стандарту ERC-4626 от OpenZeppelin, при первом депозите
        // (когда totalSupply == 0) соотношение активов к акциям идет 1:1
        uint256 expectedShares = depositAmount;

        uint256 shares = vault.deposit(depositAmount, address(this));
        assertEq(shares, expectedShares, "Shares calculation mismatch with ERC-4626 standard");
    }

    function test_SqrtYul() public {
        // Тестируем оптимизированное вычисление квадратного корня через Inline Assembly (Yul)
        assertEq(amm.sqrtYul(100), 10);
        assertEq(amm.sqrtYul(10000), 100);
    }

    function test_AMMSwapSlippage() public {
        // Добавляем ликвидность в пул AMM
        usdc.approve(address(amm), 1000 ether);
        rwa.approve(address(amm), 1000 ether);
        amm.addLiquidity(1000 ether, 1000 ether);

        usdc.approve(address(amm), 10 ether);

        // Проверяем защиту от проскальзывания (Slippage)
        // Ожидаем реверт транзакции, так как мы затребовали завышенный minAmountOut (20 токенов вместо реальных ~9)
        vm.expectRevert("Slippage too high");
        amm.swap(10 ether, true, 20 ether);
    }
}