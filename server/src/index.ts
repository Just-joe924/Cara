import express from 'express'
import cors from 'cors'
import { env } from './lib/env.js'
import { contactRouter } from './routes/contact.js'
import { ordersRouter } from './routes/orders.js'
import { productsRouter } from './routes/products.js'
import { sellerRouter } from './routes/seller.js'
import { adminRouter } from './routes/admin.js'
import { paymentsRouter, paystackWebhookHandler } from './routes/payments.js'

const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN }))

// Trust the proxy so req.ip is the real client address behind a host like
// Render or Vercel — the contact-form rate limit keys on it.
app.set('trust proxy', 1)

// The Paystack webhook must receive the RAW body for signature verification, so
// it is registered before express.json().
app.post('/api/webhooks/paystack', express.raw({ type: 'application/json' }), paystackWebhookHandler)

app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cara-api' })
})

app.use('/api/orders', ordersRouter)
app.use('/api/products', productsRouter)
app.use('/api/seller', sellerRouter)
app.use('/api/admin', adminRouter)
app.use('/api/contact', contactRouter)
app.use('/api', paymentsRouter)

// Fallback 404 for unknown API routes.
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(env.PORT, () => {
  console.log(`Cara API listening on http://localhost:${env.PORT}`)
})
