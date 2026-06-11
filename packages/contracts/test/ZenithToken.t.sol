// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZenithToken.sol";

contract ZenithTokenTest is Test {
    ZenithToken token;

    address deployer = address(this);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant SUPPLY = 1_000_000 ether;

    function setUp() public {
        token = new ZenithToken(deployer);
    }

    /// total supply = 1.000.000 ZNTH, fully minted to deployer
    function test_MintOnDeploy() public {
        assertEq(token.totalSupply(), SUPPLY);
        assertEq(token.balanceOf(deployer), SUPPLY);
        assertEq(token.name(), "Zenith Governance Token");
        assertEq(token.symbol(), "ZNTH");
    }

    /// voting power only becomes active after delegate()
    function test_DelegateToSelf() public {
        // Holding tokens is not enough — votes are 0 until delegation.
        assertEq(token.getVotes(deployer), 0);

        token.delegate(deployer);

        assertEq(token.delegates(deployer), deployer);
        assertEq(token.getVotes(deployer), SUPPLY);
    }

    /// getPastVotes() returns the correct snapshot value per block
    function test_VotingPowerSnapshot() public {
        token.delegate(deployer);

        uint256 snapshotBlock = block.number;
        vm.roll(block.number + 1);

        assertEq(token.getPastVotes(deployer, snapshotBlock), SUPPLY);
    }

    /// transferring tokens moves voting power to the new holder
    function test_TransferResetsVotes() public {
        token.delegate(deployer);
        assertEq(token.getVotes(deployer), SUPPLY);

        // Receiver must self-delegate to accrue voting power.
        vm.prank(bob);
        token.delegate(bob);

        uint256 amount = 100_000 ether;
        token.transfer(bob, amount);

        assertEq(token.getVotes(deployer), SUPPLY - amount);
        assertEq(token.getVotes(bob), amount);
    }
}
