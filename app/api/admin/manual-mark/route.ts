import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  try {
    const { rollNo, type, state } = await req.json();

    if (!rollNo || !type) {
      return NextResponse.json({ success: false, message: "rollNo and type (entry/food) are required" }, { status: 400 });
    }

    const cleanRollNo = String(rollNo).trim();
    const targetState = state !== undefined ? Boolean(state) : true;
    const now = new Date().toISOString();

    const updateDoc: Record<string, unknown> = {
      last_updated_at: now,
    };

    if (type === "entry") {
      updateDoc.entry_scanned = targetState;
      updateDoc.entry_scanned_at = targetState ? now : null;
      updateDoc.entry_scanned_by = targetState ? "admin-manual-override" : "";
    } else if (type === "food") {
      updateDoc.food_scanned = targetState;
      updateDoc.food_scanned_at = targetState ? now : null;
      updateDoc.food_scanned_by = targetState ? "admin-manual-override" : "";
    } else {
      return NextResponse.json({ success: false, message: "Invalid type. Must be 'entry' or 'food'" }, { status: 400 });
    }

    const { error } = await supabase.from("students").update(updateDoc).eq("roll_no", cleanRollNo);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully updated ${type} status for ${cleanRollNo}`,
    });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    console.error("Manual mark Supabase error:", errString);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
