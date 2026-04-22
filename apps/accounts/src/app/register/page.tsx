'use client'

export const dynamic = 'force-dynamic'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'

function RegisterForm() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const searchParams = useSearchParams()
  const continueUrl = searchParams.get('continue') ?? ''

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const nauApiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.9nau.com'
      const res = await fetch(`${nauApiUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      })

      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        setError((body as { message?: string }).message ?? 'Registration failed')
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

  const loginHref = continueUrl
    ? `/login?continue=${encodeURIComponent(continueUrl)}`
    : '/login'

  return (
    <div className="min-h-screen flex items-center justify-center bg-[radial-gradient(circle_at_top_right,#1e1b4b,#000)] p-4">
      <div className="glass w-full max-w-md animate-fade-in p-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-violet-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-[0_0_24px_rgba(124,58,237,0.5)]">
            <span className="text-white text-2xl font-bold font-heading">9</span>
          </div>
          <h1 className="text-3xl font-heading font-bold mb-2">Create your account</h1>
          <p className="text-white/60 text-sm">Join the 9naŭ platform.</p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-white/80">Full Name</label>
            <input
              type="text"
              placeholder="John Doe"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="input-field"
            />
          </div>

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
              minLength={8}
              className="input-field"
            />
          </div>

          {error && <p className="text-red-400 text-sm">{error}</p>}

          <button type="submit" className="btn-primary w-full justify-center h-12 mt-1" disabled={loading}>
            {loading ? <Loader2 size={18} className="animate-spin" /> : 'Create Account'}
          </button>

          <p className="text-center text-white/50 text-sm mt-2">
            Already have an account?{' '}
            <Link href={loginHref} className="text-violet-400 hover:underline">
              Sign in
            </Link>
          </p>
        </form>
      </div>

      <div className="absolute top-[20%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-violet-600/10 blur-[150px] -z-10 rounded-full pointer-events-none" />
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  )
}
