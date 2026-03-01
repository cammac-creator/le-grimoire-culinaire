import { Suspense, lazy } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { useAuth } from '@/hooks/useAuth'

// Eager-loaded pages (public, fast first paint)
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Register from '@/pages/Register'
import SearchPage from '@/pages/Search'

// Lazy-loaded pages (authenticated / heavy)
const RecipeDetailPage = lazy(() => import('@/pages/RecipeDetail'))
const RecipeCreate = lazy(() => import('@/pages/RecipeCreate'))
const RecipeEdit = lazy(() => import('@/pages/RecipeEdit'))
const MyRecipes = lazy(() => import('@/pages/MyRecipes'))
const Favorites = lazy(() => import('@/pages/Favorites'))
const OcrPage = lazy(() => import('@/pages/OcrPage'))
const BookBuilderPage = lazy(() => import('@/pages/BookBuilder'))
const FontCreator = lazy(() => import('@/pages/FontCreator'))

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

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <Suspense fallback={<PageLoader />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/recipes/:id" element={<RecipeDetailPage />} />
            <Route
              path="/recipes/new"
              element={<ProtectedRoute><RecipeCreate /></ProtectedRoute>}
            />
            <Route
              path="/recipes/:id/edit"
              element={<ProtectedRoute><RecipeEdit /></ProtectedRoute>}
            />
            <Route
              path="/my-recipes"
              element={<ProtectedRoute><MyRecipes /></ProtectedRoute>}
            />
            <Route
              path="/favorites"
              element={<ProtectedRoute><Favorites /></ProtectedRoute>}
            />
            <Route
              path="/ocr"
              element={<ProtectedRoute><OcrPage /></ProtectedRoute>}
            />
            <Route
              path="/book-builder"
              element={<ProtectedRoute><BookBuilderPage /></ProtectedRoute>}
            />
            <Route
              path="/font-creator"
              element={<ProtectedRoute><FontCreator /></ProtectedRoute>}
            />
          </Routes>
        </Suspense>
      </main>
      <Footer />
    </div>
  )
}
