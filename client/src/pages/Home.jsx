import { useMemo, useState, useDeferredValue, memo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import PokemonCard from '../components/PokemonCard.jsx'
import PokemonDetailsModal from '../components/PokemonDetailsModal.jsx'
import SearchBar from '../components/SearchBar.jsx'
import TypeIcon from '../components/TypeIcon.jsx'
import { usePokemonList, useTypesList } from '../hooks/queries.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { getTypeLabel } from '../i18n/typeLabels.js'

function matchesSearch(p, q) {
  if (!q.trim()) return true
  const n = q.trim().toLowerCase()
  const name = p.name.toLowerCase()
  const num = String(p.pokedexNumber)
  return name.includes(n) || num.includes(n.replace(/^#/, ''))
}

function matchesType(p, typeId) {
  if (typeId == null) return true
  return p.primaryTypeId === typeId || p.secondaryTypeId === typeId
}

const TypeFilterChip = memo(function TypeFilterChip({
  t,
  active,
  onSelect,
  lang,
}) {
  return (
    <motion.button
      type="button"
      layout
      onClick={() => onSelect(active ? null : t.id)}
      whileHover={{ scale: 1.04 }}
      whileTap={{ scale: 0.97 }}
      className={`inline-flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-xs font-semibold uppercase tracking-wide transition-colors ${
        active
          ? 'shadow-md'
          : 'border-slate-300/80 bg-white/70 text-slate-700 hover:bg-white dark:border-slate-600 dark:bg-slate-800/70 dark:text-slate-200'
      }`}
      style={
        active
          ? {
              borderColor: t.borderColor,
              color: t.borderColor,
              backgroundColor: `${t.borderColor}18`,
              boxShadow: `0 0 0 3px ${t.borderColor}44`,
            }
          : undefined
      }
    >
      <TypeIcon slug={t.slug} color={active ? t.borderColor : '#64748b'} />
      {getTypeLabel(t, lang)}
    </motion.button>
  )
})

export default function Home() {
  const { lang } = useLanguage()
  const t = {
    loading: lang === 'en' ? 'Loading Pokédex…' : 'Carregando Pokédex…',
    errorLoad: lang === 'en' ? 'Error while loading' : 'Erro ao carregar',
    checkConnection:
      lang === 'en'
        ? 'Check your internet connection and try reloading.'
        : 'Verifique sua conexão com a internet e recarregue.',
    emptyTitle: lang === 'en' ? 'Your Pokédex is empty' : 'Sua Pokédex está vazia',
    emptyText:
      lang === 'en'
        ? 'The static Pokédex JSON has no Pokémon yet.'
        : 'O JSON estático da Pokédex ainda não possui Pokémon.',
    noResults:
      lang === 'en'
        ? 'No Pokémon found with these filters.'
        : 'Nenhum Pokémon encontrado com esses filtros.',
  }
  const { data: list = [], isLoading, isError, error } = usePokemonList()
  const { data: types = [] } = useTypesList()
  const [search, setSearch] = useState('')
  const [searchFocused, setSearchFocused] = useState(false)
  const [typeFilter, setTypeFilter] = useState(null)
  const [selected, setSelected] = useState(null)
  const deferredSearch = useDeferredValue(search)

  const searchExpanded = searchFocused || search.length > 0

  const filtered = useMemo(() => {
    return list.filter(
      (p) =>
        matchesSearch(p, deferredSearch) && matchesType(p, typeFilter)
    )
  }, [list, deferredSearch, typeFilter])

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500 dark:text-slate-400">
        <motion.div
          className="h-10 w-10 rounded-full border-2 border-blue-500 border-t-transparent"
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 0.85, ease: 'linear' }}
        />
        <p className="mt-4 font-medium">{t.loading}</p>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="mx-auto max-w-md text-center">
        <p className="font-semibold text-red-600 dark:text-red-400">
          {error?.message || t.errorLoad}
        </p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
          {t.checkConnection}
        </p>
      </div>
    )
  }

  if (!list.length) {
    return (
      <div className="mx-auto max-w-md text-center">
        <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          {t.emptyTitle}
        </h1>
        <p className="mt-3 text-slate-600 dark:text-slate-400">
          {t.emptyText}
        </p>
      </div>
    )
  }

  return (
    <div className="w-full">
      {/* Título centralizado */}
      <header className="mb-8 text-center">
        <motion.h1
          className="font-display text-4xl font-extrabold tracking-tight text-slate-900 sm:text-5xl dark:text-white"
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
        >
          Pokédex
        </motion.h1>
      </header>

      <div className="mb-8 flex flex-col items-stretch gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex w-full justify-center sm:justify-start">
          <SearchBar
            value={search}
            onChange={setSearch}
            expanded={searchExpanded}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
          />
        </div>
      </div>

      <motion.div
        layout
        className="mb-6 flex flex-wrap justify-center gap-2"
        initial={false}
      >
        {types.map((t) => (
          <TypeFilterChip
            key={t.id}
            t={t}
            active={typeFilter === t.id}
            onSelect={setTypeFilter}
            lang={lang}
          />
        ))}
      </motion.div>

      <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-6">
        <AnimatePresence mode="popLayout">
          {filtered.map((p, index) => (
            <PokemonCard
              key={p.id}
              pokemon={p}
              index={index}
              layoutIdPrefix="poke"
              onClick={setSelected}
            />
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="py-16 text-center text-slate-500 dark:text-slate-400"
        >
          {t.noResults}
        </motion.p>
      )}
      <PokemonDetailsModal
        pokemon={selected}
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
      />
    </div>
  )
}
