// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./GovernanceToken.sol";

contract RWAFactory {
    event Deployed(address indexed addr, uint256 method);

    address[] public deployedTokens;

    function deployWithCreate() external returns (address) {
        GovernanceToken newToken = new GovernanceToken();
        deployedTokens.push(address(newToken));
        emit Deployed(address(newToken), 1);
        return address(newToken);
    }

    function deployWithCreate2(bytes32 salt) external returns (address) {
        GovernanceToken newToken = new GovernanceToken{salt: salt}();
        deployedTokens.push(address(newToken));
        emit Deployed(address(newToken), 2);
        return address(newToken);
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function predictAddress(bytes32 salt) public view returns (address) {
        return address(uint160(uint256(keccak256(abi.encodePacked(
            bytes1(0xff),
            address(this),
            salt,
            keccak256(abi.encodePacked(type(GovernanceToken).creationCode))
        )))));
    }
}