import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { AnimatePresence } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { ErrorBoundary } from '@/components/ErrorBoundary'
import { QueryErrorBoundary } from '@/components/QueryErrorBoundary'
import { Toaster } from '@/components/ui/toaster'
import { OfflineIndicator } from '@/components/layout/OfflineIndicator'
import { ScrollToTop } from '@/components/layout/ScrollToTop'
import { BottomTabBar } from '@/components/layout/BottomTabBar'
import { Breadcrumbs } from '@/components/layout/Breadcrumbs'
import { useAuth } from '@/hooks/useAuth'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { MotionDiv, pageTransition, useReducedMotion } from '@/lib/motion'

// Eager-loaded pages (public, fast first paint)
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import SearchPage from '@/pages/Search'

// Lazy-loaded pages (authenticated / heavy)
const RecipeDetailPage = lazy(() => import('@/pages/RecipeDetail'))
const UnifiedAddRecipe = lazy(() => import('@/pages/UnifiedAddRecipe'))
const RecipeEdit = lazy(() => import('@/pages/RecipeEdit'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const BookBuilderPage = lazy(() => import('@/pages/BookBuilder'))
const FontCreator = lazy(() => import('@/pages/FontCreator'))
const ShoppingListPage = lazy(() => import('@/pages/ShoppingList'))
const MealPlannerPage = lazy(() => import('@/pages/MealPlanner'))
const PressureCookerPage = lazy(() => import('@/pages/PressureCooker'))

function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()

  if (loading) return <PageLoader />
  if (!isAuthenticated) return <Navigate to="/login" replace />

  return <>{children}</>
}

function AnimatedRoutes() {
  const location = useLocation()
  const reduced = useReducedMotion()

  const content = (
    <Routes location={location}>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/search" element={<SearchPage />} />
      <Route path="/recipes/:id" element={<RecipeDetailPage />} />
      <Route
        path="/recipes/new"
        element={<ProtectedRoute><UnifiedAddRecipe /></ProtectedRoute>}
      />
      <Route
        path="/recipes/:id/edit"
        element={<ProtectedRoute><RecipeEdit /></ProtectedRoute>}
      />
      <Route path="/my-recipes" element={<Navigate to="/" replace />} />
      <Route
        path="/favorites"
        element={<ProtectedRoute><Favorites /></ProtectedRoute>}
      />
      <Route path="/ocr" element={<Navigate to="/recipes/new" replace />} />
      <Route
        path="/book-builder"
        element={<ProtectedRoute><BookBuilderPage /></ProtectedRoute>}
      />
      <Route
        path="/font-creator"
        element={<ProtectedRoute><FontCreator /></ProtectedRoute>}
      />
      <Route path="/import" element={<Navigate to="/recipes/new" replace />} />
      <Route
        path="/shopping-list"
        element={<ProtectedRoute><ShoppingListPage /></ProtectedRoute>}
      />
      <Route
        path="/meal-planner"
        element={<ProtectedRoute><MealPlannerPage /></ProtectedRoute>}
      />
      <Route path="/import-url" element={<Navigate to="/recipes/new" replace />} />
      <Route
        path="/pressure-cooker"
        element={<ProtectedRoute><PressureCookerPage /></ProtectedRoute>}
      />
    </Routes>
  )

  if (reduced) return content

  return (
    <AnimatePresence mode="wait">
      <MotionDiv
        key={location.pathname}
        variants={pageTransition}
        initial="initial"
        animate="animate"
        exit="exit"
      >
        {content}
      </MotionDiv>
    </AnimatePresence>
  )
}

export default function App() {
  useKeyboardShortcuts()

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only-focusable">Aller au contenu principal</a>
      <Header />
      <Breadcrumbs />
      <main id="main" className="flex-1 outline-none" tabIndex={-1}>
        <ErrorBoundary>
        <QueryErrorBoundary>
        <Suspense fallback={<PageLoader />}>
          <AnimatedRoutes />
        </Suspense>
        </QueryErrorBoundary>
        </ErrorBoundary>
      </main>
      <BottomTabBar />
      <ScrollToTop />
      <Toaster />
      <OfflineIndicator />
      <Footer />
    </div>
  )
}
