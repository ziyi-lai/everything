import path from "node:path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pin the workspace root — otherwise Turbopack walks up and finds the
  // unrelated lockfile in the parent user directory and guesses wrong
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
