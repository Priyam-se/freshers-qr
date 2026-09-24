import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

interface StudentDbRow {
  id: number;
  roll_no: string;
  name: string;
  email: string;
  qr_token: string;
  email_sent: boolean;
  entry_scanned: boolean;
  entry_scanned_at: string | null;
  entry_scanned_by: string | null;
  food_scanned: boolean;
  food_scanned_at: string | null;
  food_scanned_by: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search")?.toLowerCase().trim() || "";

    let query = supabase.from("students").select("*").order("roll_no", { ascending: true });

    if (search) {
      query = query.or(`name.ilike.%${search}%,roll_no.ilike.%${search}%,email.ilike.%${search}%`);
    }

    const { data: allStudents, error } = await query;

    if (error) {
      console.warn("Supabase query error (or empty during setup):", error.message);
    }

    const rows: StudentDbRow[] = allStudents || [];

    let total = 0;
    let entryCount = 0;
    let foodCount = 0;

    const students = rows.map((row) => {
      total++;
      if (row.entry_scanned) entryCount++;
      if (row.food_scanned) foodCount++;

      return {
        id: String(row.id),
        name: row.name,
        rollNo: row.roll_no,
        email: row.email,
        qrToken: row.qr_token,
        emailSent: Boolean(row.email_sent),
        entryScanned: Boolean(row.entry_scanned),
        entryScannedAt: row.entry_scanned_at,
        entryScannedBy: row.entry_scanned_by || "",
        foodScanned: Boolean(row.food_scanned),
        foodScannedAt: row.food_scanned_at,
        foodScannedBy: row.food_scanned_by || "",
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        total,
        entryCount,
        foodCount,
        entryPercentage: total > 0 ? Math.round((entryCount / total) * 100) : 0,
        foodPercentage: total > 0 ? Math.round((foodCount / total) * 100) : 0,
      },
      students,
    });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    console.error("Failed to fetch admin stats Supabase:", errString);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
