// Normaliza WhatsApp para impedir duplicidade entre números com e sem +55.
// Exemplo: +55 (94) 99999-9999 e (94) 99999-9999 viram 94999999999.
export function normalizeWhatsapp(value) {
  let digits = String(value || '').replace(/\D/g, '')

  if (digits.startsWith('55') && (digits.length === 12 || digits.length === 13)) {
    digits = digits.slice(2)
  }

  return digits
}

export function isValidBrazilWhatsapp(value) {
  const digits = normalizeWhatsapp(value)
  return digits.length === 10 || digits.length === 11
}

export function formatWhatsappDisplay(digits) {
  const d = normalizeWhatsapp(digits)
  if (d.length === 11) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`
  }
  if (d.length === 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  }
  return d
}

// Aceita: string ISO, objeto Date, ou Firestore Timestamp ({ seconds }) /
// resultado de serverTimestamp() já resolvido pelo SDK.
export function formatDateTime(value) {
  if (!value) return '—'
  let date
  if (typeof value?.toDate === 'function') {
    date = value.toDate()
  } else if (typeof value?.seconds === 'number') {
    date = new Date(value.seconds * 1000)
  } else {
    date = new Date(value)
  }
  if (Number.isNaN(date.getTime())) return '—'
  return date.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function slugify(text) {
  return String(text || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
}
