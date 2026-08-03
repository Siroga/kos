import { NextResponse } from "next/server";
import { exec } from "child_process";

export async function POST(request: Request) {
  try {
    // Execute system reboot command asynchronously
    exec("sudo reboot || reboot", (error) => {
      if (error) {
        console.error("Reboot error:", error);
      }
    });

    return NextResponse.json({ success: true, message: "Reboot initiated" });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
