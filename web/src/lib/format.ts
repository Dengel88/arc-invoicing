import {formatUnits, parseUnits} from 'viem'

/*
  Arc exposes one USDC balance through two interfaces: native, which `msg.value` and
  every balance in this app speak, at 18 decimals; and ERC-20 at 0x3600..., at 6.
  Everything below is native. Mixing the two is the single easiest way to be wrong by
  a factor of a trillion, so the constant is named rather than inlined.
*/
export const USDC_NATIVE_DECIMALS = 18

/** Human string ("250.5") to native base units. Throws on anything unparseable. */
export function toBaseUnits(amount: string): bigint {
  return parseUnits(amount.trim(), USDC_NATIVE_DECIMALS)
}

/** Base units to a grouped display string: 1250000000000000000000n -> "1,250.00" */
export function formatUsdc(value: bigint, maxFractionDigits = 2): string {
  const asDecimal = formatUnits(value, USDC_NATIVE_DECIMALS)
  const n = Number(asDecimal)

  // Below the display precision but non-zero, say so instead of rendering "0.00".
  if (value > 0n && n < 10 ** -maxFractionDigits) return `<0.${'0'.repeat(maxFractionDigits - 1)}1`

  return n.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: Math.max(2, maxFractionDigits),
  })
}

/**
 * Validates an amount the way the contract does, before the user spends gas finding
 * out. Returns an error string, or null when the value is good.
 */
export function validateAmount(raw: string): string | null {
  const v = raw.trim()
  if (!v) return 'Enter an amount.'
  if (!/^\d*\.?\d*$/.test(v)) return 'Use digits and a single decimal point.'

  const [, fraction = ''] = v.split('.')
  if (fraction.length > USDC_NATIVE_DECIMALS) {
    return `At most ${USDC_NATIVE_DECIMALS} decimal places.`
  }

  let units: bigint
  try {
    units = toBaseUnits(v)
  } catch {
    return 'That is not a valid amount.'
  }
  if (units === 0n) return 'Amount must be greater than zero.'
  return null
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

/** `payer` may be blank, which the contract reads as "anyone may pay". */
export function validatePayer(raw: string, self?: string): string | null {
  const v = raw.trim()
  if (!v) return null
  if (!ADDRESS_RE.test(v)) return 'Must be a 0x address with 40 hex characters.'
  if (self && v.toLowerCase() === self.toLowerCase()) {
    return 'You cannot bill yourself — use a different address.'
  }
  return null
}

export const MAX_MEMO_BYTES = 256

export function memoByteLength(memo: string): number {
  return new TextEncoder().encode(memo).length
}

export function validateMemo(raw: string): string | null {
  const bytes = memoByteLength(raw)
  if (bytes > MAX_MEMO_BYTES) return `${bytes} of ${MAX_MEMO_BYTES} bytes — shorten the reference.`
  return null
}

export function shortAddress(addr?: string | null): string {
  if (!addr) return '—'
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export function formatTimestamp(seconds: bigint | number): string {
  const ms = Number(seconds) * 1000
  if (!ms) return '—'
  return new Date(ms).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatRelative(seconds: bigint | number): string {
  const ms = Number(seconds) * 1000
  if (!ms) return '—'
  const diff = Date.now() - ms
  const mins = Math.round(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.round(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.round(hours / 24)
  if (days < 30) return `${days}d ago`
  return formatTimestamp(seconds)
}

/**
 * Turns a viem/wagmi error into one sentence a non-developer can act on. The raw
 * messages are several hundred characters of ABI dump; showing those verbatim is how
 * a demo stops looking finished.
 */
export function humanizeError(err: unknown): string {
  const raw = err instanceof Error ? `${err.name}: ${err.message}` : String(err)

  if (/User rejected|User denied|rejected the request/i.test(raw)) {
    return 'You rejected the transaction in your wallet.'
  }
  if (/IncorrectPaymentAmount/.test(raw)) {
    return 'The amount sent did not match the invoice exactly.'
  }
  if (/NotDesignatedPayer/.test(raw)) {
    return 'This invoice is addressed to a different wallet.'
  }
  if (/InvoiceNotPending/.test(raw)) {
    return 'This invoice is no longer pending — it was already paid or cancelled.'
  }
  if (/InvoiceNotFound/.test(raw)) {
    return 'No invoice with that number exists.'
  }
  if (/SelfPaymentNotAllowed/.test(raw)) {
    return 'You cannot pay an invoice you issued yourself.'
  }
  if (/PayerIsCreditor/.test(raw)) {
    return 'The payer address cannot be your own wallet.'
  }
  if (/NotCreditor/.test(raw)) {
    return 'Only the wallet that issued this invoice can cancel it.'
  }
  if (/ZeroAmount/.test(raw)) {
    return 'The amount must be greater than zero.'
  }
  if (/MemoTooLong/.test(raw)) {
    return 'The reference is too long — keep it under 256 bytes.'
  }
  if (/insufficient funds|exceeds the balance/i.test(raw)) {
    return 'Not enough USDC in this wallet to cover the amount plus gas.'
  }
  if (/chain.*mismatch|does not match the target chain/i.test(raw)) {
    return 'Your wallet is on the wrong network. Switch to Arc and try again.'
  }
  if (/HTTP request failed|fetch failed|timed out/i.test(raw)) {
    return 'Could not reach the Arc RPC. Check your connection and retry.'
  }
  return 'The transaction failed. Check your wallet and try again.'
}
