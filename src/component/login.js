"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // login berhasil
        console.log("User:", data.user);
        router.push("/addorder"); // redirect ke dash board
      } else {
        setErrorMsg(data.error || "Login failed");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("Something went wrong");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f9fb]">
      <div className="w-full max-w-md bg-white p-10 rounded-xl shadow-sm">
        <h1 className="text-xl font-bold text-black mb-6">
          <span className="text-black font-semibold">E</span>-Inventoria
        </h1>

        <h2 className="text-lg font-semibold text-black mb-6">Login</h2>

        {errorMsg && (
          <p className="text-red-600 text-sm mb-4">{errorMsg}</p>
        )}

        <form onSubmit={handleLogin}>
          <div className="mb-4">
            <label htmlFor="email" className="block mb-1 text-sm font-medium text-black">
              Email<span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter your email"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block mb-1 text-sm font-medium text-black">
              Password<span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Minimum 8 characters"
              className="w-full px-4 py-3 border border-gray-300 rounded-md bg-gray-100 text-black"
              required
            />
          </div>

          <div className="flex items-center mb-6">
            <input type="checkbox" id="remember" className="mr-2" />
            <label htmlFor="remember" className="text-sm text-black">
              Remember me
            </label>
          </div>

          <button
            type="submit"
            className="w-full py-3 bg-black text-white rounded-2xl font-semibold hover:bg-gray-800 transition"
          >
            Login
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-black">
          Not registered yet?{" "}
          <Link href="/register" className="text-black font-medium hover:underline">
            Create a new account
          </Link>
        </p>
      </div>
    </div>
  );
}

