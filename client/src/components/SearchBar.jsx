import { motion } from 'framer-motion'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons'

export default function SearchBar({ value, onChange, expanded, onFocus, onBlur }) {
  return (
    <motion.div
      layout
      className="relative flex w-full max-w-md items-center"
      initial={false}
      animate={{
        maxWidth: expanded ? 'min(28rem, 100%)' : '11rem',
      }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
    >
      <label className="relative flex w-full items-center gap-2">
        <motion.span
          className="pointer-events-none absolute left-3 z-[1] text-slate-500 dark:text-slate-400"
          animate={{ scale: expanded ? 1.06 : 1 }}
          transition={{ duration: 0.2 }}
        >
          <FontAwesomeIcon icon={faMagnifyingGlass} className="h-4 w-4" />
        </motion.span>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={onFocus}
          onBlur={onBlur}
          placeholder="Buscar nome ou nº…"
          className="w-full rounded-xl border border-slate-200/80 bg-white/90 py-2.5 pl-10 pr-3 text-sm text-slate-900 shadow-inner outline-none transition-[box-shadow] placeholder:text-slate-400 focus:border-blue-400 focus:shadow-[0_0_0_3px_rgba(59,130,246,0.2)] dark:border-slate-600/80 dark:bg-slate-900/90 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-blue-500"
          autoComplete="off"
        />
      </label>
    </motion.div>
  )
}
