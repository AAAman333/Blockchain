// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/RWAPlatform.sol";

contract GasBenchmarkTest is Test {
    RWAPlatform platform;

    function setUp() public {
        platform = new RWAPlatform();
    }

    function testBenchmarkAverage() public view {
        uint256 x = 1234567;
        uint256 y = 7654321;

        uint256 startGasSol = gasleft();
        platform.standardAverage(x, y);
        uint256 endGasSol = gasleft();
        
        uint256 startGasYul = gasleft();
        platform.optimizedAverage(x, y);
        uint256 endGasYul = gasleft();

        console.log("Solidity Gas:", startGasSol - endGasSol);
        console.log("Yul Gas:", startGasYul - endGasYul);
    }
}