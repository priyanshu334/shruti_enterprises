'use client'

import { useState } from 'react'
import { supabase } from '@/lib/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

const handleSignup = async (e: React.FormEvent) => {
  e.preventDefault()
  setMessage('')
  setError('')

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) {
    setError(error.message)
    return
  }

  // If email confirmation is not required, insert into admin table now
  const user = data.user

  if (user) {
    const { error: insertError } = await supabase
      .from('admin')
      .insert([{ user_id: user.id }]) // user.id is UUID

    if (insertError) {
      setError('Signup successful, but failed to add to admin table: ' + insertError.message)
      return
    }

    setMessage('Signup successful! Redirecting to login...')
    setTimeout(() => router.push('/login'), 3000)
  } else {
    // If confirmation email is required, user is null
    setMessage('Signup successful. Please check your email to confirm your account.')
  }
}
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl shadow-2xl p-10 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Signup</h2>
        <form onSubmit={handleSignup} className="space-y-4">
          <div>
            <label className="block text-slate-600 font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border text-black border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="you@example.com"
            />
          </div>
          <div>
            <label className="block text-slate-600 font-medium">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 rounded-lg border text-black border-slate-300 focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {message && <p className="text-green-600 text-sm">{message}</p>}
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition"
          >
            Sign Up
          </button>
             <Link href="/login">
            <p className="text-center text-sm text-blue-800 font-semibold hover:text-blue-900 mt-2">
              Already hava an Account ? Login .....
            </p>
          </Link>
        </form>
      </div>
    </div>
  )
}
