import type { NextFunction, Request, Response } from 'express'
import { supabaseAdmin } from '../lib/supabaseAdmin.js'

/**
 * Validates the `Authorization: Bearer <jwt>` header against Supabase Auth and
 * attaches the resolved user to `req.user`. Responds 401 when missing/invalid.
 */
export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  req.user = data.user
  next()
}

/**
 * Like {@link requireAuth}, but additionally requires the resolved user to have
 * the `admin` role in `public.profiles`. Responds 403 otherwise. Enforcing this
 * server-side (not just hiding the URL) is what actually protects the admin API.
 */
export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null

  if (!token) {
    return res.status(401).json({ error: 'Missing bearer token' })
  }

  const { data, error } = await supabaseAdmin.auth.getUser(token)
  if (error || !data.user) {
    return res.status(401).json({ error: 'Invalid or expired session' })
  }

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('role')
    .eq('id', data.user.id)
    .maybeSingle()

  if (profile?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' })
  }

  req.user = data.user
  next()
}
