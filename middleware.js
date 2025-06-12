import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs'
import { NextResponse } from 'next/server'

export async function middleware(req) {
  const res = NextResponse.next()
  const supabase = createMiddlewareClient({ req, res })
  const token = req.cookies.get('token')?.value;

  const {
    data: { user },
  } = await supabase.auth.getUser()

  // Redirect to login if user is not authenticated
  if (!user) return NextResponse.redirect(new URL('/login', req.url))

  const { data: profile } = await supabase
    .from('users')
    .select('user_role')
    .eq('user_id', user.id)
    .single()

  const role = profile?.user_role
  const path = req.nextUrl.pathname

  const adminPages = [
    '/instock', '/order', '/product', '/supplier',
    '/addproduct','/addstock','/addorder','/addsupplier',
    '/editproduct','/editstock','/editorder','/editsupplier'
  ]
  
  const ownerPages = [
    '/', '/dashboard', ...adminPages,
    '/accountmanagement', '/addaccount', '/editaccount',
    '/historyopname', '/opname'
  ]

  const url = req.nextUrl.clone();

  // Check token presence
  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  const allowedPages = role === 'owner' ? ownerPages : adminPages

  if (!allowedPages.includes(path)) {
    return NextResponse.redirect(new URL('/unauthorized', req.url))
  }

  return res
}
