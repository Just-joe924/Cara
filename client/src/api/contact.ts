const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:4000'

export interface ContactInput {
  name: string
  email: string
  subject: string
  message: string
}

/** Send a contact-form message to the site owner's inbox. No auth required. */
export async function sendContactMessage(input: ContactInput): Promise<void> {
  const res = await fetch(`${API_URL}/api/contact`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(input),
  })
  const json = await res.json().catch(() => ({}))
  if (!res.ok) throw new Error(json.error || 'Could not send your message. Please try again.')
}
