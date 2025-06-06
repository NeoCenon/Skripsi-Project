'use client'

import { useState } from 'react'

export default function Register() {
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone_number: '',
    password: '',
    re_password: '',
    address: '',
    access_code: '',
  })

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (form.password !== form.re_password) {
      alert('Passwords do not match')
      return
    }

    const full_name = `${form.firstName} ${form.lastName}`

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          full_name,
          email: form.email,
          phone_number: form.phone_number,
          password: form.password,
          address: form.address,
          access_code: form.access_code,
        }),
      })

      if (!res.ok) {
        const text = await res.text()
        alert(`Request failed: ${text}`)
        return
      }

      const data = await res.json()
      console.log('Response from API:', data)

      if (data.success) {
        alert('Registered successfully!')
        // Optionally reset form or redirect user here
      } else {
        alert(`Error: ${data.error}`)
      }
    } catch (error) {
      alert(`Unexpected error: ${error.message}`)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="bg-white shadow-md rounded-lg w-full max-w-5xl p-10">
        <h1 className="text-xl font-semibold text-black">E-Inventoria</h1>
        <h2 className="text-2xl font-bold mt-2 mb-4 text-[#1b1c4a]">Register</h2>
        <p className="text-sm text-gray-600 mb-6">
          <span className="font-semibold">Manage all your inventory efficiently</span>
          <br />
          Let’s get you all set up so you can verify your personal account and begin setting up your work profile
        </p>

        <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-black mb-1">First name</label>
            <input
              name="firstName"
              onChange={handleChange}
              value={form.firstName}
              required
              type="text"
              placeholder="Enter your name"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Last name</label>
            <input
              name="lastName"
              onChange={handleChange}
              value={form.lastName}
              required
              type="text"
              placeholder="Enter your surname"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Email</label>
            <input
              name="email"
              onChange={handleChange}
              value={form.email}
              required
              type="email"
              placeholder="Enter your email"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Phone no.</label>
            <input
              name="phone_number"
              onChange={handleChange}
              value={form.phone_number}
              required
              type="tel"
              placeholder="Enter your phone"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Password</label>
            <input
              name="password"
              onChange={handleChange}
              value={form.password}
              required
              type="password"
              placeholder="Enter your password"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Re-Password</label>
            <input
              name="re_password"
              onChange={handleChange}
              value={form.re_password}
              required
              type="password"
              placeholder="Repeat your password"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Address</label>
            <input
              name="address"
              onChange={handleChange}
              value={form.address}
              type="text"
              placeholder="Enter your address"
              className="input text-black"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-black mb-1">Access Code</label>
            <input
              name="access_code"
              onChange={handleChange}
              value={form.access_code}
              type="text"
              placeholder="Enter your code"
              className="input text-black"
            />
          </div>

          <div className="col-span-1 md:col-span-2 mt-4 flex justify-center">
            <button
              type="submit"
              className="px-10 py-2 bg-[#1b1c4a] text-white rounded-full font-medium hover:bg-[#2b2c5a] transition"
            >
              Sign up
            </button>
          </div>
        </form>

        <p className="text-sm text-center mt-4 text-black">
          Already have an account?{' '}
          <a href="/login" className="text-blue-600 hover:underline">
            Log in
          </a>
        </p>

        <style jsx>{`
          .input {
            width: 100%;
            padding: 0.5rem;
            border: 1px solid #ccc;
            border-radius: 0.375rem;
            background-color: white;
          }
        `}</style>
      </div>
    </div>
  )
}
