import { serialize, parse } from 'cookie'

const sessions = new Map() // simple session store di memory

export function createSession(res, user) {
  const sessionId = Math.random().toString(36).substring(2) + Date.now()
  sessions.set(sessionId, user)
  const cookie = serialize('sessionId', sessionId, {
    httpOnly: true,
    path: '/',
    maxAge: 60 * 60 * 24 * 7, // 7 hari
  })
  res.setHeader('Set-Cookie', cookie)
}

export function getSession(req) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {}
  if (!cookies.sessionId) return null
  return sessions.get(cookies.sessionId) || null
}

export function destroySession(req, res) {
  const cookies = req.headers.cookie ? parse(req.headers.cookie) : {}
  if (cookies.sessionId) {
    sessions.delete(cookies.sessionId)
    const cookie = serialize('sessionId', '', {
      httpOnly: true,
      path: '/',
      maxAge: 0,
    })
    res.setHeader('Set-Cookie', cookie)
  }
}
