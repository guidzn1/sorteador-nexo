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
    <div className="relative min-h-screen overflow-hidden bg-base text-ink">
      <div className="pointer-events-none absolute inset-0 bg-lane-lines opacity-70" />
      <div className="pointer-events-none absolute -left-32 top-[-160px] h-[380px] w-[380px] rounded-full bg-blue/25 blur-[120px]" />
      <div className="pointer-events-none absolute -right-28 top-32 h-[360px] w-[360px] rounded-full bg-blue-dim/15 blur-[120px]" />
      <div className="pointer-events-none absolute bottom-[-120px] left-1/2 h-[360px] w-[680px] -translate-x-1/2 rounded-full bg-blue-deep/20 blur-[120px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
        <Link to="/" aria-label="Voltar para a página inicial">
          <Logo />
        </Link>

        <span className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted backdrop-blur-xl">
          Nexo
        </span>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-20 pt-4 sm:pt-8">
        {loadState === 'loading' && (
          <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mx-auto h-12 w-12 rounded-full border border-blue/30 bg-blue/10 dot-pulse" />
            <p className="mt-5 font-display text-lg font-semibold">Carregando sorteio...</p>
            <p className="mt-2 text-sm text-muted">Estamos verificando as inscrições.</p>
          </div>
        )}

        {loadState === 'not-found' && (
          <div className="mx-auto max-w-md rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center shadow-2xl shadow-black/20 backdrop-blur-xl">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-2xl">
              !
            </div>

            <p className="mt-5 font-display text-2xl font-bold">Sorteio não encontrado</p>

            <p className="mt-3 leading-6 text-muted">
              Este sorteio pode ter sido encerrado ou não está mais disponível.
            </p>

            <Link
              to="/"
              className="mt-6 inline-flex items-center justify-center rounded-2xl bg-blue px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide transition hover:bg-blue-dim"
            >
              Voltar para o início
            </Link>
          </div>
        )}

        {loadState === 'found' && (
          <section className="grid items-center gap-8 lg:grid-cols-[0.95fr_1.05fr]">
            <div className="text-center lg:text-left">
              <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue/25 bg-blue/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-dim lg:mx-0">
                <span className="h-2 w-2 rounded-full bg-success dot-pulse" />
                Inscrições abertas
              </div>

              <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
                Você está concorrendo no sorteio da Nexo.
              </h1>

              <div className="mt-6 rounded-[2rem] border border-white/10 bg-white/[0.05] p-5 shadow-2xl shadow-black/10 backdrop-blur-xl">
                <p className="text-sm font-semibold uppercase tracking-[0.22em] text-blue-dim">
                  Sorteio
                </p>

                <h2 className="mt-2 font-display text-2xl font-bold tracking-[-0.03em]">
                  {event.name}
                </h2>

                {event.description && (
                  <p className="mt-3 text-sm leading-6 text-muted">{event.description}</p>
                )}
              </div>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <InfoCard number="1" title="Preencha" text="Informe seus dados principais." />
                <InfoCard number="2" title="Confirme" text="Envie sua participação." />
                <InfoCard number="3" title="Aguarde" text="O resultado sai pela Nexo." />
              </div>
            </div>

            <div className="mx-auto w-full max-w-xl">
              <div className="relative">
                <div className="absolute inset-0 rotate-3 rounded-[2.5rem] bg-blue/15 blur-2xl" />

                <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-5">
                  <div className="rounded-[2rem] border border-white/10 bg-base/80 p-5 sm:p-7">
                    <div className="mb-6 flex items-start justify-between gap-4">
                      <div>
                        <p className="font-display text-2xl font-bold tracking-[-0.03em]">
                          Participar do sorteio
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          Complete o cadastro abaixo para confirmar sua participação.
                        </p>
                      </div>

                      <div className="hidden h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-blue/15 font-display font-bold text-blue-dim sm:flex">
                        ↗
                      </div>
                    </div>

                    <ParticipantForm eventSlug={event.id} />
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  )
}

function InfoCard({ number, title, text }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4 text-left backdrop-blur-xl">
      <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue/15 font-display font-bold text-blue-dim">
        {number}
      </div>
      <p className="mt-3 font-display font-semibold">{title}</p>
      <p className="mt-1 text-sm leading-5 text-muted">{text}</p>
    </div>
  )
}