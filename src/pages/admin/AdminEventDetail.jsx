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
  const [lastWinner, setLastWinner] = useState(null)
  const [drawError, setDrawError] = useState('')

  async function loadAll() {
    setLoading(true)
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

    setLoading(false)
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
      return nameMatch || waMatch
    })
  }, [participants, search])

  async function removeParticipant(participantId) {
    if (!window.confirm('Remover este participante do sorteio?')) return
    await deleteDoc(doc(db, 'events', slug, 'participants', participantId))
    loadAll()
  }

  async function drawWinner() {
    setDrawError('')
    if (participants.length === 0) {
      setDrawError('Não há participantes cadastrados para sortear.')
      return
    }
    if (!window.confirm(`Sortear um vencedor entre ${participants.length} participantes?`)) return

    setDrawing(true)
    try {
      const winner = participants[Math.floor(Math.random() * participants.length)]

      const winnerDoc = await addDoc(collection(db, 'events', slug, 'winners'), {
        participantId: winner.id,
        fullName: winner.fullName,
        whatsapp: winner.whatsapp,
        instagram: winner.instagram || null,
        sport: winner.sport || null,
        drawnAt: serverTimestamp(),
      })

      setLastWinner({ ...winner, drawnAt: { seconds: Date.now() / 1000 }, docId: winnerDoc.id })
      loadAll()
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
          <h1 className="font-display text-2xl font-bold">{event.name}</h1>
          <p className="font-mono text-xs text-muted">
            {window.location.origin}/s/{event.id}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card px-5 py-3 text-center">
          <p className="font-display text-3xl font-bold text-blue-dim">{participants.length}</p>
          <p className="text-xs uppercase tracking-wide text-muted">Participantes</p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="font-display text-lg font-semibold">Participantes</h2>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou WhatsApp"
              className="w-full max-w-xs rounded-xl border border-border bg-elevated px-4 py-2.5 text-sm focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
            />
          </div>

          <div className="mt-4 overflow-hidden rounded-2xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-elevated text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-4 py-3">Nome</th>
                  <th className="px-4 py-3">WhatsApp</th>
                  <th className="px-4 py-3">Instagram</th>
                  <th className="px-4 py-3">Modalidade</th>
                  <th className="px-4 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-6 text-center text-muted">
                      Nenhum participante encontrado.
                    </td>
                  </tr>
                )}
                {filtered.map((p) => (
                  <tr key={p.id} className="border-t border-border">
                    <td className="px-4 py-3">{p.fullName}</td>
                    <td className="px-4 py-3 font-mono">{formatWhatsappDisplay(p.whatsapp)}</td>
                    <td className="px-4 py-3 text-muted">{p.instagram || '—'}</td>
                    <td className="px-4 py-3 text-muted">{p.sport || '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <button
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

        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <h2 className="font-display text-lg font-semibold">Sortear vencedor</h2>
            <p className="mt-1 text-sm text-muted">
              Escolhe aleatoriamente um participante cadastrado neste sorteio.
            </p>
            <button
              onClick={drawWinner}
              disabled={drawing}
              className="mt-4 w-full rounded-xl bg-blue py-3 font-display font-semibold uppercase tracking-wide disabled:opacity-60"
            >
              {drawing ? 'Sorteando...' : 'Sortear vencedor'}
            </button>
            {drawError && <p className="mt-3 text-sm text-blue-dim">{drawError}</p>}

            {lastWinner && (
              <div className="mt-5 rounded-xl border border-success/30 bg-success/10 p-4 text-left">
                <p className="text-xs uppercase tracking-wide text-success">Vencedor sorteado</p>
                <p className="mt-1 font-display font-semibold">{lastWinner.fullName}</p>
                <p className="font-mono text-sm text-muted">
                  {formatWhatsappDisplay(lastWinner.whatsapp)}
                </p>
                <p className="text-sm text-muted">{lastWinner.instagram || '—'}</p>
                <p className="text-sm text-muted">{lastWinner.sport || '—'}</p>
                <p className="mt-2 text-xs text-muted">{formatDateTime(lastWinner.drawnAt)}</p>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-lg font-semibold">Histórico de sorteios</h2>
            <div className="mt-3 space-y-3">
              {winners.length === 0 && <p className="text-sm text-muted">Nenhum sorteio realizado ainda.</p>}
              {winners.map((w) => (
                <div key={w.id} className="border-t border-border pt-3 first:border-0 first:pt-0">
                  <p className="font-display font-semibold">{w.fullName}</p>
                  <p className="font-mono text-xs text-muted">
                    {formatWhatsappDisplay(w.whatsapp)} · {w.instagram || '—'} · {w.sport || '—'}
                  </p>
                  <p className="text-xs text-muted">{formatDateTime(w.drawnAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
