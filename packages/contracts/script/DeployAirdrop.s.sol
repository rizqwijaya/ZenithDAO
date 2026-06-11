// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/MerkleDistributor.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/// @notice Deploys the MerkleDistributor and funds it with the airdrop total.
/// @dev Required env:
///        PRIVATE_KEY    - deployer (must hold >= AIRDROP_TOTAL of the token)
///        TOKEN_ADDRESS  - ZNTH token
///        MERKLE_ROOT    - root from script/merkle-airdrop.mjs
///        AIRDROP_TOTAL  - sum of all allocations, in wei (from the generator)
///      Optional env:
///        AIRDROP_OWNER  - can sweep unclaimed tokens (defaults to deployer;
///                         set to the timelock to hand control to the DAO)
contract DeployAirdrop is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);

        IERC20 token = IERC20(vm.envAddress("TOKEN_ADDRESS"));
        bytes32 merkleRoot = vm.envBytes32("MERKLE_ROOT");
        uint256 airdropTotal = vm.envUint("AIRDROP_TOTAL");
        address owner = vm.envOr("AIRDROP_OWNER", deployer);

        vm.startBroadcast(deployerPrivateKey);

        MerkleDistributor distributor = new MerkleDistributor(token, merkleRoot, owner);
        require(token.transfer(address(distributor), airdropTotal), "Funding failed");

        vm.stopBroadcast();

        console.log("MerkleDistributor deployed at:", address(distributor));
        console.log("Funded with (wei):", airdropTotal);
        console.log("Sweep owner:", owner);
    }
}
