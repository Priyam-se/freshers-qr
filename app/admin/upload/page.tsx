"use client";

import React, { useState, useEffect } from "react";
import Papa from "papaparse";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Upload,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Send,
  Sparkles,
  RefreshCw,
  QrCode,
  Download,
  UserPlus,
  Mail,
  LogOut,
} from "lucide-react";
import toast from "react-hot-toast";

interface ParsedRow {
  name: string;
  rollNo: string;
  email?: string;
}

export default function AdminUploadPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"bulk" | "single">("bulk");

  // Auth gate check
  useEffect(() => {
    const token = sessionStorage.getItem("cutm_admin_token");
    if (token !== "cutm_admin_session_valid") {
      router.replace("/admin");
    }
  }, [router]);

  // Bulk State
  const [file, setFile] = useState<File | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [rawText, setRawText] = useState("");
  const [sendEmails, setSendEmails] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<{
    inserted: number;
    skipped: number;
    emailsSent: number;
    errors: string[];
  } | null>(null);

  // Single QR Generator State
  const [singleName, setSingleName] = useState("");
  const [singleRollNo, setSingleRollNo] = useState("");
  const [singleEmail, setSingleEmail] = useState("");
  const [singleSendEmail, setSingleSendEmail] = useState(true);
  const [generatingSingle, setGeneratingSingle] = useState(false);
  const [generatedStudent, setGeneratedStudent] = useState<{
    name: string;
    rollNo: string;
    email: string;
    qrToken: string;
    qrDataUrl: string;
    emailSent: boolean;
  } | null>(null);

  // Handle CSV file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = [];
        for (const r of results.data as Record<string, string>[]) {
          const name = r.name || r.Name || r["Student Name"] || r["STUDENT NAME"] || "";
          const rollNo = r.rollNo || r.rollno || r.RollNo || r["Roll Number"] || r["Regd No"] || r["Registration Number"] || "";
          const email = r.email || r.Email || "";

          if (name && rollNo) {
            rows.push({
              name: name.trim(),
              rollNo: rollNo.trim(),
              email: email ? email.trim() : undefined,
            });
          }
        }
        setParsedRows(rows);
        if (rows.length > 0) {
          toast.success(`Parsed ${rows.length} valid student records`);
        } else {
          toast.error("No valid records found in CSV. Please ensure headers 'name' and 'rollNo' exist.");
        }
      },
      error: (err) => {
        toast.error(`CSV Parsing error: ${err.message}`);
      },
    });
  };

  // Handle manual paste parse
  const handleParseText = () => {
    if (!rawText.trim()) return;
    Papa.parse(rawText, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const rows: ParsedRow[] = [];
        for (const r of results.data as Record<string, string>[]) {
          const name = r.name || r.Name || r["Student Name"] || "";
          const rollNo = r.rollNo || r.rollno || r.RollNo || r["Regd No"] || "";
          const email = r.email || r.Email || "";

          if (name && rollNo) {
            rows.push({
              name: name.trim(),
              rollNo: rollNo.trim(),
              email: email ? email.trim() : undefined,
            });
          }
        }
        setParsedRows(rows);
        if (rows.length > 0) {
          toast.success(`Parsed ${rows.length} records from text`);
        } else {
          toast.error("Could not parse records. Check headers (name, rollNo).");
        }
      },
    });
  };

  const handleUploadBatch = async () => {
    if (parsedRows.length === 0) {
      toast.error("No student records to upload");
      return;
    }

    setUploading(true);
    setUploadResult(null);

    try {
      const res = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          students: parsedRows,
          sendEmails,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setUploadResult(data.results);
      } else {
        toast.error(data.message || "Failed to process batch");
      }
    } catch {
      toast.error("Network error during batch upload");
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateSingle = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim() || !singleRollNo.trim()) {
      toast.error("Name and Roll Number are required");
      return;
    }

    setGeneratingSingle(true);
    setGeneratedStudent(null);

    try {
      const res = await fetch("/api/admin/generate-single", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: singleName.trim(),
          rollNo: singleRollNo.trim(),
          email: singleEmail.trim() || undefined,
          sendEmail: singleSendEmail,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success(data.message);
        setGeneratedStudent(data.student);
      } else {
        toast.error(data.message || "Failed to generate QR code");
      }
    } catch {
      toast.error("Failed to generate QR code");
    } finally {
      setGeneratingSingle(false);
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
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard" className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">QR Pass Generator & Import</h1>
              <p className="text-xs text-slate-400">Generate and email unique freshers verification QR codes</p>
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

      {/* Main Container */}
      <main className="max-w-5xl w-full mx-auto p-6 space-y-6 flex-1">
        {/* Mode Selector Tabs */}
        <div className="flex items-center space-x-3 border-b border-slate-800 pb-4">
          <button
            onClick={() => setActiveTab("bulk")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition ${
              activeTab === "bulk"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            <span>Bulk CSV Roster Import</span>
          </button>

          <button
            onClick={() => setActiveTab("single")}
            className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center space-x-2 transition ${
              activeTab === "single"
                ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
            }`}
          >
            <QrCode className="w-4 h-4" />
            <span>Single QR Pass Generator & Download</span>
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 1: BULK CSV UPLOAD & EMAIL DISPATCH */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "bulk" && (
          <div className="space-y-6">
            {/* Step 1: Upload / Input Card */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">1. Select CSV or Paste Roster Data</h2>
                  <p className="text-xs text-slate-400">
                    Required CSV headers: <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">name</code> and{" "}
                    <code className="bg-slate-800 px-1.5 py-0.5 rounded text-indigo-300">rollNo</code>. Emails automatically derive as{" "}
                    <code className="text-slate-400 font-mono">rollNo@cutm.ac.in</code>.
                  </p>
                </div>
              </div>

              {/* File Upload Box */}
              <div className="border-2 border-dashed border-slate-700 hover:border-indigo-500/50 bg-slate-950/50 rounded-2xl p-8 text-center transition">
                <input
                  type="file"
                  accept=".csv,text/csv"
                  onChange={handleFileChange}
                  id="csv-file-input"
                  className="hidden"
                />
                <label htmlFor="csv-file-input" className="cursor-pointer flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center">
                    <Upload className="w-6 h-6" />
                  </div>
                  <div>
                    <span className="text-sm font-bold text-indigo-400 hover:underline">Click to browse CSV file</span>
                    <span className="text-xs text-slate-400"> or drag and drop your freshers dataset</span>
                  </div>
                  {file && (
                    <p className="text-xs font-mono text-emerald-400 font-semibold bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                      Selected: {file.name} ({parsedRows.length} students detected)
                    </p>
                  )}
                </label>
              </div>

              {/* Alternative: Paste CSV directly */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                  Or paste CSV text directly:
                </label>
                <textarea
                  rows={4}
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                  placeholder={"name,rollNo\nRahul Sharma,260314100001\nPriya Das,260314100002\nAmit Kumar,260314100003"}
                  className="w-full p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs font-mono text-slate-200 placeholder-slate-600 focus:outline-none focus:border-indigo-500 transition"
                />
                {rawText && (
                  <button
                    type="button"
                    onClick={handleParseText}
                    className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-lg text-slate-300 transition"
                  >
                    Parse Pasted Text
                  </button>
                )}
              </div>
            </div>

            {/* Step 2: Settings & Confirmation */}
            {parsedRows.length > 0 && (
              <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-6 animate-in fade-in duration-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-white">2. Preview & Options ({parsedRows.length} Students)</h2>
                      <p className="text-xs text-slate-400">Review the sample list below before committing to Firebase</p>
                    </div>
                  </div>

                  {/* Toggle Send Emails */}
                  <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
                    <input
                      type="checkbox"
                      checked={sendEmails}
                      onChange={(e) => setSendEmails(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                    />
                    <span className="text-xs font-semibold text-slate-300 flex items-center">
                      <Send className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                      Dispatch QR Pass Emails Now
                    </span>
                  </label>
                </div>

                {/* Preview Table */}
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/60">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-900 text-slate-400 font-semibold border-b border-slate-800">
                      <tr>
                        <th className="py-2.5 px-4">#</th>
                        <th className="py-2.5 px-4">Roll Number</th>
                        <th className="py-2.5 px-4">Student Name</th>
                        <th className="py-2.5 px-4">Computed Email Address</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {parsedRows.slice(0, 5).map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-800/30">
                          <td className="py-2.5 px-4 text-slate-500">{idx + 1}</td>
                          <td className="py-2.5 px-4 font-mono font-bold text-indigo-300">{row.rollNo}</td>
                          <td className="py-2.5 px-4 font-semibold text-white">{row.name}</td>
                          <td className="py-2.5 px-4 font-mono text-slate-400">{row.email || `${row.rollNo}@cutm.ac.in`}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {parsedRows.length > 5 && (
                    <div className="p-2.5 text-center text-xs text-slate-500 bg-slate-950">
                      ...and {parsedRows.length - 5} more students ready to process.
                    </div>
                  )}
                </div>

                {/* Action Trigger */}
                <div className="flex items-center justify-end space-x-3 pt-2">
                  <button
                    onClick={() => {
                      setParsedRows([]);
                      setFile(null);
                      setRawText("");
                    }}
                    disabled={uploading}
                    className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold rounded-xl transition"
                  >
                    Clear
                  </button>

                  <button
                    onClick={handleUploadBatch}
                    disabled={uploading}
                    className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-indigo-600/25 flex items-center space-x-2 transition"
                  >
                    {uploading ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Processing {parsedRows.length} Students & Sending Emails...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>Import {parsedRows.length} Students & Generate QRs</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Result Summary */}
            {uploadResult && (
              <div className="bg-slate-900/80 border border-emerald-500/30 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Batch Import Completed Successfully!</h3>
                    <p className="text-xs text-slate-400">All student records have been saved into Firestore</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4 pt-2">
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                    <span className="text-xs text-slate-400">New Freshers Inserted</span>
                    <p className="text-2xl font-black text-emerald-400 mt-1">{uploadResult.inserted}</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                    <span className="text-xs text-slate-400">Updated / Kept</span>
                    <p className="text-2xl font-black text-slate-300 mt-1">{uploadResult.skipped}</p>
                  </div>
                  <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl text-center">
                    <span className="text-xs text-slate-400">Emails Dispatched</span>
                    <p className="text-2xl font-black text-indigo-400 mt-1">{uploadResult.emailsSent}</p>
                  </div>
                </div>

                {uploadResult.errors.length > 0 && (
                  <div className="p-4 bg-rose-950/40 border border-rose-800/60 rounded-2xl space-y-2">
                    <span className="text-xs font-bold text-rose-400 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" /> Warnings / Email Failures ({uploadResult.errors.length})
                    </span>
                    <ul className="list-disc pl-5 text-[11px] text-rose-200/80 space-y-1">
                      {uploadResult.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  </div>
                )}

                <div className="pt-2">
                  <Link
                    href="/admin/dashboard"
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl shadow transition"
                  >
                    Go to Live Dashboard <ArrowLeft className="w-3.5 h-3.5 ml-1 rotate-180" />
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══════════════════════════════════════════════════════════════ */}
        {/* TAB 2: SINGLE ON-DEMAND QR GENERATOR & DOWNLOAD */}
        {/* ═══════════════════════════════════════════════════════════════ */}
        {activeTab === "single" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            {/* Form */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-5">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-white">Generate Individual Fresher QR</h2>
                  <p className="text-xs text-slate-400">Generate, display, download, and email on the spot</p>
                </div>
              </div>

              <form onSubmit={handleGenerateSingle} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Student Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={singleName}
                    onChange={(e) => setSingleName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Registration / Roll Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={singleRollNo}
                    onChange={(e) => setSingleRollNo(e.target.value)}
                    placeholder="e.g. 260314100001"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Institutional Email (Optional)
                  </label>
                  <input
                    type="email"
                    value={singleEmail}
                    onChange={(e) => setSingleEmail(e.target.value)}
                    placeholder="Defaults to rollNo@cutm.ac.in"
                    className="w-full px-4 py-2.5 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 font-mono focus:outline-none focus:border-indigo-500 transition"
                  />
                </div>

                <label className="flex items-center space-x-2.5 cursor-pointer bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl">
                  <input
                    type="checkbox"
                    checked={singleSendEmail}
                    onChange={(e) => setSingleSendEmail(e.target.checked)}
                    className="w-4 h-4 rounded text-indigo-600 focus:ring-indigo-500 bg-slate-900 border-slate-700"
                  />
                  <span className="text-xs font-semibold text-slate-300 flex items-center">
                    <Mail className="w-3.5 h-3.5 mr-1 text-indigo-400" />
                    Also send QR pass via Email
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={generatingSingle}
                  className="w-full py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center space-x-2 transition"
                >
                  {generatingSingle ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Generating QR Code...</span>
                    </>
                  ) : (
                    <>
                      <QrCode className="w-4 h-4" />
                      <span>Generate QR Code Now</span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Preview Box */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-3xl p-6 shadow-xl flex flex-col items-center justify-center text-center space-y-4 min-h-[380px]">
              {generatedStudent ? (
                <div className="space-y-4 animate-in fade-in zoom-in duration-200">
                  <div className="p-4 bg-white rounded-2xl shadow-xl inline-block">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={generatedStudent.qrDataUrl}
                      alt={`QR Code for ${generatedStudent.rollNo}`}
                      className="w-48 h-48 block"
                    />
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white">{generatedStudent.name}</h3>
                    <p className="text-xs font-mono text-indigo-400 font-semibold">{generatedStudent.rollNo}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{generatedStudent.email}</p>
                  </div>

                  <div className="flex items-center justify-center space-x-2 pt-2">
                    <a
                      href={generatedStudent.qrDataUrl}
                      download={`cutm-qr-${generatedStudent.rollNo}.png`}
                      className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download PNG</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-slate-500 space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-800 flex items-center justify-center mx-auto text-slate-600">
                    <QrCode className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-semibold text-slate-400">No QR Generated Yet</h4>
                  <p className="text-xs max-w-xs">
                    Fill out student details on the left and click &apos;Generate QR Code Now&apos; to view and download the pass.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
