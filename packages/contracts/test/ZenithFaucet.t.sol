// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZenithToken.sol";
import "../src/ZenithFaucet.sol";

contract ZenithFaucetTest is Test {
    ZenithToken token;
    ZenithFaucet faucet;

    address deployer = address(this);
    address owner = address(0x0FF1CE);
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    uint256 constant AMOUNT = 10 ether;
    uint256 constant COOLDOWN = 1 hours;
    uint256 constant FUNDING = 1_000 ether;

    function setUp() public {
        token = new ZenithToken(deployer);
        faucet = new ZenithFaucet(token, AMOUNT, COOLDOWN, owner);
        token.transfer(address(faucet), FUNDING);
    }

    /// Any wallet can claim, with no prior allowlist.
    function test_FirstClaim() public {
        vm.prank(alice);
        faucet.claim();

        assertEq(token.balanceOf(alice), AMOUNT);
        assertEq(faucet.lastClaim(alice), block.timestamp);
    }

    /// A second wallet claims independently.
    function test_AnyWalletCanClaim() public {
        vm.prank(alice);
        faucet.claim();
        vm.prank(bob);
        faucet.claim();

        assertEq(token.balanceOf(alice), AMOUNT);
        assertEq(token.balanceOf(bob), AMOUNT);
    }

    /// Claiming again before the cooldown elapses reverts.
    function test_CooldownBlocksSecondClaim() public {
        vm.startPrank(alice);
        faucet.claim();

        vm.expectRevert("Cooldown active");
        faucet.claim();
        vm.stopPrank();
    }

    /// After the cooldown, the same wallet can claim again.
    function test_ClaimAfterCooldown() public {
        vm.startPrank(alice);
        faucet.claim();

        vm.warp(block.timestamp + COOLDOWN);
        faucet.claim();
        vm.stopPrank();

        assertEq(token.balanceOf(alice), AMOUNT * 2);
    }

    /// The countdown view reports remaining time and hits zero when ready.
    function test_SecondsUntilNextClaim() public {
        assertEq(faucet.secondsUntilNextClaim(alice), 0); // never claimed

        vm.prank(alice);
        faucet.claim();

        assertEq(faucet.secondsUntilNextClaim(alice), COOLDOWN);
        vm.warp(block.timestamp + COOLDOWN / 2);
        assertEq(faucet.secondsUntilNextClaim(alice), COOLDOWN / 2);
        vm.warp(block.timestamp + COOLDOWN);
        assertEq(faucet.secondsUntilNextClaim(alice), 0);
    }

    /// Claims revert once the faucet runs dry.
    function test_FaucetEmptyReverts() public {
        vm.prank(owner);
        faucet.withdraw(owner, FUNDING); // drain it

        vm.prank(alice);
        vm.expectRevert("Faucet empty");
        faucet.claim();
    }

    /// Owner can retune the dispense amount.
    function test_OwnerSetAmount() public {
        vm.prank(owner);
        faucet.setAmountPerClaim(25 ether);

        vm.prank(alice);
        faucet.claim();
        assertEq(token.balanceOf(alice), 25 ether);
    }

    /// Owner can shorten/extend the cooldown.
    function test_OwnerSetCooldown() public {
        vm.prank(owner);
        faucet.setCooldown(10 minutes);

        vm.startPrank(alice);
        faucet.claim();
        vm.warp(block.timestamp + 10 minutes);
        faucet.claim();
        vm.stopPrank();

        assertEq(token.balanceOf(alice), AMOUNT * 2);
    }

    /// Config + withdraw are owner-only.
    function test_OnlyOwnerControls() public {
        vm.startPrank(alice);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.setAmountPerClaim(1 ether);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.setCooldown(1);
        vm.expectRevert("Ownable: caller is not the owner");
        faucet.withdraw(alice, 1 ether);
        vm.stopPrank();
    }
}
