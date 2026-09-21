import {AlertTriangle, LogOut, Wallet} from 'lucide-react'
import {useAccount, useBalance, useConnect, useDisconnect, useSwitchChain} from 'wagmi'
import {activeChain, explorerAddress} from '../lib/chain'
import {formatUsdc, shortAddress} from '../lib/format'

export function ConnectBar() {
  const {address, isConnected, chainId} = useAccount()
  const {connect, connectors, isPending, error} = useConnect()
  const {disconnect} = useDisconnect()
  const {switchChain, isPending: isSwitching} = useSwitchChain()
  const {data: balance} = useBalance({address, query: {enabled: Boolean(address)}})

  const injected = connectors[0]
  const wrongChain = isConnected && chainId !== activeChain.id
  const noWallet = typeof window !== 'undefined' && !('ethereum' in window)

  if (!isConnected) {
    return (
      <div className="flex flex-col items-end gap-2">
        <button
          type="button"
          onClick={() => injected && connect({connector: injected})}
          disabled={isPending || noWallet}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-brand px-4 font-semibold text-on-brand transition-all duration-200 hover:bg-brand-hi active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-45"
        >
          <Wallet className="size-4" aria-hidden="true" />
          {isPending ? 'Check your wallet…' : 'Connect wallet'}
        </button>
        {noWallet && (
          <p className="text-xs text-muted">
            No browser wallet detected — install MetaMask or Rabby.
          </p>
        )}
        {error && <p className="text-xs text-danger">{error.message}</p>}
      </div>
    )
  }

  if (wrongChain) {
    return (
      <button
        type="button"
        onClick={() => switchChain({chainId: activeChain.id})}
        disabled={isSwitching}
        className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg bg-danger-bg px-4 font-semibold text-danger ring-1 ring-inset ring-danger/30 transition-colors duration-200 hover:bg-danger-bg/70 disabled:opacity-45"
      >
        <AlertTriangle className="size-4" aria-hidden="true" />
        {isSwitching ? 'Switching…' : `Switch to ${activeChain.name}`}
      </button>
    )
  }

  return (
    <div className="flex items-center gap-2">
      <div className="hidden rounded-lg border border-line bg-surface px-3 py-2 text-right sm:block">
        <p className="text-[11px] font-medium uppercase tracking-wider text-faint">Balance</p>
        <p className="tnum text-sm font-semibold text-ink">
          {balance ? formatUsdc(balance.value) : '—'}{' '}
          <span className="text-xs font-normal text-muted">USDC</span>
        </p>
      </div>
      <a
        href={explorerAddress(address!)}
        target="_blank"
        rel="noreferrer"
        className="tnum inline-flex h-11 cursor-pointer items-center gap-2 rounded-lg border border-line bg-surface px-3 text-sm font-medium text-ink transition-colors duration-200 hover:border-line-strong"
      >
        <span className="size-2 rounded-full bg-paid" aria-hidden="true" />
        {shortAddress(address)}
      </a>
      <button
        type="button"
        onClick={() => disconnect()}
        aria-label="Disconnect wallet"
        className="grid size-11 cursor-pointer place-items-center rounded-lg border border-line bg-surface text-muted transition-colors duration-200 hover:border-line-strong hover:text-ink"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}
