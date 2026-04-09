// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ContentRegistry} from "../src/ContentRegistry.sol";
import {CreavaultNFT} from "../src/CreavaultNFT.sol";

contract Deploy is Script {
    function run() external {
        address payable treasury = payable(vm.envAddress("TREASURY"));
        uint16 feeBps = uint16(vm.envOr("FEE_BPS", uint256(250))); // 2.5% default

        vm.startBroadcast();

        CreavaultNFT receipts = new CreavaultNFT();
        ContentRegistry registry = new ContentRegistry(receipts, treasury, feeBps);
        receipts.setRegistry(address(registry));

        vm.stopBroadcast();

        console.log("CreavaultNFT      :", address(receipts));
        console.log("ContentRegistry   :", address(registry));
        console.log("Treasury          :", treasury);
        console.log("Fee bps           :", feeBps);
    }
}
