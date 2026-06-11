// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ZenithDAO Merkle airdrop distributor
/// @notice Distributes a fixed ZNTH allocation to a pre-committed set of
///         addresses. Eligibility lives in a Merkle root; each recipient claims
///         their own slice by submitting a proof, so on-chain cost scales with
///         claimers, not with the size of the list.
/// @dev Leaf format matches OpenZeppelin's StandardMerkleTree (JS):
///      keccak256(bytes.concat(keccak256(abi.encode(account, amount)))).
///      The double hash prevents a leaf from being forged as an internal node.
contract MerkleDistributor is Ownable {
    using SafeERC20 for IERC20;

    /// @notice Token being distributed (ZNTH).
    IERC20 public immutable token;
    /// @notice Merkle root committing to the full (account, amount) allocation.
    bytes32 public immutable merkleRoot;

    /// @notice Whether an address has already claimed its allocation.
    mapping(address => bool) public hasClaimed;

    event Claimed(address indexed account, uint256 amount);
    event Swept(address indexed to, uint256 amount);

    /// @param token_      ERC20 to distribute.
    /// @param merkleRoot_ Root of the (account, amount) allocation tree.
    /// @param owner_      Address allowed to sweep unclaimed tokens (e.g. the DAO timelock).
    constructor(IERC20 token_, bytes32 merkleRoot_, address owner_) {
        require(address(token_) != address(0), "Token is zero");
        require(merkleRoot_ != bytes32(0), "Root is zero");
        token = token_;
        merkleRoot = merkleRoot_;
        _transferOwnership(owner_);
    }

    /// @notice Claim `amount` for `account` by proving membership in the tree.
    /// @dev Permissionless caller; tokens always go to `account`, so a relayer
    ///      can pay gas on a recipient's behalf without redirecting funds.
    function claim(address account, uint256 amount, bytes32[] calldata merkleProof) external {
        require(!hasClaimed[account], "Already claimed");

        bytes32 leaf = keccak256(bytes.concat(keccak256(abi.encode(account, amount))));
        require(MerkleProof.verify(merkleProof, merkleRoot, leaf), "Invalid proof");

        hasClaimed[account] = true;
        token.safeTransfer(account, amount);

        emit Claimed(account, amount);
    }

    /// @notice Recover tokens not yet claimed. Intended for the DAO to reclaim
    ///         leftovers after the airdrop window, returning them to the treasury.
    function sweep(address to) external onlyOwner {
        require(to != address(0), "To is zero");
        uint256 balance = token.balanceOf(address(this));
        token.safeTransfer(to, balance);
        emit Swept(to, balance);
    }
}
