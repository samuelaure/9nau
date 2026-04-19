'use client'

import { TelegramLinkBanner } from '@9nau/ui'

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.9nau.com'
const BOT_USERNAME = process.env.NEXT_PUBLIC_BOT_USERNAME ?? 'zazu_bot'

export function TelegramBannerSlot() {
  return <TelegramLinkBanner apiUrl={API_URL} botUsername={BOT_USERNAME} />
}
