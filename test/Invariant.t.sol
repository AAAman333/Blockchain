// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RwaAMM.sol";
import "./DeFi.t.sol";

contract AMMInvariants is Test {
    RwaAMM amm;
    MockToken usdc;
    MockToken rwa;

    function setUp() public {
        usdc = new MockToken("USDC", "USDC");
        rwa = new MockToken("RWA", "RWA");
        amm = new RwaAMM(address(usdc), address(rwa));

        usdc.approve(address(amm), 10000 ether);
        rwa.approve(address(amm), 10000 ether);
        amm.addLiquidity(1000 ether, 1000 ether);
    }

    function testFuzz_Swap(uint256 amountIn) public {
        vm.assume(amountIn > 0 && amountIn < 100 ether);

        usdc.approve(address(amm), amountIn);
        amm.swap(amountIn, true, 0);

        assertGt(usdc.balanceOf(address(amm)), 1000 ether);
    }

    function invariant_ProductK() public view {
        uint256 k = amm.reserve0() * amm.reserve1();
        assertGe(k, 1000 ether * 1000 ether);
    }
}