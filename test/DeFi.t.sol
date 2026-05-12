// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RWAVault.sol";
import "../src/RwaAMM.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

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
    address admin = address(0x1);
    address user = address(0x2);

    function setUp() public {
        usdc = new MockToken("USDC", "USDC");
        rwa = new MockToken("RWA Asset", "RWA");
        vault = new RWAVault(usdc, admin);
        amm = new RwaAMM(address(usdc), address(rwa));

        usdc.transfer(user, 10000 ether);
        rwa.transfer(user, 10000 ether);
    }

    function test_FailDepositWithoutRole() public {
        vm.startPrank(user);
        usdc.approve(address(vault), 1000 ether);
        vm.expectRevert("Not authorized issuer");
        vault.deposit(1000 ether, user);
        vm.stopPrank();
    }

    function test_SqrtYul() public {
        assertEq(amm.sqrtYul(100), 10);
        assertEq(amm.sqrtYul(10000), 100);
    }
}