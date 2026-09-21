// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Script, console} from "forge-std/Script.sol";
import {ArcInvoicing} from "../src/ArcInvoicing.sol";

/// @notice Deploys ArcInvoicing to Arc.
///
/// @dev No private key is read inside this script on purpose. `vm.startBroadcast()`
///      with no argument takes the signer from the CLI, so the key never has to exist
///      as an environment variable or a literal in a file. Sign with whichever of
///      these you prefer:
///
///        --account <name>   an encrypted keystore (`cast wallet import`) — recommended
///        --ledger           a hardware wallet
///        --private-key ...  a raw key, shell-history and all; last resort
///
///      Run it with the helper script at ../../scripts/deploy.sh, or directly:
///
///        forge script script/Deploy.s.sol:Deploy \
///          --rpc-url https://rpc.mainnet.arc.io \
///          --account arc-deployer \
///          --broadcast
contract Deploy is Script {
    /// @dev Arc mainnet. Deploying to the wrong chain is the one mistake here that
    ///      costs real money and cannot be undone, so it is asserted, not assumed.
    uint256 internal constant ARC_MAINNET = 5042;
    uint256 internal constant ARC_TESTNET = 5042002;

    function run() external returns (ArcInvoicing invoicing) {
        uint256 chainId = block.chainid;
        require(
            chainId == ARC_MAINNET || chainId == ARC_TESTNET,
            "Deploy: refusing to deploy outside Arc. Check --rpc-url."
        );

        console.log("Chain ID:      ", chainId);
        console.log("Network:       ", chainId == ARC_MAINNET ? "Arc mainnet" : "Arc testnet");

        vm.startBroadcast();
        invoicing = new ArcInvoicing();
        vm.stopBroadcast();

        console.log("");
        console.log("=====================================================");
        console.log("  ArcInvoicing deployed");
        console.log("  Address:     ", address(invoicing));
        console.log("=====================================================");
        console.log("");

        // Read the deployed code back, so a silent failure cannot pass for success.
        require(address(invoicing).code.length > 0, "Deploy: no code at target address");
        require(invoicing.totalInvoices() == 0, "Deploy: unexpected initial state");
        require(
            invoicing.USDC_ERC20() == 0x3600000000000000000000000000000000000000,
            "Deploy: unexpected USDC address"
        );

        console.log("Sanity checks passed. Next steps:");
        console.log("  1. Put this address in web/.env as VITE_CONTRACT_ADDRESS");
        console.log("  2. Redeploy the front-end");
        console.log(
            "  3. Explorer: https://explorer.arc.io/address/%s", vm.toString(address(invoicing))
        );
    }
}
