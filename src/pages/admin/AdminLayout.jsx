import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebaseClient'
import Logo from '../../components/Logo'

export default function AdminLayout() {
  const [user, setUser] = useState(undefined)
  const [adminState, setAdminState] = useState('checking')
  const navigate = useNavigate()

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (u) => {
      setUser(u)

      if (!u) {
        setAdminState('checking')
        return
      }

      try {
        const adminSnap = await getDoc(doc(db, 'admins', u.uid))
        setAdminState(adminSnap.exists() ? 'allowed' : 'denied')
      } catch (err) {
        console.error(err)
        setAdminState('denied')
      }
    })

    return unsubscribe
  }, [])

  useEffect(() => {
    if (user === null) navigate('/admin/login')
  }, [user, navigate])

  async function handleLogout() {
    await signOut(auth)
    navigate('/admin/login')
  }

  if (user === undefined || (user && adminState === 'checking')) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base px-6 text-center text-muted">
        Verificando sessão...
      </div>
    )
  }

  if (user === null) return null

  if (adminState === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base px-4 text-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card p-6 sm:p-8">
          <Logo />

          <h1 className="mt-8 font-display text-xl font-semibold">Acesso não autorizado</h1>

          <p className="mt-2 text-sm text-muted">
            Seu login existe no Firebase, mas seu usuário ainda não foi marcado como admin da Nexo.
          </p>

          <p className="mt-4 break-all rounded-xl border border-border bg-elevated p-3 font-mono text-xs text-muted">
            UID: {user.uid}
          </p>

          <button
            onClick={handleLogout}
            className="mt-5 w-full rounded-xl bg-blue px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide hover:bg-blue-dim sm:w-auto"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen overflow-x-hidden bg-base text-ink">
      <header className="border-b border-border bg-base/95 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6 sm:py-5">
          <Link to="/admin" className="shrink-0">
            <Logo size="sm" />
          </Link>

          <div className="flex min-w-0 items-center gap-3 sm:gap-6">
            <span className="hidden max-w-[220px] truncate text-sm text-muted sm:block">
              {user.email}
            </span>

            <button
              onClick={handleLogout}
              className="rounded-xl border border-border px-3 py-2 text-xs font-semibold uppercase tracking-wide text-muted transition hover:border-blue hover:text-blue-dim sm:border-0 sm:px-0"
            >
              Sair
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
        <Outlet />
      </main>
    </div>
  )
}