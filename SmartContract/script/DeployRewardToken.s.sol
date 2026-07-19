// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {RewardToken} from "../src/RewardToken.sol";

// forge script script/DeployRewardToken.s.sol:DeployRewardToken --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
contract DeployRewardToken is Script {
    function run() external {
        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        RewardToken token = new RewardToken(1000 ether, vm.addr(pk));
        vm.stopBroadcast();
        console.log("RewardToken:", address(token));
    }
}
