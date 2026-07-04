import { useState } from 'react'

export default function Logo({ size = 'md' }) {
  const [logoError, setLogoError] = useState(false)

  const sizes = {
    sm: 'h-8',
    md: 'h-12',
    lg: 'h-16',
  }

  const fallbackSizes = {
    sm: 'text-xl',
    md: 'text-3xl',
    lg: 'text-5xl',
  }

  if (!logoError) {
    return (
      <img
        src="/logo-nexo.png"
        alt="Nexo"
        onError={() => setLogoError(true)}
        className={`${sizes[size]} w-auto object-contain`}
      />
    )
  }

  return (
    <div className={`inline-flex items-center font-display font-bold tracking-tight ${fallbackSizes[size]}`}>
      <span className="text-ink">NEXO</span>
      <span className="ml-1 h-2 w-2 rounded-full bg-blue dot-pulse" />
    </div>
  )
}
