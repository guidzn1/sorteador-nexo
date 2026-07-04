import { useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebaseClient'
import { isValidBrazilWhatsapp, normalizeWhatsapp } from '../lib/utils'

const SPORTS = [
  'Futebol',
  'Vôlei',
  'Basquete',
  'Corrida',
  'Ciclismo',
  'Natação',
  'Jiu-Jitsu / MMA',
  'Musculação / Crossfit',
  'Outra',
]

const initialState = {
  full_name: '',
  whatsapp: '',
  instagram: '',
  sport: SPORTS[0],
}

export default function ParticipantForm({ eventSlug }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | duplicate | error

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }))
    setErrors((e) => ({ ...e, [field]: null }))
    if (status !== 'idle') setStatus('idle')
  }

  function validate() {
    const next = {}
    if (!form.full_name.trim()) next.full_name = 'Informe seu nome completo.'
    if (!normalizeWhatsapp(form.whatsapp)) next.whatsapp = 'Informe seu WhatsApp.'
    else if (!isValidBrazilWhatsapp(form.whatsapp)) next.whatsapp = 'Informe um WhatsApp válido com DDD.'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!validate()) return

    setStatus('loading')
    const whatsapp = normalizeWhatsapp(form.whatsapp)
    const participantRef = doc(db, 'events', eventSlug, 'participants', whatsapp)

    try {
      // Não fazemos leitura pública para verificar duplicidade.
      // O documento usa o WhatsApp como ID; se já existir, as regras do Firestore bloqueiam.
      await setDoc(participantRef, {
        fullName: form.full_name.trim(),
        whatsapp,
        instagram: form.instagram.trim() || null,
        sport: form.sport,
        createdAt: serverTimestamp(),
      })

      setForm(initialState)
      setStatus('success')
    } catch (err) {
      if (err.code === 'permission-denied') {
        setStatus('duplicate')
      } else {
        console.error(err)
        setStatus('error')
      }
    }
  }

  if (status === 'success') {
    return (
      <div className="rounded-2xl border border-success/30 bg-success/10 p-8 text-center">
        <p className="font-display text-xl font-semibold text-success">Cadastro confirmado!</p>
        <p className="mt-2 text-muted">Boa sorte no sorteio.</p>
      </div>
    )
  }

  if (status === 'duplicate') {
    return (
      <div className="rounded-2xl border border-blue/30 bg-blue/10 p-8 text-center">
        <p className="font-display text-xl font-semibold text-blue-dim">
          Você já está participando desse sorteio.
        </p>
        <button
          onClick={() => setStatus('idle')}
          className="mt-4 text-sm text-muted underline underline-offset-4 hover:text-ink"
        >
          Voltar ao formulário
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <Field label="Nome completo" required error={errors.full_name}>
        <input
          type="text"
          value={form.full_name}
          onChange={(e) => update('full_name', e.target.value)}
          placeholder="Seu nome e sobrenome"
          className={inputClass(errors.full_name)}
          autoComplete="name"
        />
      </Field>

      <Field label="WhatsApp" required error={errors.whatsapp}>
        <input
          type="tel"
          value={form.whatsapp}
          onChange={(e) => update('whatsapp', e.target.value)}
          placeholder="(00) 00000-0000"
          className={inputClass(errors.whatsapp)}
          autoComplete="tel"
        />
      </Field>

      <Field label="Instagram">
        <input
          type="text"
          value={form.instagram}
          onChange={(e) => update('instagram', e.target.value)}
          placeholder="@seuusuario"
          className={inputClass()}
          autoComplete="off"
        />
      </Field>

      <Field label="Modalidade esportiva">
        <select
          value={form.sport}
          onChange={(e) => update('sport', e.target.value)}
          className={inputClass()}
        >
          {SPORTS.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </Field>

      {status === 'error' && (
        <p className="text-sm text-blue-dim">
          Não foi possível concluir o cadastro. Tente novamente em instantes.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full rounded-xl bg-blue py-4 font-display font-semibold uppercase tracking-wide text-ink transition hover:bg-blue-dim disabled:opacity-60"
      >
        {status === 'loading' ? 'Enviando...' : 'Participar do sorteio'}
      </button>
    </form>
  )
}

function Field({ label, required, error, children }) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-medium text-muted">
        {label} {required && <span className="text-blue-dim">*</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-blue-dim">{error}</span>}
    </label>
  )
}

function inputClass(error) {
  return [
    'w-full rounded-xl border bg-elevated px-4 py-3 text-ink placeholder:text-muted/60',
    'focus:border-blue focus:outline-none focus:ring-1 focus:ring-blue',
    error ? 'border-blue-dim' : 'border-border',
  ].join(' ')
}
