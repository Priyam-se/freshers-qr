import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Reset all attendance and food scan timestamps back to unverified
export async function POST(req: NextRequest) {
  try {
    const now = new Date().toISOString();
    const { error } = await supabase
      .from("students")
      .update({
        entry_scanned: false,
        entry_scanned_at: null,
        entry_scanned_by: null,
        food_scanned: false,
        food_scanned_at: null,
        food_scanned_by: null,
        last_updated_at: now,
      })
      .neq("id", 0);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "All student scan states have been reset to pending.",
    });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
