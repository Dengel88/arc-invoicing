import {useEffect} from 'react'
import {ArrowDownLeft, ArrowUpRight, Ban, Check, Globe2, Loader2} from 'lucide-react'
import {useAccount, useWaitForTransactionReceipt, useWriteContract} from 'wagmi'
import {arcInvoicingAbi} from '../lib/abi'
import {contractAddress, explorerAddress} from '../lib/chain'
import {formatRelative, formatUsdc, humanizeError, shortAddress} from '../lib/format'
import {Status, ZERO_ADDRESS, canPayInvoice, isCreditorOf, type Invoice} from '../lib/invoices'
import {StatusBadge} from './StatusBadge'

type Props = {
  invoice: Invoice
  index: number
  onPending: (hash: string, label: string) => void
  onSuccess: (hash: string, label: string) => void
  onError: (message: string) => void
}

export function InvoiceCard({invoice, index, onPending, onSuccess, onError}: Props) {
  const {address} = useAccount()
  const mine = isCreditorOf(invoice, address)
  const payable = canPayInvoice(invoice, address)
  const cancellable = mine && invoice.status === Status.Pending
  const isOpen = invoice.payer === ZERO_ADDRESS

  const pay = useWriteContract()
  const cancel = useWriteContract()
  const payReceipt = useWaitForTransactionReceipt({hash: pay.data})
  const cancelReceipt = useWaitForTransactionReceipt({hash: cancel.data})

  const payBusy = pay.isPending || payReceipt.isLoading
  const cancelBusy = cancel.isPending || cancelReceipt.isLoading

  useEffect(() => {
    if (pay.data) onPending(pay.data, `Paying invoice #${invoice.id}`)
  }, [pay.data])

  useEffect(() => {
    if (payReceipt.isSuccess && pay.data) {
      onSuccess(pay.data, `Invoice #${invoice.id} paid`)
      pay.reset()
    }
  }, [payReceipt.isSuccess])

  useEffect(() => {
    if (payReceipt.isError) {
      onError(humanizeError(payReceipt.error))
      pay.reset()
    }
  }, [payReceipt.isError])

  useEffect(() => {
    if (cancel.data) onPending(cancel.data, `Cancelling invoice #${invoice.id}`)
  }, [cancel.data])

  useEffect(() => {
    if (cancelReceipt.isSuccess && cancel.data) {
      onSuccess(cancel.data, `Invoice #${invoice.id} cancelled`)
      cancel.reset()
    }
  }, [cancelReceipt.isSuccess])

  useEffect(() => {
    if (cancelReceipt.isError) {
      onError(humanizeError(cancelReceipt.error))
      cancel.reset()
    }
  }, [cancelReceipt.isError])

  function handlePay() {
    if (!contractAddress) return
    pay.writeContract(
      {
        abi: arcInvoicingAbi,
        address: contractAddress,
        functionName: 'payInvoice',
        args: [invoice.id],
        // The whole Arc argument in one line: the invoiced asset is the native asset,
        // so settlement is a value transfer — no ERC-20 approval transaction first.
        value: invoice.amount,
      },
      {onError: (err) => onError(humanizeError(err))},
    )
  }

  function handleCancel() {
    if (!contractAddress) return
    cancel.writeContract(
      {
        abi: arcInvoicingAbi,
        address: contractAddress,
        functionName: 'cancelInvoice',
        args: [invoice.id],
      },
      {onError: (err) => onError(humanizeError(err))},
    )
  }

  const counterparty = mine ? invoice.payer : invoice.creditor
  const counterpartyLabel = mine ? 'Billed to' : 'From'

  return (
    <li
      // A short, capped stagger: the list reads as arriving, without the last row
      // waiting a second and a half to appear.
      style={{animationDelay: `${Math.min(index, 8) * 45}ms`}}
      className="animate-rise group rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-strong sm:p-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`grid size-9 shrink-0 place-items-center rounded-lg ring-1 ring-inset ${
              mine
                ? 'bg-paid-bg/60 text-paid ring-paid/20'
                : 'bg-brand/10 text-brand ring-brand/20'
            }`}
            aria-hidden="true"
          >
            {mine ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
          </span>
          <div className="min-w-0">
            <p className="flex items-center gap-2 text-sm font-semibold text-ink">
              <span className="tnum">#{invoice.id.toString()}</span>
              <span className="text-faint">·</span>
              <span className="truncate font-normal text-muted">
                {mine ? 'You issued' : 'You owe'}
              </span>
            </p>
            <p className="mt-0.5 truncate text-sm text-faint">
              {counterpartyLabel}{' '}
              {isOpen && mine ? (
                <span className="inline-flex items-center gap-1 text-muted">
                  <Globe2 className="size-3" aria-hidden="true" />
                  anyone
                </span>
              ) : (
                <a
                  href={explorerAddress(counterparty)}
                  target="_blank"
                  rel="noreferrer"
                  className="tnum cursor-pointer text-muted underline decoration-line-strong underline-offset-2 transition-colors duration-200 hover:text-ink"
                >
                  {shortAddress(counterparty)}
                </a>
              )}
            </p>
          </div>
        </div>
        <StatusBadge status={invoice.status} />
      </div>

      {invoice.memo && (
        <p className="mt-3 text-sm leading-snug text-muted [overflow-wrap:anywhere]">
          {invoice.memo}
        </p>
      )}

      <div className="mt-4 flex flex-wrap items-end justify-between gap-3 border-t border-line pt-4">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wider text-faint">
            {invoice.status === Status.Paid
              ? 'Settled'
              : invoice.status === Status.Cancelled
                ? 'Voided'
                : 'Amount due'}
          </p>
          <p className="tnum mt-0.5 text-2xl font-semibold leading-none text-ink">
            {formatUsdc(invoice.amount)}
            <span className="ml-1.5 text-sm font-normal text-muted">USDC</span>
          </p>
          <p className="mt-1.5 text-xs text-faint">
            {invoice.status === Status.Paid
              ? `Paid ${formatRelative(invoice.paidAt)}`
              : `Issued ${formatRelative(invoice.createdAt)}`}
            {invoice.status === Status.Paid && invoice.paidBy !== invoice.payer && (
              <> · by {shortAddress(invoice.paidBy)}</>
            )}
          </p>
        </div>

        <div className="flex gap-2">
          {cancellable && (
            <button
              type="button"
              onClick={handleCancel}
              disabled={cancelBusy || payBusy}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line px-3.5 text-sm font-medium text-muted transition-colors duration-200 hover:border-danger/40 hover:text-danger disabled:cursor-not-allowed disabled:opacity-45"
            >
              {cancelBusy ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                <Ban className="size-4" aria-hidden="true" />
              )}
              {cancelBusy ? 'Cancelling…' : 'Cancel'}
            </button>
          )}

          {payable && (
            <button
              type="button"
              onClick={handlePay}
              disabled={payBusy || cancelBusy}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 text-sm font-semibold text-on-brand transition-all duration-200 hover:bg-brand-hi active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45 disabled:active:scale-100"
            >
              {payBusy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {pay.isPending ? 'Confirm…' : 'Settling…'}
                </>
              ) : (
                <>
                  <Check className="size-4" aria-hidden="true" />
                  Pay {formatUsdc(invoice.amount)}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </li>
  )
}
