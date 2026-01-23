// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/BatchTransfer.sol";

contract DeployBatchTransfer is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(deployerPrivateKey);

        BatchTransfer batchTransfer = new BatchTransfer();

        vm.stopBroadcast();

        console.log("BatchTransfer deployed at:", address(batchTransfer));
    }
}
