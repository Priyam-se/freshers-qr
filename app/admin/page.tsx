"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Shield, KeyRound, ArrowLeft, Lock, Sparkles } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

export default function AdminLoginPage() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const token = sessionStorage.getItem("cutm_admin_token");
    if (token === "cutm_admin_session_valid") {
      router.replace("/admin/dashboard");
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) {
      toast.error("Please enter the admin password");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();
      if (data.success) {
        sessionStorage.setItem("cutm_admin_token", "cutm_admin_session_valid");
        toast.success("Admin authorized!");
        router.push("/admin/dashboard");
      } else {
        toast.error(data.message || "Incorrect Admin Password");
      }
    } catch {
      toast.error("Authentication request failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 mb-2">
            <Lock className="w-8 h-8" />
          </div>
          <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
            Protected Area
          </span>
          <h1 className="text-2xl font-black text-white tracking-tight">Admin Portal Login</h1>
          <p className="text-xs text-slate-400">
            Restricted access for BCA Freshers 2026 organizing committee
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
              Master Admin Password
            </label>
            <div className="relative">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password..."
                className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                autoFocus
              />
              <KeyRound className="w-4 h-4 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
            </div>
            <p className="text-[11px] text-slate-500 mt-1.5">
              Default password: <code className="text-indigo-400 font-mono">cutm@admin2026</code> (changeable in .env.local)
            </p>
          </div>

          <button
            type="submit"
            disabled={loading || !password}
            className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition duration-200"
          >
            {loading ? "Authenticating..." : "Enter Admin Dashboard"}
          </button>
        </form>

        <div className="pt-2 text-center border-t border-slate-800">
          <Link href="/" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-300 transition">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Scanner Stations
          </Link>
        </div>
      </div>
    </div>
  );
}
