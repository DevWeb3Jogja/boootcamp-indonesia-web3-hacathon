// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RewardToken} from "../src/RewardToken.sol";
import {BountyEscrow} from "../src/BountyEscrow.sol";

contract BountyEscrowTest is Test {
    RewardToken token;
    BountyEscrow escrow;

    address creator = address(0xC0FFEE);
    address worker = address(0xB0B);
    address random = address(0xBEEF);

    uint256 rewardAmount = 100 ether;
    string rulesURI = "https://github.com/devweb3jogja/bounty-1/blob/main/RULES.md";
    uint256 submissionDeadline;

    function setUp() public {
        submissionDeadline = block.timestamp + 7 days;
        token = new RewardToken(1000 ether, creator);
        vm.prank(creator);
        escrow = new BountyEscrow(token, rewardAmount, rulesURI, submissionDeadline);
        vm.startPrank(creator);
        token.approve(address(escrow), rewardAmount);
        escrow.fund();
        vm.stopPrank();
    }

    // ---------- SUKSES ----------
    function test_Constructor_SetSemuaField() public view {
        assertEq(address(escrow.rewardToken()), address(token));
        assertEq(escrow.creator(), creator);
        assertEq(escrow.rewardAmount(), rewardAmount);
        assertEq(escrow.rulesURI(), rulesURI);
        assertEq(escrow.submissionDeadline(), submissionDeadline);
    }

    function test_Fund_KunciHadiah() public view {
        assertEq(token.balanceOf(address(escrow)), rewardAmount);
        assertEq(token.balanceOf(creator), 900 ether);
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Dibuka));
    }

    function test_SubmitWork_CatatPengerja() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti");
        assertEq(escrow.worker(), worker);
        assertEq(escrow.proofURI(), "ipfs://bukti");
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Disubmit));
    }

    function test_ApproveWork_CairkanHadiah() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti");
        vm.prank(creator);
        escrow.approveWork();
        assertEq(token.balanceOf(worker), rewardAmount);
        assertEq(token.balanceOf(address(escrow)), 0);
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Selesai));
    }

    function test_RejectWork_BalikDibuka() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti");
        vm.prank(creator);
        escrow.rejectWork();
        assertEq(escrow.worker(), address(0));
        assertEq(escrow.proofURI(), "");
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Dibuka));
    }

    function test_RejectWork_LaluBisaSubmitLagi() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://v1");
        vm.prank(creator);
        escrow.rejectWork();
        vm.prank(worker);
        escrow.submitWork("ipfs://v2");
        assertEq(escrow.proofURI(), "ipfs://v2");
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Disubmit));
    }

    function test_Cancel_RefundCreator() public {
        vm.prank(creator);
        escrow.cancel();
        assertEq(token.balanceOf(creator), 1000 ether);
        assertEq(uint256(escrow.status()), uint256(BountyEscrow.Status.Dibatalkan));
    }

    // ---------- GAGAL: constructor ----------
    function test_Revert_ConstructorRewardNol() public {
        vm.expectRevert(BountyEscrow.RewardNol.selector);
        new BountyEscrow(token, 0, rulesURI, submissionDeadline);
    }

    function test_Revert_ConstructorAturanKosong() public {
        vm.expectRevert(BountyEscrow.AturanKosong.selector);
        new BountyEscrow(token, rewardAmount, "", submissionDeadline);
    }

    function test_Revert_ConstructorDeadlineLewat() public {
        vm.expectRevert(BountyEscrow.DeadlineHarusMasaDepan.selector);
        new BountyEscrow(token, rewardAmount, rulesURI, block.timestamp);
    }

    // ---------- GAGAL: fund ----------
    function test_Revert_FundBukanCreator() public {
        vm.prank(creator);
        BountyEscrow baru = new BountyEscrow(token, rewardAmount, rulesURI, submissionDeadline);
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BukanCreator.selector, random));
        vm.prank(random);
        baru.fund();
    }

    function test_Revert_FundDobel() public {
        // escrow di setUp udah Dibuka, fund lagi harus gagal
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.StatusSalah.selector,
                BountyEscrow.Status.MenungguDana,
                BountyEscrow.Status.Dibuka
            )
        );
        vm.prank(creator);
        escrow.fund();
    }

    // ---------- GAGAL: submitWork ----------
    function test_Revert_SubmitBelumDibuka() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti"); // -> Disubmit
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.StatusSalah.selector,
                BountyEscrow.Status.Dibuka,
                BountyEscrow.Status.Disubmit
            )
        );
        vm.prank(random);
        escrow.submitWork("dobel");
    }

    function test_Revert_SubmitSetelahDeadline() public {
        vm.warp(submissionDeadline + 1);
        vm.prank(worker);
        vm.expectRevert(BountyEscrow.DeadlineLewat.selector);
        escrow.submitWork("telat");
    }

    // ---------- GAGAL: approveWork ----------
    function test_Revert_ApproveBukanCreator() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti");
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BukanCreator.selector, random));
        vm.prank(random);
        escrow.approveWork();
    }

    function test_Revert_ApproveBelumDisubmit() public {
        // status masih Dibuka (belum ada submit)
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.StatusSalah.selector,
                BountyEscrow.Status.Disubmit,
                BountyEscrow.Status.Dibuka
            )
        );
        vm.prank(creator);
        escrow.approveWork();
    }

    // ---------- GAGAL: rejectWork ----------
    function test_Revert_RejectBukanCreator() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti");
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BukanCreator.selector, random));
        vm.prank(random);
        escrow.rejectWork();
    }

    function test_Revert_RejectBelumDisubmit() public {
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.StatusSalah.selector,
                BountyEscrow.Status.Disubmit,
                BountyEscrow.Status.Dibuka
            )
        );
        vm.prank(creator);
        escrow.rejectWork();
    }

    // ---------- GAGAL: cancel ----------
    function test_Revert_CancelBukanCreator() public {
        vm.expectRevert(abi.encodeWithSelector(BountyEscrow.BukanCreator.selector, random));
        vm.prank(random);
        escrow.cancel();
    }

    function test_Revert_CancelSetelahDisubmit() public {
        vm.prank(worker);
        escrow.submitWork("ipfs://bukti"); // -> Disubmit
        vm.expectRevert(
            abi.encodeWithSelector(
                BountyEscrow.StatusSalah.selector,
                BountyEscrow.Status.Dibuka,
                BountyEscrow.Status.Disubmit
            )
        );
        vm.prank(creator);
        escrow.cancel();
    }
}
