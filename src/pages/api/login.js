import db from '@/lib/db'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { email, password } = req.body

  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password required' })
  }

  try {
    const [rows] = await db.execute(
      'SELECT id, name, email, role FROM users WHERE email = ? AND password = ?',
      [email, password]
    )

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' })
    }

    const user = rows[0]
    return res.status(200).json({ success: true, user })
  } catch (error) {
    console.error('Login error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}
