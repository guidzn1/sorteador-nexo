import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../firebaseClient'
import Logo from '../components/Logo'

export default function Home() {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      try {
        const q = query(collection(db, 'events'), where('active', '==', true))
        const snap = await getDocs(q)
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        list.sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
        setEvents(list)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-base bg-lane-lines">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Logo />
        <Link
          to="/admin/login"
          className="text-xs font-medium uppercase tracking-widest text-muted hover:text-ink"
        >
          Área da equipe
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-6 pb-24 pt-8 text-center">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-6xl">
          Sorteios <span className="text-blue-dim">Nexo</span>
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-muted">
          Cadastre-se com um clique nos sorteios do grupo de atletas Nexo. Cada sorteio
          tem seu próprio link — basta preencher seus dados uma única vez para concorrer.
        </p>

        <div className="mt-12 space-y-4 text-left">
          {loading && <p className="text-center text-muted">Carregando sorteios...</p>}

          {!loading && events.length === 0 && (
            <div className="rounded-2xl border border-border bg-card p-8 text-center text-muted">
              Nenhum sorteio aberto no momento. Fique de olho nas redes da Nexo!
            </div>
          )}

          {events.map((ev) => (
            <Link
              key={ev.id}
              to={`/s/${ev.id}`}
              className="block rounded-2xl border border-border bg-card p-6 transition hover:border-blue/50 hover:bg-elevated"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="font-display text-lg font-semibold">{ev.name}</p>
                  {ev.description && (
                    <p className="mt-1 text-sm text-muted">{ev.description}</p>
                  )}
                </div>
                <span className="shrink-0 rounded-full bg-blue px-4 py-2 font-display text-sm font-semibold uppercase tracking-wide">
                  Participar
                </span>
              </div>
            </Link>
          ))}
        </div>
      </main>
    </div>
  )
}
