import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-base px-6 text-center">
      <p className="font-display text-3xl font-bold">Página não encontrada</p>
      <Link to="/" className="mt-4 text-blue-dim underline underline-offset-4">
        Voltar para o início
      </Link>
    </div>
  )
}
