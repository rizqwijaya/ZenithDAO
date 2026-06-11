// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZenithGovernor.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";
import "@openzeppelin/contracts/governance/utils/IVotes.sol";

/// @notice Redeploys ONLY the Governor against the existing token + timelock,
///         then wires the timelock roles. Use to change governance params
///         (e.g. proposalThreshold) without touching the token, faucet, or vault.
/// @dev Required env:
///        PRIVATE_KEY      - deployer (must hold the timelock admin role)
///        TOKEN_ADDRESS    - existing ZNTH token
///        TIMELOCK_ADDRESS - existing TimelockController
contract DeployGovernor is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address token = vm.envAddress("TOKEN_ADDRESS");
        TimelockController timelock = TimelockController(payable(vm.envAddress("TIMELOCK_ADDRESS")));

        vm.startBroadcast(deployerPrivateKey);

        ZenithGovernor governor = new ZenithGovernor(IVotes(token), timelock);

        // Let the new governor schedule + cancel through the timelock.
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        vm.stopBroadcast();

        console.log("New ZenithGovernor deployed at:", address(governor));
        console.log("proposalThreshold:", governor.proposalThreshold());
        console.log("Update VITE_GOVERNOR_ADDRESS + backend GOVERNOR/START_BLOCK to this address.");
    }
}
