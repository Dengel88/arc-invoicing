import {useCallback, useRef, useState} from 'react'
import {ExternalLink, Fuel, ReceiptText, ShieldCheck, Zap} from 'lucide-react'
import {useAccount} from 'wagmi'
import {ConnectBar} from './components/ConnectBar'
import {CreateInvoiceForm} from './components/CreateInvoiceForm'
import {InvoiceList} from './components/InvoiceList'
import {PublicActivity} from './components/PublicActivity'
import {Stats} from './components/Stats'
import {ToastStack, type ToastState} from './components/Toast'
import {activeChain, contractAddress, explorerAddress} from './lib/chain'
import {shortAddress} from './lib/format'
import {useInvoices, usePublicInvoices, useTotals} from './lib/invoices'

const PILLARS = [
  {
    Icon: Fuel,
    title: 'USDC is the gas',
    body: 'The invoiced asset and the fee asset are the same token. No second asset to hold, no bridge to cross before you can pay.',
  },
  {
    Icon: Zap,
    title: 'Settled on inclusion',
    body: 'Arc finalises on inclusion, so a paid invoice is a settled invoice — not one waiting out twelve confirmations.',
  },
  {
    Icon: ShieldCheck,
    title: 'No approval step',
    body: 'Payment is a native value transfer, so there is no ERC-20 approve transaction to sign, fund and explain first.',
  },
]

export default function App() {
  const {address} = useAccount()
  const {invoices, isLoading, isError, refetch} = useInvoices()
  const totals = useTotals(invoices, address)
  const publicFeed = usePublicInvoices()

  const [toasts, setToasts] = useState<ToastState[]>([])
  const nextId = useRef(1)

  const dismiss = useCallback((id: number) => {
    setToasts((all) => all.filter((t) => t.id !== id))
  }, [])

  const push = useCallback((toast: Omit<ToastState, 'id'>) => {
    const id = nextId.current++
    // One toast at a time: a transaction moving pending → success should replace its
    // own notice, not stack a second card on top of it.
    setToasts([{...toast, id}])
    return id
  }, [])

  const onPending = useCallback(
    (hash: string, label = 'Issuing invoice') => {
      push({kind: 'pending', title: label, detail: 'Waiting for Arc to include the transaction.', hash})
    },
    [push],
  )

  const onSuccess = useCallback(
    (hash: string, label = 'Invoice issued') => {
      push({kind: 'success', title: label, detail: 'Confirmed on Arc.', hash})
      refetch()
    },
    [push, refetch],
  )

  const onError = useCallback(
    (message: string) => {
      push({kind: 'error', title: 'Transaction failed', detail: message})
    },
    [push],
  )

  return (
    <div className="min-h-dvh">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[420px] grid-veil" aria-hidden="true" />

      <div className="relative mx-auto w-full max-w-6xl px-4 pb-20 sm:px-6">
        <header className="flex flex-wrap items-center justify-between gap-4 py-6">
          <div className="flex items-center gap-3">
            <span className="grid size-10 place-items-center rounded-xl bg-brand text-on-brand">
              <ReceiptText className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-[15px] font-semibold leading-tight text-ink">Arc Invoicing</p>
              <p className="text-xs text-muted">Cross-border invoices, settled in USDC</p>
            </div>
          </div>
          <ConnectBar />
        </header>

        <section className="py-8 sm:py-12">
          <span className="inline-flex items-center gap-2 rounded-full border border-line bg-surface px-3 py-1 text-xs font-medium text-muted">
            <span className="size-1.5 rounded-full bg-paid" aria-hidden="true" />
            Live on {activeChain.name} · chain {activeChain.id}
          </span>
          <h1 className="mt-5 max-w-2xl text-3xl font-semibold leading-[1.15] tracking-tight text-ink text-balance sm:text-5xl">
            Send an invoice abroad. Get paid in one transaction.
          </h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-muted sm:text-base">
            An invoice is issued on-chain, addressed to a payer, and settled with a single
            native USDC transfer. No approvals, no bridges, no waiting on correspondent banks.
          </p>

          <dl className="mt-10 grid gap-4 sm:grid-cols-3">
            {PILLARS.map(({Icon, title, body}) => (
              <div key={title} className="rounded-xl border border-line bg-surface/60 p-4">
                <dt className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <Icon className="size-4 text-brand" aria-hidden="true" />
                  {title}
                </dt>
                <dd className="mt-2 text-sm leading-relaxed text-muted">{body}</dd>
              </div>
            ))}
          </dl>
        </section>

        {!contractAddress && (
          <div
            role="alert"
            className="mb-8 rounded-xl border border-pending/30 bg-pending-bg/40 p-4 sm:p-5"
          >
            <p className="font-semibold text-ink">Contract address not configured</p>
            <p className="mt-1.5 text-sm leading-relaxed text-muted">
              Deploy the contract, then set{' '}
              <code className="tnum rounded bg-canvas px-1.5 py-0.5 text-[13px] text-brand">
                VITE_CONTRACT_ADDRESS
              </code>{' '}
              in <code className="rounded bg-canvas px-1.5 py-0.5 text-[13px] text-brand">web/.env</code>{' '}
              and redeploy. Everything below stays read-only until then.
            </p>
          </div>
        )}

        {address && (
          <div className="mb-8">
            <Stats totals={totals} />
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[minmax(0,380px)_minmax(0,1fr)] lg:items-start">
          <div className="lg:sticky lg:top-6">
            <CreateInvoiceForm
              onPending={(hash) => onPending(hash, 'Issuing invoice')}
              onSuccess={(hash) => onSuccess(hash, 'Invoice issued')}
              onError={onError}
            />
          </div>

          {/*
            With a wallet connected this is the visitor's own ledger. Without one it
            falls back to the public tail of the contract, so anyone opening the link
            can see the thing working rather than an empty box.
          */}
          {address ? (
            <InvoiceList
              invoices={invoices}
              self={address}
              isLoading={isLoading}
              isError={isError}
              onRetry={refetch}
              onPending={onPending}
              onSuccess={onSuccess}
              onError={onError}
            />
          ) : (
            <PublicActivity
              invoices={publicFeed.invoices}
              total={publicFeed.total}
              isLoading={publicFeed.isLoading}
              isError={publicFeed.isError}
              onRetry={publicFeed.refetch}
            />
          )}
        </div>

        <footer className="mt-16 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6 text-sm text-faint">
          <p>
            Built for Arc Microgrants · settled in native USDC ({activeChain.nativeCurrency.decimals}{' '}
            decimals)
          </p>
          {contractAddress && (
            <a
              href={explorerAddress(contractAddress)}
              target="_blank"
              rel="noreferrer"
              className="tnum inline-flex cursor-pointer items-center gap-1.5 transition-colors duration-200 hover:text-ink"
            >
              Contract {shortAddress(contractAddress)}
              <ExternalLink className="size-3.5" aria-hidden="true" />
            </a>
          )}
        </footer>
      </div>

      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
