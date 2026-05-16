// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "./RWAAsset.sol";

contract RWAFactory {
    event Deployed(address addr, uint256 method);

    address[] private _deployedTokens;

    address[] public deployedTokens;

    function deployWithCreate(string memory name, string memory symbol) external returns (address) {
        RWAAsset newAsset = new RWAAsset(name, symbol, msg.sender);
<<<<<<< HEAD
        _deployedTokens.push(address(newAsset));
        emit Deployed(address(newAsset), 1);
=======
        deployedTokens.push(address(newAsset));
        emit AssetDeployed(address(newAsset), 1);
>>>>>>> d6aae22 (adresses)
        return address(newAsset);
    }

    function deployWithCreate2(string memory name, string memory symbol, bytes32 salt) external returns (address) {
        RWAAsset newAsset = new RWAAsset{salt: salt}(name, symbol, msg.sender);
<<<<<<< HEAD
        _deployedTokens.push(address(newAsset));
        emit Deployed(address(newAsset), 2);
=======
        deployedTokens.push(address(newAsset));
        emit AssetDeployed(address(newAsset), 2);
>>>>>>> d6aae22 (adresses)
        return address(newAsset);
    }

    function getDeployedTokens() external view returns (address[] memory) {
<<<<<<< HEAD
        return _deployedTokens;
=======
        return deployedTokens;
>>>>>>> d6aae22 (adresses)
    }

    function getPrecomputedAddress(string memory name, string memory symbol, bytes32 salt) public view returns (address) {
        bytes memory bytecode = abi.encodePacked(type(RWAAsset).creationCode, abi.encode(name, symbol, msg.sender));
        bytes32 hash = keccak256(abi.encodePacked(bytes1(0xff), address(this), salt, keccak256(bytecode)));
        return address(uint160(uint256(hash)));
    }
}