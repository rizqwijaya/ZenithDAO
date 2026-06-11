// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/ZenithVault.sol";

contract ZenithVaultTest is Test {
    ZenithVault vault;

    // Stand-in for the TimelockController: holder of EXECUTOR_ROLE.
    address timelock = address(0x7);
    address alice = address(0xA11CE);
    address payable target = payable(address(0xBEEF));

    event ETHReceived(address indexed sender, uint256 amount);
    event ETHExecuted(address indexed target, uint256 amount);

    function setUp() public {
        vault = new ZenithVault(timelock);
    }

    /// vault can receive ETH via receive()
    function test_ReceiveETH() public {
        vm.deal(alice, 5 ether);

        vm.expectEmit(true, false, false, true, address(vault));
        emit ETHReceived(alice, 1 ether);

        vm.prank(alice);
        (bool ok,) = address(vault).call{value: 1 ether}("");

        assertTrue(ok);
        assertEq(vault.getETHBalance(), 1 ether);
    }

    /// anyone without EXECUTOR_ROLE is reverted
    function test_OnlyTimelockCanExecute() public {
        vm.deal(address(vault), 2 ether);

        vm.prank(alice);
        vm.expectRevert();
        vault.executeETH(target, 1 ether);
    }

    /// the timelock can move ETH out to a target
    function test_ExecuteETH() public {
        vm.deal(address(vault), 3 ether);
        uint256 before = target.balance;

        vm.expectEmit(true, false, false, true, address(vault));
        emit ETHExecuted(target, 2 ether);

        vm.prank(timelock);
        vault.executeETH(target, 2 ether);

        assertEq(target.balance, before + 2 ether);
        assertEq(vault.getETHBalance(), 1 ether);
    }

    /// executeETH reverts when the vault lacks the funds
    function test_ExecuteETH_RevertsOnInsufficientBalance() public {
        vm.deal(address(vault), 1 ether);

        vm.prank(timelock);
        vm.expectRevert("Insufficient ETH");
        vault.executeETH(target, 2 ether);
    }
}
