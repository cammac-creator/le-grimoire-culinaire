import { Component, type ErrorInfo, type ReactNode } from 'react'

interface ErrorBoundaryProps {
  children: ReactNode
  fallback?: ReactNode | ((error: Error, reset: () => void) => ReactNode)
}

interface ErrorBoundaryState {
  error: Error | null
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  resetError = () => {
    this.setState({ error: null })
  }

  render() {
    const { error } = this.state
    if (error) {
      if (typeof this.props.fallback === 'function') {
        return this.props.fallback(error, this.resetError)
      }
      return this.props.fallback ?? <DefaultErrorFallback error={error} onReset={this.resetError} />
    }
    return this.props.children
  }
}

interface ErrorFallbackProps {
  error: Error
  onReset: () => void
}

function isChunkLoadError(error: Error): boolean {
  const msg = error.message || ''
  return (
    msg.includes('MIME type') ||
    msg.includes('dynamically imported module') ||
    msg.includes('Loading chunk') ||
    msg.includes('Failed to fetch')
  )
}

export function DefaultErrorFallback({ error, onReset }: ErrorFallbackProps) {
  const isChunkError = isChunkLoadError(error)

  return (
    <div className="flex min-h-[40vh] flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <svg className="h-8 w-8 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold">
        {isChunkError ? 'Nouvelle version disponible' : 'Quelque chose s\'est mal passé'}
      </h2>
      <p className="max-w-md text-sm text-muted-foreground">
        {isChunkError
          ? 'L\'application a été mise à jour. Rechargez la page pour continuer.'
          : (error.message || 'Une erreur inattendue est survenue.')}
      </p>
      <button
        onClick={() => {
          if (isChunkError) {
            window.location.reload()
          } else {
            onReset()
          }
        }}
        className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        {isChunkError ? 'Recharger la page' : 'Réessayer'}
      </button>
    </div>
  )
}
