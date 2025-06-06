import { createConnection } from '@/lib/db'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const db = await createConnection()
    const { full_name, email, phone_number, password, address } = await req.json()

    const [existing] = await db.execute('SELECT id FROM users WHERE email = ?', [email])
    if (existing.length > 0) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
    }

    const role = 'owner' // default role for registration

    await db.execute(
      `INSERT INTO users (full_name, email, phone_number, password, address, role)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [full_name, email, phone_number || null, password, address || null, role]
    )

    return NextResponse.json({ success: true, message: 'User registered as owner' })
  } catch (error) {
    console.error('Register error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
