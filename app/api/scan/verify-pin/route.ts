import { NextRequest, NextResponse } from "next/server";
import { getScannerPins } from "@/lib/pins";

export async function POST(req: NextRequest) {
  try {
    const { pin, type } = await req.json();

    if (!pin || !type) {
      return NextResponse.json({ success: false, message: "PIN and type are required" }, { status: 400 });
    }

    const pins = await getScannerPins();
    let isValid = false;

    if (type === "entry") {
      isValid = pin.trim() === pins.entryPin.trim();
    } else if (type === "food") {
      isValid = pin.trim() === pins.foodPin.trim();
    }

    if (isValid) {
      return NextResponse.json({ success: true, message: "PIN verified" });
    } else {
      return NextResponse.json({ success: false, message: "Invalid PIN entered" }, { status: 401 });
    }
  } catch (error) {
    console.error("Error verifying PIN:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
