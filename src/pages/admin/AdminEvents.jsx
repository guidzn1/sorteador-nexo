import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from 'firebase/firestore'
import { db } from '../../firebaseClient'
import { formatDateTime, slugify } from '../../lib/utils'

export default function AdminEvents() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [name, setName] = useState('')
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [slugTouched, setSlugTouched] = useState(false)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [copiedId, setCopiedId] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  async function loadEvents() {
    setLoading(true)
    try {
      const snap = await getDocs(collection(db, 'events'))
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
      list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setEvents(list)
    } catch (err) {
      console.error(err)
      setError('Erro ao carregar sorteios.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadEvents()
  }, [])

  function handleNameChange(value) {
    setName(value)
    if (!slugTouched) setSlug(slugify(value))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setError('')

    const finalSlug = slugify(slug)

    if (!name.trim() || !finalSlug) {
      setError('Preencha o nome e o link do sorteio.')
      return
    }

    setSaving(true)

    try {
      const eventRef = doc(db, 'events', finalSlug)
      const existing = await getDoc(eventRef)

      if (existing.exists()) {
        setError('Já existe um sorteio com esse link.')
        return
      }

      await setDoc(eventRef, {
        name: name.trim(),
        slug: finalSlug,
        description: description.trim() || null,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      })

      setName('')
      setSlug('')
      setDescription('')
      setSlugTouched(false)
      setShowForm(false)
      await loadEvents()
    } catch (err) {
      console.error(err)
      setError('Erro ao criar sorteio.')
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(ev) {
    setError('')

    try {
      await updateDoc(doc(db, 'events', ev.id), {
        active: !ev.active,
        updatedAt: serverTimestamp(),
      })
      await loadEvents()
    } catch (err) {
      console.error(err)
      setError('Erro ao alterar status do sorteio.')
    }
  }

  async function deleteEvent(ev) {
    const confirmed = window.confirm(
      `Excluir o sorteio "${ev.name}"?\n\nIsso remove o sorteio, participantes e histórico de vencedores. Essa ação não pode ser desfeita.`
    )

    if (!confirmed) return

    setError('')
    setDeletingId(ev.id)

    try {
      const participantsSnap = await getDocs(collection(db, 'events', ev.id, 'participants'))
      const winnersSnap = await getDocs(collection(db, 'events', ev.id, 'winners'))

      await Promise.all([
        ...participantsSnap.docs.map((item) =>
          deleteDoc(doc(db, 'events', ev.id, 'participants', item.id))
        ),
        ...winnersSnap.docs.map((item) =>
          deleteDoc(doc(db, 'events', ev.id, 'winners', item.id))
        ),
      ])

      await deleteDoc(doc(db, 'events', ev.id))
      await loadEvents()
    } catch (err) {
      console.error(err)
      setError('Erro ao excluir sorteio.')
    } finally {
      setDeletingId(null)
    }
  }

  function copyLink(ev) {
    const url = `${window.location.origin}/s/${ev.id}`
    navigator.clipboard.writeText(url)
    setCopiedId(ev.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold">Sorteios</h1>
          <p className="mt-1 text-sm text-muted">Crie, encerre, exclua e gerencie os sorteios da Nexo.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowForm((s) => !s)}
          className="rounded-xl bg-blue px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide transition hover:bg-blue-dim"
        >
          {showForm ? 'Cancelar' : 'Novo sorteio'}
        </button>
      </div>

      {error && (
        <div className="mt-5 rounded-2xl border border-blue/25 bg-blue/10 px-4 py-3 text-sm text-blue-dim">
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mt-6 space-y-4 rounded-2xl border border-border bg-card p-6 shadow-2xl shadow-black/10"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-muted">Nome do sorteio</span>
              <input
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ex: Sorteio Camisa Nexo Julho"
                className="w-full rounded-xl border border-border bg-elevated px-4 py-3 focus:border-blue focus:outline-none focus:ring-4 focus:ring-blue/15"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-muted">Link personalizado</span>
              <div className="flex items-center rounded-xl border border-border bg-elevated px-4 py-3 focus-within:border-blue focus-within:ring-4 focus-within:ring-blue/15">
                <span className="shrink-0 text-sm text-muted">/s/</span>
                <input
                  value={slug}
                  onChange={(e) => {
                    setSlugTouched(true)
                    setSlug(slugify(e.target.value))
                  }}
                  placeholder="camisa-julho"
                  className="w-full bg-transparent outline-none"
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="mb-2 block text-sm font-medium text-muted">Descrição (opcional)</span>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Ex: concorra a uma camisa oficial da Nexo."
              className="w-full rounded-xl border border-border bg-elevated px-4 py-3 focus:border-blue focus:outline-none focus:ring-4 focus:ring-blue/15"
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-blue px-6 py-3 font-display text-sm font-semibold uppercase tracking-wide transition hover:bg-blue-dim disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Criando...' : 'Criar sorteio'}
          </button>
        </form>
      )}

      <div className="mt-8 space-y-3">
        {loading && <p className="text-muted">Carregando...</p>}

        {!loading && events.length === 0 && (
          <div className="rounded-2xl border border-border bg-card p-6 text-muted">
            Nenhum sorteio criado ainda.
          </div>
        )}

        {events.map((ev) => (
          <div
            key={ev.id}
            className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5 shadow-2xl shadow-black/10 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <Link
                  to={`/admin/eventos/${ev.id}`}
                  className="font-display text-lg font-semibold hover:text-blue-dim"
                >
                  {ev.name}
                </Link>

                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    ev.active ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
                  }`}
                >
                  {ev.active ? 'Ativo' : 'Encerrado'}
                </span>
              </div>

              {ev.description && <p className="mt-1 text-sm text-muted">{ev.description}</p>}

              <p className="mt-2 break-all font-mono text-xs text-muted">
                {window.location.origin}/s/{ev.id}
              </p>
              <p className="mt-1 text-xs text-muted">Criado em {formatDateTime(ev.createdAt)}</p>
            </div>

            <div className="flex flex-wrap gap-2 sm:justify-end">
              <button
                type="button"
                onClick={() => copyLink(ev)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium uppercase tracking-wide transition hover:border-blue hover:text-blue-dim"
              >
                {copiedId === ev.id ? 'Copiado!' : 'Copiar link'}
              </button>

              <button
                type="button"
                onClick={() => toggleActive(ev)}
                className="rounded-lg border border-border px-3 py-2 text-xs font-medium uppercase tracking-wide transition hover:border-blue hover:text-blue-dim"
              >
                {ev.active ? 'Encerrar' : 'Reabrir'}
              </button>

              <Link
                to={`/admin/eventos/${ev.id}`}
                className="rounded-lg bg-blue px-3 py-2 text-xs font-semibold uppercase tracking-wide transition hover:bg-blue-dim"
              >
                Gerenciar
              </Link>

              <button
                type="button"
                onClick={() => deleteEvent(ev)}
                disabled={deletingId === ev.id}
                className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-red-300 transition hover:border-red-300 hover:bg-red-400/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {deletingId === ev.id ? 'Excluindo...' : 'Excluir'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}