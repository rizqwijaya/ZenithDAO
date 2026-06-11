// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/// @title ZenithDAO ZNTH faucet
/// @notice Open faucet: any wallet may claim a fixed amount of ZNTH, rate-limited
///         by a per-address cooldown. Lets newcomers grab enough tokens to try
///         governance on testnet without a fixed allowlist. Funded by the DAO/deployer.
contract ZenithFaucet is Ownable {
    using SafeERC20 for IERC20;

    /// @notice Token dispensed by the faucet (ZNTH).
    IERC20 public immutable token;
    /// @notice Amount sent per successful claim (in wei).
    uint256 public amountPerClaim;
    /// @notice Minimum seconds between two claims from the same address.
    uint256 public cooldown;
    /// @notice Last claim timestamp per address (0 = never claimed).
    mapping(address => uint256) public lastClaim;

    event Claimed(address indexed account, uint256 amount);
    event AmountChanged(uint256 amount);
    event CooldownChanged(uint256 cooldown);
    event Withdrawn(address indexed to, uint256 amount);

    constructor(IERC20 token_, uint256 amountPerClaim_, uint256 cooldown_, address owner_) {
        require(address(token_) != address(0), "Token is zero");
        token = token_;
        amountPerClaim = amountPerClaim_;
        cooldown = cooldown_;
        _transferOwnership(owner_);
    }

    /// @notice Claim `amountPerClaim` to the caller, if the cooldown has elapsed.
    function claim() external {
        require(canClaim(msg.sender), "Cooldown active");
        require(token.balanceOf(address(this)) >= amountPerClaim, "Faucet empty");

        lastClaim[msg.sender] = block.timestamp;
        token.safeTransfer(msg.sender, amountPerClaim);

        emit Claimed(msg.sender, amountPerClaim);
    }

    /// @notice Whether `account` may claim right now.
    function canClaim(address account) public view returns (bool) {
        return block.timestamp >= nextClaimAt(account);
    }

    /// @notice Earliest timestamp `account` may claim again (0 if never claimed).
    function nextClaimAt(address account) public view returns (uint256) {
        uint256 last = lastClaim[account];
        return last == 0 ? 0 : last + cooldown;
    }

    /// @notice Seconds remaining until `account` may claim again (0 if ready).
    function secondsUntilNextClaim(address account) external view returns (uint256) {
        uint256 next = nextClaimAt(account);
        return block.timestamp >= next ? 0 : next - block.timestamp;
    }

    // --- owner controls ---

    function setAmountPerClaim(uint256 amount) external onlyOwner {
        amountPerClaim = amount;
        emit AmountChanged(amount);
    }

    function setCooldown(uint256 cooldown_) external onlyOwner {
        cooldown = cooldown_;
        emit CooldownChanged(cooldown_);
    }

    /// @notice Recover faucet tokens (e.g. to refill or return to the treasury).
    function withdraw(address to, uint256 amount) external onlyOwner {
        require(to != address(0), "To is zero");
        token.safeTransfer(to, amount);
        emit Withdrawn(to, amount);
    }
}
