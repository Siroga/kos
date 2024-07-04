import { exec } from "child_process";
import { NextResponse } from "next/server";

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
// To handle a GET request to /api
export async function GET(request: any) {
  try {
    await runWebhook();
    return NextResponse.redirect("/");
  } catch (error) {
    console.error("Error executing webhook:", error);
    return NextResponse.redirect("/");
  }
}
