// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title  ArcInvoicing — cross-border invoices settled in native USDC on Arc
/// @notice A creditor issues an invoice denominated in USDC; the payer settles it
///         with a single transaction. No ERC-20 `approve`, no escrow contract, no
///         bridge: on Arc, USDC *is* the native asset, so the money moves the same
///         way gas does.
///
/// @dev    Arc-specific design notes, because they drive several decisions here:
///
///         1. DECIMALS. Arc exposes one USDC balance through two interfaces: the
///            native one (18 decimals, what `msg.value` speaks) and the ERC-20 one
///            at 0x3600...0000 (6 decimals). This contract works exclusively in
///            native 18-decimal units. `1 USDC == 1e18`. Do not mix the two: a
///            `balanceOf` of 0 does not imply a native balance of 0, because the
///            ERC-20 view truncates at the 6-decimal boundary.
///
///         2. PUSH-WITH-ESCROW-FALLBACK. Payment is forwarded to the creditor in
///            the same transaction, so a paid invoice means settled funds — that is
///            the whole point of sub-second finality. But Arc enforces its
///            compliance blocklist at runtime on value transfers, and a creditor
///            may be a contract that rejects payment. If the forward fails, the
///            amount is credited to `withdrawable` instead of reverting. An invoice
///            can therefore always be paid, and the payer is never held hostage by
///            the ability of the creditor to receive.
///
///         3. NO RANDOMNESS. `PREVRANDAO` returns 0 on Arc. Invoice IDs are a plain
///            incrementing counter; nothing here depends on unpredictability.
contract ArcInvoicing {
    /*//////////////////////////////////////////////////////////////
                                  TYPES
    //////////////////////////////////////////////////////////////*/

    enum Status {
        None, // 0 — invoice does not exist
        Pending, // 1 — issued, awaiting payment
        Paid, // 2 — settled
        Cancelled // 3 — voided by the creditor before payment
    }

    /// @dev Field order is chosen for storage packing:
    ///      slot 0: creditor(20) + status(1) + createdAt(8) = 29 bytes
    ///      slot 1: payer(20) + paidAt(8)                   = 28 bytes
    ///      slot 2: paidBy(20)
    ///      slot 3: amount(32)
    ///      slot 4+: memo
    struct Invoice {
        address creditor;
        Status status;
        uint64 createdAt;
        address payer;
        uint64 paidAt;
        address paidBy;
        uint256 amount;
        string memo;
    }

    /*//////////////////////////////////////////////////////////////
                                CONSTANTS
    //////////////////////////////////////////////////////////////*/

    /// @notice Upper bound on the memo, so a single invoice cannot be made
    ///         arbitrarily expensive to store or to read back.
    uint256 public constant MAX_MEMO_BYTES = 256;

    /// @notice Canonical ERC-20 view of the same USDC balance `msg.value` moves.
    ///         Exposed for front-ends and block explorers; unused by this contract,
    ///         which deliberately settles natively. Reads 6 decimals, not 18.
    address public constant USDC_ERC20 = 0x3600000000000000000000000000000000000000;

    /*//////////////////////////////////////////////////////////////
                                 STORAGE
    //////////////////////////////////////////////////////////////*/

    /// @notice Number of invoices ever issued. IDs run 1..totalInvoices.
    uint256 public totalInvoices;

    mapping(uint256 invoiceId => Invoice) private _invoices;

    /// @notice Amounts owed to a creditor whose in-transaction payout failed.
    mapping(address account => uint256 amount) public withdrawable;

    mapping(address creditor => uint256[] invoiceIds) private _issuedBy;
    mapping(address payer => uint256[] invoiceIds) private _billedTo;

    uint256 private _lock = 1;

    /*//////////////////////////////////////////////////////////////
                                 EVENTS
    //////////////////////////////////////////////////////////////*/

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

    /// @notice Emitted instead of a direct payout when forwarding to the creditor
    ///         failed. The invoice is still Paid; the creditor must `withdraw()`.
    event PaymentEscrowed(uint256 indexed invoiceId, address indexed creditor, uint256 amount);

    event Withdrawn(address indexed account, uint256 amount);

    /*//////////////////////////////////////////////////////////////
                                 ERRORS
    //////////////////////////////////////////////////////////////*/

    error ZeroAmount();
    error MemoTooLong(uint256 length, uint256 maxLength);
    error PayerIsCreditor();
    error InvoiceNotFound(uint256 invoiceId);
    error InvoiceNotPending(uint256 invoiceId, Status status);
    error NotDesignatedPayer(uint256 invoiceId, address caller, address expected);
    error NotCreditor(uint256 invoiceId, address caller, address creditor);
    error IncorrectPaymentAmount(uint256 expected, uint256 provided);
    error SelfPaymentNotAllowed();
    error NothingToWithdraw();
    error WithdrawFailed();
    error Reentrancy();

    /*//////////////////////////////////////////////////////////////
                                MODIFIERS
    //////////////////////////////////////////////////////////////*/

    modifier nonReentrant() {
        if (_lock != 1) revert Reentrancy();
        _lock = 2;
        _;
        _lock = 1;
    }

    /*//////////////////////////////////////////////////////////////
                              WRITE METHODS
    //////////////////////////////////////////////////////////////*/

    /// @notice Issue an invoice. The caller becomes the creditor.
    /// @param  payer  Address expected to settle it. Pass `address(0)` for an open
    ///                invoice that anyone may pay — useful when you email a payment
    ///                link to a counterparty whose wallet you do not know yet.
    /// @param  amount Amount due in native USDC, 18 decimals (1 USDC == 1e18).
    /// @param  memo   Free-form reference, e.g. "INV-2026-014 design retainer".
    /// @return invoiceId Identifier of the new invoice, starting at 1.
    function createInvoice(address payer, uint256 amount, string calldata memo)
        external
        returns (uint256 invoiceId)
    {
        if (amount == 0) revert ZeroAmount();
        if (bytes(memo).length > MAX_MEMO_BYTES) {
            revert MemoTooLong(bytes(memo).length, MAX_MEMO_BYTES);
        }
        if (payer == msg.sender) revert PayerIsCreditor();

        unchecked {
            invoiceId = ++totalInvoices;
        }

        uint64 nowTs = _now();

        Invoice storage inv = _invoices[invoiceId];
        inv.creditor = msg.sender;
        inv.status = Status.Pending;
        inv.createdAt = nowTs;
        inv.payer = payer;
        inv.amount = amount;
        inv.memo = memo;

        _issuedBy[msg.sender].push(invoiceId);
        if (payer != address(0)) _billedTo[payer].push(invoiceId);

        emit InvoiceCreated(invoiceId, msg.sender, payer, amount, memo, nowTs);
    }

    /// @notice Settle an invoice by sending exactly `amount` native USDC.
    /// @dev    Payable: on Arc the invoiced asset and the gas asset are the same
    ///         thing, so there is no `approve` step and no ERC-20 transfer to fail
    ///         halfway. Exact payment only — a wrong amount reverts rather than
    ///         leaving dust or a partially-settled invoice to reconcile.
    function payInvoice(uint256 invoiceId) external payable nonReentrant {
        Invoice storage inv = _invoices[invoiceId];

        Status status = inv.status;
        if (status == Status.None) revert InvoiceNotFound(invoiceId);
        if (status != Status.Pending) revert InvoiceNotPending(invoiceId, status);

        address creditor = inv.creditor;
        address designated = inv.payer;

        if (designated != address(0) && msg.sender != designated) {
            revert NotDesignatedPayer(invoiceId, msg.sender, designated);
        }
        if (msg.sender == creditor) revert SelfPaymentNotAllowed();

        uint256 amount = inv.amount;
        if (msg.value != amount) revert IncorrectPaymentAmount(amount, msg.value);

        // Effects before interaction.
        uint64 nowTs = _now();
        inv.status = Status.Paid;
        inv.paidAt = nowTs;
        inv.paidBy = msg.sender;
        if (designated == address(0)) _billedTo[msg.sender].push(invoiceId);

        emit InvoicePaid(invoiceId, msg.sender, creditor, amount, nowTs);

        // Interaction. A failure here must not make the invoice unpayable, so the
        // funds fall back to a pull-based balance instead of reverting.
        //
        // `creditor` is user-controlled by design — it is whoever issued the invoice,
        // and routing the payment to them is the entire function. It is not attacker
        // -chosen: it was fixed at creation time and cannot be changed afterwards, and
        // the amount forwarded is exactly the `msg.value` this call just received, so
        // no other invoice can be drained. Reentry is blocked by `nonReentrant`, and
        // the status is already `Paid` before the call.
        // forge-lint: disable-next-line(arbitrary-send-eth, reentrancy-eth)
        (bool ok,) = creditor.call{value: amount}("");
        if (!ok) {
            withdrawable[creditor] += amount;
            // Necessarily emitted after the call: whether the payout needs escrowing
            // is only knowable once the call has failed. `nonReentrant` prevents a
            // re-entering callee from interleaving logs here.
            // forge-lint: disable-next-line(reentrancy-events)
            emit PaymentEscrowed(invoiceId, creditor, amount);
        }
    }

    /// @notice Void a Pending invoice. Only the creditor can, and only before payment.
    function cancelInvoice(uint256 invoiceId) external {
        Invoice storage inv = _invoices[invoiceId];

        Status status = inv.status;
        if (status == Status.None) revert InvoiceNotFound(invoiceId);
        if (status != Status.Pending) revert InvoiceNotPending(invoiceId, status);
        if (msg.sender != inv.creditor) revert NotCreditor(invoiceId, msg.sender, inv.creditor);

        inv.status = Status.Cancelled;
        emit InvoiceCancelled(invoiceId, msg.sender);
    }

    /// @notice Claim funds from payments that could not be pushed to you directly.
    function withdraw() external nonReentrant {
        uint256 amount = withdrawable[msg.sender];
        if (amount == 0) revert NothingToWithdraw();

        withdrawable[msg.sender] = 0;
        emit Withdrawn(msg.sender, amount);

        // The `nonReentrant` guard is still held here, so a re-entering callee hits
        // `Reentrancy()` before it can reach the already-zeroed balance. The event is
        // emitted above rather than below so reentrancy cannot reorder the log stream
        // that off-chain accounting reads.
        // forge-lint: disable-next-line(reentrancy-eth)
        (bool ok,) = msg.sender.call{value: amount}("");
        if (!ok) revert WithdrawFailed();
    }

    /*//////////////////////////////////////////////////////////////
                                INTERNALS
    //////////////////////////////////////////////////////////////*/

    /// @dev Narrowing `block.timestamp` to 64 bits is safe: it overflows in the year
    ///      584942417355, and packing the two timestamps beside an address keeps an
    ///      invoice at four storage slots instead of six.
    function _now() private view returns (uint64) {
        // forge-lint: disable-next-line(unsafe-typecast)
        return uint64(block.timestamp);
    }

    /*//////////////////////////////////////////////////////////////
                               VIEW METHODS
    //////////////////////////////////////////////////////////////*/

    /// @notice Read a single invoice. Reverts if it does not exist.
    function getInvoice(uint256 invoiceId) external view returns (Invoice memory) {
        Invoice memory inv = _invoices[invoiceId];
        if (inv.status == Status.None) revert InvoiceNotFound(invoiceId);
        return inv;
    }

    /// @notice Batch read, so a front-end can render a list in one RPC round trip.
    /// @dev    Unknown IDs come back zeroed with `status == Status.None` rather than
    ///         reverting, so one stale ID cannot blank the whole page.
    function getInvoices(uint256[] calldata invoiceIds)
        external
        view
        returns (Invoice[] memory out)
    {
        out = new Invoice[](invoiceIds.length);
        for (uint256 i; i < invoiceIds.length; ++i) {
            out[i] = _invoices[invoiceIds[i]];
        }
    }

    /// @notice IDs of invoices issued by `creditor`, oldest first.
    function invoicesIssuedBy(address creditor) external view returns (uint256[] memory) {
        return _issuedBy[creditor];
    }

    /// @notice IDs of invoices billed to `payer`, plus open invoices they paid.
    function invoicesBilledTo(address payer) external view returns (uint256[] memory) {
        return _billedTo[payer];
    }

    /// @notice Whether `account` may settle `invoiceId` right now.
    /// @dev    Lets the UI disable the pay button with a reason instead of letting
    ///         the user discover the problem by losing a transaction to a revert.
    function canPay(uint256 invoiceId, address account) external view returns (bool) {
        Invoice storage inv = _invoices[invoiceId];
        if (inv.status != Status.Pending) return false;
        if (account == inv.creditor) return false;
        return inv.payer == address(0) || inv.payer == account;
    }
}
