"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  QrCode,
  UtensilsCrossed,
  Sparkles,
  ArrowRight,
  Search,
  CheckCircle2,
  Calendar,
  MapPin,
} from "lucide-react";
import toast from "react-hot-toast";

export default function HomePage() {
  const [searchRoll, setSearchRoll] = useState("");
  const [lookupStudent, setLookupStudent] = useState<{
    name: string;
    rollNo: string;
    email: string;
    entryScanned: boolean;
    foodScanned: boolean;
    qrToken: string;
  } | null>(null);
  const [lookingUp, setLookingUp] = useState(false);

  const handleLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchRoll.trim()) return;

    setLookingUp(true);
    setLookupStudent(null);
    try {
      const res = await fetch(`/api/admin/stats?search=${encodeURIComponent(searchRoll.trim())}`);
      const data = await res.json();
      if (data.success && data.students && data.students.length > 0) {
        const match = data.students.find(
          (s: { rollNo: string }) => s.rollNo.toLowerCase() === searchRoll.trim().toLowerCase()
        ) || data.students[0];
        setLookupStudent(match);
        toast.success(`Found pass details for ${match.name}`);
      } else {
        toast.error("Registration not found. Please verify your roll number.");
      }
    } catch {
      toast.error("Failed to lookup pass status");
    } finally {
      setLookingUp(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-indigo-500 selection:text-white">
      {/* Top Banner / Event Header */}
      <header className="border-b border-slate-800/80 bg-slate-900/40 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-base font-black text-white tracking-tight">Centurion University Of Technology and Management</h1>
              <p className="text-[11px] text-slate-400 font-medium">BCA Freshers 2026 Verification Portal</p>
            </div>
          </div>

          <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-slate-400">
            Station Verification Desk
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-5xl w-full mx-auto p-6 md:p-12 flex-1 flex flex-col justify-center space-y-10">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Dual-Point Verification System</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Welcome to <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">BCA Freshers 2026</span>
          </h2>
          <p className="text-slate-400 text-sm md:text-base">
            Select your assigned verification station below to begin scanning fresher QR passes.
          </p>

          <div className="flex items-center justify-center space-x-6 text-xs text-slate-400 pt-2">
            <span className="flex items-center"><Calendar className="w-3.5 h-3.5 mr-1.5 text-indigo-400" /> 13 OCTOBER 2026</span>
            <span className="flex items-center"><MapPin className="w-3.5 h-3.5 mr-1.5 text-pink-400" /> GYM AREA</span>
          </div>
        </div>

        {/* 2 Main Scanner Station Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto w-full">
          {/* Station 1: Entry Scanner */}
          <Link
            href="/scanner/entry"
            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <QrCode className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                Station 1 • Gate
              </span>
              <h3 className="text-2xl font-bold text-white mt-4 group-hover:text-emerald-300 transition">
                Main Entry Scanner
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Scan fresher QR codes at the main event gate. Verifies registration and prevents duplicate entry.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-emerald-400">
              <span>Launch Entry Scanner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>

          {/* Station 2: Food Scanner */}
          <Link
            href="/scanner/food"
            className="group relative bg-slate-900/80 hover:bg-slate-900 border border-slate-800 hover:border-amber-500/50 rounded-3xl p-8 shadow-xl hover:shadow-2xl transition duration-300 flex flex-col justify-between"
          >
            <div>
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mb-5 group-hover:scale-110 transition">
                <UtensilsCrossed className="w-8 h-8" />
              </div>
              <span className="text-[11px] font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-3 py-1 rounded-full border border-amber-500/20">
                Station 2 • Meals
              </span>
              <h3 className="text-2xl font-bold text-white mt-4 group-hover:text-amber-300 transition">
                Food Counter Scanner
              </h3>
              <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                Scan fresher QR codes at the food distribution desk. Validates meal token and prevents duplicate collection.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-semibold text-amber-400">
              <span>Launch Food Scanner</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition" />
            </div>
          </Link>
        </div>

        {/* Student Pass Status Finder */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-3xl p-8 max-w-2xl mx-auto w-full shadow-xl space-y-6">
          <div className="text-center space-y-1">
            <h3 className="text-base font-bold text-white flex items-center justify-center">
              <Search className="w-4 h-4 mr-2 text-indigo-400" /> Fresher Pass Status Lookup
            </h3>
            <p className="text-xs text-slate-400">
              Enter your registration number (e.g. 260314100001) to verify your pass status
            </p>
          </div>

          <form onSubmit={handleLookup} className="flex space-x-2">
            <input
              type="text"
              value={searchRoll}
              onChange={(e) => setSearchRoll(e.target.value)}
              placeholder="e.g. 260314100001"
              className="flex-1 px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono transition"
            />
            <button
              type="submit"
              disabled={lookingUp || !searchRoll.trim()}
              className="px-5 py-3 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
            >
              {lookingUp ? "Checking..." : "Verify"}
            </button>
          </form>

          {lookupStudent && (
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div>
                  <h4 className="font-bold text-white text-sm">{lookupStudent.name}</h4>
                  <p className="font-mono text-xs text-indigo-300">{lookupStudent.rollNo}</p>
                </div>
                <span className="text-[11px] text-slate-400 font-mono">{lookupStudent.email}</span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Entry Status</span>
                  <div className="mt-1 font-semibold flex items-center">
                    {lookupStudent.entryScanned ? (
                      <span className="text-emerald-400 flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> Checked-in
                      </span>
                    ) : (
                      <span className="text-slate-400">Not checked in yet</span>
                    )}
                  </div>
                </div>

                <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Food Status</span>
                  <div className="mt-1 font-semibold flex items-center">
                    {lookupStudent.foodScanned ? (
                      <span className="text-amber-400 flex items-center">
                        <UtensilsCrossed className="w-3.5 h-3.5 mr-1" /> Collected
                      </span>
                    ) : (
                      <span className="text-slate-400">Available</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 py-6 text-center text-xs text-slate-600">
        Centurion University Of Technology and Management • BCA Freshers 2026
      </footer>
    </div>
  );
}
