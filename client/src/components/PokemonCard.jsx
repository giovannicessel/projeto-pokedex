import { memo, useMemo } from 'react'
import { motion } from 'framer-motion'
import TypeIcon from './TypeIcon.jsx'
import { typeSurfaceStyle } from '../utils/color.js'
import { useTheme } from '../theme/ThemeContext.jsx'
import { useLanguage } from '../i18n/LanguageContext.jsx'
import { getTypeLabel } from '../i18n/typeLabels.js'

function PokemonCardInner({
  pokemon,
  index = 0,
  layoutIdPrefix = 'card',
  onClick,
}) {
  const { theme } = useTheme()
  const { lang } = useLanguage()
  const border =
    pokemon.primaryType?.borderColor || pokemon.primaryType?.border_color || '#666'
  const isLegendary = Boolean(pokemon.isLegendary)
  const types = [pokemon.primaryType, pokemon.secondaryType].filter(Boolean)

  const surfaceStyle = useMemo(
    () => typeSurfaceStyle(border, theme === 'dark' ? 'dark' : 'light'),
    [border, theme]
  )

  return (
    <motion.article
      layout
      layoutId={`${layoutIdPrefix}-${pokemon.id}`}
      initial={{ opacity: 0, y: 22, scale: 0.94 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.78, y: 10 }}
      transition={{
        delay: index * 0.055,
        layout: { type: 'spring', stiffness: 400, damping: 34 },
        opacity: { duration: 0.28 },
        scale: { type: 'spring', stiffness: 420, damping: 30 },
        y: { type: 'spring', stiffness: 380, damping: 28 },
      }}
      whileHover={{
        y: -5,
        transition: { type: 'spring', stiffness: 420, damping: 24 },
      }}
      className={`group relative mx-auto w-full max-w-[220px] [aspect-ratio:8/16] flex flex-col overflow-hidden rounded-[14px] border-[3px] bg-gradient-to-b from-slate-100 to-slate-200/95 shadow-card-light transition-shadow duration-300 hover:shadow-card-hover-light dark:shadow-card dark:hover:shadow-card-hover dark:from-[#1a2230] dark:to-[#0f131a] ${
        isLegendary
          ? 'legendary-prism before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.25),transparent_45%)]'
          : ''
      }`}
      style={{ borderColor: border }}
      onClick={() => onClick?.(pokemon)}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') onClick?.(pokemon)
      }}
    >
      <motion.div
        className="relative flex min-h-0 flex-1 items-center justify-center p-2.5"
        style={surfaceStyle}
      >
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.5)_0%,transparent_55%)] dark:bg-[radial-gradient(circle_at_50%_40%,rgba(255,255,255,0.06)_0%,transparent_55%)]"
          aria-hidden
        />
        <img
          src={pokemon.gifUrl}
          alt=""
          className="relative z-[1] max-h-full max-w-full object-contain"
          loading="lazy"
          decoding="async"
        />
      </motion.div>
      <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-1 border-t border-slate-300/50 px-2.5 pb-4 pt-3 text-center dark:border-white/10">
        {isLegendary && (
          <span className="legendary-badge rounded-full px-2 py-0.5 text-[0.62rem] font-bold uppercase tracking-wider">
            {lang === 'en' ? 'Legendary' : 'Lendário'}
          </span>
        )}
        <div className="flex flex-wrap justify-center gap-1.5">
          {types.map((t) => (
            <span
              key={t.id}
              className="inline-flex items-center gap-1 rounded-full border-[1.5px] bg-black/[0.06] px-2 py-0.5 text-[0.68rem] font-semibold uppercase tracking-wider dark:bg-black/25"
              style={{ borderColor: t.borderColor, color: t.borderColor }}
            >
              <TypeIcon slug={t.slug} color={t.borderColor} />
              {getTypeLabel(t, lang)}
            </span>
          ))}
        </div>
        <h2 className="m-0 font-display text-[1.05rem] font-bold leading-tight text-slate-900 dark:text-[#f0f4f8]">
          {pokemon.name}
        </h2>
        <p className="m-0 font-mono text-[0.85rem] font-semibold tabular-nums text-slate-500 dark:text-[#8b95a5]">
          #{String(pokemon.pokedexNumber).padStart(3, '0')}
        </p>
      </div>
    </motion.article>
  )
}

export default memo(PokemonCardInner)
