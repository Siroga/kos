import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!newPassword || typeof newPassword !== "string" || newPassword.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Nové heslo nesmí být prázdné" }, { status: 400 });
    }

    const configPath = path.join(process.cwd(), "config.json");
    let config: Record<string, any> = { password: "JirkA1234", printerMac: null };

    if (fs.existsSync(configPath)) {
      try {
        const fileData = fs.readFileSync(configPath, "utf-8");
        config = JSON.parse(fileData);
      } catch (e) {}
    }

    const validPassword = config.password || "JirkA1234";

    if (currentPassword !== validPassword) {
      return NextResponse.json({ success: false, error: "Nesprávné současné heslo" }, { status: 401 });
    }

    config.password = newPassword.trim();
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2), "utf-8");

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
