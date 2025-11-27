import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	transpilePackages: ["@cgsm/sso-client"],
	output: "standalone",
	experimental: {
		serverActions: {
			bodySizeLimit: "50mb",
		},
	},
};

export default nextConfig;
