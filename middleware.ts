import { createClient } from '@supabase/supabase-js'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  const res = NextResponse.next()

  // Skip authentication for login and 403 pages to prevent redirect loops
  const publicPaths = ['/admin/login', '/admin/403']
  const pathname = request.nextUrl.pathname
  
  if (publicPaths.some(path => pathname === path || pathname.startsWith(path + '/'))) {
    return res
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        flowType: 'pkce',
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )

  // Manually set cookies from request
  const cookieHeader = request.headers.get('cookie')
  if (cookieHeader) {
    supabase.auth.setSession({
      access_token: extractToken(cookieHeader, 'sb-access-token') || '',
      refresh_token: extractToken(cookieHeader, 'sb-refresh-token') || '',
    })
  }

  const { data: { session } } = await supabase.auth.getSession()

  if (!session) {
    const redirectUrl = new URL('/admin/login', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  // Check user role from profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', session.user.id)
    .single()

  const userRole = profile?.role || 'viewer'

  // Allow admin and editor to access admin pages
  if (userRole !== 'admin' && userRole !== 'editor') {
    const redirectUrl = new URL('/admin/403', request.url)
    return NextResponse.redirect(redirectUrl)
  }

  return res
}

// Helper function to extract token from cookie header
function extractToken(cookieHeader: string, tokenName: string): string | null {
  const cookies = cookieHeader.split(';').map(c => c.trim())
  const tokenCookie = cookies.find(c => c.startsWith(`${tokenName}=`))
  if (tokenCookie) {
    return tokenCookie.split('=')[1]
  }
  return null
}

export const config = {
  matcher: '/admin/:path*',
}