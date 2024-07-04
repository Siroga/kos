import { exec } from "child_process";
import { NextResponse } from "next/server";

// To handle a GET request to /api
export async function GET(request: any) {
  try {
    await runWebhook();
    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error("Error executing webhook:", error);
    return NextResponse.json({ message: "Internal Server Error" });
  }

  // Do whatever you want
  return NextResponse.json({ message: "Hello World" }, { status: 200 });
}

const runWebhook = async () => {
  return new Promise((resolve, reject) => {
    exec(
      "/home/user/Desktop/deploy.sh",
      { cwd: "/home/user/kos/" },
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error executing shell script: ${error}`);
          reject("Internal Server Error");
        } else {
          console.log(`Shell script output: ${stdout}`);
          resolve("Shell script executed successfully");
        }
      }
    );
  });
};
