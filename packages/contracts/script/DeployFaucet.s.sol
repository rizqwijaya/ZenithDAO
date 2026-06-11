// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ZenithFaucet.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploys the ZNTH faucet and funds it.
/// @dev Required env:
///        PRIVATE_KEY      - deployer (must hold >= FAUCET_FUND of the token)
///        TOKEN_ADDRESS    - ZNTH token
///      Optional env (defaults shown):
///        FAUCET_AMOUNT    - per-claim amount in wei      (default 10 ZNTH)
///        FAUCET_COOLDOWN  - seconds between claims         (default 3600 = 1 hour)
///        FAUCET_FUND      - initial top-up in wei          (default 100,000 ZNTH)
///        FAUCET_OWNER     - can retune/withdraw            (default deployer)
contract DeployFaucet is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        IERC20 token = IERC20(vm.envAddress("TOKEN_ADDRESS"));
        uint256 amount = vm.envOr("FAUCET_AMOUNT", uint256(10 ether));
        uint256 cooldown = vm.envOr("FAUCET_COOLDOWN", uint256(1 hours));
        uint256 funding = vm.envOr("FAUCET_FUND", uint256(100_000 ether));
        address owner = vm.envOr("FAUCET_OWNER", deployer);

        vm.startBroadcast(deployerPrivateKey);

        ZenithFaucet faucet = new ZenithFaucet(token, amount, cooldown, owner);
        if (funding > 0) {
            require(token.transfer(address(faucet), funding), "Funding failed");
        }

        vm.stopBroadcast();

        console.log("ZenithFaucet deployed at:", address(faucet));
        console.log("Amount per claim (wei):", amount);
        console.log("Cooldown (seconds):", cooldown);
        console.log("Funded with (wei):", funding);
        console.log("Owner:", owner);
    }
}
