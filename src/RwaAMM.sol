// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

contract RwaAMM is ERC20, ReentrancyGuard {
    using SafeERC20 for IERC20;

    IERC20 public immutable token0;
    IERC20 public immutable token1;
    uint256 public reserve0;
    uint256 public reserve1;

    constructor(address _token0, address _token1) ERC20("RWA LP Token", "RWA-LP") {
        token0 = IERC20(_token0);
        token1 = IERC20(_token1);
    }

    function swap(uint256 amountIn, bool isToken0, uint256 minAmountOut) external nonReentrant returns (uint256 amountOut) {
        (uint256 resIn, uint256 resOut) = isToken0 ? (reserve0, reserve1) : (reserve1, reserve0);
        IERC20 inTkn = isToken0 ? token0 : token1;
        IERC20 outTkn = isToken0 ? token1 : token0;

        inTkn.safeTransferFrom(msg.sender, address(this), amountIn);

        uint256 amountInWithFee = (amountIn * 997) / 1000; // 0.3% fee
        amountOut = (resOut * amountInWithFee) / (resIn + amountInWithFee);
        require(amountOut >= minAmountOut, "Slippage too high");

        outTkn.safeTransfer(msg.sender, amountOut);
        _updateReserves();
    }

    function addLiquidity(uint256 amount0, uint256 amount1) external nonReentrant returns (uint256 shares) {
        token0.safeTransferFrom(msg.sender, address(this), amount0);
        token1.safeTransferFrom(msg.sender, address(this), amount1);

        uint256 _totalSupply = totalSupply();
        if (_totalSupply == 0) {
            shares = sqrtYul(amount0 * amount1);
        } else {
            shares = (amount0 * _totalSupply) / reserve0; // Упрощенно для примера
        }

        _mint(msg.sender, shares);
        _updateReserves();
    }

    function _updateReserves() internal {
        reserve0 = token0.balanceOf(address(this));
        reserve1 = token1.balanceOf(address(this));
    }

    function sqrtYul(uint256 y) public pure returns (uint256 z) {
        assembly {
            switch uint256(gt(y, 3))
        case 1 {
        z := y
        let x := add(div(y, 2), 1)
    for { } lt(x, z) { } {
        z := x
        x := div(add(div(y, x), x), 2)
    }
    }
        default { if iszero(iszero(y)) { z := 1 } }
    }
}
}