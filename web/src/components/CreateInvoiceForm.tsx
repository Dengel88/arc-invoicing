import {useEffect, useState} from 'react'
import {FilePlus2, Loader2, Send} from 'lucide-react'
import {useAccount, useWaitForTransactionReceipt, useWriteContract} from 'wagmi'
import {arcInvoicingAbi} from '../lib/abi'
import {contractAddress} from '../lib/chain'
import {
  MAX_MEMO_BYTES,
  humanizeError,
  memoByteLength,
  toBaseUnits,
  validateAmount,
  validateMemo,
  validatePayer,
} from '../lib/format'
import {ZERO_ADDRESS} from '../lib/invoices'
import type {Address} from 'viem'

type Props = {
  onPending: (hash: string) => void
  onSuccess: (hash: string) => void
  onError: (message: string) => void
}

type Touched = {payer: boolean; amount: boolean; memo: boolean}

export function CreateInvoiceForm({onPending, onSuccess, onError}: Props) {
  const {address, isConnected} = useAccount()
  const [payer, setPayer] = useState('')
  const [amount, setAmount] = useState('')
  const [memo, setMemo] = useState('')
  const [touched, setTouched] = useState<Touched>({payer: false, amount: false, memo: false})

  const {writeContract, data: hash, isPending: isSigning, reset} = useWriteContract()
  const receipt = useWaitForTransactionReceipt({hash})

  // Validate on blur, not on every keystroke — errors that appear while you are still
  // typing the first character read as nagging rather than helpful.
  const payerError = validatePayer(payer, address)
  const amountError = validateAmount(amount)
  const memoError = validateMemo(memo)
  const memoBytes = memoByteLength(memo)

  const showPayerError = touched.payer && payerError
  const showAmountError = touched.amount && amountError
  const showMemoError = memoError // byte overflow is shown immediately; it is a hard cap

  const blocked = Boolean(payerError || amountError || memoError)
  const busy = isSigning || receipt.isLoading

  useEffect(() => {
    if (!hash) return
    onPending(hash)
  }, [hash])

  useEffect(() => {
    if (!receipt.isSuccess || !hash) return
    onSuccess(hash)
    setPayer('')
    setAmount('')
    setMemo('')
    setTouched({payer: false, amount: false, memo: false})
    reset()
  }, [receipt.isSuccess, hash])

  useEffect(() => {
    if (!receipt.isError) return
    onError(humanizeError(receipt.error))
    reset()
  }, [receipt.isError])

  function submit(e: React.FormEvent) {
    e.preventDefault()
    setTouched({payer: true, amount: true, memo: true})
    if (blocked || !contractAddress) return

    writeContract(
      {
        abi: arcInvoicingAbi,
        address: contractAddress,
        functionName: 'createInvoice',
        args: [
          (payer.trim() || ZERO_ADDRESS) as Address,
          toBaseUnits(amount),
          memo.trim(),
        ],
      },
      {onError: (err) => onError(humanizeError(err))},
    )
  }

  const disabled = !isConnected || !contractAddress || busy

  return (
    <section
      aria-labelledby="new-invoice-heading"
      className="animate-rise rounded-2xl border border-line bg-surface p-5 sm:p-6"
    >
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand ring-1 ring-inset ring-brand/20">
          <FilePlus2 className="size-5" aria-hidden="true" />
        </span>
        <div>
          <h2 id="new-invoice-heading" className="text-base font-semibold text-ink">
            New invoice
          </h2>
          <p className="text-sm text-muted">Settled in native USDC. No approval step.</p>
        </div>
      </div>

      <form onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="payer" className="mb-1.5 block text-sm font-medium text-ink">
            Bill to{' '}
            <span className="font-normal text-faint">— leave blank for anyone to pay</span>
          </label>
          <input
            id="payer"
            name="payer"
            value={payer}
            onChange={(e) => setPayer(e.target.value)}
            onBlur={() => setTouched((t) => ({...t, payer: true}))}
            placeholder="0x…"
            autoComplete="off"
            spellCheck={false}
            aria-invalid={Boolean(showPayerError)}
            aria-describedby={showPayerError ? 'payer-error' : 'payer-help'}
            className="tnum h-12 w-full rounded-lg border border-line bg-canvas px-3.5 text-[15px] text-ink placeholder:text-faint transition-colors duration-200 hover:border-line-strong focus:border-brand focus:outline-none"
          />
          {showPayerError ? (
            <p id="payer-error" role="alert" className="mt-1.5 text-sm text-danger">
              {payerError}
            </p>
          ) : (
            <p id="payer-help" className="mt-1.5 text-sm text-faint">
              The wallet expected to settle this invoice.
            </p>
          )}
        </div>

        <div>
          <label htmlFor="amount" className="mb-1.5 block text-sm font-medium text-ink">
            Amount <span aria-hidden="true" className="text-brand">*</span>
            <span className="sr-only">(required)</span>
          </label>
          <div className="relative">
            <input
              id="amount"
              name="amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              onBlur={() => setTouched((t) => ({...t, amount: true}))}
              inputMode="decimal"
              placeholder="1200.00"
              autoComplete="off"
              required
              aria-invalid={Boolean(showAmountError)}
              aria-describedby={showAmountError ? 'amount-error' : undefined}
              className="tnum h-12 w-full rounded-lg border border-line bg-canvas pl-3.5 pr-20 text-[15px] text-ink placeholder:text-faint transition-colors duration-200 hover:border-line-strong focus:border-brand focus:outline-none"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3.5 flex items-center text-sm font-medium text-muted">
              USDC
            </span>
          </div>
          {showAmountError && (
            <p id="amount-error" role="alert" className="mt-1.5 text-sm text-danger">
              {amountError}
            </p>
          )}
        </div>

        <div>
          <div className="mb-1.5 flex items-baseline justify-between gap-2">
            <label htmlFor="memo" className="text-sm font-medium text-ink">
              Reference
            </label>
            <span
              className={`tnum text-xs ${memoBytes > MAX_MEMO_BYTES ? 'text-danger' : 'text-faint'}`}
            >
              {memoBytes}/{MAX_MEMO_BYTES}
            </span>
          </div>
          <input
            id="memo"
            name="memo"
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            onBlur={() => setTouched((t) => ({...t, memo: true}))}
            placeholder="INV-2026-014 · Q3 design retainer"
            autoComplete="off"
            aria-invalid={Boolean(showMemoError)}
            aria-describedby={showMemoError ? 'memo-error' : undefined}
            className="h-12 w-full rounded-lg border border-line bg-canvas px-3.5 text-[15px] text-ink placeholder:text-faint transition-colors duration-200 hover:border-line-strong focus:border-brand focus:outline-none"
          />
          {showMemoError && (
            <p id="memo-error" role="alert" className="mt-1.5 text-sm text-danger">
              {memoError}
            </p>
          )}
        </div>

        <button
          type="submit"
          disabled={disabled}
          className="inline-flex h-12 w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-brand font-semibold text-on-brand transition-all duration-200 hover:bg-brand-hi active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              {isSigning ? 'Confirm in wallet…' : 'Issuing on Arc…'}
            </>
          ) : (
            <>
              <Send className="size-4" aria-hidden="true" />
              Issue invoice
            </>
          )}
        </button>

        {!isConnected && (
          <p className="text-center text-sm text-muted">Connect a wallet to issue invoices.</p>
        )}
      </form>
    </section>
  )
}
