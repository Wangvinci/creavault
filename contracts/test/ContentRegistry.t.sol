// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ContentRegistry} from "../src/ContentRegistry.sol";
import {CreavaultNFT} from "../src/CreavaultNFT.sol";

contract ContentRegistryTest is Test {
    CreavaultNFT receipts;
    ContentRegistry registry;
    address payable treasury = payable(address(0xBEEF));
    address creator = address(0xCAFE);
    address collab = address(0xC0DE);
    address buyer = address(0xB0B);

    function setUp() public {
        receipts = new CreavaultNFT();
        registry = new ContentRegistry(receipts, treasury, 250); // 2.5% fee
        receipts.setRegistry(address(registry));
        vm.deal(buyer, 10 ether);
    }

    function _splits(address a, uint16 ba, address b, uint16 bb)
        internal
        pure
        returns (ContentRegistry.Split[] memory s)
    {
        s = new ContentRegistry.Split[](2);
        s[0] = ContentRegistry.Split({recipient: payable(a), bps: ba});
        s[1] = ContentRegistry.Split({recipient: payable(b), bps: bb});
    }

    function test_register_and_collect_pays_everyone() public {
        ContentRegistry.Split[] memory s = _splits(creator, 8000, collab, 2000);

        vm.prank(creator);
        uint256 workId = registry.register(
            ContentRegistry.ContentKind.Music,
            "ipfs://bafy...",
            "ipfs://bafy.../meta.json",
            1 ether,
            1000, // 10% royalty
            s
        );
        assertEq(workId, 1);

        uint256 t0 = treasury.balance;
        uint256 c0 = creator.balance;
        uint256 k0 = collab.balance;

        vm.prank(buyer);
        registry.collect{value: 1 ether}(workId);

        // 2.5% fee → treasury = 0.025
        assertEq(treasury.balance - t0, 0.025 ether, "treasury fee");
        // net = 0.975, 80/20 split
        assertEq(creator.balance - c0, 0.78 ether, "creator share");
        assertEq(collab.balance - k0, 0.195 ether, "collab share");

        // buyer got receipt #1
        assertEq(receipts.balanceOf(buyer), 1);
        assertEq(receipts.ownerOf(1), buyer);
        assertEq(receipts.workIdOf(1), workId);
    }

    function test_revert_on_wrong_payment() public {
        ContentRegistry.Split[] memory s = _splits(creator, 10000, address(0xdead), 0);
        s = new ContentRegistry.Split[](1);
        s[0] = ContentRegistry.Split({recipient: payable(creator), bps: 10000});

        vm.prank(creator);
        uint256 workId = registry.register(
            ContentRegistry.ContentKind.Writing,
            "ipfs://b",
            "ipfs://b/m",
            0.5 ether,
            500,
            s
        );

        vm.prank(buyer);
        vm.expectRevert(ContentRegistry.WrongPayment.selector);
        registry.collect{value: 0.4 ether}(workId);
    }

    function test_revert_on_duplicate_cid() public {
        ContentRegistry.Split[] memory s = new ContentRegistry.Split[](1);
        s[0] = ContentRegistry.Split({recipient: payable(creator), bps: 10000});

        vm.startPrank(creator);
        registry.register(ContentRegistry.ContentKind.Music, "ipfs://same", "m", 0, 0, s);
        vm.expectRevert(ContentRegistry.AlreadyRegistered.selector);
        registry.register(ContentRegistry.ContentKind.Music, "ipfs://same", "m", 0, 0, s);
        vm.stopPrank();
    }

    function test_royalty_too_high() public {
        ContentRegistry.Split[] memory s = new ContentRegistry.Split[](1);
        s[0] = ContentRegistry.Split({recipient: payable(creator), bps: 10000});
        vm.prank(creator);
        vm.expectRevert(ContentRegistry.RoyaltyTooHigh.selector);
        registry.register(ContentRegistry.ContentKind.Music, "ipfs://x", "m", 0, 2500, s);
    }

    function test_invalid_split_sum() public {
        ContentRegistry.Split[] memory s = _splits(creator, 6000, collab, 3000);
        vm.prank(creator);
        vm.expectRevert(ContentRegistry.InvalidSplits.selector);
        registry.register(ContentRegistry.ContentKind.Music, "ipfs://y", "m", 0, 0, s);
    }

    function test_only_creator_can_change_price() public {
        ContentRegistry.Split[] memory s = new ContentRegistry.Split[](1);
        s[0] = ContentRegistry.Split({recipient: payable(creator), bps: 10000});
        vm.prank(creator);
        uint256 id = registry.register(ContentRegistry.ContentKind.Music, "ipfs://p", "m", 1, 0, s);

        vm.prank(buyer);
        vm.expectRevert(ContentRegistry.NotCreator.selector);
        registry.setPrice(id, 99);

        vm.prank(creator);
        registry.setPrice(id, 99);
        assertEq(registry.workOf(id).priceWei, 99);
    }
}
