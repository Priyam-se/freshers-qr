import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { generateQRCodeDataURL } from "@/lib/qr";
import { sendFresherPassEmail } from "@/lib/mailer";

export async function POST(req: NextRequest) {
  try {
    const { name, rollNo, email: explicitEmail, sendEmail } = await req.json();

    if (!name || !rollNo) {
      return NextResponse.json({ success: false, message: "Name and Roll Number are required" }, { status: 400 });
    }

    const cleanName = name.trim();
    const cleanRollNo = rollNo.trim();
    const cleanEmail = explicitEmail ? explicitEmail.trim() : `${cleanRollNo}@cutm.ac.in`.toLowerCase();
    const now = new Date().toISOString();

    const { data: existing } = await supabase
      .from("students")
      .select("qr_token")
      .eq("roll_no", cleanRollNo)
      .maybeSingle();

    let qrToken: string;

    if (existing) {
      qrToken = existing.qr_token || uuidv4();
      await supabase
        .from("students")
        .update({
          name: cleanName,
          email: cleanEmail,
          qr_token: qrToken,
          last_updated_at: now,
        })
        .eq("roll_no", cleanRollNo);
    } else {
      qrToken = uuidv4();
      await supabase.from("students").insert({
        name: cleanName,
        roll_no: cleanRollNo,
        email: cleanEmail,
        qr_token: qrToken,
        email_sent: false,
        entry_scanned: false,
        food_scanned: false,
        created_at: now,
        last_updated_at: now,
      });
    }

    // Generate Base64 QR Image Data URL
    const qrDataUrl = await generateQRCodeDataURL(qrToken);

    let emailSent = false;
    if (sendEmail) {
      const emailRes = await sendFresherPassEmail({
        name: cleanName,
        rollNo: cleanRollNo,
        email: cleanEmail,
        qrToken,
      });
      if (emailRes.success) {
        emailSent = true;
        await supabase.from("students").update({ email_sent: true }).eq("roll_no", cleanRollNo);
      }
    }

    return NextResponse.json({
      success: true,
      message: `QR Pass generated for ${cleanName} (${cleanRollNo})`,
      student: {
        name: cleanName,
        rollNo: cleanRollNo,
        email: cleanEmail,
        qrToken,
        qrDataUrl,
        emailSent,
      },
    });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    console.error("Single QR generator Supabase error:", errString);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
