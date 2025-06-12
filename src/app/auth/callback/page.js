'use client';
import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';

export default function AuthCallback() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  useEffect(() => {
    if (token) {
      // Handle token verification (Supabase auto-verifies via email link)
      window.location.href = '/dashboard';
    }
  }, [token]);

  return <div>Verifying your email...</div>;
}