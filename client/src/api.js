const DATA_SOURCE_URL =
  import.meta.env.VITE_DATA_SOURCE_URL ||
  'https://raw.githubusercontent.com/giovannicessel/projeto-pokedex/main/server/data/db.json'
const ASSET_SOURCE_BASE =
  (import.meta.env.VITE_ASSET_SOURCE_BASE ||
    'https://raw.githubusercontent.com/giovannicessel/projeto-pokedex/main').replace(/\/$/, '')

async function fetchJson(url) {
  const r = await fetch(url)
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
  cacheDb = await fetchJson(DATA_SOURCE_URL)
  return cacheDb
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
  if (lang === 'en') return sanitizeFlavor(en?.flavor_text || pt?.flavor_text)
  return sanitizeFlavor(pt?.flavor_text || en?.flavor_text)
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

  return {
    description: extractDescription(species, lang),
    evolvesTo: chainNodes.slice(currentIndex + 1).map((n) => n.name),
    chain: chainNodes.map((n) => n.name),
    chainNodes,
    currentIndex,
    radial: { centerSlug: radialCenterSlug, targetSlugs: radialTargets },
    isLegendary: Boolean(species.is_legendary || species.is_mythical || pokemon.isLegendary),
  }
}
