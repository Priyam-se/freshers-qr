"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Users,
  CheckCircle2,
  UtensilsCrossed,
  Download,
  Upload,
  KeyRound,
  RefreshCw,
  Search,
  Mail,
  Send,
  Trash2,
  RotateCcw,
  LogOut,
  Sparkles,
} from "lucide-react";
import toast from "react-hot-toast";

interface StudentRecord {
  id: string;
  name: string;
  rollNo: string;
  email: string;
  qrToken: string;
  emailSent: boolean;
  entryScanned: boolean;
  entryScannedAt: string | null;
  entryScannedBy?: string;
  foodScanned: boolean;
  foodScannedAt: string | null;
  foodScannedBy?: string;
}

interface StatsData {
  total: number;
  entryCount: number;
  foodCount: number;
  entryPercentage: number;
  foodPercentage: number;
}

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<StatsData>({
    total: 0,
    entryCount: 0,
    foodCount: 0,
    entryPercentage: 0,
    foodPercentage: 0,
  });
  const [students, setStudents] = useState<StudentRecord[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<"all" | "entered" | "not_entered" | "food_collected">("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Auth gate check
  useEffect(() => {
    const token = sessionStorage.getItem("cutm_admin_token");
    if (token !== "cutm_admin_session_valid") {
      router.replace("/admin");
    }
  }, [router]);

  const fetchStats = useCallback(async (showToast = false) => {
    try {
      if (showToast) setRefreshing(true);
      const res = await fetch(`/api/admin/stats?search=${encodeURIComponent(search)}`);
      const data = await res.json();
      if (data.success) {
        setStats(data.stats);
        setStudents(data.students);
        if (showToast) toast.success("Live data refreshed");
      }
    } catch {
      toast.error("Failed to load live data");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => {
    fetchStats();
    // Auto-poll stats every 6 seconds for live counters
    const interval = setInterval(() => {
      fetchStats();
    }, 6000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const handleManualMark = async (rollNo: string, type: "entry" | "food", currentState: boolean) => {
    setActionLoading(`${rollNo}-${type}`);
    try {
      const res = await fetch("/api/admin/manual-mark", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rollNo,
          type,
          state: !currentState,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Manual override request failed");
    } finally {
      setActionLoading(null);
    }
  };

  const handleResendEmail = async (rollNo: string) => {
    setActionLoading(`${rollNo}-email`);
    try {
      const res = await fetch("/api/admin/resend-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rollNo }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Email resend request failed");
    } finally {
      setActionLoading(null);
    }
  };

  // Delete individual student
  const handleDeleteStudent = async (rollNo: string, name: string) => {
    if (!confirm(`Are you sure you want to delete ${name} (${rollNo}) from the database?`)) {
      return;
    }

    setActionLoading(`${rollNo}-delete`);
    try {
      const res = await fetch(`/api/admin/delete-student?rollNo=${encodeURIComponent(rollNo)}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to delete student record");
    } finally {
      setActionLoading(null);
    }
  };

  // Reset scan status only (rehearsal / retest)
  const handleResetAllScans = async () => {
    if (!confirm("Reset all scan statuses back to 0? (Students will remain registered, but entry/food scans will be cleared)")) {
      return;
    }

    try {
      const res = await fetch("/api/admin/reset-scans", { method: "POST" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to reset scan data");
    }
  };

  // Delete all students completely
  const handleClearAllStudents = async () => {
    const confirmation = prompt("Type DELETE to permanently remove ALL registered students:");
    if (confirmation !== "DELETE") {
      if (confirmation !== null) toast.error("Action cancelled. You must type DELETE to confirm.");
      return;
    }

    try {
      const res = await fetch("/api/admin/delete-student?clearAll=true", { method: "DELETE" });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        fetchStats();
      } else {
        toast.error(data.message);
      }
    } catch {
      toast.error("Failed to clear database");
    }
  };

  const exportCSV = () => {
    if (students.length === 0) {
      toast.error("No students to export");
      return;
    }

    const headers = [
      "Roll Number",
      "Name",
      "Email",
      "Email Sent",
      "Entry Scanned",
      "Entry Time",
      "Food Scanned",
      "Food Time",
      "QR Token",
    ];

    const rows = students.map((s) => [
      `"${s.rollNo}"`,
      `"${s.name}"`,
      `"${s.email}"`,
      s.emailSent ? "Yes" : "No",
      s.entryScanned ? "Yes" : "No",
      s.entryScannedAt ? `"${new Date(s.entryScannedAt).toLocaleString("en-IN")}"` : "N/A",
      s.foodScanned ? "Yes" : "No",
      s.foodScannedAt ? `"${new Date(s.foodScannedAt).toLocaleString("en-IN")}"` : "N/A",
      `"${s.qrToken}"`,
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `bca-freshers-attendance-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded!");
  };

  const handleLogout = () => {
    sessionStorage.removeItem("cutm_admin_token");
    router.replace("/admin");
    toast.success("Admin logged out");
  };

  // Filter students based on selection
  const displayedStudents = students.filter((s) => {
    if (filter === "entered") return s.entryScanned;
    if (filter === "not_entered") return !s.entryScanned;
    if (filter === "food_collected") return s.foodScanned;
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/60 backdrop-blur sticky top-0 z-30 px-6 py-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-pink-600 flex items-center justify-center text-white shadow-lg">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">BCA Freshers 2026</h1>
              <p className="text-xs text-slate-400">Live Verification & Attendance Command Center</p>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <button
              onClick={() => fetchStats(true)}
              disabled={refreshing}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
              <span>Refresh</span>
            </button>

            <Link
              href="/admin/upload"
              className="px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-lg shadow-indigo-600/20 transition"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Generate QRs / Upload</span>
            </Link>

            <button
              onClick={exportCSV}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV</span>
            </button>

            <Link
              href="/admin/pins"
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>PINs</span>
            </Link>

            {/* Quick Reset Tools */}
            <button
              onClick={handleResetAllScans}
              className="px-3 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
              title="Reset scan statuses only (for testing)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Scans</span>
            </button>

            <button
              onClick={handleClearAllStudents}
              className="px-3 py-2 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-semibold rounded-xl flex items-center space-x-1.5 transition"
              title="Delete all registered students"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Clear All</span>
            </button>

            <button
              onClick={handleLogout}
              className="p-2 bg-slate-800 hover:bg-rose-900/30 hover:text-rose-400 text-slate-400 rounded-xl transition"
              title="Logout Admin"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl w-full mx-auto p-6 flex-1 space-y-6">
        {/* KPI Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
          {/* Total Registered */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Registered</p>
                <h3 className="text-4xl font-black text-white mt-2">{stats.total}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                <Users className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
              <span>BCA Freshers 2026 Batch</span>
              <span className="text-indigo-400 font-semibold">100% Target</span>
            </div>
          </div>

          {/* Entry Check-in Count */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-emerald-400">Auditorium Entry</p>
                <h3 className="text-4xl font-black text-white mt-2">{stats.entryCount}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                <CheckCircle2 className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Turnout Rate</span>
              <span className="text-emerald-400 font-bold">{stats.entryPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.entryPercentage}%` }}
              ></div>
            </div>
          </div>

          {/* Food Coupons Collected */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl relative overflow-hidden">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-amber-400">Food Collected</p>
                <h3 className="text-4xl font-black text-white mt-2">{stats.foodCount}</h3>
              </div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                <UtensilsCrossed className="w-7 h-7" />
              </div>
            </div>
            <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Collection Rate</span>
              <span className="text-amber-400 font-bold">{stats.foodPercentage}%</span>
            </div>
            <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${stats.foodPercentage}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="relative w-full sm:w-80">
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, roll no, or email..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
            {(
              [
                { id: "all", label: "All Students" },
                { id: "entered", label: "Entered Auditorium" },
                { id: "not_entered", label: "Not Yet Entered" },
                { id: "food_collected", label: "Food Collected" },
              ] as const
            ).map((item) => (
              <button
                key={item.id}
                onClick={() => setFilter(item.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
                  filter === item.id
                    ? "bg-indigo-600 text-white shadow-md shadow-indigo-600/20"
                    : "bg-slate-800 text-slate-400 hover:text-white"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </div>

        {/* Student Roster Table */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-3xl overflow-hidden shadow-xl">
          <div className="p-5 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <h3 className="font-bold text-white text-base">Registered Freshers Roster</h3>
              <span className="px-2.5 py-0.5 bg-slate-800 rounded-full text-xs font-semibold text-slate-400">
                {displayedStudents.length} of {students.length}
              </span>
            </div>
          </div>

          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-3" />
              <p className="text-sm font-medium">Loading freshers database...</p>
            </div>
          ) : displayedStudents.length === 0 ? (
            <div className="py-16 text-center text-slate-500 text-sm">
              No students match the current filter or search criteria.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider font-semibold border-b border-slate-800">
                  <tr>
                    <th className="py-3.5 px-6">Roll No / Regd.</th>
                    <th className="py-3.5 px-6">Student Name</th>
                    <th className="py-3.5 px-6">Email Status</th>
                    <th className="py-3.5 px-6">Entry Check-In</th>
                    <th className="py-3.5 px-6">Food Coupon</th>
                    <th className="py-3.5 px-6 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {displayedStudents.map((student) => (
                    <tr key={student.id} className="hover:bg-slate-800/30 transition">
                      {/* Roll No */}
                      <td className="py-4 px-6 font-mono font-bold text-indigo-300">
                        {student.rollNo}
                      </td>

                      {/* Name */}
                      <td className="py-4 px-6">
                        <div className="font-semibold text-white text-sm">{student.name}</div>
                        <div className="text-slate-400 text-[11px]">{student.email}</div>
                      </td>

                      {/* Email Status */}
                      <td className="py-4 px-6">
                        {student.emailSent ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium text-[11px]">
                            <Mail className="w-3 h-3 mr-1" /> Sent
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-md bg-slate-800 text-slate-400 border border-slate-700 font-medium text-[11px]">
                            Not sent
                          </span>
                        )}
                      </td>

                      {/* Entry Status */}
                      <td className="py-4 px-6">
                        {student.entryScanned ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[11px]">
                              <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-400" /> Entered
                            </span>
                            {student.entryScannedAt && (
                              <div className="text-[10px] text-slate-400">
                                {new Date(student.entryScannedAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-500 font-medium text-[11px]">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Food Status */}
                      <td className="py-4 px-6">
                        {student.foodScanned ? (
                          <div className="space-y-1">
                            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[11px]">
                              <UtensilsCrossed className="w-3.5 h-3.5 mr-1 text-amber-400" /> Collected
                            </span>
                            {student.foodScannedAt && (
                              <div className="text-[10px] text-slate-400">
                                {new Date(student.foodScannedAt).toLocaleTimeString("en-IN", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                  hour12: true,
                                })}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-slate-800/80 text-slate-500 font-medium text-[11px]">
                            Pending
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1.5">
                          {/* Toggle Entry Override */}
                          <button
                            onClick={() => handleManualMark(student.rollNo, "entry", student.entryScanned)}
                            disabled={actionLoading === `${student.rollNo}-entry`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              student.entryScanned
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                : "bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                            }`}
                            title={student.entryScanned ? "Revoke entry status" : "Manually check-in"}
                          >
                            {student.entryScanned ? "Undo Entry" : "Check-in"}
                          </button>

                          {/* Toggle Food Override */}
                          <button
                            onClick={() => handleManualMark(student.rollNo, "food", student.foodScanned)}
                            disabled={actionLoading === `${student.rollNo}-food`}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition ${
                              student.foodScanned
                                ? "bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20"
                                : "bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20"
                            }`}
                            title={student.foodScanned ? "Revoke food coupon" : "Manually give food"}
                          >
                            {student.foodScanned ? "Undo Food" : "Give Food"}
                          </button>

                          {/* Resend Email */}
                          <button
                            onClick={() => handleResendEmail(student.rollNo)}
                            disabled={actionLoading === `${student.rollNo}-email`}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition"
                            title="Resend QR Pass Email"
                          >
                            <Send className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete Student */}
                          <button
                            onClick={() => handleDeleteStudent(student.rollNo, student.name)}
                            disabled={actionLoading === `${student.rollNo}-delete`}
                            className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 transition"
                            title="Delete this student"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
