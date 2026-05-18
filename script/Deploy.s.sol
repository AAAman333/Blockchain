// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.24;

import {Script} from "../lib/forge-std/src/Script.sol";
import "../lib/openzeppelin-contracts/contracts/governance/TimelockController.sol";
import {IVotes} from "../lib/openzeppelin-contracts/contracts/governance/utils/IVotes.sol";
import {ERC1967Proxy} from "../lib/openzeppelin-contracts/contracts/proxy/ERC1967/ERC1967Proxy.sol";
import {GovernanceToken} from "../src/GovernanceToken.sol";
import {ProtocolTimelock} from "../src/Timelock.sol";
import {ProtocolGovernor} from "../src/ProtocolGovernor.sol";
import {RWAPlatform} from "../src/RWAPlatform.sol";
import {RWAFactory} from "../src/RWAFactory.sol";

contract Deploy is Script {
    function run() public {
        vm.startBroadcast();

        address deployer = msg.sender;

        GovernanceToken token = new GovernanceToken();

        address[] memory executors = new address[](1);
        executors[0] = address(0);

        ProtocolTimelock timelock = new ProtocolTimelock(
            2 days,
            new address[](0),
            executors,
            deployer
        );

        ProtocolGovernor governor = new ProtocolGovernor(
            IVotes(address(token)),
            TimelockController(payable(address(timelock)))
        );

        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));

 
        bytes memory initData = abi.encodeWithSelector(
            RWAPlatform.initialize.selector,
            deployer
        );

        ERC1967Proxy proxy = new ERC1967Proxy(address(platformImpl), initData);
       
        RWAPlatform platform = RWAPlatform(address(proxy));

        RWAFactory factory = new RWAFactory();

        bytes32 DEFAULT_ADMIN_ROLE = bytes32(0);
        platform.grantRole(DEFAULT_ADMIN_ROLE, address(timelock));
        platform.revokeRole(DEFAULT_ADMIN_ROLE, deployer);

        vm.stopBroadcast();
    }
}