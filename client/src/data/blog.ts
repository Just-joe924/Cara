import type { BlogPost } from '../types'

// Each excerpt is written to the photo beside it — if you swap an image, rewrite
// the copy with it.
export const blogPosts: BlogPost[] = [
  {
    id: 1,
    title: 'Sheer, Styled Simply',
    excerpt:
      'A black chiffon top with a tie-back opening does all the work on its own — the detail sits at the nape, so the back becomes the feature. Keep hair off the neck, skip the necklace, and let the fabric do the talking.',
    image: '/img/blog/b1.jpg',
    date: '13/01',
  },
  {
    id: 2,
    title: 'Black and Camel, Nothing Else',
    excerpt:
      'Two colours are enough for a full wardrobe. A sharp black jacket next to a soft camel blouse reads considered rather than plain, and every piece you own suddenly works with every other one.',
    image: '/img/blog/b2.jpg',
    date: '13/04',
  },
  {
    id: 3,
    title: 'Inside the Shops on Cara',
    excerpt:
      'Behind every listing is a real shop with real rails — folded knits on the table, the season hanging in colour order. Choose pay-on-pickup at checkout and you walk in, see it in person, and pay at the counter.',
    image: '/img/blog/b3.jpg',
    date: '12/01',
  },
  {
    id: 4,
    title: 'Grey-on-Grey, Off Duty',
    excerpt:
      'Soft marl knits over cuffed joggers, finished with chunky sandals — the outfit you can actually move in. It is the easiest way to look put together on a day you are not trying to.',
    image: '/img/blog/b4.jpg',
    date: '16/01',
  },
  {
    id: 5,
    title: 'Dressing for Harmattan',
    excerpt:
      'The season turns dry, the mornings turn cold, and the heavy knit finally earns its place. Layer a chunky sleeve over something light, keep a warm drink close, and let the dust settle.',
    image: '/img/blog/b6.jpg',
    date: '10/03',
  },
]
