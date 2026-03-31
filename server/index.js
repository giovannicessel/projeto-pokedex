import express from 'express'
import cors from 'cors'
import multer from 'multer'
import helmet from 'helmet'
import rateLimit from 'express-rate-limit'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { readDb, writeDb, nextId, slugify } from './db.js'
import { getPokemonLore } from './pokeapi.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const ROOT = path.resolve(__dirname, '..')
const ASSETS_DIR = path.join(ROOT, 'assets')

const PORT = Number(process.env.PORT) || 3001
const ADMIN_KEY = process.env.ADMIN_KEY || 'pokedex-admin'
const CORS_ORIGIN = process.env.CORS_ORIGIN || '*'

if (!fs.existsSync(ASSETS_DIR)) {
  fs.mkdirSync(ASSETS_DIR, { recursive: true })
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, ASSETS_DIR),
  filename: (_req, file, cb) => {
    const base = path.basename(file.originalname).replace(/[^\w.\-]/g, '_')
    const unique = `${Date.now()}-${base}`
    cb(null, unique)
  },
})

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const ok = /\.(gif|webp|png|jpe?g)$/i.test(file.originalname)
    cb(null, ok)
  },
})

const app = express()
app.use(
  cors({
    origin: CORS_ORIGIN === '*' ? true : CORS_ORIGIN.split(',').map((s) => s.trim()),
  })
)
app.use(
  helmet({
    crossOriginResourcePolicy: false,
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        styleSrc: ["'self'", "'unsafe-inline'", 'https:'],
        scriptSrc: ["'self'", "'unsafe-inline'", 'https:'],
        connectSrc: ["'self'", 'https:'],
      },
    },
  })
)
app.use(express.json({ limit: '2mb' }))
app.use('/assets', express.static(ASSETS_DIR))

const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
})

function requireAdmin(req, res, next) {
  const key = req.get('x-admin-key')
  if (!key || key !== ADMIN_KEY) {
    return res.status(401).json({ error: 'Não autorizado. Defina a chave administrativa.' })
  }
  next()
}

function getTypeById(db, id) {
  return db.types.find((t) => t.id === id)
}

function enrichPokemon(db, p) {
  const primary = getTypeById(db, p.primaryTypeId)
  const secondary = p.secondaryTypeId ? getTypeById(db, p.secondaryTypeId) : null
  return {
    ...p,
    primaryType: primary || null,
    secondaryType: secondary,
  }
}

