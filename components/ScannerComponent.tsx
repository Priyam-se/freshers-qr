"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { Html5Qrcode } from "html5-qrcode";
import { CheckCircle2, AlertTriangle, XCircle, Shield, Camera, RefreshCw, KeyRound, ArrowLeft, Volume2, VolumeX } from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

interface ScannerProps {
  type: "entry" | "food";
  title: string;
  badgeLabel: string;
  badgeColor: string;
  apiEndpoint: string;
}

interface ScanState {
  status: "idle" | "scanning" | "processing" | "success" | "already_scanned" | "invalid";
  name?: string;
  rollNo?: string;
  scannedAt?: string;
  message?: string;
}

export default function ScannerComponent({
  type,
  title,
  badgeLabel,
  badgeColor,
  apiEndpoint,
}: ScannerProps) {
  // PIN Auth
  const [pin, setPin] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [pinLoading, setPinLoading] = useState(false);

  // Scanner
  const [scanState, setScanState] = useState<ScanState>({ status: "idle" });
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [manualToken, setManualToken] = useState("");
  const [isManualSubmitting, setIsManualSubmitting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isProcessingRef = useRef(false);

  // Audio tone generator using Web Audio API
  const playSound = useCallback((toneType: "success" | "warning" | "error") => {
    if (!audioEnabled || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();

      if (toneType === "success") {
        // High, cheerful double beep
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
        osc.frequency.setValueAtTime(1174.66, ctx.currentTime + 0.1); // D6
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else if (toneType === "warning") {
        // Double warning buzz
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(440, ctx.currentTime);
        osc.frequency.setValueAtTime(330, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.4);
      } else {
        // Low error thud
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "square";
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        gain.gain.setValueAtTime(0.4, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.3);
      }
    } catch {
      // Ignore audio context errors
    }
  }, [audioEnabled]);

  // Check cached PIN on mount
  useEffect(() => {
    const savedPin = sessionStorage.getItem(`fresher_pin_${type}`);
    if (savedPin) {
      verifyPin(savedPin);
    }
  }, [type]);

  const verifyPin = async (inputPin: string) => {
    setPinLoading(true);
    try {
      const res = await fetch("/api/scan/verify-pin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pin: inputPin, type }),
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthorized(true);
        sessionStorage.setItem(`fresher_pin_${type}`, inputPin);
        toast.success("Station unlocked!");
      } else {
        toast.error(data.message || "Invalid Station PIN");
      }
    } catch (err) {
      toast.error("Failed to authenticate PIN");
    } finally {
      setPinLoading(false);
    }
  };

  const handleProcessQR = useCallback(async (tokenText: string) => {
    if (isProcessingRef.current) return;
    isProcessingRef.current = true;
    setScanState({ status: "processing" });

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrToken: tokenText }),
      });

      const data = await res.json();

      if (data.status === "success") {
        playSound("success");
        setScanState({
          status: "success",
          name: data.name,
          rollNo: data.rollNo,
          message: data.message,
        });
      } else if (data.status === "already_scanned") {
        playSound("warning");
        setScanState({
          status: "already_scanned",
          name: data.name,
          rollNo: data.rollNo,
          scannedAt: data.scannedAt,
          message: data.message,
        });
      } else {
        playSound("error");
        setScanState({
          status: "invalid",
          message: data.message || "Unrecognized QR Code",
        });
      }
    } catch (err) {
      playSound("error");
      setScanState({
        status: "invalid",
        message: "Network/Server error during scan verification",
      });
    } finally {
      // Reset scan window after 3.2 seconds so operator can scan next student
      setTimeout(() => {
        setScanState({ status: "idle" });
        isProcessingRef.current = false;
      }, 3200);
    }
  }, [apiEndpoint, playSound]);

  // Start Camera
  const startScanner = useCallback(async () => {
    try {
      setCameraError(null);
      if (scannerRef.current) {
        try {
          await scannerRef.current.stop();
        } catch {}
      }

      const scanner = new Html5Qrcode("qr-reader-container");
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: "environment" },
        {
          fps: 15,
          qrbox: { width: 260, height: 260 },
          aspectRatio: 1.0,
        },
        (decodedText) => {
          handleProcessQR(decodedText);
        },
        () => {
          // ignore scan frame errors
        }
      );

      setIsCameraActive(true);
    } catch (err: unknown) {
      console.error("Camera start error:", err);
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(msg || "Could not access camera. Please check browser permissions.");
      setIsCameraActive(false);
    }
  }, [handleProcessQR]);

  // Stop Camera
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isCameraActive) {
      try {
        await scannerRef.current.stop();
        setIsCameraActive(false);
      } catch (err) {
        console.error("Error stopping scanner:", err);
      }
    }
  }, [isCameraActive]);

  useEffect(() => {
    if (isAuthorized) {
      startScanner();
    }
    return () => {
      if (scannerRef.current) {
        try {
          scannerRef.current.stop();
        } catch {}
      }
    };
  }, [isAuthorized, startScanner]);

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualToken.trim()) return;
    setIsManualSubmitting(true);
    await handleProcessQR(manualToken.trim());
    setManualToken("");
    setIsManualSubmitting(false);
  };

  // 1. PIN GATE VIEW
  if (!isAuthorized) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-slate-950">
        <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-8 shadow-2xl">
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-indigo-500/10 text-indigo-400 mb-4 border border-indigo-500/20">
              <Shield className="w-8 h-8" />
            </div>
            <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider mb-2 ${badgeColor}`}>
              {badgeLabel}
            </span>
            <h1 className="text-2xl font-extrabold text-white tracking-tight">{title}</h1>
            <p className="text-slate-400 text-sm mt-1">Enter station security PIN to activate camera</p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              verifyPin(pin);
            }}
            className="space-y-4"
          >
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">
                Station PIN
              </label>
              <div className="relative">
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={8}
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="Enter 4-digit PIN"
                  className="w-full px-4 py-3 bg-slate-950 border border-slate-700 rounded-xl text-white text-center text-2xl tracking-widest focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition"
                  autoFocus
                />
                <KeyRound className="w-5 h-5 text-slate-500 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <button
              type="submit"
              disabled={pinLoading || !pin}
              className="w-full py-3.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white font-bold rounded-xl shadow-lg shadow-indigo-600/25 transition duration-200"
            >
              {pinLoading ? "Verifying..." : "Unlock Scanner"}
            </button>
          </form>

          <div className="mt-6 text-center">
            <Link href="/" className="inline-flex items-center text-xs text-slate-500 hover:text-slate-300">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Back to Home
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. MAIN ACTIVE SCANNER VIEW
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col text-slate-100">
      {/* Header */}
      <header className="px-4 py-3 bg-slate-900/80 backdrop-blur border-b border-slate-800 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center space-x-3">
          <Link href="/" className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${badgeColor}`}>
                {badgeLabel}
              </span>
              <h2 className="text-base font-bold text-white">{title}</h2>
            </div>
            <p className="text-xs text-slate-400">BCA Freshers 2026</p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setAudioEnabled(!audioEnabled)}
            className={`p-2 rounded-lg transition ${audioEnabled ? "bg-indigo-500/20 text-indigo-400" : "bg-slate-800 text-slate-500"}`}
            title={audioEnabled ? "Sound enabled" : "Sound muted"}
          >
            {audioEnabled ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
          </button>
          <button
            onClick={() => {
              sessionStorage.removeItem(`fresher_pin_${type}`);
              setIsAuthorized(false);
            }}
            className="text-xs px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-900/30 hover:text-rose-400 text-slate-400 transition"
          >
            Lock
          </button>
        </div>
      </header>

      {/* Scanner Screen & Result Overlays */}
      <main className="flex-1 max-w-lg w-full mx-auto p-4 flex flex-col justify-center relative">
        <div className="relative bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-2xl aspect-square flex items-center justify-center">
          {/* Camera Video Mount */}
          <div id="qr-reader-container" className="w-full h-full object-cover"></div>

          {/* Fallback Camera State / Retrying */}
          {cameraError && (
            <div className="absolute inset-0 bg-slate-900/95 flex flex-col items-center justify-center p-6 text-center z-10">
              <Camera className="w-12 h-12 text-rose-400 mb-3" />
              <h3 className="text-lg font-bold text-white mb-1">Camera Permission Needed</h3>
              <p className="text-xs text-slate-400 mb-4">{cameraError}</p>
              <button
                onClick={startScanner}
                className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Retry Camera</span>
              </button>
            </div>
          )}

          {/* 🟢 SUCCESS FLASH OVERLAY */}
          {scanState.status === "success" && (
            <div className="absolute inset-0 bg-emerald-600/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in zoom-in duration-200">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 text-white shadow-lg animate-bounce">
                <CheckCircle2 className="w-12 h-12" />
              </div>
              <span className="px-3 py-1 bg-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wider mb-2">
                Verified Successfully
              </span>
              <h2 className="text-3xl font-black text-white tracking-tight leading-tight">{scanState.name}</h2>
              <p className="text-emerald-100 font-mono text-base font-semibold mt-1">{scanState.rollNo}</p>
              <div className="mt-4 px-4 py-2 bg-emerald-700/60 rounded-xl text-xs font-medium text-emerald-50">
                {scanState.message}
              </div>
            </div>
          )}

          {/* 🟡 DUPLICATE / ALREADY SCANNED OVERLAY */}
          {scanState.status === "already_scanned" && (
            <div className="absolute inset-0 bg-amber-600/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in zoom-in duration-200">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 text-white shadow-lg">
                <AlertTriangle className="w-12 h-12" />
              </div>
              <span className="px-3 py-1 bg-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wider mb-2">
                Already Scanned Once ⚠️
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">{scanState.name}</h2>
              <p className="text-amber-100 font-mono text-sm font-semibold mt-1">{scanState.rollNo}</p>
              <div className="mt-4 px-4 py-2.5 bg-amber-800/70 border border-amber-400/30 rounded-xl text-xs font-bold text-white shadow">
                Scanned previously at: {scanState.scannedAt || "earlier"}
              </div>
            </div>
          )}

          {/* 🔴 INVALID QR OVERLAY */}
          {scanState.status === "invalid" && (
            <div className="absolute inset-0 bg-rose-600/95 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20 animate-in fade-in zoom-in duration-200">
              <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center mb-4 text-white shadow-lg">
                <XCircle className="w-12 h-12" />
              </div>
              <span className="px-3 py-1 bg-white/30 rounded-full text-xs font-bold text-white uppercase tracking-wider mb-2">
                Scan Rejected
              </span>
              <h2 className="text-2xl font-black text-white tracking-tight leading-tight">Invalid Pass</h2>
              <p className="text-rose-100 text-xs font-medium mt-2 max-w-xs">{scanState.message}</p>
            </div>
          )}

          {/* ⏳ PROCESSING SPINNER */}
          {scanState.status === "processing" && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center z-20">
              <RefreshCw className="w-10 h-10 text-indigo-400 animate-spin mb-3" />
              <p className="text-sm font-semibold text-white">Verifying pass...</p>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-4 text-center">
          <p className="text-xs text-slate-400">
            Align fresher&apos;s QR code within camera frame. Auto-scans on detection.
          </p>
        </div>

        {/* Manual Code Input Fallback */}
        <div className="mt-4 bg-slate-900/60 border border-slate-800/80 rounded-2xl p-3">
          <form onSubmit={handleManualSubmit} className="flex space-x-2">
            <input
              type="text"
              value={manualToken}
              onChange={(e) => setManualToken(e.target.value)}
              placeholder="Manual QR Token (if camera fails)..."
              className="flex-1 px-3 py-2 bg-slate-950 border border-slate-700 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
            <button
              type="submit"
              disabled={isManualSubmitting || !manualToken.trim()}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition"
            >
              Verify
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
