# DoraHacks submission draft — Arc Microgrants

Copy each block into the matching field on
<https://dorahacks.io/hackathon/arc-microgrants>.

Fill the three `<< >>` placeholders first — they only exist after deployment:

- `<<CONTRACT_ADDRESS>>` — printed by the deploy script
- `<<LIVE_URL>>` — the Vercel URL
- `<<REPO_URL>>` — the GitHub repository URL

---

## Project name

```
Arc Invoicing
```

## One-line description

```
Cross-border invoices issued on-chain and settled with a single native USDC transfer — no approval step, no bridge, no correspondent banks.
```

## Live deployment

```
<<LIVE_URL>>
```

## Repository

```
<<REPO_URL>>
```

## Contract address (Arc mainnet, chain 5042)

```
<<CONTRACT_ADDRESS>>
```

---

## Full description

```
A freelancer in Lisbon bills a client in Singapore. Today that invoice takes two to five days, passes through correspondent banks, loses 3-6% to FX spread and wire fees, and neither side can see where the money is while it is in flight. Chasing payment means chasing a bank.

Arc Invoicing makes that a single transaction.

The creditor issues an invoice on-chain: a payer address, an amount in USDC, and a reference line. The payer opens the app, sees the invoice addressed to their wallet, and settles it. The money is in the creditor's wallet before the page finishes re-rendering, and both sides have a permanent, shared record of what was owed, what was paid, and when.

WHAT IT DOES

- createInvoice(payer, amount, memo) issues an invoice; the caller becomes the creditor. Passing the zero address creates an open invoice that anyone can pay, for when you are emailing a payment link to a counterparty whose wallet you do not know yet.
- payInvoice(invoiceId) settles it with one payable call. Exact amount only.
- cancelInvoice(invoiceId) lets the creditor void an invoice that has not been paid.
- The ledger is read straight from contract state through paged getters, so the front-end needs no indexer and cannot drift from chain state.

The front-end is a static React app. It reads invoice lists straight from contract state, connects to Arc's public RPC without an API key, and shows each invoice's status as Pending, Paid or Cancelled in colour, icon and words.

WHY THIS IS AN ARC PROJECT, NOT A PORT

Three properties of Arc changed the design of the contract itself.

1. USDC IS THE GAS TOKEN, SO THERE IS NO APPROVAL STEP.

On Ethereum, paying a USDC invoice through a contract takes two transactions: approve, then transferFrom. Two confirmations, two fees, and a well-known failure mode where a user approves and never completes the payment. On Arc, USDC is the native asset, so payInvoice is simply payable and msg.value carries the money. One signature.

It also removes the two-asset problem. Everywhere else, a payer must hold both ETH for gas and USDC for the invoice, and an invoice they have the money for can still be unpayable because they are out of gas. On Arc the money and the gas are the same balance.

2. FINALITY ON INCLUSION, SO "PAID" MEANS PAID.

Arc finalises on inclusion rather than probabilistically over subsequent blocks. That is why this contract forwards the payment to the creditor inside payInvoice, instead of holding it in escrow behind a separate withdrawal step. An invoice that reads Paid is an invoice whose funds have already moved. On a chain with probabilistic finality, showing Paid immediately would be lying to the creditor for the next several minutes.

3. ONE BALANCE, TWO DECIMAL INTERFACES.

Arc exposes the same USDC balance natively at 18 decimals and through the ERC-20 at 0x3600...0000 at 6 decimals. The contract and the UI work exclusively in native 18-decimal units and say so at every boundary, because confusing the two is an error of a factor of a trillion. The ERC-20 address is kept as a public constant for explorers and integrators, and is deliberately never called.

There is also an Arc-specific compliance consideration in the contract. Arc enforces its blocklist at runtime on value transfers, so the push to the creditor can fail for reasons that have nothing to do with the payer. Rather than reverting the payment, the contract credits the amount to a withdrawable balance and still marks the invoice settled. A payer can always settle their invoice; a creditor's problem never becomes the payer's problem.

ENGINEERING

The contract is 5.8 KB, has no dependencies, no proxy, no owner key and no pause function. There is nothing to lose and no upgrade that can change the terms of an invoice after it has been issued.

46 Foundry tests and 5 stateful-fuzzing invariants pass, covering 100% of lines and functions and 95.7% of branches. The suite includes a creditor contract that rejects payment (proving the escrow fallback), a creditor that re-enters payInvoice from its receive hook (asserting the call is stopped specifically by the reentrancy guard, not incidentally by a later check), a proof that escrowed funds from one invoice cannot be drained by paying another, and invariants asserting solvency and conservation of value across 16,384 randomly ordered calls.

The tests were themselves tested: ten deliberate bugs were injected one at a time, and all ten were caught. Two were not, on the first pass, and that was the most useful result of the exercise - both were reentrancy-adjacent cases where the contract was safe only because of the guard, with nothing verifying the checks-effects-interactions ordering that is supposed to be the second lock. Tests were added that have the recipient read contract state from inside its own receive hook, pinning that ordering from the outside.

A written self-review is published as SECURITY.md, including a medium-severity finding it turned up that no linter catches: anyone can address an invoice to anyone, and the id is appended to that address's index permanently, so a griefer could spam a victim until their ledger no longer loads. Fixed with paged reads and a batch cap. SECURITY.md also states plainly what was not done - no independent audit, no formal verification - because a self-review that claims to be more than it is would be worse than none.

The deploy script asserts block.chainid is Arc before broadcasting and reads the deployed bytecode back afterwards, so a silent failure cannot pass for success. Deployment cost was measured, not guessed, by simulating against live Arc mainnet: 1,725,656 gas, about 0.075 USDC.

LIMITATIONS, STATED PLAINLY

No partial payments or instalments. The memo is on-chain in the clear and is a reference string, not a place for sensitive detail. No recurring invoices and no multi-currency — Arc's built-in FX engine and EURC would make cross-currency invoicing the natural next step, and it is not implemented here. Not audited: the contract is small, dependency-free and thoroughly tested, and SECURITY.md documents a full self-review, but that is not the same as an independent audit. A creditor blocked by Arc's compliance blocklist cannot recover escrowed funds, because there is no admin key by design; that trade-off is documented rather than hidden.

WHERE THIS GOES NEXT

Recurring invoices, partial settlement with a running balance, EURC and the Arc FX engine for bill-in-EUR-settle-in-USD, and a shareable payment link so a client can settle an invoice without ever seeing the word "blockchain".
```

## What it uses from Arc

```
- Native USDC as the settlement asset: payInvoice is payable and msg.value carries the payment, so there is no ERC-20 approve step and no separate gas asset to hold.
- Arc's 18-decimal native interface throughout, with the 6-decimal ERC-20 at 0x3600000000000000000000000000000000000000 exposed as a public constant for explorers and never mixed with it.
- Deterministic finality on inclusion, which is what makes it correct to forward funds to the creditor inside the payment transaction rather than escrowing them behind a withdrawal.
- Arc's runtime compliance blocklist on value transfers, handled explicitly: a failed push to the creditor falls back to a pull-based balance instead of blocking the payer.
- Arc's public RPC (https://rpc.mainnet.arc.io, chain 5042), which needs no credentials, so the front-end is a static page with no API key and no backend.
- Deployed via the Arachnid CREATE2 factory already present on Arc at 0x4e59b44847b379578588920cA78FbF26c0B4956C.
```

## Tags

```
USDC, payments, invoicing, cross-border, stablecoin, fintech, solidity, foundry
```

## Builder profile

```
<<your GitHub profile URL>>
```
