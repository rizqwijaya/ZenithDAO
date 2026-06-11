// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZenithVault is AccessControl {
    bytes32 public constant EXECUTOR_ROLE = keccak256("EXECUTOR_ROLE");

    event ETHReceived(address indexed sender, uint256 amount);
    event ETHExecuted(address indexed target, uint256 amount);
    event ERC20Executed(address indexed token, address indexed to, uint256 amount);

    constructor(address timelockAddress) {
        _grantRole(DEFAULT_ADMIN_ROLE, timelockAddress);
        _grantRole(EXECUTOR_ROLE, timelockAddress);
    }

    receive() external payable {
        emit ETHReceived(msg.sender, msg.value);
    }

    function executeETH(address payable target, uint256 amount) external onlyRole(EXECUTOR_ROLE) {
        require(address(this).balance >= amount, "Insufficient ETH");
        (bool success,) = target.call{value: amount}("");
        require(success, "ETH transfer failed");
        emit ETHExecuted(target, amount);
    }

    function executeERC20(address token, address to, uint256 amount) external onlyRole(EXECUTOR_ROLE) {
        IERC20(token).transfer(to, amount);
        emit ERC20Executed(token, to, amount);
    }

    function getETHBalance() external view returns (uint256) {
        return address(this).balance;
    }
}
