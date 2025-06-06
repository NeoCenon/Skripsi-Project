import db from '@/lib/db'
import { getSession } from '@/lib/session'

export default async function handler(req, res) {
  const session = getSession(req)
  if (!session) return res.status(401).json({ error: 'Unauthorized' })
  if (session.role !== 'owner' && session.role !== 'admin') return res.status(403).json({ error: 'Forbidden' })

  if (req.method === 'GET') {
    const [users] = await db.query('SELECT id, full_name, email, role, created_at FROM users')
    return res.status(200).json({ users })
  }

  res.status(405).json({ error: 'Method not allowed' })
}
