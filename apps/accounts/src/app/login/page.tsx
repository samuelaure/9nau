'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const continueUrl = searchParams.get('continue') ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const nauApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.9nau.com'
      const res = await fetch(`${nauApiUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { message?: string }).message ?? 'Invalid credentials')
        return
      }

      const { accessToken } = (await res.json()) as { accessToken: string }

      if (continueUrl) {
        const callbackUrl = new URL(continueUrl)
        callbackUrl.searchParams.set('token', accessToken)
        window.location.href = callbackUrl.toString()
      } else {
        window.location.href = 'https://app.9nau.com'
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const registerHref = continueUrl
    ? `/register?continue=${encodeURIComponent(continueUrl)}`
    : '/register'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,#1e1b4b,#000)] p-4">
      <div className="glass w-full max-w-md animate-fade-in p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(124,58,237,0.5)]">
            <span className="text-white text-2xl font-bold font-heading">9</span>
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Sign in to 9naŭ</h1>
          <p className="text-white/60 text-sm">
            {continueUrl ? 'Sign in to continue to your app.' : 'Welcome back.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Email Address</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="input-field"
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Password</label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="input-field"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center h-12 mt-1" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Sign In'}
          </button>

          <p className="text-center text-white/50 text-sm mt-2">
            Don&apos;t have an account?{' '}
            <Link href={registerHref} className="text-violet-400 hover:underline">
              Create one
            </Link>
          </p>
        </form>
      </div>

      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 blur-[150px] -z-10 rounded-full pointer-events-none" />
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  )
}
