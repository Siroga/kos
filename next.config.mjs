import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["react-router-typing"],
  allowedDevOrigins: ["kemp.local:8888", "localhost:8888", "kemp.local", "192.168.0.172:8888", "kemp.tail0b1ff7.ts.net", "kemp.tail0b1ff7.ts.net:8888"],
  turbopack: {
    root: __dirname,
  },
  //output: "export",
};

export default nextConfig;
