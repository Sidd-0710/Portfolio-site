import { SHARE_CARD_SIZE, shareCard } from '@/lib/shareCard'

export const alt = 'Siddheshwar Chirkute, full-stack developer building AI-powered products'
export const size = SHARE_CARD_SIZE
export const contentType = 'image/png'

export default function OpengraphImage() {
  return shareCard({
    eyebrow: 'Full-stack developer',
    title: ['Siddheshwar', 'Chirkute'],
    subtitle: 'Building AI-powered products',
    footer: 'AutoValue · Signal · Seatly',
  })
}
