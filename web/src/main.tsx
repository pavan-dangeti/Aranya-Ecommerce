import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { warmUpApi } from './lib/api'
import { useAuthGuard } from './hooks/useAuth'
import { QueryProvider } from './hooks/useQueryClient'
import './index.css'

function SessionBootstrap() {
  useAuthGuard()
  return null
}

function Root() {
  return (
    <StrictMode>
      <QueryProvider>
        <SessionBootstrap />
        <App />
      </QueryProvider>
    </StrictMode>
  )
}

warmUpApi()
createRoot(document.getElementById('root')!).render(<Root />)
