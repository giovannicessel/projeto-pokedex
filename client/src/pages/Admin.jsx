import { useCallback, useEffect, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import {
  fetchTypes,
  fetchPokemon,
  createType,
  updateType,
  deleteType,
  createPokemon,
  updatePokemon,
  deletePokemon,
  getAdminKey,
  setAdminKey,
  uploadGif,
} from '../api.js'
import { qk } from '../hooks/queries.js'
import styles from './Admin.module.css'

export default function Admin() {
  const queryClient = useQueryClient()

  const invalidateGallery = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: qk.types })
    queryClient.invalidateQueries({ queryKey: qk.pokemon })
  }, [queryClient])
  const [types, setTypes] = useState([])
  const [pokemon, setPokemon] = useState([])
  const [loading, setLoading] = useState(true)
  const [msg, setMsg] = useState(null)
  const [err, setErr] = useState(null)
  const [adminKey, setAdminKeyState] = useState(() => getAdminKey())

  const load = useCallback(async () => {
    setErr(null)
    const [t, p] = await Promise.all([fetchTypes(), fetchPokemon()])
    setTypes(t)
    setPokemon(p)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        await load()
      } catch (e) {
        if (!cancelled) setErr(e.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [load])

  const flash = (text) => {
    setMsg(text)
    setTimeout(() => setMsg(null), 3200)
  }

  const saveAdminKey = () => {
    setAdminKey(adminKey.trim())
    flash('Chave administrativa salva neste navegador.')
  }

  /* ——— Tipos ——— */
  const [typeName, setTypeName] = useState('')
  const [typeSlug, setTypeSlug] = useState('')
  const [typeColor, setTypeColor] = useState('#888888')
  const [editingTypeId, setEditingTypeId] = useState(null)

  const resetTypeForm = () => {
    setTypeName('')
    setTypeSlug('')
    setTypeColor('#888888')
    setEditingTypeId(null)
  }

  const submitType = async (e) => {
    e.preventDefault()
    setErr(null)
    try {
      if (editingTypeId) {
        await updateType(editingTypeId, {
          name: typeName,
          borderColor: typeColor,
          slug: typeSlug || undefined,
        })
        flash('Tipo atualizado.')
      } else {
        await createType({
          name: typeName,
          borderColor: typeColor,
          slug: typeSlug || undefined,
        })
        flash('Tipo criado.')
      }
      resetTypeForm()
      await load()
      invalidateGallery()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const startEditType = (t) => {
    setEditingTypeId(t.id)
    setTypeName(t.name)
    setTypeSlug(t.slug)
    setTypeColor(t.borderColor)
  }

  const removeType = async (id) => {
    if (!window.confirm('Excluir este tipo?')) return
    setErr(null)
    try {
      await deleteType(id)
      flash('Tipo excluído.')
      if (editingTypeId === id) resetTypeForm()
      await load()
      invalidateGallery()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  /* ——— Pokémon ——— */
  const [dexNum, setDexNum] = useState(1)
  const [pName, setPName] = useState('')
  const [gifUrl, setGifUrl] = useState('')
  const [primaryId, setPrimaryId] = useState('')
  const [secondaryId, setSecondaryId] = useState('')
  const [isLegendary, setIsLegendary] = useState(false)
  const [editingPokeId, setEditingPokeId] = useState(null)
  const [uploading, setUploading] = useState(false)

  const resetPokeForm = () => {
    setDexNum(1)
    setPName('')
    setGifUrl('')
    setPrimaryId(types[0]?.id ?? '')
    setSecondaryId('')
    setIsLegendary(false)
    setEditingPokeId(null)
  }

  useEffect(() => {
    if (!editingPokeId && types.length && primaryId === '') {
      setPrimaryId(String(types[0].id))
    }
  }, [types, editingPokeId, primaryId])

  const submitPokemon = async (e) => {
    e.preventDefault()
    setErr(null)
    const body = {
      pokedexNumber: Number(dexNum),
      name: pName,
      gifUrl,
      primaryTypeId: Number(primaryId),
      secondaryTypeId: secondaryId === '' ? null : Number(secondaryId),
      isLegendary,
    }
    try {
      if (editingPokeId) {
        await updatePokemon(editingPokeId, body)
        flash('Pokémon atualizado.')
      } else {
        await createPokemon(body)
        flash('Pokémon cadastrado.')
      }
      resetPokeForm()
      await load()
      invalidateGallery()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  const onUpload = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setErr(null)
    try {
      const { url } = await uploadGif(file)
      setGifUrl(url)
      flash('Arquivo enviado.')
    } catch (e2) {
      setErr(e2.message)
    } finally {
      setUploading(false)
      e.target.value = ''
    }
  }

  const startEditPokemon = (p) => {
    setEditingPokeId(p.id)
    setDexNum(p.pokedexNumber)
    setPName(p.name)
    setGifUrl(p.gifUrl)
    setPrimaryId(String(p.primaryTypeId))
    setSecondaryId(p.secondaryTypeId != null ? String(p.secondaryTypeId) : '')
    setIsLegendary(Boolean(p.isLegendary))
  }

  const removePokemon = async (id) => {
    if (!window.confirm('Excluir este Pokémon?')) return
    setErr(null)
    try {
      await deletePokemon(id)
      flash('Pokémon excluído.')
      if (editingPokeId === id) resetPokeForm()
      await load()
      invalidateGallery()
    } catch (e2) {
      setErr(e2.message)
    }
  }

  if (loading) {
    return (
      <div className={styles.state}>
        <p>Carregando painel…</p>
      </div>
    )
  }

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Painel administrativo</h1>
      <p className={styles.lead}>
        Gerencie tipos (cor da borda do card) e Pokémon (GIF, nome, número e tipos).
      </p>
      <section className={styles.section}>
        <h2 className={styles.h2}>Acesso administrativo</h2>
        <p className={styles.help}>
          Para criar, editar ou excluir, informe a chave configurada no backend (`ADMIN_KEY`).
        </p>
        <div className={styles.row}>
          <label className={styles.labelWide}>
            Chave
            <input
              className={styles.input}
              value={adminKey}
              onChange={(e) => setAdminKeyState(e.target.value)}
              placeholder="pokedex-admin"
            />
          </label>
          <button type="button" className={styles.btnPrimary} onClick={saveAdminKey}>
            Salvar chave
          </button>
        </div>
      </section>

      {msg && <div className={styles.msg}>{msg}</div>}
      {err && <div className={styles.err}>{err}</div>}

      <section className={styles.section}>
        <h2 className={styles.h2}>Tipos</h2>
        <p className={styles.help}>
          A cor define a borda do card para Pokémon cujo tipo primário é este. Você pode criar novos
          tipos ou editar os existentes.
        </p>

        <form className={styles.form} onSubmit={submitType}>
          <div className={styles.row}>
            <label className={styles.label}>
              Nome
              <input
                className={styles.input}
                value={typeName}
                onChange={(e) => setTypeName(e.target.value)}
                placeholder="Ex.: Fogo"
                required
              />
            </label>
            <label className={styles.label}>
              Slug (opcional)
              <input
                className={styles.input}
                value={typeSlug}
                onChange={(e) => setTypeSlug(e.target.value)}
                placeholder="auto a partir do nome"
              />
            </label>
            <label className={styles.label}>
              Cor da borda
              <span className={styles.colorRow}>
                <input
                  type="color"
                  className={styles.color}
                  value={typeColor.length === 7 ? typeColor : '#888888'}
                  onChange={(e) => setTypeColor(e.target.value)}
                />
                <input
                  className={styles.input}
                  value={typeColor}
                  onChange={(e) => setTypeColor(e.target.value)}
                  pattern="^#[0-9A-Fa-f]{6}$"
                  title="#RRGGBB"
                  placeholder="#EE8130"
                />
              </span>
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary}>
              {editingTypeId ? 'Salvar tipo' : 'Adicionar tipo'}
            </button>
            {editingTypeId && (
              <button type="button" className={styles.btnGhost} onClick={resetTypeForm}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Cor</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {types.map((t) => (
                <tr key={t.id}>
                  <td>{t.name}</td>
                  <td>
                    <code>{t.slug}</code>
                  </td>
                  <td>
                    <span className={styles.swatch} style={{ background: t.borderColor }} />
                    <code>{t.borderColor}</code>
                  </td>
                  <td className={styles.tdActions}>
                    <button type="button" className={styles.btnSm} onClick={() => startEditType(t)}>
                      Editar
                    </button>
                    <button type="button" className={styles.btnSmDanger} onClick={() => removeType(t.id)}>
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className={styles.section}>
        <h2 className={styles.h2}>Pokémon</h2>
        <p className={styles.help}>
          Envie um GIF (ou PNG/WebP) pelo botão de upload — o caminho será preenchido como{' '}
          <code>/assets/…</code>. Você também pode copiar GIFs para a pasta <code>assets</code> e
          colar o caminho manualmente.
        </p>

        <form className={styles.form} onSubmit={submitPokemon}>
          {editingPokeId && (
            <p className={styles.help} style={{ marginTop: 0 }}>
              Editando: <strong>{pName || `#${dexNum}`}</strong>
            </p>
          )}
          <div className={styles.row}>
            <label className={styles.label}>
              Nº Pokédex
              <input
                type="number"
                min={1}
                className={styles.input}
                value={dexNum}
                onChange={(e) => setDexNum(Number(e.target.value))}
                required
              />
            </label>
            <label className={styles.labelWide}>
              Nome
              <input
                className={styles.input}
                value={pName}
                onChange={(e) => setPName(e.target.value)}
                placeholder="Nome do Pokémon"
                required
              />
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.labelWide}>
              URL do GIF <span className={styles.muted}>(deve começar com /assets/)</span>
              <input
                className={styles.input}
                value={gifUrl}
                onChange={(e) => setGifUrl(e.target.value)}
                placeholder="/assets/meu-pokemon.gif"
                required
              />
            </label>
            <label className={styles.label}>
              Upload
              <input
                type="file"
                accept="image/gif,image/png,image/jpeg,image/webp"
                className={styles.file}
                onChange={onUpload}
                disabled={uploading}
              />
              {uploading && <span className={styles.muted}> Enviando…</span>}
            </label>
          </div>
          <div className={styles.row}>
            <label className={styles.label}>
              Tipo primário
              <select
                className={styles.select}
                value={primaryId}
                onChange={(e) => setPrimaryId(e.target.value)}
                required
              >
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Tipo secundário
              <select
                className={styles.select}
                value={secondaryId}
                onChange={(e) => setSecondaryId(e.target.value)}
              >
                <option value="">Nenhum</option>
                {types.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </label>
            <label className={styles.label}>
              Raridade
              <span className={styles.muted} style={{ display: 'inline-flex', gap: '0.45rem', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={isLegendary}
                  onChange={(e) => setIsLegendary(e.target.checked)}
                />
                Lendário / mítico
              </span>
            </label>
          </div>
          <div className={styles.actions}>
            <button type="submit" className={styles.btnPrimary}>
              {editingPokeId ? 'Salvar Pokémon' : 'Adicionar Pokémon'}
            </button>
            {editingPokeId && (
              <button type="button" className={styles.btnGhost} onClick={resetPokeForm}>
                Cancelar edição
              </button>
            )}
          </div>
        </form>

        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Nome</th>
                <th>GIF</th>
                <th>Tipos</th>
                <th>Raro</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {pokemon.map((p) => (
                <tr key={p.id}>
                  <td>#{String(p.pokedexNumber).padStart(3, '0')}</td>
                  <td>{p.name}</td>
                  <td>
                    <code className={styles.clip}>{p.gifUrl}</code>
                  </td>
                  <td>
                    {p.primaryType?.name}
                    {p.secondaryType ? ` / ${p.secondaryType.name}` : ''}
                  </td>
                  <td>{p.isLegendary ? '⭐' : '—'}</td>
                  <td className={styles.tdActions}>
                    <button type="button" className={styles.btnSm} onClick={() => startEditPokemon(p)}>
                      Editar
                    </button>
                    <button
                      type="button"
                      className={styles.btnSmDanger}
                      onClick={() => removePokemon(p.id)}
                    >
                      Excluir
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {!pokemon.length && (
            <p className={styles.empty}>Nenhum Pokémon cadastrado ainda.</p>
          )}
        </div>
      </section>
    </div>
  )
}
