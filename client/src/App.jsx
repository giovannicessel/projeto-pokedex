import { lazy, Suspense } from 'react'
import { Routes, Route, Outlet, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import Home from './pages/Home.jsx'
import PokeballThemeToggle from './components/PokeballThemeToggle.jsx'
import LanguageToggle from './components/LanguageToggle.jsx'
import { useLanguage } from './i18n/LanguageContext.jsx'

const Admin = lazy(() => import('./pages/Admin.jsx'))

function AnimatedOutlet() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -14 }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
        className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 sm:px-6"
      >
        <Outlet />
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { lang } = useLanguage()
  const t = {
    gallery: lang === 'en' ? 'Gallery' : 'Galeria',
    admin: 'Admin',
    loadingAdmin: lang === 'en' ? 'Loading admin panel…' : 'Carregando painel…',
  }
  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)] text-[color:var(--text)] transition-colors duration-300">
      <header
        className="sticky top-0 z-20 flex items-center justify-between border-b border-black/5 px-4 py-3 backdrop-blur-md dark:border-white/[0.08] sm:px-6"
        style={{ background: 'var(--header-bg)' }}
      >
        <NavLink
          to="/"
          className="font-display text-xl font-bold tracking-tight text-slate-900 no-underline hover:text-blue-600 dark:text-white dark:hover:text-blue-300"
        >
          Pokédex
        </NavLink>
        <div className="flex items-center gap-2 sm:gap-3">
          <nav className="flex gap-1">
            <NavLink
              to="/"
              end
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold no-underline transition-colors ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                    : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                }`
              }
            >
              {t.gallery}
            </NavLink>
            <NavLink
              to="/admin"
              className={({ isActive }) =>
                `rounded-lg px-3 py-2 text-sm font-semibold no-underline transition-colors ${
                  isActive
                    ? 'bg-blue-500/15 text-blue-700 dark:bg-blue-500/20 dark:text-blue-200'
                    : 'text-slate-600 hover:bg-black/5 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/10 dark:hover:text-white'
                }`
              }
            >
              Admin
            </NavLink>
          </nav>
          <LanguageToggle />
          <PokeballThemeToggle />
        </div>
      </header>
      <Routes>
        <Route element={<AnimatedOutlet />}>
          <Route index element={<Home />} />
          <Route
            path="admin"
            element={
              <Suspense
                fallback={
                  <div className="flex justify-center py-16 text-slate-500 dark:text-slate-400">
                    {t.loadingAdmin}
                  </div>
                }
              >
                <Admin />
              </Suspense>
            }
          />
        </Route>
      </Routes>
    </div>
  )
}
