// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test, console} from "forge-std/Test.sol";
import {ArcInvoicing} from "../src/ArcInvoicing.sol";

/// @dev A creditor that refuses every incoming payment, standing in for the two
///      real cases on Arc: a contract with no payable receiver, and an address the
///      network blocklist refuses value transfers to.
contract RejectingCreditor {
    function issue(ArcInvoicing inv, address payer, uint256 amount, string calldata memo)
        external
        returns (uint256)
    {
        return inv.createInvoice(payer, amount, memo);
    }

    function pull(ArcInvoicing inv) external {
        inv.withdraw();
    }

    receive() external payable {
        revert("no thanks");
    }
}

/// @dev A creditor that tries to re-enter `payInvoice` from its receive hook.
contract ReentrantCreditor {
    ArcInvoicing private immutable INV;
    uint256 public target;
    bool public reentryAttempted;
    bool public reentrySucceeded;
    bytes4 public reentryRevertSelector;

    constructor(ArcInvoicing inv) {
        INV = inv;
    }

    function issue(address payer, uint256 amount) external returns (uint256 id) {
        id = INV.createInvoice(payer, amount, "reentrancy probe");
        target = id;
    }

    receive() external payable {
        if (reentryAttempted) return;
        reentryAttempted = true;
        try INV.payInvoice{value: msg.value}(target) {
            reentrySucceeded = true;
        } catch (bytes memory err) {
            reentrySucceeded = false;
            if (err.length >= 4) {
                reentryRevertSelector =
                    bytes4(bytes.concat(err[0], err[1], err[2], err[3]));
            }
        }
    }
}

/// @dev A creditor that accepts payment normally.
contract AcceptingCreditor {
    function issue(ArcInvoicing inv, address payer, uint256 amount, string calldata memo)
        external
        returns (uint256)
    {
        return inv.createInvoice(payer, amount, memo);
    }

    receive() external payable {}
}

