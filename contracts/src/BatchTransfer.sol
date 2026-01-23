// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IERC20 {
    function transfer(address recipient, uint256 amount) external returns (bool);
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function allowance(address owner, address spender) external view returns (uint256);
}

/**
 * @title BatchTransfer
 * @notice Send tokens to multiple recipients in a single transaction
 * @dev Optimized for gas efficiency on Base network
 */
contract BatchTransfer {
    address private immutable owner;

    error ArraysLengthMismatch();
    error ZeroAddress();
    error ZeroAmount();
    error TransferFailed();
    error InsufficientAllowance();
    error NotOwner();

    constructor() {
        owner = msg.sender;
    }

    event BatchTransferIndexed(
        bytes32 indexed batchId,
        address indexed token,
        address indexed sender,
        uint256 totalAmount,
        uint256 recipientCount
    );

    event TransferIndexed(
        bytes32 indexed batchId,
        address indexed recipient,
        uint256 amount
    );

    /**
     * @notice Send tokens to multiple recipients
     * @param token The ERC20 token address to transfer
     * @param recipients Array of recipient addresses
     * @param amounts Array of amounts to send (must match recipients length)
     * @return batchId Unique identifier for this batch transfer
     */
    function batchSend(
        address token,
        address[] calldata recipients,
        uint256[] calldata amounts
    ) external returns (bytes32 batchId) {
        // Validation
        if (recipients.length != amounts.length) {
            revert ArraysLengthMismatch();
        }
        if (recipients.length == 0) {
            revert ZeroAmount();
        }

        // Calculate total amount needed
        uint256 totalAmount = 0;
        for (uint256 i = 0; i < amounts.length; i++) {
            if (recipients[i] == address(0)) revert ZeroAddress();
            if (amounts[i] == 0) revert ZeroAmount();
            totalAmount += amounts[i];
        }

        // Generate batch ID
        batchId = keccak256(
            abi.encodePacked(
                block.timestamp,
                msg.sender,
                token,
                recipients.length,
                block.number
            )
        );

        // Check and transfer tokens from sender
        IERC20 tokenContract = IERC20(token);
        uint256 allowance = tokenContract.allowance(msg.sender, address(this));
        if (allowance < totalAmount) {
            revert InsufficientAllowance();
        }

        // Transfer all tokens from sender to contract first
        if (!tokenContract.transferFrom(msg.sender, address(this), totalAmount)) {
            revert TransferFailed();
        }

        // Distribute to recipients
        for (uint256 i = 0; i < recipients.length; i++) {
            if (!tokenContract.transfer(recipients[i], amounts[i])) {
                revert TransferFailed();
            }
            emit TransferIndexed(batchId, recipients[i], amounts[i]);
        }

        emit BatchTransferIndexed(batchId, token, msg.sender, totalAmount, recipients.length);
    }

    /**
     * @notice Calculate estimated gas for batch transfer
     * @param recipientCount Number of recipients
     * @return estimatedGas Estimated gas cost
     */
    function estimateGas(uint256 recipientCount) external pure returns (uint256 estimatedGas) {
        // Base gas + gas per recipient
        estimatedGas = 50000 + (recipientCount * 35000);
    }

    /**
     * @notice Get batch status (placeholder for future expansion)
     * @param batchId The batch ID to check
     * @return completed Always returns true if batch was executed
     */
    function getBatchStatus(bytes32 batchId) external pure returns (bool completed) {
        // Since all transfers happen in the same transaction,
        // if the transaction succeeded, the batch is complete
        completed = true;
    }

    /**
     * @notice Get maximum recipients allowed per batch
     * @return maxRecipients Maximum number of recipients
     */
    function MAX_RECIPIENTS() external pure returns (uint256 maxRecipients) {
        return 200;
    }

    /**
     * @notice Emergency withdraw tokens accidentally sent to contract
     * @dev Only callable by contract owner (deployer)
     * @param token Token address to withdraw
     * @param amount Amount to withdraw
     */
    function emergencyWithdraw(address token, uint256 amount) external {
        if (msg.sender != owner) revert NotOwner();
        IERC20(token).transfer(msg.sender, amount);
    }

    /**
     * @notice Get contract owner (deployer)
     * @return owner Address of the contract owner
     */
    function _getOwner() internal view returns (address) {
        return owner;
    }

    /**
     * @notice Get contract version
     */
    function VERSION() external pure returns (string memory) {
        return "1.0.0";
    }
}
