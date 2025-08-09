'use client'

import { useState } from 'react'
import { supabase } from '@/lib/lib/supabaseClient' 

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setMessage('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/updatepass`,
    })

    if (error) setError(error.message)
    else setMessage('Password reset email sent. Check your inbox.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 text-white">
      <form
        onSubmit={handleSubmit}
        className="bg-white text-slate-800 p-8 rounded-xl w-full max-w-md shadow-xl"
      >
        <h2 className="text-2xl font-bold mb-4 text-center">Forgot Password</h2>
        <label className="block mb-2 font-medium">Email</label>
        <input
          type="email"
          required
          className="w-full px-4 py-2 mb-4 border border-gray-300 rounded"
          placeholder="Enter your email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        {message && <p className="text-green-600 text-sm mb-2">{message}</p>}
        {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
        >
          Send Reset Email
        </button>
      </form>
    </div>
  )
}
