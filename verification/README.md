# Verifying the contract on explorer.arc.io

Verification publishes the Solidity source next to the deployed bytecode, so anyone
clicking the contract address sees readable code instead of a hex blob. It is **not** a
transaction: no private key, no gas, nothing to sign.

## Why this is a manual, browser-only step

`forge verify-contract` cannot reach this explorer. `explorer.arc.io` is Blockscout
behind a Cloudflare **managed challenge**, which requires JavaScript and cookies — every
programmatic request, from `curl` or Foundry alike, gets an HTTP 403 challenge page
instead of the API. That is a property of the explorer's edge protection, not of
Blockscout, and there is no flag or API key that works around it. A real browser passes
the challenge, so the upload has to happen there.

## What to do (about 2 minutes)

1. Open the contract's **Contract** tab:
   <https://explorer.arc.io/address/0x4AC461f079E9dd4f49f4d8254e4e0cA79b2102BA?tab=contract>
2. Click **Verify & publish**.
3. Choose the method **Solidity (Standard JSON Input)** — not "single file" and not
   "flattened source". The JSON already carries the exact compiler settings, so there is
   nothing to fill in by hand and nothing to get wrong.
4. Compiler version: **v0.8.28**
5. Upload the file in this folder:
   [`ArcInvoicing.standard-input.json`](ArcInvoicing.standard-input.json)
6. Contract name, if asked: `ArcInvoicing`
7. Constructor arguments: **none** — the contract has no constructor parameters.
8. Submit.

## Why it should match on the first try

The deployed bytecode was already confirmed byte-for-byte identical to a local build
(5,789 bytes). The JSON above was generated from that same build, and carries the
settings that produced it:

| Setting | Value |
|---|---|
| Compiler | 0.8.28 |
| Optimizer | enabled, 200 runs |
| EVM version | `shanghai` |
| `bytecodeHash` | `none` |
| `appendCBOR` | `false` |

The last two matter: `foundry.toml` deliberately strips the metadata hash, which removes
the single most common cause of "bytecode doesn't match" failures — a metadata hash that
differs because of an unrelated path or comment.

## If it fails anyway

Re-generate the JSON from a clean build and try again:

```powershell
cd D:\AI\Kwork\ARcHakaton\contracts
forge build --force
forge verify-contract --show-standard-json-input 0x4AC461f079E9dd4f49f4d8254e4e0cA79b2102BA src/ArcInvoicing.sol:ArcInvoicing > ..\verification\ArcInvoicing.standard-input.json
```

(That command needs `ARC_EXPLORER_VERIFIER_URL` set to anything non-empty — the
`[etherscan]` block in `foundry.toml` reads it even though this particular command does
not use it. `$env:ARC_EXPLORER_VERIFIER_URL = "https://explorer.arc.io/api/"` is enough.)
