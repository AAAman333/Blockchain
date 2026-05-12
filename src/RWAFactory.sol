// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./GovernanceToken.sol";

contract RWAFactory {
    event Deployed(address addr, uint256 method); 

    function deployWithCreate() external returns (address) {
        GovernanceToken newToken = new GovernanceToken();
        emit Deployed(address(newToken), 1);
        return address(newToken);
    }

    function deployWithCreate2(bytes32 salt) external returns (address) {
        GovernanceToken newToken = new GovernanceToken{salt: salt}();
        emit Deployed(address(newToken), 2);
        return address(newToken);
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