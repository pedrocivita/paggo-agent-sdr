import type { NextConfig } from "next";
import { withEve } from "eve/next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
};

// Mounts the eve agent in ./agent at /eve/v1/* in the same app and deploy.
export default withEve(nextConfig);
