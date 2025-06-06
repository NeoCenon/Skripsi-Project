import { destroySession } from '@/lib/session'

export default function handler(req, res) {
  destroySession(req, res)
  res.status(200).json({ success: true })
}
