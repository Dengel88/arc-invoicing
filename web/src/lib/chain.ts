import {arc, arcTestnet} from 'viem/chains'
import {createConfig, http} from 'wagmi'
import {injected} from 'wagmi/connectors'
import type {Address} from 'viem'

/*
  Wallet connection is injected-only (MetaMask, Rabby, Coinbase Wallet extension...).
  WalletConnect is deliberately left out: it needs a per-project cloud ID, which turns
  a static front-end into something with a signup and a secret to rotate. For a demo
  that must simply open and work, that trade is not worth it.
*/

const USE_TESTNET = import.meta.env.VITE_USE_TESTNET === 'true'

export const activeChain = USE_TESTNET ? arcTestnet : arc

/** Arc's public RPC needs no key, so the app works straight from a static host. */
const rpcUrl =
  import.meta.env.VITE_RPC_URL ||
  (USE_TESTNET ? 'https://rpc.testnet.arc.io' : 'https://rpc.mainnet.arc.io')

export const wagmiConfig = createConfig({
  chains: [activeChain],
  connectors: [injected()],
  transports: {
    [arc.id]: http(USE_TESTNET ? undefined : rpcUrl),
    [arcTestnet.id]: http(USE_TESTNET ? rpcUrl : undefined),
  },
})

declare module 'wagmi' {
  interface Register {
    config: typeof wagmiConfig
  }
}

const RAW_ADDRESS = (import.meta.env.VITE_CONTRACT_ADDRESS ?? '').trim()

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/

/** `null` until the contract address is configured — the UI says so rather than failing. */
export const contractAddress: Address | null = ADDRESS_RE.test(RAW_ADDRESS)
  ? (RAW_ADDRESS as Address)
  : null

export const explorerBase = USE_TESTNET
  ? 'https://explorer.testnet.arc.io'
  : 'https://explorer.arc.io'

export const explorerTx = (hash: string) => `${explorerBase}/tx/${hash}`
export const explorerAddress = (addr: string) => `${explorerBase}/address/${addr}`
