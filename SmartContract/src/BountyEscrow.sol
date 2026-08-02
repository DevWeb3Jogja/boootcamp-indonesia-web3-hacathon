// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IBountyFactory {
    function oracle() external view returns (address);
}

/// @title BountyEscrow - satu bounty berhadiah, dana dikunci sampai kerjaan diverifikasi
/// @notice Sesi 4: di-deploy oleh BountyFactory, verifikasi utama oleh AI oracle via fulfillVerification.
contract BountyEscrow is ReentrancyGuard {
    using SafeERC20 for IERC20;

    enum Status {
        MenungguDana,
        Dibuka,
        Disubmit,
        Selesai,
        Dibatalkan
    }

    IBountyFactory public immutable factory;
    IERC20 public immutable rewardToken;
    address public immutable creator;
    uint256 public immutable rewardAmount;
    uint256 public immutable submissionDeadline;
    string public rulesURI;

    Status public status;
    address public worker;
    string public proofURI;

    event BountyFunded(uint256 rewardAmount);
    event WorkSubmitted(address indexed worker, string proofURI);
    event VerificationFulfilled(address indexed oracle, bool eligible);
    event WorkRejected(address indexed worker);
    event RewardReleased(address indexed worker, uint256 rewardAmount);
    event BountyCancelled(uint256 refundAmount);

    error BukanCreator(address caller);
    error BukanFactory(address caller);
    error BukanOracle(address caller);
    error StatusSalah(Status butuh, Status sekarang);
    error DeadlineLewat();
    error OracleMasihBertugas(uint256 deadline);
    error DanaKurang(uint256 butuh, uint256 saldo);
    error RewardNol();
    error AturanKosong();
    error DeadlineHarusMasaDepan();

    modifier hanyaCreator() {
        if (msg.sender != creator) revert BukanCreator(msg.sender);
        _;
    }

    modifier hanyaFactory() {
        if (msg.sender != address(factory)) revert BukanFactory(msg.sender);
        _;
    }

    modifier hanyaOracle() {
        if (msg.sender != factory.oracle()) revert BukanOracle(msg.sender);
        _;
    }

    constructor(
        IERC20 _rewardToken,
        address _creator,
        uint256 _rewardAmount,
        string memory _rulesURI,
        uint256 _submissionDeadline
    ) {
        if (_rewardAmount == 0) revert RewardNol();
        if (bytes(_rulesURI).length == 0) revert AturanKosong();
        if (_submissionDeadline <= block.timestamp) {
            revert DeadlineHarusMasaDepan();
        }
        factory = IBountyFactory(msg.sender);
        rewardToken = _rewardToken;
        creator = _creator;
        rewardAmount = _rewardAmount;
        rulesURI = _rulesURI;
        submissionDeadline = _submissionDeadline;
        status = Status.MenungguDana;
    }

    function confirmFunding() external hanyaFactory {
        if (status != Status.MenungguDana) {
            revert StatusSalah(Status.MenungguDana, status);
        }
        uint256 saldo = rewardToken.balanceOf(address(this));
        if (saldo < rewardAmount) revert DanaKurang(rewardAmount, saldo);
        status = Status.Dibuka;
        emit BountyFunded(rewardAmount);
    }

    function submitWork(string calldata _proofURI) external {
        if (status != Status.Dibuka) revert StatusSalah(Status.Dibuka, status);
        if (block.timestamp > submissionDeadline) revert DeadlineLewat();
        worker = msg.sender;
        proofURI = _proofURI;
        status = Status.Disubmit;
        emit WorkSubmitted(msg.sender, _proofURI);
    }

    function fulfillVerification(bool eligible) external hanyaOracle nonReentrant {
        if (status != Status.Disubmit) {
            revert StatusSalah(Status.Disubmit, status);
        }
        emit VerificationFulfilled(msg.sender, eligible);
        if (eligible) {
            _releaseReward();
        } else {
            _rejectSubmission();
        }
    }

    function approveWork() external hanyaCreator nonReentrant {
        if (status != Status.Disubmit) {
            revert StatusSalah(Status.Disubmit, status);
        }
        if (block.timestamp <= submissionDeadline) {
            revert OracleMasihBertugas(submissionDeadline);
        }
        _releaseReward();
    }

    function rejectWork() external hanyaCreator {
        if (status != Status.Disubmit) {
            revert StatusSalah(Status.Disubmit, status);
        }
        if (block.timestamp <= submissionDeadline) {
            revert OracleMasihBertugas(submissionDeadline);
        }
        _rejectSubmission();
    }

    function cancel() external hanyaCreator nonReentrant {
        if (status != Status.Dibuka) revert StatusSalah(Status.Dibuka, status);
        status = Status.Dibatalkan;
        rewardToken.safeTransfer(creator, rewardAmount);
        emit BountyCancelled(rewardAmount);
    }

    function _releaseReward() internal {
        status = Status.Selesai;
        address recipient = worker;
        rewardToken.safeTransfer(recipient, rewardAmount);
        emit RewardReleased(recipient, rewardAmount);
    }

    function _rejectSubmission() internal {
        address rejectedWorker = worker;
        worker = address(0);
        proofURI = "";
        status = Status.Dibuka;
        emit WorkRejected(rejectedWorker);
    }
}
