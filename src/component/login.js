'use client'

import { supabase } from '@/lib/supabase'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setLoading(true)

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error || !data?.session || !data?.user) {
      setErrorMsg('Email or password is incorrect.')
      setLoading(false)
      return
    }

    const { session, user } = data

    // Optional: store JWT in localStorage or cookie
    localStorage.setItem('access_token', session.access_token)

    // Get user role from your `users` table (join by email or user ID)
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('user_role')
      .eq('user_email', email)
      .single()

    if (userError || !userData) {
      setErrorMsg('Failed to retrieve user role.')
      setLoading(false)
      return
    }

    const role = userData.user_role
    localStorage.setItem('user_role', role) 

    if (role === 'owner') {
      router.push('/product')
    } else if (role === 'admin') {
      router.push('/product') // or wherever admins should land
    } else {
      setErrorMsg('Unknown user role.')
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-sm">
        <h1 className="text-xl font-bold text-black mb-6">
          <span className="text-black font-semibold">E</span>-Inventoria
        </h1>

        <h2 className="text-lg font-semibold text-black mb-6">Login</h2>

        {errorMsg && <p className="text-red-600 text-sm mb-4">{errorMsg}</p>}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-black">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-black">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black">
          Not registered yet?{' '}
          <Link href="/register" className="text-black font-medium hover:underline">
            Create a new account
          </Link>
        </p>
      </div>
    </div>
  )
}