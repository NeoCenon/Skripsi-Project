import db from '@/lib/db';

export async function POST(req) {
  try {
    const body = await req.json();
    const { full_name, email, password } = body;

    if (!full_name || !email || !password) {
      return new Response(JSON.stringify({ success: false, error: 'Missing required fields' }), { status: 400 });
    }

    const [rows] = await db.query(
      'INSERT INTO users (name, email, password) VALUES (?, ?, ?)',
      [full_name, email, password]
    );

    return new Response(JSON.stringify({ success: true, message: 'User registered' }), { status: 201 });
  } catch (error) {
    console.error('Register error:', error);
    return new Response(JSON.stringify({ success: false, error: 'Failed to register user' }), { status: 500 });
  }
}
