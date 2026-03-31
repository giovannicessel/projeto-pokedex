const DATA_SOURCE_URL =
  import.meta.env.VITE_DATA_SOURCE_URL ||
  'https://raw.githubusercontent.com/giovannicessel/projeto-pokedex/main/server/data/db.json'
const DATA_SOURCE_FALLBACK_URL =
  import.meta.env.VITE_DATA_SOURCE_FALLBACK_URL ||
  'https://cdn.jsdelivr.net/gh/giovannicessel/projeto-pokedex@main/server/data/db.json'
const ASSET_SOURCE_BASE =
  (import.meta.env.VITE_ASSET_SOURCE_BASE ||
    'https://raw.githubusercontent.com/giovannicessel/projeto-pokedex/main').replace(/\/$/, '')

const DB_CACHE_KEY = 'pokedex-static-db-cache-v1'

async function fetchJson(url, timeoutMs = 10000) {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  const r = await fetch(url, { signal: ctrl.signal, cache: 'no-store' })
  clearTimeout(timer)
  if (!r.ok) throw new Error(`Falha ao carregar: ${url}`)
  return r.json()
}

function absolutizeAsset(url) {
  if (!url || typeof url !== 'string') return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/assets/')) return `${ASSET_SOURCE_BASE}${url}`
  return url
}

function enrichPokemon(db, p) {
  const primaryType = db.types.find((t) => t.id === p.primaryTypeId) || null
  const secondaryType = p.secondaryTypeId
    ? db.types.find((t) => t.id === p.secondaryTypeId) || null
    : null
  return {
    ...p,
    gifUrl: absolutizeAsset(p.gifUrl),
    primaryType,
    secondaryType,
  }
}

let cacheDb = null
async function getDb() {
  if (cacheDb) return cacheDb
  const sources = [DATA_SOURCE_URL, DATA_SOURCE_FALLBACK_URL]
  for (const src of sources) {
    try {
      const db = await fetchJson(src)
      cacheDb = db
      if (typeof window !== 'undefined') {
        localStorage.setItem(DB_CACHE_KEY, JSON.stringify(db))
      }
      return cacheDb
    } catch {
      // tenta próxima fonte
    }
  }

  if (typeof window !== 'undefined') {
    const cached = localStorage.getItem(DB_CACHE_KEY)
    if (cached) {
      cacheDb = JSON.parse(cached)
      return cacheDb
    }
  }

  throw new Error('Não foi possível carregar os dados estáticos da Pokédex.')
}

export async function fetchTypes() {
  const db = await getDb()
  return [...db.types].sort((a, b) => a.name.localeCompare(b.name, 'pt-BR'))
}

export async function fetchPokemon() {
  const db = await getDb()
  return [...db.pokemon]
    .sort((a, b) => a.pokedexNumber - b.pokedexNumber)
    .map((p) => enrichPokemon(db, p))
}

function sanitizeFlavor(text) {
  return String(text || '')
    .replace(/\f|\n|\r/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

const translationCache = new Map()

async function translateEnToPt(text) {
  const key = String(text || '').toLowerCase()
  if (!key) return ''
  if (translationCache.has(key)) return translationCache.get(key)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|pt-BR`
    const data = await fetchJson(url, 8000)
    const translated = data?.responseData?.translatedText
    const out =
      translated && typeof translated === 'string' ? translated : text
    translationCache.set(key, out)
    return out
  } catch {
    return text
  }
}

function titleCase(name) {
  return String(name || '')
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function flattenEvolutionWithLinks(node, parent = null, out = []) {
  if (!node?.species?.name) return out
  const slug = node.species.name
  out.push({
    slug,
    parentSlug: parent,
    children: (node.evolves_to || []).map((x) => x.species?.name).filter(Boolean),
  })
  for (const child of node.evolves_to || []) {
    flattenEvolutionWithLinks(child, slug, out)
  }
  return out
}

function extractDescription(species, lang) {
  const entries = species.flavor_text_entries || []
  const pt = entries.find((x) => x.language?.name === 'pt')
  const en = entries.find((x) => x.language?.name === 'en')
  if (lang === 'en') {
    return {
      text: sanitizeFlavor(en?.flavor_text || pt?.flavor_text),
      source: en ? 'en' : pt ? 'pt' : 'none',
    }
  }
  return {
    text: sanitizeFlavor(pt?.flavor_text || en?.flavor_text),
    source: pt ? 'pt' : en ? 'en' : 'none',
  }
}

async function getPokemonThumb(slug) {
  try {
    const p = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${slug}`)
    return {
      url:
        p?.sprites?.other?.['official-artwork']?.front_default ||
        p?.sprites?.front_default ||
        null,
      fallback:
        p?.sprites?.front_default ||
        (p?.id
          ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png`
          : null),
      id: p?.id ?? null,
    }
  } catch {
    return { url: null, fallback: null, id: null }
  }
}

export async function fetchPokemonDetails(pokemon, lang = 'pt') {
  const species = await fetchJson(
    `https://pokeapi.co/api/v2/pokemon-species/${pokemon.pokedexNumber}`
  )
  const chain = await fetchJson(species.evolution_chain.url)
  const links = flattenEvolutionWithLinks(chain.chain)
  const names = links.map((x) => x.slug)
  const currentSlug = species.name
  const currentIndex = Math.max(0, names.findIndex((n) => n === currentSlug))
  const thumbs = await Promise.all(names.map((n) => getPokemonThumb(n)))

  const chainNodes = names.map((name, idx) => ({
    slug: name,
    name: titleCase(name),
    thumbnail: thumbs[idx]?.url || null,
    thumbnailFallback: thumbs[idx]?.fallback || null,
    pokeApiId: thumbs[idx]?.id || null,
    isCurrent: idx === currentIndex,
  }))

  const linkMap = new Map(links.map((x) => [x.slug, x]))
  const currentNode = linkMap.get(currentSlug)
  const parentNode = currentNode?.parentSlug ? linkMap.get(currentNode.parentSlug) : null
  let radialCenterSlug = currentSlug
  let radialTargets = (currentNode?.children || []).slice()
  if (parentNode && parentNode.children.length > 1) {
    radialCenterSlug = parentNode.slug
    radialTargets = parentNode.children.slice()
  }

  const desc = extractDescription(species, lang)
  const description =
    lang === 'pt' && desc.source === 'en'
      ? await translateEnToPt(desc.text)
      : desc.text

  return {
    description,
    evolvesTo: chainNodes.slice(currentIndex + 1).map((n) => n.name),
    chain: chainNodes.map((n) => n.name),
    chainNodes,
    currentIndex,
    radial: { centerSlug: radialCenterSlug, targetSlugs: radialTargets },
    isLegendary: Boolean(species.is_legendary || species.is_mythical || pokemon.isLegendary),
  }
}
