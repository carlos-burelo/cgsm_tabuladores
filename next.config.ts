import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	output: "standalone",
	  basePath: "",
  assetPrefix: "",
	experimental: {
		serverActions: {
			bodySizeLimit: "50mb",
		},
	},
};

export default nextConfig;
