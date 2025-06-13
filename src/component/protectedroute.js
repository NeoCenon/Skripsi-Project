'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function RequireAuth({ children }) {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const token = localStorage.getItem('access_token')
    if (!token) {
      router.replace('/unauthorized') // redirect if not logged in
    } else {
      setLoading(false)
    }
  }, [router])

  if (loading) {
    return <div>Loading...</div>
  }

  return children
}