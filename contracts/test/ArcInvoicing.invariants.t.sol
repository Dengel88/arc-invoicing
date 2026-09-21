// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ArcInvoicing} from "../src/ArcInvoicing.sol";

/// @dev An actor that refuses incoming value, so the escrow path is exercised by the
///      random walk rather than only by hand-written unit tests.
contract RejectingActor {
    function forward(address target, bytes calldata data, uint256 value) external {
        (bool ok,) = target.call{value: value}(data);
        ok; // outcome is the handler's business
    }

    receive() external payable {
        revert("rejects");
    }
}

/// @notice Drives ArcInvoicing with bounded random input. Every call is wrapped so a
///         legitimate revert (wrong payer, already paid, nothing to withdraw) simply
///         ends that step instead of aborting the run.
contract Handler is Test {
    ArcInvoicing public immutable INV;

    address[] public actors;
    uint256[] public ids;

    /// @dev Total native USDC that `payInvoice` has successfully accepted.
    uint256 public ghostPaidIn;
    /// @dev Total successfully pulled back out via `withdraw`.
    uint256 public ghostWithdrawn;
    /// @dev Ids that have reached a terminal status, to check statuses never regress.
    mapping(uint256 => bool) public ghostFinalized;

    constructor(ArcInvoicing inv) {
        INV = inv;
        actors.push(makeAddr("actorA"));
        actors.push(makeAddr("actorB"));
        actors.push(makeAddr("actorC"));
        actors.push(address(new RejectingActor()));
        for (uint256 i; i < actors.length; ++i) {
            vm.deal(actors[i], 10_000 ether);
        }
    }

    function actorCount() external view returns (uint256) {
        return actors.length;
    }

    function idCount() external view returns (uint256) {
        return ids.length;
    }

    function _actor(uint256 seed) internal view returns (address) {
        return actors[seed % actors.length];
    }

    function createInvoice(uint256 creditorSeed, uint256 payerSeed, uint128 rawAmount, bool open)
        external
    {
        address creditor = _actor(creditorSeed);
        address payer = open ? address(0) : _actor(payerSeed);
        uint256 amount = uint256(rawAmount);
        if (amount == 0) return;
        if (payer == creditor) return;

        vm.prank(creditor);
        try INV.createInvoice(payer, amount, "inv") returns (uint256 id) {
            ids.push(id);
        } catch {}
    }

    function payInvoice(uint256 callerSeed, uint256 idSeed) external {
        if (ids.length == 0) return;
        uint256 id = ids[idSeed % ids.length];
        address caller = _actor(callerSeed);

        ArcInvoicing.Invoice memory inv = INV.getInvoice(id);
        if (inv.status != ArcInvoicing.Status.Pending) return;
        if (caller == inv.creditor) return;
        if (inv.payer != address(0) && inv.payer != caller) return;
        if (caller.balance < inv.amount) return;

        vm.prank(caller);
        try INV.payInvoice{value: inv.amount}(id) {
            ghostPaidIn += inv.amount;
            ghostFinalized[id] = true;
        } catch {}
    }

    function cancelInvoice(uint256 callerSeed, uint256 idSeed) external {
        if (ids.length == 0) return;
        uint256 id = ids[idSeed % ids.length];
        address caller = _actor(callerSeed);

        vm.prank(caller);
        try INV.cancelInvoice(id) {
            ghostFinalized[id] = true;
        } catch {}
    }

    function withdraw(uint256 callerSeed) external {
        address caller = _actor(callerSeed);
        uint256 owed = INV.withdrawable(caller);
        if (owed == 0) return;

        vm.prank(caller);
        try INV.withdraw() {
            ghostWithdrawn += owed;
        } catch {}
    }
}

/// @notice Stateful fuzzing. Where the unit tests check specific scenarios, these
///         assertions must hold after *every* reachable sequence of calls.
contract ArcInvoicingInvariantsTest is Test {
    ArcInvoicing internal invoicing;
    Handler internal handler;

    function setUp() public {
        invoicing = new ArcInvoicing();
        handler = new Handler(invoicing);

        targetContract(address(handler));

        bytes4[] memory selectors = new bytes4[](4);
        selectors[0] = Handler.createInvoice.selector;
        selectors[1] = Handler.payInvoice.selector;
        selectors[2] = Handler.cancelInvoice.selector;
        selectors[3] = Handler.withdraw.selector;
        targetSelector(FuzzSelector({addr: address(handler), selectors: selectors}));
    }

    /// The solvency invariant. The contract is a conduit, not a vault: the only value it
    /// may hold is value it owes to a specific creditor whose payout could not be pushed.
    /// A single wei of drift either way means funds are stranded or double-counted.
    function invariant_BalanceEqualsSumOfEscrowedClaims() public view {
        uint256 claims;
        uint256 n = handler.actorCount();
        for (uint256 i; i < n; ++i) {
            claims += invoicing.withdrawable(handler.actors(i));
        }
        assertEq(
            address(invoicing).balance, claims, "contract balance must equal what it owes"
        );
    }

    /// Nothing is created or destroyed: everything paid in has either been forwarded to
    /// a creditor, pulled back out, or is still held as an escrowed claim.
    function invariant_ValueIsConserved() public view {
        assertGe(
            handler.ghostPaidIn(),
            address(invoicing).balance + handler.ghostWithdrawn(),
            "contract cannot hold or release more than was ever paid in"
        );
    }

    /// A settled or voided invoice is final. Nothing may move it back to Pending, which
    /// would let an already-paid invoice be charged a second time.
    function invariant_TerminalStatusesNeverRegress() public view {
        uint256 n = handler.idCount();
        for (uint256 i; i < n; ++i) {
            uint256 id = handler.ids(i);
            if (!handler.ghostFinalized(id)) continue;
            ArcInvoicing.Status status = invoicing.getInvoice(id).status;
            assertTrue(
                status == ArcInvoicing.Status.Paid || status == ArcInvoicing.Status.Cancelled,
                "a finalized invoice must never return to Pending"
            );
        }
    }

    /// Payment metadata and status must agree, so off-chain accounting reading either
    /// one reaches the same conclusion.
    function invariant_PaymentFieldsMatchStatus() public view {
        uint256 n = handler.idCount();
        for (uint256 i; i < n; ++i) {
            ArcInvoicing.Invoice memory inv = invoicing.getInvoice(handler.ids(i));
            if (inv.status == ArcInvoicing.Status.Paid) {
                assertTrue(inv.paidBy != address(0), "paid invoice must record a payer");
                assertTrue(inv.paidAt != 0, "paid invoice must record a time");
                assertTrue(inv.paidBy != inv.creditor, "creditor cannot have paid itself");
            } else {
                assertEq(inv.paidBy, address(0), "unpaid invoice must not name a payer");
                assertEq(inv.paidAt, 0, "unpaid invoice must not carry a payment time");
            }
        }
    }

    /// Ids are dense and start at 1, so `totalInvoices` is a usable upper bound for
    /// anything iterating the ledger.
    function invariant_IdsAreDenseFromOne() public {
        uint256 total = invoicing.totalInvoices();
        if (total == 0) return;
        assertTrue(invoicing.getInvoice(1).creditor != address(0), "id 1 must exist");

        // One past the counter must not exist, or `totalInvoices` would understate the
        // ledger and anything iterating 1..total would silently skip invoices.
        vm.expectRevert(
            abi.encodeWithSelector(ArcInvoicing.InvoiceNotFound.selector, total + 1)
        );
        invoicing.getInvoice(total + 1);
    }
}
