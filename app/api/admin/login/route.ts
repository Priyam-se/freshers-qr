import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();

    const expectedPassword = process.env.ADMIN_PASSWORD || "cutm@admin2026";

    if (!password) {
      return NextResponse.json({ success: false, message: "Password is required" }, { status: 400 });
    }

    if (password.trim() === expectedPassword.trim()) {
      return NextResponse.json({
        success: true,
        message: "Admin authentication successful",
        token: "cutm_admin_session_valid",
      });
    } else {
      return NextResponse.json({ success: false, message: "Incorrect Admin Password" }, { status: 401 });
    }
  } catch (error) {
    console.error("Admin login error:", error);
    return NextResponse.json({ success: false, message: "Internal server error" }, { status: 500 });
  }
}
