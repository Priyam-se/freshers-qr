import { NextRequest, NextResponse } from "next/server";
import { getScannerPins, updateScannerPins } from "@/lib/pins";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const pins = await getScannerPins();
    return NextResponse.json({ success: true, pins });
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { entryPin, foodPin } = await req.json();

    if (!entryPin || !foodPin) {
      return NextResponse.json({ success: false, message: "Both entryPin and foodPin are required" }, { status: 400 });
    }

    const updated = await updateScannerPins(String(entryPin).trim(), String(foodPin).trim());

    if (updated) {
      return NextResponse.json({ success: true, message: "PINs updated successfully" });
    } else {
      return NextResponse.json({ success: false, message: "Failed to persist PINs" }, { status: 500 });
    }
  } catch (error: unknown) {
    const errString = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ success: false, message: errString }, { status: 500 });
  }
}
