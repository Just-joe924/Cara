import type { BlogPost } from '../types'

const EXCERPT =
  'Kickstarter man braid godard coloring book. Raclette waistcoat selfies yr wolf ' +
  'chartreuse hexagon irony, godard...'

export const blogPosts: BlogPost[] = [
  { id: 1, title: 'The Cotton-Jersey Zip-Up Hoodies', excerpt: EXCERPT, image: '/img/blog/b1.jpg', date: '13/01' },
  { id: 2, title: 'Must-Have Skater Girl Items', excerpt: EXCERPT, image: '/img/blog/b2.jpg', date: '13/04' },
  { id: 3, title: 'The Weekender Trends of 2024', excerpt: EXCERPT, image: '/img/blog/b3.jpg', date: '12/01' },
  { id: 4, title: 'Runway-Inspired Trends', excerpt: EXCERPT, image: '/img/blog/b4.jpg', date: '16/01' },
  { id: 5, title: 'AW20 Menswear Trends', excerpt: EXCERPT, image: '/img/blog/b6.jpg', date: '10/03' },
]
