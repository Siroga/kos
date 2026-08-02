import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["react-router-typing"],
  allowedDevOrigins: [
    "kemp.tail0b1ff7.ts.net",
    "kemp-1.tail0b1ff7.ts.net",
    "*.tail0b1ff7.ts.net",
    "kemp.local",
    "*.local",
    "localhost",
    "127.0.0.1",
    "192.168.0.172",
    "192.168.1.*",
    "192.168.0.*",
    "192.168.1.20",
  ],
  turbopack: {
    root: __dirname,
  },
  //output: "export",
};

export default nextConfig;
