import { useState } from 'react'
import { doc, serverTimestamp, setDoc } from 'firebase/firestore'
import { db } from '../firebaseClient'
import {
  formatWhatsappInput,
  isValidBrazilWhatsapp,
  normalizeWhatsapp,
} from '../lib/utils'

const initialState = {
  full_name: '',
  whatsapp: '',
  instagram: '',
}

export default function ParticipantForm({ eventSlug }) {
  const [form, setForm] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [status, setStatus] = useState('idle') // idle | loading | success | duplicate | error

  function update(field, value) {
    let nextValue = value

    if (field === 'whatsapp') {
      nextValue = formatWhatsappInput(value)
    }

    setForm((f) => ({ ...f, [field]: nextValue }))
    setErrors((e) => ({ ...e, [field]: null }))

    if (status !== 'idle') setStatus('idle')
  }

  function validate() {
    const next = {}
    const whatsappDigits = normalizeWhatsapp(form.whatsapp)

    if (!form.full_name.trim()) {
      next.full_name = 'Informe seu nome completo.'
    }

    if (!whatsappDigits) {
      next.whatsapp = 'Informe seu WhatsApp.'
    } else if (whatsappDigits.length < 11) {
      next.whatsapp = 'Digite o DDD + 9 números.'
    } else if (!isValidBrazilWhatsapp(form.whatsapp)) {
      next.whatsapp = 'WhatsApp inválido.'
    }

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
      await setDoc(participantRef, {
        fullName: form.full_name.trim(),
        whatsapp,
        instagram: form.instagram.trim() || null,
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
      <div className="rounded-[2rem] border border-success/30 bg-success/10 p-8 text-center shadow-2xl shadow-success/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-success/15 text-2xl">
          ✓
        </div>

        <p className="mt-4 font-display text-xl font-semibold text-success">
          Cadastro confirmado!
        </p>

        <p className="mt-2 text-muted">
          Boa sorte no sorteio. Agora é só torcer.
        </p>
      </div>
    )
  }

  if (status === 'duplicate') {
    return (
      <div className="rounded-[2rem] border border-blue/30 bg-blue/10 p-8 text-center shadow-2xl shadow-blue/5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-blue/15 text-2xl">
          i
        </div>

        <p className="mt-4 font-display text-xl font-semibold text-blue-dim">
          Você já está participando do sorteio.
        </p>
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

      <Field
        label="WhatsApp"
        required
        error={errors.whatsapp}
        helper={`${normalizeWhatsapp(form.whatsapp).length}/11 dígitos`}
      >
        <input
          type="tel"
          value={form.whatsapp}
          onChange={(e) => update('whatsapp', e.target.value)}
          placeholder="(94) 99999-9999"
          className={inputClass(errors.whatsapp)}
          autoComplete="tel"
          inputMode="numeric"
          maxLength={15}
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

      {status === 'error' && (
        <p className="rounded-xl border border-blue/25 bg-blue/10 px-4 py-3 text-sm text-blue-dim">
          Não foi possível concluir o cadastro. Tente novamente em instantes.
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-blue px-5 py-4 font-display font-semibold uppercase tracking-wide text-ink shadow-2xl shadow-blue/20 transition hover:-translate-y-0.5 hover:bg-blue-dim disabled:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {status === 'loading' ? 'Enviando...' : 'Participar do sorteio'}
        <span className="transition group-hover:translate-x-1">→</span>
      </button>

      <p className="text-center text-xs leading-relaxed text-muted">
        Seus dados serão usados apenas para identificar sua participação neste sorteio.
      </p>
    </form>
  )
}

function Field({ label, required, error, helper, children }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center justify-between gap-3 text-sm font-medium text-muted">
        <span>
          {label} {required && <span className="text-blue-dim">*</span>}
        </span>

        {error ? (
          <span className="text-right text-xs text-blue-dim">{error}</span>
        ) : helper ? (
          <span className="text-right text-xs text-muted/70">{helper}</span>
        ) : null}
      </span>

      {children}
    </label>
  )
}

function inputClass(error) {
  return [
    'w-full rounded-2xl border bg-elevated/80 px-4 py-4 text-ink placeholder:text-muted/60 shadow-inner shadow-black/10 transition',
    'focus:border-blue focus:bg-elevated focus:outline-none focus:ring-4 focus:ring-blue/15',
    error ? 'border-blue-dim' : 'border-border',
  ].join(' ')
}