contract ArcInvoicingTest is Test {
    ArcInvoicing internal invoicing;

    address internal alice = makeAddr("alice"); // creditor / exporter
    address internal bob = makeAddr("bob"); // payer / importer
    address internal carol = makeAddr("carol"); // unrelated third party

    /// @dev Arc denominates native USDC in 18 decimals: 1 USDC == 1e18.
    uint256 internal constant ONE_USDC = 1e18;

    // Mirrors of the contract events, so `expectEmit` can match on them.
    event InvoiceCreated(
        uint256 indexed invoiceId,
        address indexed creditor,
        address indexed payer,
        uint256 amount,
        string memo,
        uint64 createdAt
    );
    event InvoicePaid(
        uint256 indexed invoiceId,
        address indexed payer,
        address indexed creditor,
        uint256 amount,
        uint64 paidAt
    );
    event InvoiceCancelled(uint256 indexed invoiceId, address indexed creditor);
    event PaymentEscrowed(uint256 indexed invoiceId, address indexed creditor, uint256 amount);
    event Withdrawn(address indexed account, uint256 amount);

    function setUp() public {
        invoicing = new ArcInvoicing();
        vm.deal(alice, 1_000 * ONE_USDC);
        vm.deal(bob, 1_000 * ONE_USDC);
        vm.deal(carol, 1_000 * ONE_USDC);
        // A plausible wall-clock time, so timestamp assertions are not testing 1.
        vm.warp(1_789_000_000);
    }

    /*//////////////////////////////////////////////////////////////
                              CREATE INVOICE
    //////////////////////////////////////////////////////////////*/

    function test_CreateInvoice_StoresEveryField() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, 250 * ONE_USDC, "INV-2026-014 design retainer");

        assertEq(id, 1, "first invoice id should be 1");
        assertEq(invoicing.totalInvoices(), 1);

        ArcInvoicing.Invoice memory inv = invoicing.getInvoice(id);
        assertEq(inv.creditor, alice);
        assertEq(inv.payer, bob);
        assertEq(inv.amount, 250 * ONE_USDC);
        assertEq(inv.memo, "INV-2026-014 design retainer");
        assertEq(uint256(inv.status), uint256(ArcInvoicing.Status.Pending));
        assertEq(inv.createdAt, uint64(block.timestamp));
        assertEq(inv.paidAt, 0);
        assertEq(inv.paidBy, address(0));
    }

    function test_CreateInvoice_EmitsEvent() public {
        vm.expectEmit(true, true, true, true);
        emit InvoiceCreated(1, alice, bob, 42 * ONE_USDC, "consulting", uint64(block.timestamp));

        vm.prank(alice);
        invoicing.createInvoice(bob, 42 * ONE_USDC, "consulting");
    }

    function test_CreateInvoice_IdsIncrementAcrossCreditors() public {
        vm.prank(alice);
        uint256 a = invoicing.createInvoice(bob, ONE_USDC, "a");
        vm.prank(carol);
        uint256 b = invoicing.createInvoice(bob, ONE_USDC, "b");
        vm.prank(alice);
        uint256 c = invoicing.createInvoice(carol, ONE_USDC, "c");

        assertEq(a, 1);
        assertEq(b, 2);
        assertEq(c, 3);
        assertEq(invoicing.totalInvoices(), 3);
    }

    function test_CreateInvoice_IndexesByCreditorAndPayer() public {
        vm.startPrank(alice);
        uint256 a = invoicing.createInvoice(bob, ONE_USDC, "a");
        uint256 b = invoicing.createInvoice(carol, ONE_USDC, "b");
        vm.stopPrank();

        uint256[] memory issued = invoicing.invoicesIssuedBy(alice);
        assertEq(issued.length, 2);
        assertEq(issued[0], a);
        assertEq(issued[1], b);

        uint256[] memory billedToBob = invoicing.invoicesBilledTo(bob);
        assertEq(billedToBob.length, 1);
        assertEq(billedToBob[0], a);

        assertEq(invoicing.invoicesBilledTo(carol).length, 1);
    }

    function test_CreateInvoice_OpenInvoiceIsNotIndexedToAnyPayer() public {
        vm.prank(alice);
        invoicing.createInvoice(address(0), ONE_USDC, "open");
        assertEq(invoicing.invoicesBilledTo(address(0)).length, 0, "must not index the zero address");
    }

    function test_CreateInvoice_RevertsOnZeroAmount() public {
        vm.prank(alice);
        vm.expectRevert(ArcInvoicing.ZeroAmount.selector);
        invoicing.createInvoice(bob, 0, "free work");
    }

    function test_CreateInvoice_RevertsWhenPayerIsCreditor() public {
        vm.prank(alice);
        vm.expectRevert(ArcInvoicing.PayerIsCreditor.selector);
        invoicing.createInvoice(alice, ONE_USDC, "self");
    }

    function test_CreateInvoice_RevertsOnOversizedMemo() public {
        string memory tooLong = _repeat("x", 257);
        vm.prank(alice);
        vm.expectRevert(abi.encodeWithSelector(ArcInvoicing.MemoTooLong.selector, 257, 256));
        invoicing.createInvoice(bob, ONE_USDC, tooLong);
    }

    function test_CreateInvoice_AcceptsMemoAtExactLimit() public {
        string memory atLimit = _repeat("x", 256);
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, atLimit);
        assertEq(bytes(invoicing.getInvoice(id).memo).length, 256);
    }

    /*//////////////////////////////////////////////////////////////
                                PAY INVOICE
    //////////////////////////////////////////////////////////////*/

    function test_PayInvoice_MovesFundsAndFlipsStatus() public {
        uint256 amount = 250 * ONE_USDC;
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, amount, "INV-1");

        uint256 aliceBefore = alice.balance;
        uint256 bobBefore = bob.balance;

        vm.prank(bob);
        invoicing.payInvoice{value: amount}(id);

        assertEq(alice.balance, aliceBefore + amount, "creditor should be paid in full");
        assertEq(bob.balance, bobBefore - amount, "payer should be debited exactly");
        assertEq(address(invoicing).balance, 0, "contract must not retain funds");

        ArcInvoicing.Invoice memory inv = invoicing.getInvoice(id);
        assertEq(uint256(inv.status), uint256(ArcInvoicing.Status.Paid));
        assertEq(inv.paidBy, bob);
        assertEq(inv.paidAt, uint64(block.timestamp));
    }

    function test_PayInvoice_EmitsEvent() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");

        vm.expectEmit(true, true, true, true);
        emit InvoicePaid(id, bob, alice, ONE_USDC, uint64(block.timestamp));

        vm.prank(bob);
        invoicing.payInvoice{value: ONE_USDC}(id);
    }

    function test_PayInvoice_OpenInvoiceCanBePaidByAnyone() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(address(0), ONE_USDC, "open");

        vm.prank(carol);
        invoicing.payInvoice{value: ONE_USDC}(id);

        ArcInvoicing.Invoice memory inv = invoicing.getInvoice(id);
        assertEq(uint256(inv.status), uint256(ArcInvoicing.Status.Paid));
        assertEq(inv.paidBy, carol, "should record who actually paid");

        uint256[] memory billed = invoicing.invoicesBilledTo(carol);
        assertEq(billed.length, 1, "paying an open invoice should index it to the payer");
        assertEq(billed[0], id);
    }

    function test_PayInvoice_RevertsForWrongPayer() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");

        vm.prank(carol);
        vm.expectRevert(
            abi.encodeWithSelector(ArcInvoicing.NotDesignatedPayer.selector, id, carol, bob)
        );
        invoicing.payInvoice{value: ONE_USDC}(id);
    }

    function test_PayInvoice_RevertsOnUnderpayment() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, 100 * ONE_USDC, "INV-1");

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcInvoicing.IncorrectPaymentAmount.selector, 100 * ONE_USDC, 99 * ONE_USDC
            )
        );
        invoicing.payInvoice{value: 99 * ONE_USDC}(id);
    }

    function test_PayInvoice_RevertsOnOverpayment() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, 100 * ONE_USDC, "INV-1");

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcInvoicing.IncorrectPaymentAmount.selector, 100 * ONE_USDC, 101 * ONE_USDC
            )
        );
        invoicing.payInvoice{value: 101 * ONE_USDC}(id);
    }

    function test_PayInvoice_RevertsOnDoublePayment() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");

        vm.prank(bob);
        invoicing.payInvoice{value: ONE_USDC}(id);

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcInvoicing.InvoiceNotPending.selector, id, ArcInvoicing.Status.Paid
            )
        );
        invoicing.payInvoice{value: ONE_USDC}(id);
    }

    function test_PayInvoice_RevertsOnUnknownInvoice() public {
        vm.prank(bob);
        vm.expectRevert(abi.encodeWithSelector(ArcInvoicing.InvoiceNotFound.selector, 999));
        invoicing.payInvoice{value: ONE_USDC}(999);
    }

    function test_PayInvoice_RevertsWhenCreditorPaysOwnOpenInvoice() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(address(0), ONE_USDC, "open");

        vm.prank(alice);
        vm.expectRevert(ArcInvoicing.SelfPaymentNotAllowed.selector);
        invoicing.payInvoice{value: ONE_USDC}(id);
    }

    function test_PayInvoice_RevertsOnCancelledInvoice() public {
        vm.startPrank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");
        invoicing.cancelInvoice(id);
        vm.stopPrank();

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcInvoicing.InvoiceNotPending.selector, id, ArcInvoicing.Status.Cancelled
            )
        );
        invoicing.payInvoice{value: ONE_USDC}(id);
    }

    /*//////////////////////////////////////////////////////////////
                              CANCEL INVOICE
    //////////////////////////////////////////////////////////////*/

    function test_CancelInvoice_ByCreditor() public {
        vm.startPrank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");

        vm.expectEmit(true, true, false, false);
        emit InvoiceCancelled(id, alice);
        invoicing.cancelInvoice(id);
        vm.stopPrank();

        assertEq(
            uint256(invoicing.getInvoice(id).status), uint256(ArcInvoicing.Status.Cancelled)
        );
    }

    function test_CancelInvoice_RevertsForNonCreditor() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");

        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(ArcInvoicing.NotCreditor.selector, id, bob, alice)
        );
        invoicing.cancelInvoice(id);
    }

    function test_CancelInvoice_RevertsAfterPayment() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");
        vm.prank(bob);
        invoicing.payInvoice{value: ONE_USDC}(id);

        vm.prank(alice);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcInvoicing.InvoiceNotPending.selector, id, ArcInvoicing.Status.Paid
            )
        );
        invoicing.cancelInvoice(id);
    }

    /*//////////////////////////////////////////////////////////////
                        ESCROW FALLBACK AND WITHDRAW
    //////////////////////////////////////////////////////////////*/

    function test_PayInvoice_EscrowsWhenCreditorRejectsPayment() public {
        RejectingCreditor creditor = new RejectingCreditor();
        uint256 id = creditor.issue(invoicing, bob, 50 * ONE_USDC, "rejecting creditor");

        vm.expectEmit(true, true, false, true);
        emit PaymentEscrowed(id, address(creditor), 50 * ONE_USDC);

        vm.prank(bob);
        invoicing.payInvoice{value: 50 * ONE_USDC}(id);

        // The invoice still settles — the payer is not blocked by the creditor.
        assertEq(uint256(invoicing.getInvoice(id).status), uint256(ArcInvoicing.Status.Paid));
        assertEq(invoicing.withdrawable(address(creditor)), 50 * ONE_USDC);
        assertEq(address(invoicing).balance, 50 * ONE_USDC, "funds held for later pull");
        assertEq(address(creditor).balance, 0);
    }

    function test_Withdraw_RevertsWhileCreditorStillRejects() public {
        RejectingCreditor creditor = new RejectingCreditor();
        uint256 id = creditor.issue(invoicing, bob, 50 * ONE_USDC, "rejecting");
        vm.prank(bob);
        invoicing.payInvoice{value: 50 * ONE_USDC}(id);

        vm.expectRevert(ArcInvoicing.WithdrawFailed.selector);
        creditor.pull(invoicing);

        // Balance must survive the failed pull, not be silently zeroed.
        assertEq(invoicing.withdrawable(address(creditor)), 50 * ONE_USDC);
    }

    function test_Withdraw_SucceedsForEOACreditor() public {
        // Force the escrow path for an EOA by making the push fail: an EOA push
        // cannot fail, so instead check the ordinary path leaves nothing to pull.
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");
        vm.prank(bob);
        invoicing.payInvoice{value: ONE_USDC}(id);

        assertEq(invoicing.withdrawable(alice), 0);
        vm.prank(alice);
        vm.expectRevert(ArcInvoicing.NothingToWithdraw.selector);
        invoicing.withdraw();
    }

    function test_Withdraw_PaysOutAndZeroesBalance() public {
        // A creditor that rejects the push but accepts a later pull is modelled by
        // funding the escrow through a rejecting creditor, then replacing its code
        // with an accepting implementation.
        RejectingCreditor rejecting = new RejectingCreditor();
        uint256 id = rejecting.issue(invoicing, bob, 75 * ONE_USDC, "escrowed");
        vm.prank(bob);
        invoicing.payInvoice{value: 75 * ONE_USDC}(id);
        assertEq(invoicing.withdrawable(address(rejecting)), 75 * ONE_USDC);

        vm.etch(address(rejecting), address(new AcceptingCreditor()).code);

        vm.expectEmit(true, false, false, true);
        emit Withdrawn(address(rejecting), 75 * ONE_USDC);

        vm.prank(address(rejecting));
        invoicing.withdraw();

        assertEq(address(rejecting).balance, 75 * ONE_USDC);
        assertEq(invoicing.withdrawable(address(rejecting)), 0);
        assertEq(address(invoicing).balance, 0);
    }

    /*//////////////////////////////////////////////////////////////
                                 ATTACKS
    //////////////////////////////////////////////////////////////*/

    function test_Reentrancy_IsBlockedOnPayInvoice() public {
        ReentrantCreditor attacker = new ReentrantCreditor(invoicing);
        uint256 id = attacker.issue(bob, 10 * ONE_USDC);

        vm.prank(bob);
        invoicing.payInvoice{value: 10 * ONE_USDC}(id);

        assertTrue(attacker.reentryAttempted(), "attacker should have tried to re-enter");
        assertFalse(attacker.reentrySucceeded(), "re-entry must fail");
        assertEq(
            attacker.reentryRevertSelector(),
            ArcInvoicing.Reentrancy.selector,
            "must be stopped by the guard, not by a later check"
        );

        // The guard rejects the nested call, the attacker swallows that revert, and
        // the outer push therefore still succeeds. One payment in, one payment out.
        assertEq(uint256(invoicing.getInvoice(id).status), uint256(ArcInvoicing.Status.Paid));
        assertEq(address(attacker).balance, 10 * ONE_USDC, "creditor paid exactly once");
        assertEq(address(invoicing).balance, 0, "no funds stranded in the contract");
        assertEq(invoicing.withdrawable(address(attacker)), 0);
    }

    function test_PlainTransferToContractReverts() public {
        // No `receive` or `fallback`: funds can only enter through `payInvoice`, so
        // a stray transfer cannot become unaccounted-for balance.
        vm.prank(bob);
        (bool ok,) = address(invoicing).call{value: ONE_USDC}("");
        assertFalse(ok, "contract must reject bare value transfers");
    }

    function test_CannotDrainOtherInvoicesFunds() public {
        RejectingCreditor rejecting = new RejectingCreditor();
        uint256 escrowed = rejecting.issue(invoicing, bob, 100 * ONE_USDC, "escrowed");
        vm.prank(bob);
        invoicing.payInvoice{value: 100 * ONE_USDC}(escrowed);
        assertEq(address(invoicing).balance, 100 * ONE_USDC);

        // Carol pays her own invoice to Alice; the escrowed balance must be untouched
        // and Alice must receive only her own amount.
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(carol, 5 * ONE_USDC, "unrelated");
        uint256 aliceBefore = alice.balance;
        vm.prank(carol);
        invoicing.payInvoice{value: 5 * ONE_USDC}(id);

        assertEq(alice.balance, aliceBefore + 5 * ONE_USDC);
        assertEq(address(invoicing).balance, 100 * ONE_USDC, "escrow untouched");
        assertEq(invoicing.withdrawable(address(rejecting)), 100 * ONE_USDC);
    }

    /*//////////////////////////////////////////////////////////////
                               VIEW METHODS
    //////////////////////////////////////////////////////////////*/

    function test_GetInvoice_RevertsOnUnknownId() public {
        vm.expectRevert(abi.encodeWithSelector(ArcInvoicing.InvoiceNotFound.selector, 7));
        invoicing.getInvoice(7);
    }

    function test_GetInvoices_ReturnsBatchAndTolerToUnknownIds() public {
        vm.startPrank(alice);
        uint256 a = invoicing.createInvoice(bob, ONE_USDC, "a");
        uint256 b = invoicing.createInvoice(carol, 2 * ONE_USDC, "b");
        vm.stopPrank();

        uint256[] memory ids = new uint256[](3);
        ids[0] = a;
        ids[1] = 999; // does not exist
        ids[2] = b;

        ArcInvoicing.Invoice[] memory out = invoicing.getInvoices(ids);
        assertEq(out.length, 3);
        assertEq(out[0].memo, "a");
        assertEq(uint256(out[1].status), uint256(ArcInvoicing.Status.None), "unknown id is zeroed");
        assertEq(out[2].amount, 2 * ONE_USDC);
    }

    function test_CanPay_ReflectsEveryGate() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "INV-1");

        assertTrue(invoicing.canPay(id, bob), "designated payer can pay");
        assertFalse(invoicing.canPay(id, carol), "third party cannot");
        assertFalse(invoicing.canPay(id, alice), "creditor cannot pay own invoice");
        assertFalse(invoicing.canPay(999, bob), "unknown invoice is not payable");

        vm.prank(bob);
        invoicing.payInvoice{value: ONE_USDC}(id);
        assertFalse(invoicing.canPay(id, bob), "already paid");
    }

    function test_CanPay_OpenInvoiceIsPayableByAnyoneButCreditor() public {
        vm.prank(alice);
        uint256 id = invoicing.createInvoice(address(0), ONE_USDC, "open");
        assertTrue(invoicing.canPay(id, bob));
        assertTrue(invoicing.canPay(id, carol));
        assertFalse(invoicing.canPay(id, alice));
    }

    function test_UsdcErc20AddressIsArcCanonical() public view {
        assertEq(invoicing.USDC_ERC20(), 0x3600000000000000000000000000000000000000);
    }

    /*//////////////////////////////////////////////////////////////
                                  FUZZ
    //////////////////////////////////////////////////////////////*/

    function testFuzz_CreateAndPay_SettlesExactly(uint128 rawAmount, address payer) public {
        uint256 amount = uint256(rawAmount);
        vm.assume(amount > 0);
        vm.assume(payer != address(0) && payer != alice);
        vm.assume(payer.code.length == 0); // EOA payers only
        assumePayable(payer);

        vm.prank(alice);
        uint256 id = invoicing.createInvoice(payer, amount, "fuzzed");

        vm.deal(payer, amount);
        uint256 aliceBefore = alice.balance;

        vm.prank(payer);
        invoicing.payInvoice{value: amount}(id);

        assertEq(alice.balance, aliceBefore + amount);
        assertEq(payer.balance, 0);
        assertEq(address(invoicing).balance, 0);
        assertEq(uint256(invoicing.getInvoice(id).status), uint256(ArcInvoicing.Status.Paid));
    }

    function testFuzz_WrongAmountAlwaysReverts(uint96 amount, uint96 sent) public {
        vm.assume(amount > 0);
        vm.assume(sent != amount);

        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, amount, "fuzzed");

        vm.deal(bob, uint256(sent));
        vm.prank(bob);
        vm.expectRevert(
            abi.encodeWithSelector(
                ArcInvoicing.IncorrectPaymentAmount.selector, uint256(amount), uint256(sent)
            )
        );
        invoicing.payInvoice{value: sent}(id);
    }

    function testFuzz_OnlyDesignatedPayerSettles(address caller) public {
        vm.assume(caller != bob && caller != alice && caller != address(0));
        vm.assume(caller.code.length == 0);
        assumePayable(caller);

        vm.prank(alice);
        uint256 id = invoicing.createInvoice(bob, ONE_USDC, "fuzzed");

        vm.deal(caller, ONE_USDC);
        vm.prank(caller);
        vm.expectRevert(
            abi.encodeWithSelector(ArcInvoicing.NotDesignatedPayer.selector, id, caller, bob)
        );
        invoicing.payInvoice{value: ONE_USDC}(id);
    }

    /*//////////////////////////////////////////////////////////////
                                 HELPERS
    //////////////////////////////////////////////////////////////*/

    function _repeat(string memory ch, uint256 times) private pure returns (string memory out) {
        bytes memory unit = bytes(ch);
        bytes memory buf = new bytes(unit.length * times);
        for (uint256 i; i < times; ++i) {
            for (uint256 j; j < unit.length; ++j) {
                buf[i * unit.length + j] = unit[j];
            }
        }
        out = string(buf);
    }
}
