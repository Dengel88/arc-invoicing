import {useMemo, useState} from 'react'
import {AlertTriangle, Inbox, RefreshCw} from 'lucide-react'
import type {Address} from 'viem'
import {Status, isCreditorOf, type Invoice} from '../lib/invoices'
import {InvoiceCard} from './InvoiceCard'

type Filter = 'all' | 'receivable' | 'payable' | 'settled'

const TABS: {id: Filter; label: string}[] = [
  {id: 'all', label: 'All'},
  {id: 'receivable', label: 'Owed to you'},
  {id: 'payable', label: 'You owe'},
  {id: 'settled', label: 'Settled'},
]

const EMPTY_COPY: Record<Filter, {title: string; body: string}> = {
  all: {
    title: 'No invoices yet',
    body: 'Use the New invoice form to issue your first one. It settles in a single transaction, in USDC, with no approval step.',
  },
  receivable: {
    title: 'Nothing outstanding',
    body: 'Invoices you have issued that are still waiting on payment will appear here.',
  },
  payable: {
    title: 'You owe nothing',
    body: 'Invoices addressed to this wallet will appear here the moment they are issued.',
  },
  settled: {
    title: 'Nothing settled yet',
    body: 'Paid and cancelled invoices are kept here as a permanent record.',
  },
}

type Props = {
  invoices: Invoice[]
  self?: Address
  isLoading: boolean
  isError: boolean
  onRetry: () => void
  onPending: (hash: string, label: string) => void
  onSuccess: (hash: string, label: string) => void
  onError: (message: string) => void
}

export function InvoiceList({
  invoices,
  self,
  isLoading,
  isError,
  onRetry,
  onPending,
  onSuccess,
  onError,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const c = {all: 0, receivable: 0, payable: 0, settled: 0}
    for (const inv of invoices) {
      c.all += 1
      const mine = isCreditorOf(inv, self)
      if (inv.status === Status.Pending) {
        if (mine) c.receivable += 1
        else c.payable += 1
      } else {
        c.settled += 1
      }
    }
    return c
  }, [invoices, self])

  const visible = useMemo(() => {
    return invoices.filter((inv) => {
      const mine = isCreditorOf(inv, self)
      switch (filter) {
        case 'receivable':
          return inv.status === Status.Pending && mine
        case 'payable':
          return inv.status === Status.Pending && !mine
        case 'settled':
          return inv.status !== Status.Pending
        default:
          return true
      }
    })
  }, [invoices, filter, self])

  return (
    <section aria-labelledby="ledger-heading" className="flex min-w-0 flex-col">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="ledger-heading" className="text-base font-semibold text-ink">
          Ledger
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

      {/* Horizontally scrollable on narrow screens so the page itself never scrolls sideways. */}
      <div
        role="tablist"
        aria-label="Filter invoices"
        className="-mx-1 mb-4 flex gap-1 overflow-x-auto px-1 pb-1"
      >
        {TABS.map((tab) => {
          const active = filter === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={active}
              type="button"
              onClick={() => setFilter(tab.id)}
              className={`inline-flex h-10 shrink-0 cursor-pointer items-center gap-2 rounded-lg px-3.5 text-sm font-medium transition-colors duration-200 ${
                active
                  ? 'bg-raised text-ink ring-1 ring-inset ring-line-strong'
                  : 'text-muted hover:text-ink'
              }`}
            >
              {tab.label}
              <span
                className={`tnum rounded-md px-1.5 py-0.5 text-xs ${
                  active ? 'bg-brand/15 text-brand' : 'bg-line/60 text-faint'
                }`}
              >
                {counts[tab.id]}
              </span>
            </button>
          )
        })}
      </div>

      {isError ? (
        <div className="rounded-xl border border-danger/25 bg-danger-bg/40 p-6 text-center">
          <AlertTriangle className="mx-auto size-6 text-danger" aria-hidden="true" />
          <p className="mt-3 font-semibold text-ink">Could not read the ledger</p>
          <p className="mt-1 text-sm text-muted">
            The Arc RPC did not respond. Your invoices are safe on-chain.
          </p>
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
        // Skeletons reserve the real row height, so nothing jumps when data lands.
        <ul className="space-y-3" aria-busy="true" aria-label="Loading invoices">
          {[0, 1, 2].map((i) => (
            <li
              key={i}
              className="relative h-[168px] overflow-hidden rounded-xl border border-line bg-surface"
            >
              <div className="animate-sweep absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.035] to-transparent" />
            </li>
          ))}
        </ul>
      ) : visible.length === 0 ? (
        <div className="rounded-xl border border-dashed border-line bg-surface/40 px-6 py-14 text-center">
          <span className="mx-auto grid size-12 place-items-center rounded-xl bg-raised text-faint">
            <Inbox className="size-6" aria-hidden="true" />
          </span>
          <p className="mt-4 font-semibold text-ink">{EMPTY_COPY[filter].title}</p>
          <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-muted">
            {EMPTY_COPY[filter].body}
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {visible.map((inv, i) => (
            <InvoiceCard
              key={inv.id.toString()}
              invoice={inv}
              index={i}
              onPending={onPending}
              onSuccess={onSuccess}
              onError={onError}
            />
          ))}
        </ul>
      )}
    </section>
  )
}
