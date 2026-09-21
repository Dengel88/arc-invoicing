import {useMemo} from 'react'
import {useAccount, useReadContract} from 'wagmi'
import type {Address} from 'viem'
import {arcInvoicingAbi} from './abi'
import {contractAddress} from './chain'

/** Mirrors the contract's `Status` enum. A const object rather than a TS `enum`,
 *  because `erasableSyntaxOnly` forbids syntax that emits runtime code. */
export const Status = {
  None: 0,
  Pending: 1,
  Paid: 2,
  Cancelled: 3,
} as const

export type Status = (typeof Status)[keyof typeof Status]

export type Invoice = {
  id: bigint
  creditor: Address
  status: Status
  createdAt: bigint
  payer: Address
  paidAt: bigint
  paidBy: Address
  amount: bigint
  memo: string
}

export const ZERO_ADDRESS = '0x0000000000000000000000000000000000000000' as const

const base = {
  abi: arcInvoicingAbi,
  address: (contractAddress ?? undefined) as Address | undefined,
} as const

/**
 * Loads every invoice the connected wallet is party to.
 *
 * Deliberately read straight from contract state rather than from event logs: no
 * indexer to run, no subgraph to deploy, and the list cannot drift from the chain.
 * Arc's `getInvoices` batch view keeps this to three RPC round trips regardless of
 * how many invoices come back.
 */
export function useInvoices() {
  const {address} = useAccount()
  const ready = Boolean(contractAddress && address)

  const issued = useReadContract({
    ...base,
    functionName: 'invoicesIssuedBy',
    args: address ? [address] : undefined,
    query: {enabled: ready, refetchInterval: 12_000},
  })

  const billed = useReadContract({
    ...base,
    functionName: 'invoicesBilledTo',
    args: address ? [address] : undefined,
    query: {enabled: ready, refetchInterval: 12_000},
  })

  // Open invoices a wallet has paid appear in both lists; de-duplicate, newest first.
  const ids = useMemo(() => {
    const set = new Set<bigint>()
    for (const id of issued.data ?? []) set.add(id)
    for (const id of billed.data ?? []) set.add(id)
    return [...set].sort((a, b) => (a > b ? -1 : a < b ? 1 : 0))
  }, [issued.data, billed.data])

  const details = useReadContract({
    ...base,
    functionName: 'getInvoices',
    args: [ids],
    query: {enabled: ready && ids.length > 0, refetchInterval: 12_000},
  })

  const invoices: Invoice[] = useMemo(() => {
    if (!details.data) return []
    return details.data
      .map((row, i) => ({
        id: ids[i],
        creditor: row.creditor,
        status: row.status as Status,
        createdAt: row.createdAt,
        payer: row.payer,
        paidAt: row.paidAt,
        paidBy: row.paidBy,
        amount: row.amount,
        memo: row.memo,
      }))
      .filter((inv) => inv.status !== Status.None)
  }, [details.data, ids])

  const refetch = () => {
    void issued.refetch()
    void billed.refetch()
    void details.refetch()
  }

  return {
    invoices,
    // Only the first load should blank the screen; background refetches must not.
    isLoading: ready && (issued.isLoading || billed.isLoading || (ids.length > 0 && details.isLoading)),
    isError: issued.isError || billed.isError || details.isError,
    error: issued.error ?? billed.error ?? details.error,
    refetch,
  }
}

export type Totals = {
  owedToYou: bigint
  youOwe: bigint
  receivedTotal: bigint
  openCount: number
}

export function useTotals(invoices: Invoice[], self?: Address): Totals {
  return useMemo(() => {
    let owedToYou = 0n
    let youOwe = 0n
    let receivedTotal = 0n
    let openCount = 0

    if (!self) return {owedToYou, youOwe, receivedTotal, openCount}
    const me = self.toLowerCase()

    for (const inv of invoices) {
      const isCreditor = inv.creditor.toLowerCase() === me
      if (inv.status === Status.Pending) {
        openCount += 1
        if (isCreditor) owedToYou += inv.amount
        else youOwe += inv.amount
      } else if (inv.status === Status.Paid && isCreditor) {
        receivedTotal += inv.amount
      }
    }
    return {owedToYou, youOwe, receivedTotal, openCount}
  }, [invoices, self])
}

export function isCreditorOf(inv: Invoice, self?: Address): boolean {
  return Boolean(self && inv.creditor.toLowerCase() === self.toLowerCase())
}

export function canPayInvoice(inv: Invoice, self?: Address): boolean {
  if (!self || inv.status !== Status.Pending) return false
  const me = self.toLowerCase()
  if (inv.creditor.toLowerCase() === me) return false
  return inv.payer === ZERO_ADDRESS || inv.payer.toLowerCase() === me
}
