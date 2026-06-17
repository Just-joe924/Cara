import express from 'express'
import cors from 'cors'
import { env } from './lib/env.js'
import { ordersRouter } from './routes/orders.js'
import { stripeRouter } from './routes/stripe.js'

const app = express()

app.use(cors({ origin: env.CLIENT_ORIGIN }))
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'cara-api' })
})

app.use('/api/orders', ordersRouter)
app.use('/api', stripeRouter)

// Fallback 404 for unknown API routes.
app.use((_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

app.listen(env.PORT, () => {
  console.log(`Cara API listening on http://localhost:${env.PORT}`)
})
