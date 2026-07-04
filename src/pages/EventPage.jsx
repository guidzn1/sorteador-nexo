import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { doc, getDoc } from 'firebase/firestore'
import { db } from '../firebaseClient'
import Logo from '../components/Logo'
import ParticipantForm from '../components/ParticipantForm'

export default function EventPage() {
  const { slug } = useParams()
  const [event, setEvent] = useState(null)
  const [loadState, setLoadState] = useState('loading') // loading | found | not-found

  useEffect(() => {
    let active = true
    async function load() {
      try {
        const snap = await getDoc(doc(db, 'events', slug))
        if (!active) return
        if (!snap.exists() || snap.data().active !== true) {
          setLoadState('not-found')
        } else {
          setEvent({ id: snap.id, ...snap.data() })
          setLoadState('found')
        }
      } catch (err) {
        console.error(err)
        if (active) setLoadState('not-found')
      }
    }
    load()
    return () => {
      active = false
    }
  }, [slug])

  return (
    <div className="relative min-h-screen bg-base bg-lane-lines">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-8">
        <Link to="/">
          <Logo />
        </Link>
      </header>

      <main className="mx-auto flex max-w-md flex-col px-6 pb-20 pt-6">
        {loadState === 'loading' && (
          <p className="text-center text-muted">Carregando sorteio...</p>
        )}

        {loadState === 'not-found' && (
          <div className="rounded-2xl border border-border bg-card p-8 text-center">
            <p className="font-display text-xl font-semibold">Sorteio não encontrado</p>
            <p className="mt-2 text-muted">
              Este link pode ter expirado ou o sorteio já foi encerrado.
            </p>
          </div>
        )}

        {loadState === 'found' && (
          <>
            <div className="mb-8 text-center">
              <span className="mb-3 inline-block rounded-full border border-blue/30 bg-blue/10 px-3 py-1 font-mono text-xs uppercase tracking-widest text-blue-dim">
                Inscrições abertas
              </span>
              <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
                Sorteios <span className="text-blue-dim">Nexo</span>
              </h1>
              <p className="mt-2 font-display text-lg text-muted">{event.name}</p>
              {event.description && (
                <p className="mt-3 text-sm text-muted">{event.description}</p>
              )}
              <p className="mt-4 text-sm text-muted">
                Preencha seus dados apenas uma vez para concorrer. Não é necessário se
                cadastrar novamente — um cadastro por atleta garante sua vaga no sorteio.
              </p>
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 sm:p-8">
              <ParticipantForm eventSlug={event.id} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}
