'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    re_password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handleChange = (e) => {
    let { name, value } = e.target
    // Always set email to lowercase
    if (name === 'email') value = value.toLowerCase()
    setFormData({ ...formData, [name]: value })
    setError('')
    setSuccess('')
  }

  const validateEmail = (email) => {
    // Must contain @ and . after @
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  }

  const validatePassword = (password) => {
    // At least 8 chars, at least one letter and one number
    return /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/.test(password)
  }

  const handleSubmit = async () => {
    const { username, email, password, re_password } = formData

    if (!username || !email || !password || !re_password) {
      setError('Please fill in all fields!')
      return
    }

    if (!validateEmail(email)) {
      setError('Please enter a valid email address (e.g. user@gmail.com)')
      return
    }

    // Check if email already exists (case-insensitive)
    const { data: existing } = await supabase
      .from('users')
      .select('user_email')
      .ilike('user_email', email)
      .maybeSingle()
    if (existing) {
      setError('Email is already registered')
      return
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters and contain both letters and numbers')
      return
    }

    if (password !== re_password) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        setError(signUpError.message)
        setLoading(false)
        return
      }

      const userId = signUpData.user?.id
      if (!userId) {
        setError('Registration failed. No user ID returned.')
        setLoading(false)
        return
      }

      const { error: insertError } = await supabase.from('users').insert([
        {
          user_id: userId,
          user_name: username,
          user_email: email,
          user_role: 'owner',
        },
      ])

      if (insertError) {
        setError('User created, but failed to insert profile data.')
        setLoading(false)
        return
      }

      setSuccess('Registered successfully!')
      setFormData({
        username: '',
        email: '',
        password: '',
        re_password: '',
      })

      setTimeout(() => {
        router.push('/login')
      }, 1500)
    } catch (err) {
      setError('Unexpected error: ' + err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-sm">
        <h1 className="text-2xl mb-6 font-semibold text-[#5E35B1]">E-Inventoria</h1>
        <h2 className="text-lg font-semibold text-black mb-6">Register</h2>

        <form onSubmit={e => { e.preventDefault(); handleSubmit(); }}>
          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-black">
              Username<span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-black">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-black">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          <div className="mb-4">
            <label className="block mb-1 text-sm font-medium text-black">
              Re-Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              name="re_password"
              value={formData.re_password}
              onChange={handleChange}
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              disabled={loading}
              placeholder="Repeat your password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 mt-4 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition disabled:opacity-60"
          >
            {loading ? 'Registering...' : 'Sign up'}
          </button>
        </form>
        <div className="flex justify-center mt-4">
          <Link
            href="/login"
            className="text-blue-500 hover:text-[#0033FF] text-sm font-medium hover:underline"
          >
            Already have an account?
          </Link>
        </div>
      </div>
    </div>
  )
}