import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { signInWithEmailAndPassword } from 'firebase/auth'
import { auth } from '../../firebaseClient'
import Logo from '../../components/Logo'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await signInWithEmailAndPassword(auth, email, password)
      navigate('/admin')
    } catch (err) {
      setError('E-mail ou senha inválidos.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base bg-lane-lines px-6">
      <Logo />
      <form
        onSubmit={handleSubmit}
        className="mt-10 w-full max-w-sm space-y-5 rounded-2xl border border-border bg-card p-8"
      >
        <div>
          <h1 className="font-display text-xl font-semibold">Área da equipe</h1>
          <p className="mt-1 text-sm text-muted">Entre para gerenciar os sorteios.</p>
        </div>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">E-mail</span>
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-3 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </label>

        <label className="block">
          <span className="mb-2 block text-sm font-medium text-muted">Senha</span>
          <input
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-border bg-elevated px-4 py-3 focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue"
          />
        </label>

        {error && <p className="text-sm text-blue-dim">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-blue py-3 font-display font-semibold uppercase tracking-wide disabled:opacity-60"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  )
}
