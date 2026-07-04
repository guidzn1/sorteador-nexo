import { useEffect, useState } from 'react'
import { Link, Outlet, useNavigate } from 'react-router-dom'
import { onAuthStateChanged, signOut } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../../firebaseClient'
import Logo from '../../components/Logo'

export default function AdminLayout() {
  const [user, setUser] = useState(undefined) // undefined = checking, null = logged out
  const [adminState, setAdminState] = useState('checking') // checking | allowed | denied
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
      <div className="flex min-h-screen items-center justify-center bg-base text-muted">
        Verificando sessão...
      </div>
    )
  }

  if (user === null) return null

  if (adminState === 'denied') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base px-6 text-center">
        <div className="max-w-md rounded-2xl border border-border bg-card p-8">
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
            className="mt-5 rounded-xl bg-blue px-5 py-3 font-display text-sm font-semibold uppercase tracking-wide hover:bg-blue-dim"
          >
            Sair
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-base">
      <header className="border-b border-border">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <Link to="/admin">
            <Logo size="sm" />
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-sm text-muted">{user.email}</span>
            <button
              onClick={handleLogout}
              className="text-sm font-medium uppercase tracking-wide text-muted hover:text-blue-dim"
            >
              Sair
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-10">
        <Outlet />
      </main>
    </div>
  )
}
