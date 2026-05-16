// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RWAAsset.sol";

contract RWAFactory {
    event AssetDeployed(address assetAddress, uint256 method);

    address[] public deployedTokens;

    function deployWithCreate(string memory name, string memory symbol) external returns (address) {
        RWAAsset newAsset = new RWAAsset(name, symbol, msg.sender);
        deployedTokens.push(address(newAsset));
        emit AssetDeployed(address(newAsset), 1);
        return address(newAsset);
    }

    function deployWithCreate2(string memory name, string memory symbol, bytes32 salt) external returns (address) {
        RWAAsset newAsset = new RWAAsset{salt: salt}(name, symbol, msg.sender);
        deployedTokens.push(address(newAsset));
        emit AssetDeployed(address(newAsset), 2);
        return address(newAsset);
    }

    function getDeployedTokens() external view returns (address[] memory) {
        return deployedTokens;
    }

    function getPrecomputedAddress(string memory name, string memory symbol, bytes32 salt) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(type(RWAAsset).creationCode, abi.encode(name, symbol, msg.sender));
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint256(hash)));
    }
}