export function slugify(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function normalizeWhatsapp(value) {
  let digits = String(value || '').replace(/\D/g, '')

  // Aceita quando a pessoa cola com +55 ou 55 no início.
  // Ex: +55 (94) 99999-9999 -> 94999999999
  if (digits.startsWith('55') && digits.length > 11) {
    digits = digits.slice(2)
  }

  // Limite: DDD com 2 dígitos + celular com 9 dígitos = 11
  return digits.slice(0, 11)
}

export function formatWhatsappInput(value) {
  const digits = normalizeWhatsapp(value)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 7) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`
}

export function isValidBrazilWhatsapp(value) {
  const digits = normalizeWhatsapp(value)

  // DDD + 9 números
  if (digits.length !== 11) return false

  const ddd = digits.slice(0, 2)
  const phone = digits.slice(2)

  // DDD não pode começar com 0
  if (ddd[0] === '0') return false

  // Celular brasileiro deve começar com 9
  if (phone[0] !== '9') return false

  return true
}

export function formatWhatsappDisplay(value) {
  const digits = normalizeWhatsapp(value)

  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }

  return digits || '—'
}

export function formatDateTime(value) {
  if (!value) return '—'

  const date = value?.toDate ? value.toDate() : new Date(value)

  if (Number.isNaN(date.getTime())) return '—'

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(date)
}