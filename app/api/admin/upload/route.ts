import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { v4 as uuidv4 } from "uuid";
import { sendFresherPassEmail } from "@/lib/mailer";

export interface StudentInputRow {
  name: string;
  rollNo: string;
  email?: string;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const students: StudentInputRow[] = body.students;
    const sendEmailsImmediately: boolean = body.sendEmails !== false;

    if (!students || !Array.isArray(students) || students.length === 0) {
      return NextResponse.json({ success: false, message: "No student records provided" }, { status: 400 });
    }

    const results = {
      total: students.length,
      inserted: 0,
      skipped: 0,
      emailsSent: 0,
      emailFailures: 0,
      errors: [] as string[],
    };

    const now = new Date().toISOString();

    for (const raw of students) {
      const name = raw.name?.trim();
      const rollNo = raw.rollNo?.trim();

      if (!name || !rollNo) {
        results.errors.push("Skipped row: Missing name or roll number");
        results.skipped++;
        continue;
      }

      let email = raw.email?.trim();
      if (!email) {
        email = `${rollNo}@cutm.ac.in`.toLowerCase();
      }

      // Check existing
      const { data: existing } = await supabase
        .from("students")
        .select("qr_token, email_sent")
        .eq("roll_no", rollNo)
        .maybeSingle();

      let qrToken: string;

      if (existing) {
        qrToken = existing.qr_token || uuidv4();
        await supabase
          .from("students")
          .update({
            name,
            email,
            qr_token: qrToken,
            last_updated_at: now,
          })
          .eq("roll_no", rollNo);
        results.skipped++;
      } else {
        qrToken = uuidv4();
        await supabase.from("students").insert({
          name,
          roll_no: rollNo,
          email,
          qr_token: qrToken,
          email_sent: false,
          entry_scanned: false,
          food_scanned: false,
          created_at: now,
          last_updated_at: now,
        });
        results.inserted++;
      }

      // Send email if requested
      if (sendEmailsImmediately) {
        const emailRes = await sendFresherPassEmail({
          name,
          rollNo,
          email,
          qrToken,
        });

        if (emailRes.success) {
          results.emailsSent++;
          await supabase.from("students").update({ email_sent: true }).eq("roll_no", rollNo);
        } else {
          results.emailFailures++;
          results.errors.push(`Email failed for ${name} (${email}): ${emailRes.error}`);
        }
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch processed: ${results.inserted} inserted, ${results.skipped} updated/skipped, ${results.emailsSent} emails sent.`,
      results,
    });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    console.error("Batch upload Supabase error:", errString);
    return NextResponse.json({ success: false, message: `Batch processing failed: ${errString}` }, { status: 500 });
  }
}
