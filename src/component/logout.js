"use client"

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function Logout() {
  const router = useRouter();

  useEffect(() => {
    const logout = async () => {
      await supabase.auth.signOut();
      localStorage.removeItem('access_token')
      localStorage.removeItem('user_role')
      router.push("/login"); // redirect to login
    };
    logout();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <p>Logging out...</p>
    </div>
  )
}
