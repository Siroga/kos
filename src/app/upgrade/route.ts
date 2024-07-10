import { exec } from "child_process";
import { NextApiRequest, NextApiResponse } from "next";
import { NextRequest, NextResponse } from "next/server";

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
export async function POST(req: NextRequest, res: NextResponse) {
  try {
    await runWebhook();
    return NextResponse.json({ message: "Success" });
  } catch (error) {
    console.error("Error executing webhook:", error);
    return NextResponse.json({ message: "Error" });
  }
}
