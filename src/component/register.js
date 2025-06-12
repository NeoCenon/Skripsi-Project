'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import bcrypt from 'bcryptjs'
import { supabase } from '@/lib/supabase'

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
    setFormData({ ...formData, [e.target.name]: e.target.value })
    setError('')
    setSuccess('')
  }

  const handleSubmit = async () => {
    const { username, email, password, re_password } = formData

    if (!username || !email || !password || !re_password) {
      setError('Please fill in all fields!')
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
      // Hash password di frontend dengan bcryptjs
      
      // const hashedPassword = await bcrypt.hash(password, 10)

      // const { data, error: insertError } = await supabase.from('users').insert([
      //   {
      //     user_name: username,
      //     user_email: email,
      //     user_password: hashedPassword,
      //     user_role: 'owner',
      //   },
      // ])

      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      })

      if (signUpError) {
        console.error('Sign up error:', signUpError)
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

      // 2. Insert profile into 'users' table
      const { error: insertError } = await supabase.from('users').insert([
        {
          user_id: userId,       // Foreign key to auth.users
          user_name: username,
          user_email: email,
          user_role: 'owner',
        },
      ])

      if (insertError) {
        console.error('Insert profile error:', insertError)
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
    <div className="flex flex-col min-h-screen bg-white text-black font-[Poppins] items-center justify-center p-8">
      <div className="bg-white shadow-md rounded-lg w-full max-w-md p-10">
        <h1 className="text-xl font-semibold text-black mb-1">E-Inventoria</h1>
        <h2 className="text-2xl font-bold mb-6 text-[#1b1c4a]">Register</h2>

        <div className="space-y-6">
          <div>
            <label className="block text-base font-semibold text-black mb-1">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="border border-black rounded-[12px] h-[42px] px-6 w-full outline-none text-black"
              disabled={loading}
              placeholder="Enter your username"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-1">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="border border-black rounded-[12px] h-[42px] px-6 w-full outline-none text-black"
              disabled={loading}
              placeholder="Enter your email"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="border border-black rounded-[12px] h-[42px] px-6 w-full outline-none text-black"
              disabled={loading}
              placeholder="Enter your password"
            />
          </div>

          <div>
            <label className="block text-base font-semibold text-black mb-1">Re-Password</label>
            <input
              type="password"
              name="re_password"
              value={formData.re_password}
              onChange={handleChange}
              className="border border-black rounded-[12px] h-[42px] px-6 w-full outline-none text-black"
              disabled={loading}
              placeholder="Repeat your password"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">{success}</p>}

          <div className="flex justify-center mt-6">
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#89E0F8] text-black font-semibold px-10 py-2 rounded-full hover:text-white hover:bg-[#89E0F8] disabled:opacity-60"
            >
              {loading ? 'Registering...' : 'Sign up'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
