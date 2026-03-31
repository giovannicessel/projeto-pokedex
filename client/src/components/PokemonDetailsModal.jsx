import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { usePokemonDetails } from '../hooks/queries.js'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { getTypeLabel } from '../i18n/typeLabels.js'
import TypeIcon from './TypeIcon.jsx'

function handleImgError(e) {
  const img = e.currentTarget
  const fallback = img.dataset.fallback
  if (fallback && img.src !== fallback) {
    img.src = fallback
    return
  }
  img.style.display = 'none'
  const placeholder = img.nextElementSibling
  if (placeholder) placeholder.classList.remove('hidden')
}

function EvolutionRadial({ data, borderColor }) {
  const nodes = data?.chainNodes || []
  const radial = data?.radial
  if (!radial?.centerSlug || !radial.targetSlugs?.length) return null

  const center = nodes.find((n) => n.slug === radial.centerSlug)
  const targets = radial.targetSlugs
    .map((slug) => nodes.find((n) => n.slug === slug))
    .filter(Boolean)

  if (!center || targets.length < 2) return null

  const r = 34
  const points = targets.map((node, i) => {
    const angle = (-90 + (360 / targets.length) * i) * (Math.PI / 180)
    return {
      node,
      x: 50 + r * Math.cos(angle),
      y: 50 + r * Math.sin(angle),
    }
  })

  return (
    <div className="mt-3 rounded-xl border border-white/10 bg-black/10 p-3">
      <div className="relative mx-auto h-[260px] w-[260px]">
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100">
          {points.map((p) => (
            <line
              key={`line-${p.node.slug}`}
              x1="50"
              y1="50"
              x2={p.x}
              y2={p.y}
              stroke={borderColor}
              strokeOpacity="0.75"
              strokeWidth="0.7"
            />
          ))}
        </svg>

        <div
          className="absolute left-1/2 top-1/2 flex h-[84px] w-[84px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border bg-white/20 px-1 text-center shadow-md"
          style={{ borderColor }}
        >
          {center.thumbnail ? (
            <img
              src={center.thumbnail}
              data-fallback={center.thumbnailFallback || ''}
              onError={handleImgError}
              alt={center.name}
              className="h-10 w-10 object-contain"
            />
          ) : (
            <div className="h-10 w-10 rounded-full bg-slate-500/20" />
          )}
          <div className="hidden h-10 w-10 rounded-full bg-slate-500/20" />
          <span className="mt-1 text-[10px] font-semibold leading-tight">{center.name}</span>
        </div>

        {points.map((p) => (
          <div
            key={p.node.slug}
            className={`absolute flex h-[72px] w-[72px] -translate-x-1/2 -translate-y-1/2 flex-col items-center justify-center rounded-xl border px-1 text-center ${
              p.node.isCurrent ? 'bg-white/20 shadow-md' : 'bg-black/15'
            }`}
            style={{ left: `${p.x}%`, top: `${p.y}%`, borderColor: p.node.isCurrent ? borderColor : 'rgba(148,163,184,0.4)' }}
          >
            {p.node.thumbnail ? (
              <img
                src={p.node.thumbnail}
                data-fallback={p.node.thumbnailFallback || ''}
                onError={handleImgError}
                alt={p.node.name}
                className="h-9 w-9 object-contain"
              />
            ) : (
              <div className="h-9 w-9 rounded-full bg-slate-500/20" />
            )}
            <div className="hidden h-9 w-9 rounded-full bg-slate-500/20" />
            <span className="mt-0.5 text-[9px] font-medium leading-tight">{p.node.name}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function PokemonDetailsModal({ pokemon, open, onClose }) {
  const [showBack, setShowBack] = useState(false)
  const { lang } = useLanguage()
  const t = {
    front: lang === 'en' ? 'Show front' : 'Ver frente',
    back: lang === 'en' ? 'Show back' : 'Ver verso',
    close: lang === 'en' ? 'Close' : 'Fechar',
    dex: lang === 'en' ? 'Dex #' : '#',
    primary: lang === 'en' ? 'Primary type' : 'Tipagem principal',
    secondary: lang === 'en' ? 'Secondary type' : 'Tipagem secundária',
    loading: lang === 'en' ? 'Loading data from PokéAPI…' : 'Buscando dados da PokéAPI…',
    loadError: lang === 'en' ? 'Failed loading details.' : 'Falha ao carregar detalhes.',
    description: lang === 'en' ? 'Description' : 'Descrição',
    evolution: lang === 'en' ? 'Evolution line' : 'Linha evolutiva',
    noEvo:
      lang === 'en'
        ? 'This Pokémon has no further evolution.'
        : 'Este Pokémon não possui evolução posterior.',
  }
  const { data, isLoading, isError, error } = usePokemonDetails(
    pokemon?.id,
    lang,
    open
  )
  const borderColor =
    pokemon?.primaryType?.borderColor || pokemon?.primaryType?.border_color || '#888888'
  const isLegendary = Boolean(pokemon?.isLegendary || data?.isLegendary)
  const prismClass = isLegendary ? 'legendary-prism' : ''

  if (!pokemon) return null

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.div
            className={`w-full max-w-4xl overflow-hidden rounded-2xl border-2 bg-[var(--bg-elevated)] shadow-2xl ${prismClass}`}
            style={{ borderColor }}
            initial={{ scale: 0.94, y: 30 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 20 }}
            transition={{ type: 'spring', stiffness: 260, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <h3 className="m-0 font-display text-xl">{pokemon.name}</h3>
              <div className="flex items-center gap-2">
                {isLegendary && (
                  <span className="legendary-badge rounded-full px-2 py-0.5 text-xs font-semibold">
                    {lang === 'en' ? 'Legendary' : 'Lendário'}
                  </span>
                )}
                <button
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm"
                  onClick={() => setShowBack((v) => !v)}
                  type="button"
                >
                  {showBack ? t.front : t.back}
                </button>
                <button
                  className="rounded-lg border border-white/20 px-3 py-1.5 text-sm"
                  onClick={onClose}
                  type="button"
                >
                  {t.close}
                </button>
              </div>
            </div>

            <div className="grid gap-0 md:grid-cols-[280px_1fr]">
              <div className="relative min-h-[360px] bg-black/20 p-4">
                <motion.div
                  className="absolute inset-4"
                  animate={{ rotateY: showBack ? 180 : 0 }}
                  transition={{ duration: 0.45 }}
                  style={{ transformStyle: 'preserve-3d' }}
                >
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-xl border-2 bg-white/10"
                    style={{ borderColor, backfaceVisibility: 'hidden' }}
                  >
                    <img
                      src={pokemon.gifUrl}
                      data-fallback={`https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${pokemon.pokedexNumber}.png`}
                      onError={handleImgError}
                      alt={pokemon.name}
                      className="max-h-[280px] max-w-full object-contain"
                    />
                    <div className="hidden h-[180px] w-[180px] rounded-xl bg-slate-500/20" />
                  </div>
                  <div
                    className="absolute inset-0 rounded-xl border-2 bg-black/30 p-4"
                    style={{
                      transform: 'rotateY(180deg)',
                      backfaceVisibility: 'hidden',
                      borderColor,
                    }}
                  >
                    <p className="text-sm text-slate-200">
                      {t.dex} {String(pokemon.pokedexNumber).padStart(3, '0')}
                    </p>
                    <p className="mt-3 text-sm text-slate-300">
                      <span className="inline-flex items-center gap-1">
                        <TypeIcon slug={pokemon.primaryType?.slug} color={borderColor} />
                        {t.primary}: {getTypeLabel(pokemon.primaryType, lang) || '—'}
                      </span>
                    </p>
                    {pokemon.secondaryType && (
                      <p className="mt-1 text-sm text-slate-300">
                        <span className="inline-flex items-center gap-1">
                          <TypeIcon
                            slug={pokemon.secondaryType?.slug}
                            color={pokemon.secondaryType?.borderColor}
                          />
                          {t.secondary}: {getTypeLabel(pokemon.secondaryType, lang)}
                        </span>
                      </p>
                    )}
                  </div>
                </motion.div>
              </div>

              <div className="p-5">
                {isLoading && <p>{t.loading}</p>}
                {isError && (
                  <p className="text-red-400">
                    {error?.message || t.loadError}
                  </p>
                )}
                {data && (
                  <div className="grid gap-4 md:grid-cols-2">
                    <section>
                      <h4 className="m-0 text-lg">{t.description}</h4>
                      <p className="mt-2 text-sm text-[color:var(--muted)]">
                        {data.description}
                      </p>
                    </section>
                    <section>
                      <h4 className="m-0 text-lg">{t.evolution}</h4>
                      <EvolutionRadial data={data} borderColor={borderColor} />
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        {data.chainNodes?.map((node, idx) => (
                          <div key={`${node.slug}-${idx}`} className="contents">
                            <div
                              className={`flex min-w-[88px] flex-col items-center rounded-xl border px-2 py-2 ${
                                node.isCurrent
                                  ? 'bg-white/20 shadow-md'
                                  : 'bg-black/10'
                              }`}
                              style={{
                                borderColor: node.isCurrent ? borderColor : 'rgba(148,163,184,0.4)',
                              }}
                            >
                              {node.thumbnail ? (
                                <img
                                  src={node.thumbnail}
                                  alt={node.name}
                                  className="h-12 w-12 object-contain"
                                />
                              ) : (
                                <div className="h-12 w-12 rounded-full bg-slate-500/20" />
                              )}
                              <span className="mt-1 text-center text-xs font-medium">
                                {node.name}
                              </span>
                            </div>
                            {idx < data.chainNodes.length - 1 && (
                              <span className="px-1 text-slate-400">→</span>
                            )}
                          </div>
                        ))}
                      </div>
                      {!data.evolvesTo?.length && (
                        <p className="mt-2 text-sm text-[color:var(--muted)]">
                          {t.noEvo}
                        </p>
                      )}
                    </section>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
