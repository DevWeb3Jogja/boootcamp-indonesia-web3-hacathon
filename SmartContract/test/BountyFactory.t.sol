// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";
import {BountyFactory} from "../src/BountyFactory.sol";

contract BountyFactoryTest is Test {
    RewardToken token;
    BountyFactory factory;

    address factoryOwner = address(0xA11CE);
    address oracle = address(0x04AC1E);
    address oracleBaru = address(0x04AC2E);
    address creator = address(0xC0FFEE);
    address random = address(0xBEEF);

    uint256 rewardAmount = 100 ether;
    string rulesURI = "https://github.com/devweb3jogja/bounty-1/blob/main/RULES.md";
    uint256 submissionDeadline;

    event OracleSet(address indexed oracle);
    event BountyCreated(
        uint256 indexed bountyId, address indexed escrow, address indexed creator, uint256 rewardAmount
    );

    function setUp() public {
        submissionDeadline = block.timestamp + 7 days;
        token = new RewardToken(1000 ether, creator);
        factory = new BountyFactory(token, factoryOwner, oracle);
    }

    // ---------- SUKSES ----------
    function test_Constructor_SetSemuaField() public view {
        assertEq(address(factory.rewardToken()), address(token));
        assertEq(factory.oracle(), oracle);
        assertEq(factory.owner(), factoryOwner);
        assertEq(factory.totalBounties(), 0);
    }

    function test_SetOracle_GantiAlamat() public {
        vm.expectEmit(true, false, false, false);
        emit OracleSet(oracleBaru);
        vm.prank(factoryOwner);
        factory.setOracle(oracleBaru);
        assertEq(factory.oracle(), oracleBaru);
    }

    function test_CreateBounty_DeployDanDanai() public {
        vm.startPrank(creator);
        token.approve(address(factory), rewardAmount);
        address escrowAddr = factory.createBounty(rewardAmount, rulesURI, submissionDeadline);
        vm.stopPrank();

        BountyEscrow escrow = BountyEscrow(escrowAddr);
        assertEq(factory.totalBounties(), 1);
        assertEq(factory.bounties(0), escrowAddr);
        assertEq(escrow.creator(), creator);
        assertEq(token.balanceOf(escrowAddr), rewardAmount);
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Dibuka));
    }

    function test_CreateBounty_EmitEvent() public {
        vm.startPrank(creator);
        token.approve(address(factory), rewardAmount);
        vm.expectEmit(true, false, true, true);
        emit BountyCreated(0, address(0), creator, rewardAmount);
        factory.createBounty(rewardAmount, rulesURI, submissionDeadline);
        vm.stopPrank();
    }

    function test_CreateBounty_DuaBountyBedaEscrow() public {
        vm.startPrank(creator);
        token.approve(address(factory), rewardAmount * 2);
        address escrowA = factory.createBounty(rewardAmount, rulesURI, submissionDeadline);
        address escrowB = factory.createBounty(rewardAmount, rulesURI, submissionDeadline);
        vm.stopPrank();

        assertEq(factory.totalBounties(), 2);
        assertTrue(escrowA != escrowB);
        assertEq(token.balanceOf(escrowA), rewardAmount);
        assertEq(token.balanceOf(escrowB), rewardAmount);
    }

    // ---------- GAGAL: constructor ----------
    function test_Revert_ConstructorTokenNol() public {
        vm.expectRevert(BountyFactory.AlamatNol.selector);
        new BountyFactory(IERC20(address(0)), factoryOwner, oracle);
    }

    function test_Revert_ConstructorOracleNol() public {
        vm.expectRevert(BountyFactory.AlamatNol.selector);
        new BountyFactory(token, factoryOwner, address(0));
    }

    // ---------- GAGAL: setOracle ----------
    function test_Revert_SetOracleAlamatNol() public {
        vm.expectRevert(BountyFactory.AlamatNol.selector);
        vm.prank(factoryOwner);
        factory.setOracle(address(0));
    }

    function test_Revert_SetOracleBukanOwner() public {
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", random));
        vm.prank(random);
        factory.setOracle(oracleBaru);
    }

    // ---------- GAGAL: createBounty ----------
    function test_Revert_CreateBountyTanpaApprove() public {
        vm.prank(creator);
        vm.expectRevert();
        factory.createBounty(rewardAmount, rulesURI, submissionDeadline);
    }

    function test_Revert_CreateBountyRewardNol() public {
        vm.prank(creator);
        vm.expectRevert(BountyEscrow.RewardNol.selector);
        factory.createBounty(0, rulesURI, submissionDeadline);
    }
}
