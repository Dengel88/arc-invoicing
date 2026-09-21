# Security review

**This is not an audit.** An audit is an independent third party with a reputation at
stake reviewing code they did not write. Everything below was produced by the same
process that wrote the contract, which is a real and unavoidable limitation. It is
published because a self-review with its method and results stated in the open is more
useful than silence — not because it substitutes for the real thing.

Scope: `contracts/src/ArcInvoicing.sol` at the commit this file ships in.

---

## What was actually done

| Method | Result |
|---|---|
| Foundry lint (`forge build`) | Clean. Two suppressions, each justified inline. |
| Unit tests | 46 passing |
| Stateful fuzzing (invariants) | 5 invariants, 256 runs × 64 depth = 16,384 calls, 0 reverts |
| Coverage | 100% of lines, 100% of functions, 95.7% of branches |
| Mutation testing | 10 deliberate bugs injected, **10/10 caught** |
| Slither | **Not run** — see limitations |
| Independent human review | **Not done** |

### Invariants

Asserted after every reachable sequence of `createInvoice` / `payInvoice` /
`cancelInvoice` / `withdraw` by four actors, one of which refuses incoming value:

1. **Solvency** — the contract's balance always equals the sum of what it owes.
   It is a conduit, not a vault; a single wei of drift means funds are stranded or
   double-counted.
2. **Conservation** — it can never hold or release more than was ever paid in.
3. **Terminal statuses never regress** — a Paid or Cancelled invoice can never return to
   Pending, which would allow charging it twice.
4. **Payment metadata matches status** — a Paid invoice always names a payer and a time;
   an unpaid one never does.
5. **Ids are dense from 1** — so anything iterating `1..totalInvoices` cannot skip
   invoices.

The solvency invariant was verified to be non-trivial: an inverted probe asserting the
escrow is always empty **fails**, proving the random walk really does exercise the
escrow path rather than passing because everything is zero.

### Mutation testing

The point of mutation testing is to test the tests. Ten realistic bugs were injected one
at a time and the suite re-run; a bug the suite fails to notice is a hole in the suite.

| # | Injected bug | Caught |
|---|---|---|
| M1 | Accept underpayment | ✅ |
| M2 | Remove the reentrancy guard | ✅ |
| M3 | Mark Paid *after* the external transfer (CEI violation) | ✅ |
| M4 | Let anyone pay an invoice addressed to someone else | ✅ |
| M5 | Zero the escrow balance *after* the payout call | ✅ |
| M6 | Drop the creditor check in `cancelInvoice` | ✅ |
| M7 | Allow a creditor to pay their own invoice | ✅ |
| M8 | Escrow overwrites instead of accumulating | ✅ |
| M9 | Remove the batch cap | ✅ |
| M10 | Remove the page clamp | ✅ |

**M3 and M5 originally survived**, and that was the most useful result of the exercise.
Both are reentrancy-adjacent: the contract was still safe, because the guard blocked the
attack either way — but *nothing in the suite tested the second lock*. All of the
protection rested on one mechanism, and if that mechanism were ever removed or bypassed
by a future change, no test would have noticed.

Two tests were added to close it, which pin the ordering from the outside:
`test_CEI_InvoiceIsAlreadyPaidWhenTheExternalCallHappens` and
`test_CEI_EscrowIsZeroedBeforeThePayoutCall`. Both have the recipient read the
contract's state from inside its own `receive` hook, i.e. at the exact instant control
leaves the contract, and assert it is already fully consistent.

---

## Findings

### 1. Unbounded payer index enables permanent UI denial of service — *fixed*

**Severity: medium.** No funds at risk; the app becomes unusable for the victim.

`createInvoice` lets anyone issue an invoice addressed to any address, and the id is
appended to that address's index permanently. There is no way to remove an entry. A
griefer could therefore spam invoices at a victim until `invoicesBilledTo(victim)`
returned an array too large to fit in an RPC response, and the victim's ledger page
would stop loading — permanently, with no recovery.

At roughly 200,000 gas per invoice, filling a victim's index with 100,000 entries costs
on the order of a few hundred USDC. Cheap enough to be worth doing to a competitor.

Static analysis does not find this. It is not a memory-safety or arithmetic bug; it is an
unbounded data structure that an attacker, rather than the owner, controls.

**Fix:** added `invoicesIssuedByCount` / `invoicesBilledToCount` and
`invoicesIssuedByPaged` / `invoicesBilledToPaged`, added a `MAX_BATCH` of 200 to
`getInvoices` so oversized batches fail with a named error instead of an opaque node
timeout, and changed the front-end to read only the newest 50 ids from each index. The
unbounded getters are kept for integrators and carry a warning in their NatSpec.
Regression test: `test_Griefing_PagedReadSurvivesASpammedIndex`.

### 2. A blocklisted creditor's escrow is unrecoverable — *accepted, documented*

**Severity: low, by design.**

If Arc's runtime blocklist refuses transfers to a creditor, their payment is escrowed —
and `withdraw` will fail for the same reason. Those funds stay in the contract
permanently. There is no owner and no rescue function, so nobody can move them.

This is the deliberate trade-off for having no admin key: an owner able to rescue stuck
funds is also an owner able to take unstuck ones. For a proof of concept holding small
amounts, no-owner is the right side of that trade. A production version handling
meaningful balances should reconsider — most likely with a timelocked, creditor-only
recovery path rather than an admin key.

### 3. Cancel and pay can race — *accepted, inherent*

**Severity: informational.**

A payer can settle an invoice in the same block a creditor cancels it. Whichever
transaction lands first wins; the other reverts cleanly. This is not exploitable for
profit and no state is corrupted — it is the ordinary race any two-party state machine
has. Worth knowing before demoing it.

### 4. Memos are public — *documented*

The memo is stored on-chain in the clear, forever. It is a reference line, not a place
for commercially sensitive detail. Stated in the README and the UI copy.

---

## Limitations, stated plainly

- **No independent review.** The most important one. Every result above comes from the
  same process that wrote the code, and self-review does not find the bugs that come
  from a wrong mental model, because the reviewer shares the model.
- **Slither was not run.** The environment's Python is 3.12.0**rc1**, a release
  candidate whose packaging stack is broken, and `pip` could not install it in any of
  three attempts. On a 270-line contract with no dependencies, Slither's likely findings
  (`reentrancy-eth`, `arbitrary-send-eth`, `low-level-calls`) are the same ones Foundry's
  linter already raised and which mutations M2, M3 and M5 now cover — so the gap is
  small, but it is a gap. Fix: install a stable Python and run
  `pip install slither-analyzer && slither contracts/src/ArcInvoicing.sol`.
- **No formal verification**, no symbolic execution, no economic/game-theoretic modelling.
- **Not tested against a real Arc blocklist event.** The escrow fallback is tested with a
  contract that reverts on receive, which is the same code path, but the live blocklist
  behaviour is assumed from Arc's documentation rather than observed.
- **The front-end is out of scope** beyond the paging change in finding 1.

## If this ever handles real money at scale

In order: an independent audit; reconsider the unrecoverable-escrow trade-off; add
invoice expiry; and get a second pair of eyes on the 18/6 decimal boundary, which is the
single place in this codebase where a mistake is silently catastrophic rather than loud.
