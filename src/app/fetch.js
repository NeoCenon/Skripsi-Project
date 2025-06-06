"use client"

import { useEffect, useState } from "react"

export default function Fetch() {
  const [posts, setPosts] = useState([])

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await fetch('/api/fetch')
        const response = await data.json()
        console.log(response)
        setPosts(response)
      } catch (error) {
        console.log(error)
      }
    }

    fetchData()
  }, [])

  return (
    <div>
      Welcome to Next.js!
      {posts.map((post, index) => (
        <div key={index}>{post.post}</div>
      ))}
    </div>
  )
}
