import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { sendFresherPassEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { rollNo } = await req.json();

    if (!rollNo) {
      return NextResponse.json({ success: false, message: "Roll number is required" }, { status: 400 });
    }

    const cleanRollNo = String(rollNo).trim();

    const { data: student, error } = await supabase
      .from("students")
      .select("*")
      .eq("roll_no", cleanRollNo)
      .maybeSingle();

    if (error || !student) {
      return NextResponse.json({ success: false, message: `Student ${cleanRollNo} not found` }, { status: 404 });
    }

    const emailRes = await sendFresherPassEmail({
      name: student.name,
      rollNo: student.roll_no || cleanRollNo,
      email: student.email,
      qrToken: student.qr_token,
    });

    if (emailRes.success) {
      await supabase.from("students").update({ email_sent: true }).eq("roll_no", cleanRollNo);
      return NextResponse.json({ success: true, message: `Email resent successfully to ${student.email}` });
    } else {
      return NextResponse.json({ success: false, message: `Failed to send email: ${emailRes.error}` }, { status: 500 });
    }
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
