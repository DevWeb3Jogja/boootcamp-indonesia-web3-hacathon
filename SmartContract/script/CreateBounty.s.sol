// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {BountyFactory} from "../src/BountyFactory.sol";

// forge script script/CreateBounty.s.sol:CreateBounty --rpc-url bsc_testnet --broadcast -vvvv --legacy
contract CreateBounty is Script {
    function run() external {
        address factoryAddr = vm.envAddress("BOUNTY_FACTORY");
        require(factoryAddr.code.length > 0, "BOUNTY_FACTORY belum ke-deploy di chain ini");
        BountyFactory factory = BountyFactory(factoryAddr);

        uint256 rewardAmount = 100 ether;
        string memory rulesURI = "https://github.com/devweb3jogja/bounty-1/blob/main/RULES.md";
        uint256 submissionDeadline = block.timestamp + 7 days;

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        factory.rewardToken().approve(factoryAddr, rewardAmount);
        address escrow = factory.createBounty(rewardAmount, rulesURI, submissionDeadline);
        vm.stopBroadcast();

        console.log("BountyEscrow:", escrow);
        console.log("Total bounty di registry:", factory.totalBounties());
    }
}
