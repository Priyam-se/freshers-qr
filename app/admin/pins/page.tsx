"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Shield, Save, RefreshCw, LogOut } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminPinsPage() {
  const router = useRouter();
  const [entryPin, setEntryPin] = useState("1234");
  const [foodPin, setFoodPin] = useState("5678");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Auth gate check
  useEffect(() => {
    const token = sessionStorage.getItem("cutm_admin_token");
    if (token !== "cutm_admin_session_valid") {
      router.replace("/admin");
    }
  }, [router]);

  useEffect(() => {
    fetchPins();
  }, []);

  const fetchPins = async () => {
    try {
      const res = await fetch("/api/admin/pins");
      const data = await res.json();
      if (data.success && data.pins) {
        setEntryPin(data.pins.entryPin);
        setFoodPin(data.pins.foodPin);
      }
    } catch {
      toast.error("Failed to load current PINs");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entryPin.trim() || !foodPin.trim()) {
      toast.error("Both PINs are required");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/pins", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entryPin: entryPin.trim(),
          foodPin: foodPin.trim(),
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Scanner PINs updated successfully!");
      } else {
        toast.error(data.message || "Failed to update PINs");
      }
    } catch {
      toast.error("Network error updating PINs");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("cutm_admin_token");
    router.replace("/admin");
    toast.success("Admin logged out");
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">Scanner PIN Settings</h1>
              <p className="text-xs text-slate-400">Configure access PINs for the Entry and Food scanner stations</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Link
              href="/admin/dashboard"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl transition"
            >
              Dashboard
            </Link>
            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-rose-900/30 hover:text-rose-400 text-slate-400 rounded-xl transition"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Form Container */}
      <main className="max-w-2xl w-full mx-auto p-6 flex-1 flex flex-col justify-center">
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Station Security Credentials</h2>
              <p className="text-xs text-slate-400">
                Staff operating camera scanners must enter these PINs to unlock the scanner screen.
              </p>
            </div>
          </div>

          {loading ? (
            <div className="py-12 text-center text-slate-400 flex flex-col items-center">
              <RefreshCw className="w-6 h-6 animate-spin text-indigo-500 mb-2" />
              <p className="text-xs">Loading PIN configuration...</p>
            </div>
          ) : (
            <form onSubmit={handleSave} className="space-y-5">
              {/* Entry Scanner PIN */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-emerald-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 mr-2"></span>
                    Entry Gate Scanner PIN
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">/scanner/entry</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    value={entryPin}
                    onChange={(e) => setEntryPin(e.target.value)}
                    placeholder="e.g. 1234"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold tracking-widest focus:outline-none focus:border-emerald-500 transition"
                  />
                  <KeyRound className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Food Scanner PIN */}
              <div className="bg-slate-950/60 border border-slate-800 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span>
                    Food Counter Scanner PIN
                  </label>
                  <span className="text-[11px] text-slate-500 font-mono">/scanner/food</span>
                </div>
                <div className="relative">
                  <input
                    type="text"
                    maxLength={8}
                    value={foodPin}
                    onChange={(e) => setFoodPin(e.target.value)}
                    placeholder="e.g. 5678"
                    className="w-full px-4 py-3 bg-slate-900 border border-slate-700 rounded-xl text-white font-mono text-lg font-bold tracking-widest focus:outline-none focus:border-amber-500 transition"
                  />
                  <KeyRound className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition"
              >
                {saving ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Saving Changes...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Save Scanner PINs</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
