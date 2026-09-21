import {ArrowDownLeft, ArrowUpRight, Wallet2} from 'lucide-react'
import type {LucideIcon} from 'lucide-react'
import {formatUsdc} from '../lib/format'
import type {Totals} from '../lib/invoices'

function Tile({
  label,
  value,
  hint,
  Icon,
  tone,
}: {
  label: string
  value: string
  hint: string
  Icon: LucideIcon
  tone: string
}) {
  return (
    <div className="rounded-xl border border-line bg-surface p-4">
      <div className="flex items-center gap-2">
        <Icon className={`size-4 ${tone}`} aria-hidden="true" />
        <p className="text-[11px] font-medium uppercase tracking-wider text-faint">{label}</p>
      </div>
      <p className="tnum mt-2 text-2xl font-semibold leading-none text-ink">
        {value}
        <span className="ml-1.5 text-sm font-normal text-muted">USDC</span>
      </p>
      <p className="mt-1.5 text-xs text-faint">{hint}</p>
    </div>
  )
}

export function Stats({totals}: {totals: Totals}) {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      <Tile
        label="Owed to you"
        value={formatUsdc(totals.owedToYou)}
        hint={`${totals.openCount} invoice${totals.openCount === 1 ? '' : 's'} open`}
        Icon={ArrowDownLeft}
        tone="text-pending"
      />
      <Tile
        label="You owe"
        value={formatUsdc(totals.youOwe)}
        hint="Payable in one transaction"
        Icon={ArrowUpRight}
        tone="text-brand"
      />
      <Tile
        label="Received"
        value={formatUsdc(totals.receivedTotal)}
        hint="Settled to your wallet"
        Icon={Wallet2}
        tone="text-paid"
      />
    </div>
  )
}
