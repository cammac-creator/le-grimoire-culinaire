import { useQueryErrorResetBoundary } from '@tanstack/react-query'
import { ErrorBoundary, DefaultErrorFallback } from './ErrorBoundary'
import type { ReactNode } from 'react'

export function QueryErrorBoundary({ children }: { children: ReactNode }) {
  const { reset } = useQueryErrorResetBoundary()

  return (
    <ErrorBoundary
      fallback={(error, resetError) => (
        <DefaultErrorFallback
          error={error}
          onReset={() => {
            reset()
            resetError()
          }}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  )
}
