// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZenithToken.sol";
import "../src/MerkleDistributor.sol";

contract MerkleDistributorTest is Test {
    ZenithToken token;
    MerkleDistributor distributor;

    address deployer = address(this);
    address owner = address(0x0FF1CE);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);
    address mallory = address(0xBAD);

    uint256 constant ALICE_AMOUNT = 100_000 ether;
    uint256 constant BOB_AMOUNT = 50_000 ether;
    uint256 constant AIRDROP_TOTAL = ALICE_AMOUNT + BOB_AMOUNT;

    bytes32 leafAlice;
    bytes32 leafBob;
    bytes32 root;

    function setUp() public {
        token = new ZenithToken(deployer);

        // Two-leaf tree built the same way as OZ StandardMerkleTree.
        leafAlice = _leaf(alice, ALICE_AMOUNT);
        leafBob = _leaf(bob, BOB_AMOUNT);
        root = _hashPair(leafAlice, leafBob);

        distributor = new MerkleDistributor(token, root, owner);
        token.transfer(address(distributor), AIRDROP_TOTAL);
    }

    /// Eligible address claims its exact allocation.
    function test_Claim() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        distributor.claim(alice, ALICE_AMOUNT, proof);

        assertEq(token.balanceOf(alice), ALICE_AMOUNT);
        assertTrue(distributor.hasClaimed(alice));
    }

    /// A relayer can submit on a recipient's behalf; funds still go to the recipient.
    function test_ClaimByRelayer() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafAlice;

        vm.prank(mallory);
        distributor.claim(bob, BOB_AMOUNT, proof);

        assertEq(token.balanceOf(bob), BOB_AMOUNT);
        assertEq(token.balanceOf(mallory), 0);
    }

    /// Claiming twice reverts.
    function test_DoubleClaimReverts() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        distributor.claim(alice, ALICE_AMOUNT, proof);

        vm.expectRevert("Already claimed");
        distributor.claim(alice, ALICE_AMOUNT, proof);
    }

    /// A tampered amount breaks the proof.
    function test_WrongAmountReverts() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        vm.expectRevert("Invalid proof");
        distributor.claim(alice, ALICE_AMOUNT + 1, proof);
    }

    /// An address absent from the tree cannot claim.
    function test_IneligibleReverts() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;

        vm.expectRevert("Invalid proof");
        distributor.claim(mallory, ALICE_AMOUNT, proof);
    }

    /// Owner sweeps the remaining (unclaimed) balance back to the treasury.
    function test_SweepUnclaimed() public {
        bytes32[] memory proof = new bytes32[](1);
        proof[0] = leafBob;
        distributor.claim(alice, ALICE_AMOUNT, proof);

        vm.prank(owner);
        distributor.sweep(owner);

        assertEq(token.balanceOf(owner), BOB_AMOUNT);
        assertEq(token.balanceOf(address(distributor)), 0);
    }

    /// Only the owner can sweep.
    function test_SweepOnlyOwner() public {
        vm.prank(mallory);
        vm.expectRevert("Ownable: caller is not the owner");
        distributor.sweep(mallory);
    }

    function _leaf(address account, uint256 amount) internal pure returns (bytes32) {
        return keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
    }

    function _hashPair(bytes32 a, bytes32 b) internal pure returns (bytes32) {
        return a < b ? keccak256(abi.encodePacked(a, b)) : keccak256(abi.encodePacked(b, a));
    }
}
