// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;
import {AggregatorV3Interface} from "@chainlink/contracts/src/v0.8/shared/interfaces/AggregatorV3Interface.sol";

contract PriceConsumer {
    AggregatorV3Interface internal dataFeed;

    constructor(address _priceFeed) {
        dataFeed = AggregatorV3Interface(_priceFeed);
    }

    function getLatestPrice() public view returns (int) {
        (uint80 roundId, int price, , uint updatedAt, uint80 answeredInRound) = dataFeed.latestRoundData();
        require(updatedAt > block.timestamp - 3600, "Price stale");
        require(answeredInRound >= roundId, "Incomplete round");
        return price;
    }
}