// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {Test} from "forge-std/Test.sol";
import {RewardToken} from "../src/RewardToken.sol";

contract RewardTokenTest is Test {
    RewardToken token;
    address owner = address(0xA11CE);
    address minter = address(0x515C0);
    address bob = address(0xB0B);

    function setUp() public {
        token = new RewardToken(1000 ether, owner);
    }

    function test_InitialSupplyKeOwner() public view {
        assertEq(token.balanceOf(owner), 1000 ether);
        assertEq(token.totalSupply(), 1000 ether);
    }

    function test_Revert_ConstructorOwnerNol() public {
        // owner address(0) ditolak Ownable OpenZeppelin (bukan cek kita)
        vm.expectRevert(abi.encodeWithSignature("OwnableInvalidOwner(address)", address(0)));
        new RewardToken(1000 ether, address(0));
    }

    function test_SetMinter() public {
        vm.prank(owner);
        token.setMinter(minter, true);
        assertTrue(token.isMinter(minter));
    }

    function test_Revert_SetMinterAlamatNol() public {
        vm.prank(owner);
        vm.expectRevert(RewardToken.AlamatNol.selector);
        token.setMinter(address(0), true);
    }

    function test_Revert_SetMinterBukanOwner() public {
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", bob));
        vm.prank(bob);
        token.setMinter(minter, true);
    }

    function test_MintOlehOwner() public {
        vm.prank(owner);
        token.mint(bob, 10 ether);
        assertEq(token.balanceOf(bob), 10 ether);
    }

    function test_MintOlehMinter() public {
        vm.prank(owner);
        token.setMinter(minter, true);
        vm.prank(minter);
        token.mint(bob, 25 ether);
        assertEq(token.balanceOf(bob), 25 ether);
    }

    function test_Revert_MintBukanMinter() public {
        vm.expectRevert(abi.encodeWithSelector(RewardToken.BukanMinter.selector, bob));
        vm.prank(bob);
        token.mint(bob, 1 ether);
    }

    function test_Revert_MintMelebihiMaxSupply() public {
        uint256 max = token.MAX_SUPPLY();
        vm.prank(owner);
        vm.expectRevert();
        token.mint(owner, max); // total jadi max + 1000, lewat cap
    }

    function test_Burn() public {
        vm.prank(owner);
        token.burn(400 ether);
        assertEq(token.balanceOf(owner), 600 ether);
        assertEq(token.totalSupply(), 600 ether);
    }
}
