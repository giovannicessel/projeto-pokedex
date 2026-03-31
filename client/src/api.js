const json = async (res) => {
  const text = await res.text()
  if (!text) return null
  try {
    return JSON.parse(text)
  } catch {
    return null
  }
}

const ADMIN_KEY_STORAGE = 'pokedex-admin-key'
const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '')

function apiUrl(path) {
  return `${API_BASE}${path}`
}

function absolutizeAsset(url) {
  if (!url || typeof url !== 'string') return url
  if (/^https?:\/\//i.test(url)) return url
  if (url.startsWith('/assets/')) return `${API_BASE}${url}`
  return url
}

function withAssetUrls(pokemon) {
  return {
    ...pokemon,
    gifUrl: absolutizeAsset(pokemon.gifUrl),
  }
}

export function getAdminKey() {
  if (typeof window === 'undefined') return ''
  return localStorage.getItem(ADMIN_KEY_STORAGE) || ''
}

export function setAdminKey(value) {
  if (typeof window === 'undefined') return
  localStorage.setItem(ADMIN_KEY_STORAGE, value || '')
}

function withAdminHeaders(extra = {}) {
  const key = getAdminKey()
  return {
    ...extra,
    ...(key ? { 'x-admin-key': key } : {}),
  }
}

export async function fetchTypes() {
  const r = await fetch(apiUrl('/api/types'))
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao carregar tipos')
  return data
}

export async function createType(body) {
  const r = await fetch(apiUrl('/api/types'), {
    method: 'POST',
    headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao criar tipo')
  return data
}

export async function updateType(id, body) {
  const r = await fetch(apiUrl(`/api/types/${id}`), {
    method: 'PUT',
    headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao atualizar tipo')
  return data
}

export async function deleteType(id) {
  const r = await fetch(apiUrl(`/api/types/${id}`), {
    method: 'DELETE',
    headers: withAdminHeaders(),
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao excluir tipo')
}

export async function fetchPokemon() {
  const r = await fetch(apiUrl('/api/pokemon'))
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao carregar Pokémon')
  return Array.isArray(data) ? data.map(withAssetUrls) : []
}

export async function createPokemon(body) {
  const r = await fetch(apiUrl('/api/pokemon'), {
    method: 'POST',
    headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao criar Pokémon')
  return data
}

export async function updatePokemon(id, body) {
  const r = await fetch(apiUrl(`/api/pokemon/${id}`), {
    method: 'PUT',
    headers: withAdminHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao atualizar Pokémon')
  return data
}

export async function deletePokemon(id) {
  const r = await fetch(apiUrl(`/api/pokemon/${id}`), {
    method: 'DELETE',
    headers: withAdminHeaders(),
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao excluir Pokémon')
}

export async function uploadGif(file) {
  const fd = new FormData()
  fd.append('gif', file)
  const r = await fetch(apiUrl('/api/upload'), {
    method: 'POST',
    headers: withAdminHeaders(),
    body: fd,
  })
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro no upload')
  if (data?.url) {
    return { ...data, url: absolutizeAsset(data.url) }
  }
  return data
}

export async function fetchPokemonDetails(id, lang = 'pt') {
  const r = await fetch(apiUrl(`/api/pokemon/${id}/details?lang=${lang}`))
  const data = await json(r)
  if (!r.ok) throw new Error(data?.error || 'Erro ao carregar detalhes')
  return data
}
