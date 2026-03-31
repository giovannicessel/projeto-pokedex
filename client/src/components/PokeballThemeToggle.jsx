import { motion } from 'framer-motion'
import { useTheme } from '../theme/ThemeContext.jsx'

export default function PokeballThemeToggle() {
  const { theme, toggleTheme } = useTheme()
  const isDark = theme === 'dark'

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 border-black/20 shadow-md transition-transform hover:scale-105 active:scale-95 dark:border-white/15"
      aria-label={isDark ? 'Ativar tema claro' : 'Ativar tema escuro'}
      title={isDark ? 'Tema claro (Pokébola)' : 'Tema escuro'}
    >
      <motion.span
        className="absolute inset-0 overflow-hidden rounded-full"
        initial={false}
        animate={{ rotate: isDark ? 180 : 0 }}
        transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      >
        {/* Metade superior */}
        <span
          className={`absolute left-0 right-0 top-0 h-1/2 ${
            isDark ? 'bg-zinc-700' : 'bg-red-600'
          }`}
        />
        {/* Metade inferior */}
        <span
          className={`absolute bottom-0 left-0 right-0 h-1/2 ${
            isDark ? 'bg-zinc-900' : 'bg-white'
          }`}
        />
        {/* Banda central */}
        <span className="absolute left-0 right-0 top-1/2 z-[1] h-[3px] -translate-y-1/2 bg-black/80 dark:bg-white/70" />
        {/* Botão central */}
        <span className="absolute left-1/2 top-1/2 z-[2] h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-black/80 bg-white dark:border-white/80 dark:bg-zinc-800" />
      </motion.span>
    </button>
  )
}
