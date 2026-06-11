// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Permit.sol";

contract ZenithToken is ERC20, ERC20Permit, ERC20Votes {
    constructor(address initialHolder)
        ERC20("Zenith Governance Token", "ZNTH")
        ERC20Permit("Zenith Governance Token")
    {
        _mint(initialHolder, 1_000_000 * 10 ** decimals());
    }

    // Required overrides
    function _afterTokenTransfer(address from, address to, uint256 amount)
        internal
        override(ERC20, ERC20Votes)
    {
        super._afterTokenTransfer(from, to, amount);
    }

    function _mint(address to, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._mint(to, amount);
    }

    function _burn(address account, uint256 amount) internal override(ERC20, ERC20Votes) {
        super._burn(account, amount);
    }
}
