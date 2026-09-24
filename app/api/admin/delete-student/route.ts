import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// DELETE single student by rollNo OR clear entire batch
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rollNo = searchParams.get("rollNo")?.trim();
    const clearAll = searchParams.get("clearAll") === "true";

    if (clearAll) {
      // Clear all students in the database
      const { error } = await supabase.from("students").delete().neq("id", 0);

      if (error) {
        return NextResponse.json({ success: false, message: error.message }, { status: 500 });
      }

      return NextResponse.json({
        success: true,
        message: "All student records have been deleted successfully.",
      });
    }

    if (!rollNo) {
      return NextResponse.json({ success: false, message: "Roll number is required" }, { status: 400 });
    }

    // Delete single student
    const { error } = await supabase.from("students").delete().eq("roll_no", rollNo);

    if (error) {
      return NextResponse.json({ success: false, message: error.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: `Student ${rollNo} deleted successfully.`,
    });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    console.error("Delete student Supabase error:", errString);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
