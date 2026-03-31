import { createContext, useContext, useMemo, useState } from 'react'

const STORAGE_KEY = 'pokedex-lang'

const LanguageContext = createContext({
  lang: 'pt',
  setLang: () => {},
})

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    if (typeof window === 'undefined') return 'pt'
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === 'en' ? 'en' : 'pt'
  })

  const setLang = (value) => {
    const next = value === 'en' ? 'en' : 'pt'
    setLangState(next)
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY, next)
    }
  }

  const value = useMemo(() => ({ lang, setLang }), [lang])
  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>
}

export function useLanguage() {
  return useContext(LanguageContext)
}
