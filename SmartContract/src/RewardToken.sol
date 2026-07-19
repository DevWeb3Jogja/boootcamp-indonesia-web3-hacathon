// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {Ownable} from "@openzeppelin/contracts/access/Ownable.sol";

/// @title RewardToken - token hadiah buat Papan Sayembara
contract RewardToken is ERC20, Ownable {
    uint256 public constant MAX_SUPPLY = 1_000_000 ether;
    mapping(address => bool) public isMinter;

    event MinterSet(address indexed account, bool allowed);

    error BukanMinter(address caller);
    error MelebihiMaxSupply(uint256 diminta, uint256 sisa);
    error AlamatNol();

    modifier hanyaMinter() {
        if (msg.sender != owner() && !isMinter[msg.sender]) {
            revert BukanMinter(msg.sender);
        }
        _;
    }

    constructor(uint256 initialSupply, address initialOwner)
        ERC20("Reward Token", "RWD")
        Ownable(initialOwner)
    {
        _mintDenganCek(initialOwner, initialSupply);
    }

    function setMinter(address account, bool allowed) external onlyOwner {
        if (account == address(0)) revert AlamatNol();
        isMinter[account] = allowed;
        emit MinterSet(account, allowed);
    }

    function mint(address to, uint256 amount) external hanyaMinter {
        _mintDenganCek(to, amount);
    }

    function _mintDenganCek(address to, uint256 amount) internal {
        uint256 sisa = MAX_SUPPLY - totalSupply();
        if (amount > sisa) revert MelebihiMaxSupply(amount, sisa);
        _mint(to, amount);
    }

    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
