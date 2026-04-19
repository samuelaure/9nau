'use client'

import * as React from 'react'
import { cn } from '@9nau/ui/lib/utils'

const COOKIE_KEY = 'zazu_banner_dismissed'
const COOKIE_TTL_HOURS = 12

interface TelegramLinkBannerProps {
  /** Base URL of the 9nau API, e.g. "https://api.9nau.com" */
  apiUrl: string
  /** Telegram bot username without @, e.g. "zazu_bot" */
  botUsername: string
  /** localStorage key where the user's JWT access token is stored */
  tokenKey?: string
  className?: string
}

function getDismissedCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split(';').some((c) => c.trim().startsWith(`${COOKIE_KEY}=`))
}

function setDismissedCookie() {
  const expires = new Date(Date.now() + COOKIE_TTL_HOURS * 60 * 60 * 1000).toUTCString()
  document.cookie = `${COOKIE_KEY}=1; expires=${expires}; path=/; SameSite=Lax`
}

export function TelegramLinkBanner({
  apiUrl,
  botUsername,
  tokenKey = 'nau_access_token',
  className,
}: TelegramLinkBannerProps) {
  const [visible, setVisible] = React.useState(false)
  const [loading, setLoading] = React.useState(false)

  React.useEffect(() => {
    if (getDismissedCookie()) return

    const token = localStorage.getItem(tokenKey)
    if (!token) return

    fetch(`${apiUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => r.json())
      .then((user: { telegramId?: string | null }) => {
        if (!user.telegramId) setVisible(true)
      })
      .catch(() => {/* non-critical */})
  }, [apiUrl, tokenKey])

  const handleDismiss = () => {
    setDismissedCookie()
    setVisible(false)
  }

  const handleLink = async () => {
    const token = localStorage.getItem(tokenKey)
    if (!token) return

    setLoading(true)
    try {
      const res = await fetch(`${apiUrl}/api/auth/link-token`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      })
      const { token: linkToken } = (await res.json()) as { token: string }
      window.open(`https://t.me/${botUsername}?start=link-${linkToken}`, '_blank')
    } catch {
      /* no-op */
    } finally {
      setLoading(false)
    }
  }

  if (!visible) return null

  return (
    <div
      className={cn(
        'relative flex items-center justify-between gap-4 px-4 py-3',
        'bg-violet-600 text-white text-sm font-medium',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span>📲</span>
        <span>Connect Telegram to receive notifications and use Zazŭ features.</span>
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={handleLink}
          disabled={loading}
          className="rounded-md bg-white text-violet-700 font-semibold px-3 py-1 text-xs hover:bg-violet-50 disabled:opacity-60 transition-colors"
        >
          {loading ? 'Opening…' : 'Link Zazŭ'}
        </button>
        <button
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="text-white/70 hover:text-white text-lg leading-none"
        >
          ×
        </button>
      </div>
    </div>
  )
}
