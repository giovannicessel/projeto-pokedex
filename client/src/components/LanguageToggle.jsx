import { useLanguage } from '../i18n/LanguageContext.jsx'

export default function LanguageToggle() {
  const { lang, setLang } = useLanguage()

  return (
    <div className="inline-flex items-center rounded-lg border border-black/10 bg-white/70 p-1 dark:border-white/15 dark:bg-slate-900/60">
      <button
        type="button"
        onClick={() => setLang('pt')}
        className={`rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${
          lang === 'pt'
            ? 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        PT
      </button>
      <button
        type="button"
        onClick={() => setLang('en')}
        className={`rounded-md px-2.5 py-1 text-xs font-bold tracking-wide ${
          lang === 'en'
            ? 'bg-blue-500/20 text-blue-700 dark:bg-blue-500/25 dark:text-blue-200'
            : 'text-slate-600 dark:text-slate-300'
        }`}
      >
        ENG
      </button>
    </div>
  )
}
