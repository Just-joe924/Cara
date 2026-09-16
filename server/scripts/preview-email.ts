/**
 * Render every transactional email to HTML files so the design can be checked
 * in a browser without placing an order or sending anything.
 *
 *   npm run preview:email -w server
 *
 * Files land in server/.email-preview/ (git-ignored). Open them directly.
 */
import { mkdirSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { buildContactMessage, buildOrderReceipt, type ReceiptOrder } from '../src/lib/email.js'

const OUT = join(process.cwd(), '.email-preview')
mkdirSync(OUT, { recursive: true })

const shop = {
  business_name: 'Adunni Fabrics',
  brand_name: 'Adunni',
  address_line: '12 Adeola Odeku Street, Shop B4',
  city: 'Victoria Island',
  state: 'Lagos',
  landmark: 'Opposite Mega Plaza',
  phone: '08031234567',
  phone_alt: '09087654321',
}

const baseOrder: ReceiptOrder = {
  id: 'a1b2c3d4-0000-0000-0000-000000000000',
  user_id: 'user-1',
  status: 'paid',
  total_amount: 78500,
  created_at: new Date().toISOString(),
  payment_method: 'online',
  fulfilment: 'delivery',
  payment_reference: 'cara_m8x1k2_9f3a7c2b1d04',
  shipping_address: {
    full_name: 'Chidinma Okafor',
    email: 'buyer@example.com',
    phone: '08012345678',
    address: '7 Bode Thomas Street',
    city: 'Surulere',
    state: 'Lagos',
  },
  order_items: [
    { quantity: 1, price_at_purchase: 45000, size: 'US M · UK 12', products: { name: 'Adire Wrap Dress', sellers: shop } },
    { quantity: 2, price_at_purchase: 16750, size: null, products: { name: 'Handwoven Aso-Oke Clutch', sellers: shop } },
  ],
}

const pickupOrder: ReceiptOrder = {
  ...baseOrder,
  status: 'pending',
  payment_method: 'pickup',
  fulfilment: 'pickup',
  payment_reference: null,
}

const previews: Array<[string, { subject: string; html: string }]> = [
  ['receipt-paid-online.html', buildOrderReceipt(baseOrder, 'Chidinma')],
  ['receipt-pay-on-pickup.html', buildOrderReceipt(pickupOrder, 'Chidinma')],
  [
    'contact-message.html',
    buildContactMessage({
      name: 'Tunde Bakare',
      email: 'tunde@example.com',
      subject: 'Question about bulk orders',
      message:
        'Hello,\n\nI run a boutique in Ibadan and would like to order 20 pieces of the Adire wrap dress.\n\nDo you offer wholesale pricing?\n\nThanks,\nTunde',
    }),
  ],
]

for (const [file, { subject, html }] of previews) {
  writeFileSync(join(OUT, file), html, 'utf8')
  console.log(`${file}  —  ${subject}`)
}

console.log(`\n${previews.length} previews written to ${OUT}`)