app.get('/api/types', (_req, res) => {
  try {
    const db = readDb()
    res.json(db.types.sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')))
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.post('/api/types', adminLimiter, requireAdmin, (req, res) => {
  try {
    const { name, borderColor, slug: slugIn } = req.body
    if (!name || typeof name !== 'string') {
      return res.status(400).json({ error: 'Nome é obrigatório.' })
    }
    const db = readDb()
    const slug = slugIn && String(slugIn).trim() ? slugify(String(slugIn)) : slugify(name)
    if (db.types.some((t) => t.slug === slug)) {
      return res.status(409).json({ error: 'Já existe um tipo com esse identificador.' })
    }
    const border =
      typeof borderColor === 'string' && /^#[0-9A-Fa-f]{6}$/.test(borderColor.trim())
        ? borderColor.trim()
        : '#888888'
    const row = { id: nextId(db.types), slug, name: name.trim(), borderColor: border }
    db.types.push(row)
    writeDb(db)
    res.status(201).json(row)
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.put('/api/types/:id', adminLimiter, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const { name, borderColor, slug: slugIn } = req.body
    const db = readDb()
    const idx = db.types.findIndex((t) => t.id === id)
    if (idx === -1) return res.status(404).json({ error: 'Tipo não encontrado.' })
    const cur = db.types[idx]
    const slug =
      slugIn !== undefined && String(slugIn).trim()
        ? slugify(String(slugIn))
        : cur.slug
    if (db.types.some((t) => t.slug === slug && t.id !== id)) {
      return res.status(409).json({ error: 'Já existe um tipo com esse identificador.' })
    }
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Nome inválido.' })
      }
      cur.name = name.trim()
    }
    cur.slug = slug
    if (borderColor !== undefined) {
      if (typeof borderColor !== 'string' || !/^#[0-9A-Fa-f]{6}$/.test(borderColor.trim())) {
        return res.status(400).json({ error: 'borderColor deve ser um hex #RRGGBB.' })
      }
      cur.borderColor = borderColor.trim()
    }
    db.types[idx] = cur
    writeDb(db)
    res.json(cur)
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.delete('/api/types/:id', adminLimiter, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const db = readDb()
    const inUse = db.pokemon.some(
      (p) => p.primaryTypeId === id || p.secondaryTypeId === id
    )
    if (inUse) {
      return res.status(409).json({
        error: 'Não é possível excluir: há Pokémon usando este tipo.',
      })
    }
    const before = db.types.length
    db.types = db.types.filter((t) => t.id !== id)
    if (db.types.length === before) return res.status(404).json({ error: 'Tipo não encontrado.' })
    writeDb(db)
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.get('/api/pokemon', (_req, res) => {
  try {
    const db = readDb()
    const list = [...db.pokemon]
      .sort((a, b) => a.pokedexNumber - b.pokedexNumber)
      .map((p) => enrichPokemon(db, p))
    res.json(list)
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.get('/api/pokemon/:id', (req, res) => {
  try {
    const id = Number(req.params.id)
    const db = readDb()
    const p = db.pokemon.find((x) => x.id === id)
    if (!p) return res.status(404).json({ error: 'Pokémon não encontrado.' })
    res.json(enrichPokemon(db, p))
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.get('/api/pokemon/:id/details', async (req, res) => {
  try {
    const id = Number(req.params.id)
    const lang = req.query.lang === 'en' ? 'en' : 'pt'
    const db = readDb()
    const p = db.pokemon.find((x) => x.id === id)
    if (!p) return res.status(404).json({ error: 'Pokémon não encontrado.' })
    const lore = await getPokemonLore({
      dexNumber: p.pokedexNumber,
      fallbackName: p.name.toLowerCase(),
      lang,
    })
    res.json(lore)
  } catch (e) {
    res.status(502).json({
      error: 'Não foi possível consultar os detalhes da PokéAPI agora.',
      reason: String(e.message),
    })
  }
})

app.post('/api/pokemon', adminLimiter, requireAdmin, (req, res) => {
  try {
    const { pokedexNumber, name, gifUrl, primaryTypeId, secondaryTypeId, isLegendary } = req.body
    if (typeof pokedexNumber !== 'number' || pokedexNumber < 1) {
      return res.status(400).json({ error: 'Número da Pokédex inválido.' })
    }
    if (!name || typeof name !== 'string' || !name.trim()) {
      return res.status(400).json({ error: 'Nome é obrigatório.' })
    }
    if (!gifUrl || typeof gifUrl !== 'string' || !gifUrl.startsWith('/assets/')) {
      return res.status(400).json({ error: 'gifUrl deve começar com /assets/ (envie um GIF ou informe o caminho).' })
    }
    const pid = Number(primaryTypeId)
    const sid = secondaryTypeId != null ? Number(secondaryTypeId) : null
    const db = readDb()
    if (!getTypeById(db, pid)) return res.status(400).json({ error: 'Tipo primário inválido.' })
    if (sid != null && !getTypeById(db, sid)) {
      return res.status(400).json({ error: 'Tipo secundário inválido.' })
    }
    if (db.pokemon.some((p) => p.pokedexNumber === pokedexNumber)) {
      return res.status(409).json({ error: 'Já existe um Pokémon com este número na Pokédex.' })
    }
    const row = {
      id: nextId(db.pokemon),
      pokedexNumber,
      name: name.trim(),
      gifUrl: gifUrl.trim(),
      primaryTypeId: pid,
      secondaryTypeId: sid,
      isLegendary: Boolean(isLegendary),
    }
    db.pokemon.push(row)
    writeDb(db)
    res.status(201).json(enrichPokemon(readDb(), row))
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.put('/api/pokemon/:id', adminLimiter, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const { pokedexNumber, name, gifUrl, primaryTypeId, secondaryTypeId, isLegendary } = req.body
    const db = readDb()
    const idx = db.pokemon.findIndex((p) => p.id === id)
    if (idx === -1) return res.status(404).json({ error: 'Pokémon não encontrado.' })
    const cur = db.pokemon[idx]
    if (pokedexNumber !== undefined) {
      if (typeof pokedexNumber !== 'number' || pokedexNumber < 1) {
        return res.status(400).json({ error: 'Número da Pokédex inválido.' })
      }
      if (db.pokemon.some((p) => p.pokedexNumber === pokedexNumber && p.id !== id)) {
        return res.status(409).json({ error: 'Já existe outro Pokémon com este número.' })
      }
      cur.pokedexNumber = pokedexNumber
    }
    if (name !== undefined) {
      if (typeof name !== 'string' || !name.trim()) {
        return res.status(400).json({ error: 'Nome inválido.' })
      }
      cur.name = name.trim()
    }
    if (gifUrl !== undefined) {
      if (typeof gifUrl !== 'string' || !gifUrl.startsWith('/assets/')) {
        return res.status(400).json({ error: 'gifUrl deve começar com /assets/.' })
      }
      cur.gifUrl = gifUrl.trim()
    }
    if (primaryTypeId !== undefined) {
      const pid = Number(primaryTypeId)
      if (!getTypeById(db, pid)) return res.status(400).json({ error: 'Tipo primário inválido.' })
      cur.primaryTypeId = pid
    }
    if (secondaryTypeId !== undefined) {
      if (secondaryTypeId === null || secondaryTypeId === '') {
        cur.secondaryTypeId = null
      } else {
        const sid = Number(secondaryTypeId)
        if (!getTypeById(db, sid)) {
          return res.status(400).json({ error: 'Tipo secundário inválido.' })
        }
        cur.secondaryTypeId = sid
      }
    }
    if (isLegendary !== undefined) {
      cur.isLegendary = Boolean(isLegendary)
    }
    db.pokemon[idx] = cur
    writeDb(db)
    res.json(enrichPokemon(readDb(), cur))
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.delete('/api/pokemon/:id', adminLimiter, requireAdmin, (req, res) => {
  try {
    const id = Number(req.params.id)
    const db = readDb()
    const before = db.pokemon.length
    db.pokemon = db.pokemon.filter((p) => p.id !== id)
    if (db.pokemon.length === before) return res.status(404).json({ error: 'Pokémon não encontrado.' })
    writeDb(db)
    res.status(204).end()
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.post('/api/upload', adminLimiter, requireAdmin, upload.single('gif'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Arquivo ausente (campo: gif).' })
    }
    const url = `/assets/${req.file.filename}`
    res.json({ url, filename: req.file.filename })
  } catch (e) {
    res.status(500).json({ error: String(e.message) })
  }
})

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, assetsDir: ASSETS_DIR })
})

const clientDist = path.join(ROOT, 'client', 'dist')
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path.startsWith('/assets')) return next()
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) next(err)
    })
  })
}

app.listen(PORT, () => {
  console.log(`Pokédex API em http://localhost:${PORT}`)
  console.log(`Admin protegido por x-admin-key.`)
  if (fs.existsSync(clientDist)) {
    console.log(`Interface React (build) servida na mesma porta.`)
  }
})
