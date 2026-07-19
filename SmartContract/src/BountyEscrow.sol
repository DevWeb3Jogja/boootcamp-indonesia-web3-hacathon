// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";

/// @title BountyEscrow - satu bounty berhadiah, dana dikunci sampai tugas di-approve
/// @notice Sesi 3: inti escrow (tanpa Factory, tanpa AI oracle). Rilis di-approve manual oleh creator.
contract BountyEscrow {
    using SafeERC20 for IERC20;

    enum Status { MenungguDana, Dibuka, Disubmit, Selesai, Dibatalkan }

    IERC20 public immutable rewardToken;
    address public immutable creator;
    uint256 public immutable rewardAmount;
    uint256 public immutable submissionDeadline;

    string public rulesURI;   // link aturan (GitHub/website/dokumen/IPFS). string -> tidak bisa immutable.
    Status public status;
    address public worker;
    string public proofURI;

    event BountyFunded(uint256 rewardAmount);
    event WorkSubmitted(address indexed worker, string proofURI);
    event WorkRejected(address indexed worker);
    event RewardReleased(address indexed worker, uint256 rewardAmount);
    event BountyCancelled(uint256 refundAmount);

    error BukanCreator(address caller);
    error StatusSalah(Status butuh, Status sekarang);
    error DeadlineLewat();
    error RewardNol();
    error DeadlineHarusMasaDepan();
    error AturanKosong();

    modifier hanyaCreator() {
        if (msg.sender != creator) revert BukanCreator(msg.sender);
        _;
    }

    constructor(IERC20 _rewardToken, uint256 _rewardAmount, string memory _rulesURI, uint256 _submissionDeadline) {
        if (_rewardAmount == 0) revert RewardNol();
        if (bytes(_rulesURI).length == 0) revert AturanKosong();
        if (_submissionDeadline <= block.timestamp) revert DeadlineHarusMasaDepan();
        rewardToken = _rewardToken;
        rewardAmount = _rewardAmount;
        rulesURI = _rulesURI;
        submissionDeadline = _submissionDeadline;
        creator = msg.sender;
        status = Status.MenungguDana;
    }

    function fund() external hanyaCreator {
        if (status != Status.MenungguDana) revert StatusSalah(Status.MenungguDana, status);
        status = Status.Dibuka;
        rewardToken.safeTransferFrom(creator, address(this), rewardAmount);
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

    function approveWork() external hanyaCreator {
        if (status != Status.Disubmit) revert StatusSalah(Status.Disubmit, status);
        status = Status.Selesai;
        address recipient = worker;
        rewardToken.safeTransfer(recipient, rewardAmount);
        emit RewardReleased(recipient, rewardAmount);
    }

    function rejectWork() external hanyaCreator {
        if (status != Status.Disubmit) revert StatusSalah(Status.Disubmit, status);
        address rejectedWorker = worker;
        worker = address(0);
        proofURI = "";
        status = Status.Dibuka;
        emit WorkRejected(rejectedWorker);
    }

    function cancel() external hanyaCreator {
        if (status != Status.Dibuka) revert StatusSalah(Status.Dibuka, status);
        status = Status.Dibatalkan;
        rewardToken.safeTransfer(creator, rewardAmount);
        emit BountyCancelled(rewardAmount);
    }
}
