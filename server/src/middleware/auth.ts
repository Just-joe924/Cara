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
