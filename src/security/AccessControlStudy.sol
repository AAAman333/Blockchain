// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/Ownable.sol";

contract VulnerableVault {
    uint256 public protocolFees;

    function setFees(uint256 _newFee) public {
        protocolFees = _newFee;
    }
}

contract FixedVault is Ownable {
    uint256 public protocolFees;

    constructor() Ownable(msg.sender) {}

    function setFees(uint256 _newFee) public onlyOwner {
        protocolFees = _newFee;
    }
}