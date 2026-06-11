// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZenithToken.sol";
import "../src/ZenithGovernor.sol";
import "../src/ZenithVault.sol";
import "@openzeppelin/contracts/governance/TimelockController.sol";

contract Deploy is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        vm.startBroadcast(deployerPrivateKey);

        // 1. Deploy token
        ZenithToken token = new ZenithToken(deployer);

        // 2. Deploy timelock (300 detik delay untuk testnet)
        address[] memory proposers = new address[](0);
        address[] memory executors = new address[](1);
        executors[0] = address(0); // siapapun bisa eksekusi
        TimelockController timelock = new TimelockController(300, proposers, executors, deployer);

        // 3. Deploy governor
        ZenithGovernor governor = new ZenithGovernor(token, timelock);

        // 4. Deploy vault (owner = timelock)
        ZenithVault vault = new ZenithVault(address(timelock));

        // 5. Grant proposer role ke governor di timelock
        timelock.grantRole(timelock.PROPOSER_ROLE(), address(governor));
        timelock.grantRole(timelock.CANCELLER_ROLE(), address(governor));

        // 6. Revoke admin dari deployer (opsional — fully decentralized)
        // timelock.revokeRole(timelock.TIMELOCK_ADMIN_ROLE(), deployer);

        vm.stopBroadcast();

        console.log("ZenithToken deployed at:", address(token));
        console.log("TimelockController deployed at:", address(timelock));
        console.log("ZenithGovernor deployed at:", address(governor));
        console.log("ZenithVault deployed at:", address(vault));
    }
}
