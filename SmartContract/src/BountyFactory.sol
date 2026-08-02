// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";
import {BountyEscrow} from "./BountyEscrow.sol";

/// @title BountyFactory - nyetak satu BountyEscrow per bounty + registry alamatnya
/// @notice Sesi 4: createBounty atomic (deploy + kunci hadiah dalam 1 tx). Alamat oracle disimpan di sini.
contract BountyFactory is Ownable {
    using SafeERC20 for IERC20;

    IERC20 public immutable rewardToken;
    address public oracle;
    address[] public bounties;

    event OracleSet(address indexed oracle);
    event BountyCreated(
        uint256 indexed bountyId, address indexed escrow, address indexed creator, uint256 rewardAmount
    );

    error AlamatNol();

    constructor(IERC20 _rewardToken, address initialOwner, address initialOracle) Ownable(initialOwner) {
        if (address(_rewardToken) == address(0)) revert AlamatNol();
        if (initialOracle == address(0)) revert AlamatNol();
        rewardToken = _rewardToken;
        oracle = initialOracle;
        emit OracleSet(initialOracle);
    }

    function setOracle(address newOracle) external onlyOwner {
        if (newOracle == address(0)) revert AlamatNol();
        oracle = newOracle;
        emit OracleSet(newOracle);
    }

    function createBounty(uint256 rewardAmount, string calldata rulesURI, uint256 submissionDeadline)
        external
        returns (address)
    {
        BountyEscrow escrow = new BountyEscrow(rewardToken, msg.sender, rewardAmount, rulesURI, submissionDeadline);
        bounties.push(address(escrow));
        rewardToken.safeTransferFrom(msg.sender, address(escrow), rewardAmount);
        escrow.confirmFunding();
        emit BountyCreated(bounties.length - 1, address(escrow), msg.sender, rewardAmount);
        return address(escrow);
    }

    function totalBounties() external view returns (uint256) {
        return bounties.length;
    }
}
