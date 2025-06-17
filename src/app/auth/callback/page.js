'use client';
import { useEffect } from 'react';

export default function AuthCallback({ searchParams }) {
  const token = searchParams?.token;

  useEffect(() => {
    if (token) {
      window.location.href = '/dashboard';
    }
  }, [token]);

  return <div>Verifying your email...</div>;
}