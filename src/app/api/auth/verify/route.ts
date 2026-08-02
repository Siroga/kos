import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { password } = body;

    const configPath = path.join(process.cwd(), "config.json");
    let validPassword = "JirkA1234";

    if (fs.existsSync(configPath)) {
      const fileData = fs.readFileSync(configPath, "utf-8");
      const config = JSON.parse(fileData);
      if (config.password) {
        validPassword = config.password;
      }
    }

    if (password === validPassword) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ success: false }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}
