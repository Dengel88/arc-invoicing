import {ArrowRight, Globe2, Inbox, RefreshCw} from 'lucide-react'
import {explorerAddress} from '../lib/chain'
import {formatRelative, formatUsdc, shortAddress} from '../lib/format'
import {Status, ZERO_ADDRESS, type Invoice} from '../lib/invoices'
import {StatusBadge} from './StatusBadge'

/*
  The read-only view of the ledger, shown when no wallet is connected.

  Deliberately written in the third person — "issued by / billed to", never "you owe".
  The wallet-aware card cannot be reused here: with no connected address it would
  render every invoice as though the visitor owed it.
*/

function Row({invoice, index}: {invoice: Invoice; index: number}) {
  const isOpen = invoice.payer === ZERO_ADDRESS
  const counterparty = invoice.status === Status.Paid ? invoice.paidBy : invoice.payer

  return (
    <li
      style={{animationDelay: `${Math.min(index, 8) * 45}ms`}}
      className="animate-rise rounded-xl border border-line bg-surface p-4 transition-colors duration-200 hover:border-line-strong"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <p className="tnum text-sm font-semibold text-ink">#{invoice.id.toString()}</p>
        <StatusBadge status={invoice.status} size="sm" />
      </div>

      {invoice.memo && (
        <p className="mt-2 text-sm leading-snug text-muted [overflow-wrap:anywhere]">
          {invoice.memo}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-faint">
        <a
          href={explorerAddress(invoice.creditor)}
          target="_blank"
          rel="noreferrer"
          className="tnum cursor-pointer transition-colors duration-200 hover:text-ink"
        >
          {shortAddress(invoice.creditor)}
        </a>
        <ArrowRight className="size-3" aria-hidden="true" />
        {isOpen && invoice.status !== Status.Paid ? (
          <span className="inline-flex items-center gap-1">
            <Globe2 className="size-3" aria-hidden="true" />
            anyone
          </span>
        ) : (
          <a
            href={explorerAddress(counterparty)}
            target="_blank"
            rel="noreferrer"
            className="tnum cursor-pointer transition-colors duration-200 hover:text-ink"
          >
            {shortAddress(counterparty)}
          </a>
        )}
      </div>

      <div className="mt-3 flex items-end justify-between gap-3 border-t border-line pt-3">
        <p className="tnum text-lg font-semibold leading-none text-ink">
          {formatUsdc(invoice.amount)}
          <span className="ml-1.5 text-xs font-normal text-muted">USDC</span>
        </p>
        <p className="text-xs text-faint">
          {invoice.status === Status.Paid
            ? `settled ${formatRelative(invoice.paidAt)}`
            : `issued ${formatRelative(invoice.createdAt)}`}
        </p>
      </div>
    </li>
  )
}

type Props = {
  invoices: Invoice[]
  total: bigint
  isLoading: boolean
  isError: boolean
  onRetry: () => void
}

export function PublicActivity({invoices, total, isLoading, isError, onRetry}: Props) {
  return (
    <section aria-labelledby="activity-heading" className="flex min-w-0 flex-col">
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h2 id="activity-heading" className="text-base font-semibold text-ink">
          Recent activity on Arc
        </h2>
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex h-9 cursor-pointer items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-medium text-muted transition-colors duration-200 hover:border-line-strong hover:text-ink"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} aria-hidden="true" />
          Refresh
        </button>
      </div>
      <p className="mb-4 text-sm text-muted">
        Read live from the contract — no wallet needed.{' '}
        <span className="tnum">{total.toString()}</span>{' '}
        {total === 1n ? 'invoice' : 'invoices'} issued so far.
      </p>

      {isError ? (
        <div className="rounded-xl border border-danger/25 bg-danger-bg/40 p-6 text-center">
          <p className="font-semibold text-ink">Could not reach the Arc RPC</p>
          <button
            type="button"
            onClick={onRetry}
            className="mt-4 inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 font-semibold text-on-brand transition-colors duration-200 hover:bg-brand-hi"
          >
            <RefreshCw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </div>
      ) : isLoading ? (
        <ul className="space-y-3" aria-busy="true" aria-label="Loading recent invoices">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="relative h-[132px] overflow-hidden rounded-xl border border-line bg-surface"
            >
              <div className="animate-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />
            </li>
          ))}
        </ul>
      ) : invoices.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/40 px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-raised text-faint">
            <Inbox className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold text-ink">No invoices yet</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            Connect a wallet and issue the first one.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {invoices.map((inv, i) => (
            <Row key={inv.id.toString()} invoice={inv} index={i} />
          ))}
        </ul>
      )}
    </section>
  )
}
