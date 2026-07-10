import { Router, type Request, type Response } from 'express'
import { requireAuth } from '../middleware/auth.js'
import { generateDescription } from '../services/description.js'

export const productsRouter = Router()

/**
 * POST /api/products/describe — auto-generate a product description from the
 * seller's inputs. No external API/keys (see services/description.ts).
 */
productsRouter.post('/describe', requireAuth, (req: Request, res: Response) => {
  const { name, brand, category, condition, features, price } = req.body ?? {}
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'A product name is required' })
  }
  const description = generateDescription({ name, brand, category, condition, features, price })
  return res.json({ description })
})
