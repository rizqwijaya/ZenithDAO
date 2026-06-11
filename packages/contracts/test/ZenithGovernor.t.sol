// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZenithToken.sol";
import "../src/ZenithGovernor.sol";
import "../src/ZenithVault.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/governance/IGovernor.sol";

contract ZenithGovernorTest is Test {
    ZenithToken token;
    TimelockController timelock;
    ZenithGovernor governor;
    ZenithVault vault;

    address deployer = address(this);
    address voter = address(0x7012E5);
    address payable grantee = payable(address(0x6A47EE));

    uint256 constant SUPPLY = 1_000_000 ether;
    uint256 constant VAULT_FUNDING = 10 ether;
    uint256 constant PAYOUT = 1 ether;

    function setUp() public {
        token = new ZenithToken(deployer);

        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // anyone can execute
        timelock = new TimelockController(300, proposers, executors, deployer);

        governor = new ZenithGovernor(token, timelock);
        vault = new ZenithVault(address(timelock));

        // Wire governor into the timelock as proposer + canceller.
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // Give the voter 10% of supply (well above 4% quorum) and self-delegate.
        token.transfer(voter, 100_000 ether);
        vm.prank(voter);
        token.delegate(voter);

        // Deployer keeps the rest, self-delegated.
        token.delegate(deployer);

        // Fund the treasury vault.
        vm.deal(address(vault), VAULT_FUNDING);

        // Move forward one block so delegation checkpoints are in the past.
        vm.roll(block.number + 1);
    }

    // --- helpers ---------------------------------------------------------

    function _buildProposal()
        internal
        view
        returns (
            address[] memory targets,
            uint256[] memory values,
            bytes[] memory calldatas,
            string memory description
        )
    {
        targets = new address[](1);
        values = new uint256[](1);
        calldatas = new bytes[](1);
        targets[0] = address(vault);
        values[0] = 0;
        calldatas[0] = abi.encodeWithSelector(ZenithVault.executeETH.selector, grantee, PAYOUT);
        description = "ZIP-1: Pay 1 ETH from the treasury to the grantee";
    }

    function _propose() internal returns (uint256 proposalId) {
        (address[] memory t, uint256[] memory v, bytes[] memory c, string memory d) = _buildProposal();
        vm.prank(voter);
        proposalId = governor.propose(t, v, c, d);
    }

    // --- tests -----------------------------------------------------------

    /// propose() succeeds and returns a non-zero proposalId in Pending state
    function test_CreateProposal() public {
        uint256 id = _propose();
        assertGt(id, 0);
        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Pending));
    }

    /// state transitions Pending -> Active once votingDelay elapses
    function test_VotingPeriod() public {
        uint256 id = _propose();
        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Pending));

        vm.roll(block.number + governor.votingDelay() + 1);

        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Active));
    }

    /// a cast vote is counted and the tally updates
    function test_CastVote() public {
        uint256 id = _propose();
        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(voter);
        governor.castVote(id, 1); // 1 = For

        (uint256 against, uint256 forVotes, uint256 abstain) = governor.proposalVotes(id);
        assertEq(forVotes, 100_000 ether);
        assertEq(against, 0);
        assertEq(abstain, 0);
        assertTrue(governor.hasVoted(id, voter));
    }

    /// quorum reached + majority For => Succeeded
    function test_ProposalSucceeds() public {
        uint256 id = _propose();
        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(voter);
        governor.castVote(id, 1); // For

        vm.roll(block.number + governor.votingPeriod() + 1);

        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Succeeded));
    }

    /// majority Against (quorum on For not reached) => Defeated
    function test_ProposalDefeated() public {
        uint256 id = _propose();
        vm.roll(block.number + governor.votingDelay() + 1);

        vm.prank(voter);
        governor.castVote(id, 0); // Against

        vm.roll(block.number + governor.votingPeriod() + 1);

        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Defeated));
    }

    /// full flow: propose -> vote -> queue -> timelock wait -> execute -> funds leave the vault
    function test_QueueAndExecute() public {
        (address[] memory t, uint256[] memory v, bytes[] memory c, string memory d) = _buildProposal();
        bytes32 descHash = keccak256(bytes(d));

        vm.prank(voter);
        uint256 id = governor.propose(t, v, c, d);

        vm.roll(block.number + governor.votingDelay() + 1);
        vm.prank(voter);
        governor.castVote(id, 1); // For

        vm.roll(block.number + governor.votingPeriod() + 1);
        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Succeeded));

        // Queue into the timelock.
        governor.queue(t, v, c, descHash);
        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Queued));

        // Wait out the 300s timelock delay.
        vm.warp(block.timestamp + 301);

        uint256 beforeBal = grantee.balance;
        governor.execute(t, v, c, descHash);

        assertEq(uint8(governor.state(id)), uint8(IGovernor.ProposalState.Executed));
        assertEq(grantee.balance, beforeBal + PAYOUT);
        assertEq(vault.getETHBalance(), VAULT_FUNDING - PAYOUT);
    }
}
