import { Suspense, lazy, useEffect } from 'react'
import { Route, Routes, useLocation } from 'react-router'
import Layout from './components/Layout'

const Home = lazy(() => import('./pages/Home'))
const TrackPage = lazy(() => import('./pages/TrackPage'))
const ConceptPage = lazy(() => import('./pages/ConceptPage'))
const GlossaryPage = lazy(() => import('./pages/GlossaryPage'))
const MapPage = lazy(() => import('./pages/MapPage'))
const NotFound = lazy(() => import('./pages/NotFound'))

function ScrollToTop() {
  const { pathname } = useLocation()
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' as ScrollBehavior })
  }, [pathname])
  return null
}

export default function App() {
  return (
    <Layout>
      <ScrollToTop />
      <Suspense fallback={<div className="p-10 text-sm text-faint">carregando…</div>}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/t/:trackSlug" element={<TrackPage />} />
          <Route path="/c/:slug" element={<ConceptPage />} />
          <Route path="/glossario" element={<GlossaryPage />} />
          <Route path="/mapa" element={<MapPage />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Layout>
  )
}
