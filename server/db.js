import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DB_PATH = path.join(__dirname, 'data', 'db.json')

export function readDb() {
  const raw = fs.readFileSync(DB_PATH, 'utf8')
  return JSON.parse(raw)
}

export function writeDb(data) {
  fs.writeFileSync(DB_PATH, JSON.stringify(data, null, 2), 'utf8')
}

export function nextId(items) {
  if (!items.length) return 1
  return Math.max(...items.map((x) => x.id)) + 1
}

export function slugify(str) {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tipo'
}
