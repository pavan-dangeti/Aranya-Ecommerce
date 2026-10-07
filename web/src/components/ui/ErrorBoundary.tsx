import { Component, type ErrorInfo, type ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { Button } from './Button'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  error: Error | null
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    if (import.meta.env.DEV) {
      console.error('Aranya boundary caught:', error.message, info.componentStack)
    }
  }

  render() {
    if (this.state.error) {
      if (this.props.fallback != null) return this.props.fallback
      return (
        <div className="shell grid min-h-[60vh] place-items-center py-24">
          <div className="max-w-md text-center">
            <p className="eyebrow mb-3 text-clay-500">Something wilted</p>
            <h1 className="font-display text-3xl font-medium">An unexpected error occurred</h1>
            <p className="mt-4 text-sm leading-relaxed text-forest-900/65">
              The garden hiccuped. Reloading usually helps.
            </p>
            <Button className="mt-8" onClick={() => window.location.reload()}>
              <RotateCcw size={14} /> Reload
            </Button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
