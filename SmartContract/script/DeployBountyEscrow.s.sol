// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Script, console} from "forge-std/Script.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";

// forge script script/DeployBountyEscrow.s.sol:DeployBountyEscrow --rpc-url bsc_testnet --broadcast --verify -vvvv --legacy
contract DeployBountyEscrow is Script {
    function run() external {
        address rewardTokenAddr = vm.envAddress("REWARD_TOKEN");
        require(rewardTokenAddr.code.length > 0, "REWARD_TOKEN belum ke-deploy di chain ini");
        IERC20 rewardToken = IERC20(rewardTokenAddr);

        uint256 rewardAmount = 100 ether;
        string memory rulesURI = "https://github.com/devweb3jogja/bounty-1/blob/main/RULES.md";
        uint256 submissionDeadline = block.timestamp + 7 days;

        vm.startBroadcast(vm.envUint("PRIVATE_KEY"));
        BountyEscrow escrow = new BountyEscrow(rewardToken, rewardAmount, rulesURI, submissionDeadline);
        rewardToken.approve(address(escrow), rewardAmount);
        escrow.fund();
        vm.stopBroadcast();

        console.log("BountyEscrow:", address(escrow));
        console.log("Saldo escrow:", rewardToken.balanceOf(address(escrow)));
    }
}
