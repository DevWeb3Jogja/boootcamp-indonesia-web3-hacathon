// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BountyFactory} from "../src/BountyFactory.sol";

// forge script script/DeployBountyFactory.s.sol:DeployBountyFactory --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
contract DeployBountyFactory is Script {
    function run() external {
        address rewardTokenAddr = vm.envAddress("REWARD_TOKEN");
        require(rewardTokenAddr.code.length > 0, "REWARD_TOKEN belum ke-deploy di chain ini");
        address oracleAddr = vm.envAddress("ORACLE_ADDRESS");

        uint256 pk = vm.envUint("PRIVATE_KEY");
        vm.startBroadcast(pk);
        BountyFactory factory = new BountyFactory(IERC20(rewardTokenAddr), vm.addr(pk), oracleAddr);
        vm.stopBroadcast();

        console.log("BountyFactory:", address(factory));
        console.log("Oracle:", factory.oracle());
    }
}
