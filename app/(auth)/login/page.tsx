"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { loginAction } from "@/app/actions/auth.actions";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const router = useRouter();

  async function handleLogin(formData: FormData) {
    const { errorMessage } = await loginAction(formData);

    if (errorMessage) {
      setError(errorMessage);
      return;
    }

    router.push("/firm");
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-700 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl shadow-xl p-8 sm:p-10 w-full max-w-md">
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-2">
          Admin Login
        </h2>
        <p className="text-sm text-center text-slate-500 mb-6">
          Sign in with your admin credentials
        </p>

        {/* Form submits directly to the server action */}
        <form action={handleLogin} className="space-y-4">
          <div className="space-y-1">
            <label className="block text-slate-600 font-medium">Email</label>
            <input
              type="email"
              name="email"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="admin@example.com"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-slate-600 font-medium">Password</label>
            <input
              type="password"
              name="password"
              required
              className="w-full px-4 py-2 border border-slate-300 rounded-lg text-black focus:ring-2 focus:ring-blue-500 focus:outline-none"
              placeholder="••••••••"
            />
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}

          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg transition duration-200"
          >
            Login
          </button>

          <Link href="/forgotpass">
            <p className="text-center text-sm text-red-400 hover:text-red-600 mt-2">
              Forgot password?
            </p>
          </Link>
        </form>
      </div>
    </div>
  );
}
