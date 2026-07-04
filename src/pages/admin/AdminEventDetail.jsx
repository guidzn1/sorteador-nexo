import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
} from 'firebase/firestore'
import { db } from '../../firebaseClient'
import { formatDateTime, formatWhatsappDisplay, normalizeWhatsapp } from '../../lib/utils'

export default function AdminEventDetail() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [participants, setParticipants] = useState([])
  const [winners, setWinners] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [drawing, setDrawing] = useState(false)
  const [lastWinners, setLastWinners] = useState([])
  const [drawCount, setDrawCount] = useState(1)
  const [drawError, setDrawError] = useState('')

  async function loadAll() {
    setLoading(true)

    try {
      const eventRef = doc(db, 'events', slug)
      const [evSnap, partsSnap, winsSnap] = await Promise.all([
        getDoc(eventRef),
        getDocs(collection(db, 'events', slug, 'participants')),
        getDocs(collection(db, 'events', slug, 'winners')),
      ])

      setEvent(evSnap.exists() ? { id: evSnap.id, ...evSnap.data() } : null)

      const parts = partsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      parts.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
      setParticipants(parts)

      const wins = winsSnap.docs.map((d) => ({ id: d.id, ...d.data() }))
      wins.sort((a, b) => (b.drawnAt?.seconds || 0) - (a.drawnAt?.seconds || 0))
      setWinners(wins)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const qDigits = normalizeWhatsapp(search)

    if (!q) return participants

    return participants.filter((p) => {
      const nameMatch = p.fullName?.toLowerCase().includes(q)
      const waMatch = qDigits && p.whatsapp?.includes(qDigits)
      const instagramMatch = p.instagram?.toLowerCase().includes(q)
      return nameMatch || waMatch || instagramMatch
    })
  }, [participants, search])

  const safeDrawCount = Math.min(Math.max(Number(drawCount) || 1, 1), participants.length || 1)

  async function removeParticipant(participantId) {
    if (!window.confirm('Remover este participante do sorteio?')) return

    await deleteDoc(doc(db, 'events', slug, 'participants', participantId))
    await loadAll()
  }

  function getRandomIndex(max) {
    if (window.crypto?.getRandomValues) {
      const array = new Uint32Array(1)
      window.crypto.getRandomValues(array)
      return array[0] % max
    }

    return Math.floor(Math.random() * max)
  }

  function pickRandomParticipants(list, amount) {
    const pool = [...list]
    const selected = []

    while (selected.length < amount && pool.length > 0) {
      const index = getRandomIndex(pool.length)
      selected.push(pool[index])
      pool.splice(index, 1)
    }

    return selected
  }

  async function drawWinners() {
    setDrawError('')
    setLastWinners([])

    if (participants.length === 0) {
      setDrawError('Não há participantes cadastrados para sortear.')
      return
    }

    if (safeDrawCount > participants.length) {
      setDrawError('A quantidade de ganhadores não pode ser maior que a quantidade de participantes.')
      return
    }

    const confirmed = window.confirm(
      `Sortear ${safeDrawCount} ganhador${safeDrawCount > 1 ? 'es' : ''} entre ${participants.length} participante${participants.length > 1 ? 's' : ''}?`
    )

    if (!confirmed) return

    setDrawing(true)

    try {
      const drawGroupId = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
      const selected = pickRandomParticipants(participants, safeDrawCount)

      await Promise.all(
        selected.map((winner, index) =>
          addDoc(collection(db, 'events', slug, 'winners'), {
            drawGroupId,
            drawPosition: index + 1,
            winnersCount: safeDrawCount,
            participantId: winner.id,
            fullName: winner.fullName,
            whatsapp: winner.whatsapp,
            instagram: winner.instagram || null,
            drawnAt: serverTimestamp(),
          })
        )
      )

      setLastWinners(
        selected.map((winner, index) => ({
          ...winner,
          drawGroupId,
          drawPosition: index + 1,
          winnersCount: safeDrawCount,
          drawnAt: { seconds: Date.now() / 1000 },
        }))
      )

      await loadAll()
    } catch (err) {
      console.error(err)
      setDrawError('Erro ao salvar o resultado do sorteio.')
    } finally {
      setDrawing(false)
    }
  }

  if (loading) {
    return <p className="text-muted">Carregando...</p>
  }

  if (!event) {
    return (
      <div>
        <p className="text-muted">Sorteio não encontrado.</p>
        <Link to="/admin" className="mt-2 inline-block text-blue-dim underline underline-offset-4">
          Voltar
        </Link>
      </div>
    )
  }

  return (
    <div>
      <Link to="/admin" className="text-sm text-muted hover:text-ink">
        ← Todos os sorteios
      </Link>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="font-display text-2xl font-bold">{event.name}</h1>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                event.active ? 'bg-success/15 text-success' : 'bg-muted/15 text-muted'
              }`}
            >
              {event.active ? 'Ativo' : 'Encerrado'}
            </span>
          </div>
          <p className="mt-1 break-all font-mono text-xs text-muted">
            {window.location.origin}/s/{event.id}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Metric label="Participantes" value={participants.length} />
          <Metric label="Ganhadores" value={winners.length} />
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold">Participantes</h2>
              <p className="mt-1 text-sm text-muted">Lista de pessoas cadastradas neste sorteio.</p>
            </div>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome, WhatsApp ou Instagram"
              className="w-full max-w-sm rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm focus:border-blue focus:outline-none focus:ring-4 focus:ring-blue/15"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border bg-card">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="bg-elevated text-xs uppercase tracking-wide text-muted">
                  <tr>
                    <th className="px-4 py-3">Nome</th>
                    <th className="px-4 py-3">WhatsApp</th>
                    <th className="px-4 py-3">Instagram</th>
                    <th className="px-4 py-3 text-right">Ação</th>
                  </tr>
                </thead>

                <tbody>
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-center text-muted">
                        Nenhum participante encontrado.
                      </td>
                    </tr>
                  )}

                  {filtered.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="px-4 py-3">{p.fullName}</td>
                      <td className="px-4 py-3 font-mono">{formatWhatsappDisplay(p.whatsapp)}</td>
                      <td className="px-4 py-3 text-muted">{p.instagram || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <button
                          type="button"
                          onClick={() => removeParticipant(p.id)}
                          className="text-xs font-medium uppercase tracking-wide text-muted hover:text-blue-dim"
                        >
                          Remover
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Sortear ganhadores</h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Escolhe aleatoriamente a quantidade definida. Dentro do mesmo clique, a pessoa não se repete.
            </p>

            <label className="mt-5 block">
              <span className="mb-2 block text-sm font-medium text-muted">Quantidade de ganhadores</span>
              <input
                type="number"
                min="1"
                max={Math.max(participants.length, 1)}
                value={drawCount}
                onChange={(e) => setDrawCount(e.target.value)}
                className="w-full rounded-xl border border-border bg-elevated px-4 py-3 focus:border-blue focus:outline-none focus:ring-4 focus:ring-blue/15"
              />
            </label>

            <button
              type="button"
              onClick={drawWinners}
              disabled={drawing || participants.length === 0}
              className="mt-4 w-full rounded-xl bg-blue py-3 font-display font-semibold uppercase tracking-wide transition hover:bg-blue-dim disabled:cursor-not-allowed disabled:opacity-60"
            >
              {drawing ? 'Sorteando...' : `Sortear ${safeDrawCount} ganhador${safeDrawCount > 1 ? 'es' : ''}`}
            </button>

            {drawError && <p className="mt-3 text-sm text-blue-dim">{drawError}</p>}

            {lastWinners.length > 0 && (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4">
                <p className="text-xs uppercase tracking-wide text-success">
                  Último sorteio realizado
                </p>

                <div className="mt-3 space-y-3">
                  {lastWinners.map((winner) => (
                    <div key={winner.id} className="rounded-xl border border-success/20 bg-base/30 p-3">
                      <p className="text-xs text-success">#{winner.drawPosition}</p>
                      <p className="mt-1 font-display font-semibold">{winner.fullName}</p>
                      <p className="font-mono text-sm text-muted">
                        {formatWhatsappDisplay(winner.whatsapp)}
                      </p>
                      <p className="text-sm text-muted">{winner.instagram || '—'}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Histórico de ganhadores</h2>

            <div className="mt-3 space-y-3">
              {winners.length === 0 && (
                <p className="text-sm text-muted">Nenhum sorteio realizado ainda.</p>
              )}

              {winners.map((w) => (
                <div key={w.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-display font-semibold">{w.fullName}</p>
                      <p className="font-mono text-xs text-muted">
                        {formatWhatsappDisplay(w.whatsapp)} · {w.instagram || '—'}
                      </p>
                      <p className="text-xs text-muted">{formatDateTime(w.drawnAt)}</p>
                    </div>

                    {w.drawPosition && (
                      <span className="rounded-full bg-blue/10 px-2 py-1 text-xs font-semibold text-blue-dim">
                        #{w.drawPosition}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function Metric({ label, value }) {
  return (
    <div className="rounded-xl border border-border bg-card px-5 py-3 text-center">
      <p className="font-display text-3xl font-bold text-blue-dim">{value}</p>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
    </div>
  )
}