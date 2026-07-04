import { useEffect, useMemo, useState } from 'react'
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

  const totalEvents = events.length
  const firstEvent = events[0]

  const headline = useMemo(() => {
    if (loading) return 'Carregando sorteios da Nexo...'
    if (totalEvents === 0) return 'Em breve novos sorteios da Nexo.'
    return 'Participe dos sorteios oficiais da Nexo.'
  }, [loading, totalEvents])

  return (
    <div className="relative min-h-screen overflow-hidden bg-base text-ink">
      <div className="pointer-events-none absolute inset-0 bg-lane-lines opacity-60" />
      <div className="pointer-events-none absolute -left-40 top-[-180px] h-[440px] w-[440px] rounded-full bg-blue/25 blur-[130px]" />
      <div className="pointer-events-none absolute -right-36 top-28 h-[420px] w-[420px] rounded-full bg-blue-dim/15 blur-[130px]" />
      <div className="pointer-events-none absolute bottom-[-160px] left-1/2 h-[380px] w-[760px] -translate-x-1/2 rounded-full bg-blue-deep/25 blur-[130px]" />

      <header className="relative z-10 mx-auto flex max-w-6xl items-center justify-between px-6 py-6 sm:py-8">
        <Link to="/" aria-label="Página inicial">
          <Logo />
        </Link>

        <Link
          to="/admin/login"
          className="rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-muted backdrop-blur-xl transition hover:border-blue/50 hover:text-ink"
        >
          Equipe
        </Link>
      </header>

      <main className="relative z-10 mx-auto max-w-6xl px-6 pb-24 pt-4 sm:pt-8">
        <section className="grid min-h-[70vh] items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="text-center lg:text-left">
            <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-blue/25 bg-blue/10 px-4 py-2 text-xs font-semibold uppercase tracking-[0.22em] text-blue-dim lg:mx-0">
              <span className="h-2 w-2 rounded-full bg-success dot-pulse" />
              Sorteios abertos
            </div>

            <h1 className="mt-6 font-display text-5xl font-bold leading-[0.95] tracking-[-0.05em] sm:text-7xl lg:text-8xl">
              {headline}
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg lg:mx-0">
              Escolha o sorteio, preencha seus dados e confirme sua participação em poucos segundos.
            </p>

            <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row lg:justify-start">
              {firstEvent ? (
                <Link
                  to={`/s/${firstEvent.id}`}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-blue px-6 py-4 font-display font-semibold uppercase tracking-wide text-ink shadow-2xl shadow-blue/20 transition hover:-translate-y-0.5 hover:bg-blue-dim sm:w-auto"
                >
                  Participar agora
                  <span className="ml-2">→</span>
                </Link>
              ) : (
                <button
                  type="button"
                  disabled
                  className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-2xl bg-white/10 px-6 py-4 font-display font-semibold uppercase tracking-wide text-muted sm:w-auto"
                >
                  Nenhum sorteio aberto
                </button>
              )}

              <div className="flex w-full items-center justify-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] px-5 py-4 text-sm text-muted backdrop-blur-xl sm:w-auto">
                <span className="font-display text-2xl font-bold text-ink">
                  {loading ? '...' : totalEvents}
                </span>
                {totalEvents === 1 ? 'sorteio disponível' : 'sorteios disponíveis'}
              </div>
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-xl lg:max-w-none">
            <div className="absolute inset-0 rotate-3 rounded-[2.75rem] bg-blue/15 blur-2xl" />

            <div className="relative overflow-hidden rounded-[2.75rem] border border-white/10 bg-white/[0.07] p-4 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-5">
              <div className="rounded-[2.25rem] border border-white/10 bg-base/90 p-5 sm:p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-dim">
                      Disponíveis agora
                    </p>
                    <h2 className="mt-2 font-display text-3xl font-bold tracking-[-0.04em]">
                      Escolha seu sorteio
                    </h2>
                  </div>

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue/15 font-display text-xl font-bold text-blue-dim">
                    ✦
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  {loading && (
                    <>
                      <SkeletonCard />
                      <SkeletonCard />
                    </>
                  )}

                  {!loading && totalEvents === 0 && (
                    <div className="rounded-[2rem] border border-white/10 bg-white/[0.05] p-8 text-center">
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/10 text-2xl text-blue-dim">
                        ✦
                      </div>

                      <p className="mt-4 font-display text-2xl font-bold tracking-[-0.03em]">
                        Nenhum sorteio aberto no momento.
                      </p>

                      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
                        Fique atento ao grupo e às redes oficiais da Nexo.
                      </p>
                    </div>
                  )}

                  {!loading &&
                    events.map((ev, index) => (
                      <Link
                        key={ev.id}
                        to={`/s/${ev.id}`}
                        className="group block rounded-[2rem] border border-yellow-300/25 bg-yellow-400/[0.08] p-5 transition hover:-translate-y-0.5 hover:border-yellow-300/60 hover:bg-yellow-400/[0.14] hover:shadow-2xl hover:shadow-yellow-400/10"
                      >
                        <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 font-display text-lg font-bold text-yellow-950">
                              {String(index + 1).padStart(2, '0')}
                            </div>

                            <div className="min-w-0">
                              <div className="flex flex-wrap items-center gap-2">
                                <p className="font-display text-xl font-semibold tracking-[-0.03em] text-ink">
                                  {ev.name}
                                </p>

                                <span className="rounded-full bg-yellow-400/15 px-3 py-1 text-xs font-semibold text-yellow-200">
                                  aberto
                                </span>
                              </div>

                              {ev.description && (
                                <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                                  {ev.description}
                                </p>
                              )}
                            </div>
                          </div>

                          <span className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-yellow-400 px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide text-yellow-950 transition group-hover:bg-yellow-300">
                            Participar
                            <span className="ml-2 transition group-hover:translate-x-1">→</span>
                          </span>
                        </div>
                      </Link>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

function SkeletonCard() {
  return (
    <div className="rounded-[2rem] border border-yellow-300/10 bg-yellow-400/[0.06] p-5">
      <div className="flex animate-pulse flex-col gap-5 sm:flex-row sm:items-center">
        <div className="h-12 w-12 rounded-2xl bg-yellow-400/20" />

        <div className="flex-1 space-y-3">
          <div className="h-5 w-2/3 rounded-full bg-white/10" />
          <div className="h-4 w-full rounded-full bg-white/10" />
          <div className="h-4 w-1/2 rounded-full bg-white/10" />
        </div>

        <div className="h-11 w-32 rounded-2xl bg-yellow-400/20" />
      </div>
    </div>
  )
}