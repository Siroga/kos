import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const nextConfig = {
  reactStrictMode: false,
  transpilePackages: ["react-router-typing"],
  turbopack: {
    root: __dirname,
  },
  //output: "export",
};

export default nextConfig;
