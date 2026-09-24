import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const qrToken = body.qrToken?.trim();
    const scannerId = body.scannerId || "food-station-1";

    if (!qrToken) {
      return NextResponse.json({ status: "invalid", message: "QR code token missing" }, { status: 400 });
    }

    // 1. Fetch student
    const { data: student, error: fetchErr } = await supabase
      .from("students")
      .select("*")
      .eq("qr_token", qrToken)
      .maybeSingle();

    if (fetchErr || !student) {
      return NextResponse.json({
        status: "invalid",
        message: "Unrecognized QR code. Student is not registered in system.",
      });
    }

    // 2. Check if already scanned for food
    if (student.food_scanned) {
      const scannedTime = student.food_scanned_at
        ? new Date(student.food_scanned_at).toLocaleTimeString("en-IN", {
            hour: "2-digit",
            minute: "2-digit",
            second: "2-digit",
            hour12: true,
          })
        : "earlier";

      return NextResponse.json({
        status: "already_scanned",
        name: student.name,
        rollNo: student.roll_no,
        scannedAt: scannedTime,
        message: `Food coupon already collected at ${scannedTime}!`,
      });
    }

    // 3. Atomic conditional update for food (anti-duplicate guarantee)
    const now = new Date().toISOString();
    const { data: updatedRows, error: updateErr } = await supabase
      .from("students")
      .update({
        food_scanned: true,
        food_scanned_at: now,
        food_scanned_by: scannerId,
        last_updated_at: now,
      })
      .eq("qr_token", qrToken)
      .eq("food_scanned", false)
      .select();

    if (updateErr || !updatedRows || updatedRows.length === 0) {
      // Concurrently scanned at the exact same millisecond
      return NextResponse.json({
        status: "already_scanned",
        name: student.name,
        rollNo: student.roll_no,
        scannedAt: "just now",
        message: "Food coupon already collected!",
      });
    }

    return NextResponse.json({
      status: "success",
      name: student.name,
      rollNo: student.roll_no,
      message: "Food token approved! Enjoy your meal 🍽️",
    });
  } catch (error) {
    console.error("Food scan Supabase error:", error);
    return NextResponse.json(
      { status: "invalid", message: "Database connection failed. Please check Supabase credentials." },
      { status: 500 }
    );
  }
}
