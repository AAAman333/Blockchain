// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

contract RwaAMM is ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0;
    IERC20 public immutable token1;

    uint256 public reserve0;
    uint256 public reserve1;

    mapping(address => uint256) public lpProviders;

    constructor(address _token0, address _token1) {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function sqrtYul(uint256 y) public pure returns (uint256 z) {
        assembly {
            switch y
            case 0 { z := 0 }
            case 1 { z := 1 }
            case 2 { z := 1 }
            case 3 { z := 1 }
            default {
                z := y
                let x := add(shr(1, y), 1)
                for { } lt(x, z) { } {
                    z := x
                    x := shr(1, add(div(y, x), x))
                }
            }
        }
    }

    function swap(uint256 amountIn, bool token0To1, uint256 minAmountOut) external nonReentrant returns (uint256 amountOut) {
        (uint256 resIn, uint256 resOut) = token0To1 ? (reserve0, reserve1) : (reserve1, reserve0);

        uint256 amountInWithFee = (amountIn * 997) / 1000;
        amountOut = (resOut * amountInWithFee) / (resIn + amountInWithFee);

        require(amountOut >= minAmountOut, "Slippage too high");

        if (token0To1) {
            token0.safeTransferFrom(msg.sender, address(this), amountIn);
            token1.safeTransfer(msg.sender, amountOut);
        } else {
            token1.safeTransferFrom(msg.sender, address(this), amountIn);
            token0.safeTransfer(msg.sender, amountOut);
        }

        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
    }

<<<<<<< HEAD
    function addLiquidity(uint256 amount0, uint256 amount1) external {
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);
=======
    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant {
        token0.transferFrom(msg.sender, address(this), amount0);
        token1.transferFrom(msg.sender, address(this), amount1);

        lpProviders[msg.sender] += (amount0 + amount1);

>>>>>>> 414ee81 (Fix paths, configure remappings, update RWAVault constructors and fix DeFi tests)
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this)); 
    }
}