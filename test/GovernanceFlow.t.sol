// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "forge-std/Test.sol";
import "../src/ProtocolGovernor.sol";
import "../src/GovernanceToken.sol";
import "../src/Timelock.sol";

contract GovernanceFlowTest is Test {
    ProtocolGovernor governor;
    GovernanceToken govToken;
    ProtocolTimelock timelock;

    address public voter = address(0x1337);
    address public admin = address(0x42);

    function setUp() public {
        govToken = new GovernanceToken();
        
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](0);
        
        timelock = new ProtocolTimelock(2 days, proposers, executors, admin);
        governor = new ProtocolGovernor(govToken, timelock);
        
        vm.startPrank(admin);
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.EXECUTOR_ROLE(), address(0));
        vm.stopPrank();

        govToken.transfer(voter, 10_000_000 * 10**18);
        govToken.transfer(address(timelock), 1000 * 10**18); 

        vm.prank(voter);
        govToken.delegate(voter);
        
        vm.roll(block.number + 1);
    }

    function testFullGovernanceCycle() public {
        address[] memory targets = new address[](1);
        uint256[] memory values = new uint256[](1);
        bytes[] memory calldatas = new bytes[](1);
        string memory description = "Proposal #1: Treasury Disbursement";

        targets[0] = address(govToken);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSignature("transfer(address,uint256)", address(0x123), 100);

        vm.prank(voter);
        uint256 proposalId = governor.propose(targets, values, calldatas, description);
        
        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(voter);
        governor.castVote(proposalId, 1);

        vm.roll(block.number + governor.votingPeriod() + 1);

        bytes32 descriptionHash = keccak256(bytes(description));
        governor.queue(targets, values, calldatas, descriptionHash);

        vm.warp(block.timestamp + 2 days + 1);
        governor.execute(targets, values, calldatas, descriptionHash);
        
        assertEq(uint(governor.state(proposalId)), 7);
        assertEq(govToken.balanceOf(address(0x123)), 100); 
    }
}