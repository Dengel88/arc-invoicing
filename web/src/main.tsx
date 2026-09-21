import {StrictMode} from 'react'
import {createRoot} from 'react-dom/client'
import {QueryClient, QueryClientProvider} from '@tanstack/react-query'
import {WagmiProvider} from 'wagmi'
import App from './App'
import {wagmiConfig} from './lib/chain'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Chain reads are cheap and the ledger must not look stale during a demo.
      staleTime: 5_000,
      retry: 2,
    },
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
