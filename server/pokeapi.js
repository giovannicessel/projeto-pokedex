const detailsCache = new Map()
const translateCache = new Map()

async function fetchJson(url) {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 7000)
  try {
    const r = await fetch(url, { signal: controller.signal })
    if (!r.ok) {
      throw new Error(`Falha ao consultar PokéAPI (${r.status})`)
    }
    return await r.json()
  } finally {
    clearTimeout(timeout)
  }
}

function sanitizeFlavor(text) {
  return text.replace(/\f|\n|\r/g, ' ').replace(/\s+/g, ' ').trim()
}

function extractDescription(species, lang = 'pt') {
  const entries = species.flavor_text_entries || []
  const pt = entries.find((x) => x.language?.name === 'pt')
  const en = entries.find((x) => x.language?.name === 'en')
  if (lang === 'en') {
    return {
      text: sanitizeFlavor(en?.flavor_text || pt?.flavor_text || 'No description available.'),
      source: en ? 'en' : pt ? 'pt' : 'none',
    }
  }
  return {
    text: sanitizeFlavor(pt?.flavor_text || en?.flavor_text || 'Sem descrição disponível.'),
    source: pt ? 'pt' : en ? 'en' : 'none',
  }
}

function flattenEvolution(chain, out = []) {
  if (!chain) return out
  if (chain.species?.name) out.push(chain.species.name)
  for (const evo of chain.evolves_to || []) {
    flattenEvolution(evo, out)
  }
  return out
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

function titleCase(name) {
  return name
    .split('-')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ')
}

function normalizeName(name) {
  return String(name || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

async function getPokemonThumb(name) {
  try {
    const p = await fetchJson(`https://pokeapi.co/api/v2/pokemon/${name}`)
    return {
      url:
        p?.sprites?.other?.['official-artwork']?.front_default ||
        p?.sprites?.front_default ||
        null,
      fallback:
        p?.sprites?.front_default ||
        (p?.id ? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${p.id}.png` : null),
      id: p?.id ?? null,
    }
  } catch {
    return { url: null, fallback: null, id: null }
  }
}

async function translateEnToPt(text) {
  const key = text.toLowerCase()
  if (translateCache.has(key)) return translateCache.get(key)
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 6000)
  try {
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(
      text
    )}&langpair=en|pt-BR`
    const r = await fetch(url, { signal: controller.signal })
    if (!r.ok) return text
    const data = await r.json()
    const translated = data?.responseData?.translatedText
    const result = translated && typeof translated === 'string' ? translated : text
    translateCache.set(key, result)
    return result
  } catch {
    return text
  } finally {
    clearTimeout(timeout)
  }
}

function shouldTranslateToPt(desc) {
  if (!desc?.text) return false
  if (desc.source !== 'pt') return true
  const hasLatin = /[A-Za-z]/.test(desc.text)
  const hasPtMarks = /[áéíóúâêôãõç]/i.test(desc.text)
  return hasLatin && !hasPtMarks
}

export async function getPokemonLore({ dexNumber, fallbackName, lang = 'pt' }) {
  const key = `${String(dexNumber || fallbackName || '').toLowerCase()}:${lang}`
  if (detailsCache.has(key)) return detailsCache.get(key)

  const speciesUrl = `https://pokeapi.co/api/v2/pokemon-species/${dexNumber || fallbackName}`
  const species = await fetchJson(speciesUrl)
  const chain = await fetchJson(species.evolution_chain.url)

  const names = flattenEvolution(chain.chain)
  const links = flattenEvolutionWithLinks(chain.chain)
  const currentNorm = normalizeName(species.name || fallbackName)
  const currentIndex = Math.max(
    0,
    names.findIndex((n) => normalizeName(n) === currentNorm)
  )
  const thumbs = await Promise.all(names.map((n) => getPokemonThumb(n)))
  const chainNodes = names.map((name, idx) => ({
    slug: name,
    name: titleCase(name),
    thumbnail: thumbs[idx]?.url || null,
    thumbnailFallback: thumbs[idx]?.fallback || null,
    pokeApiId: thumbs[idx]?.id || null,
    isCurrent: idx === currentIndex,
  }))
  const desc = extractDescription(species, lang)
  const description =
    lang === 'pt' && shouldTranslateToPt(desc)
      ? await translateEnToPt(desc.text)
      : desc.text

  const linkMap = new Map(links.map((x) => [x.slug, x]))
  const currentSlug = names[currentIndex]
  const currentNode = linkMap.get(currentSlug)
  const parentNode = currentNode?.parentSlug ? linkMap.get(currentNode.parentSlug) : null

  let radialCenterSlug = currentSlug
  let radialTargets = (currentNode?.children || []).slice()

  // Eevee-style: when pre-evolution branches into many outputs, keep it in center.
  if (parentNode && parentNode.children.length > 1) {
    radialCenterSlug = parentNode.slug
    radialTargets = parentNode.children.slice()
  }

  const result = {
    description,
    evolvesTo: chainNodes.slice(currentIndex + 1).map((n) => n.name),
    chain: names.map(titleCase),
    chainNodes,
    currentIndex,
    radial: {
      centerSlug: radialCenterSlug,
      targetSlugs: radialTargets,
    },
    isLegendary: Boolean(species.is_legendary || species.is_mythical),
  }

  detailsCache.set(key, result)
  return result
}
